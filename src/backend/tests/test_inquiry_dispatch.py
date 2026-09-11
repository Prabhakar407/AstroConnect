"""Local database and injected network only; never use permanent Neon as a fixture."""
import io
import json
import os
import unittest
from concurrent.futures import ThreadPoolExecutor
from dataclasses import replace
from datetime import timedelta
from email.message import Message
from pathlib import Path
from threading import Event
from unittest.mock import patch
from uuid import uuid4

from fastapi.testclient import TestClient
from psycopg import sql
from src.backend.application import Settings, create_app
from src.backend.inquiry_dispatch import InquiryDispatch, publish_jobs, queue_configured
from src.backend.inquiry_delivery import InquiryDelivery
from src.backend.storage import StorageUnavailable
from src.backend.tests import test_foundation as foundation

SETTINGS = Settings(cloudflare_account_id='a' * 32, cloudflare_queue_id='b' * 32,
                    cloudflare_queue_token='synthetic-queue-credential',
                    recovery_secret='synthetic-recovery-secret-32-characters',
                    delivery_secret='synthetic-delivery-secret-32-characters')


class PublisherTests(unittest.TestCase):
    def response(self, body=b'{"success":true}', status=200, content_type='application/json'):
        response = io.BytesIO(body)
        response.status = status
        response.headers = Message()
        response.headers['Content-Type'] = content_type
        return response

    def test_fixed_destination_only_opaque_identifiers_and_explicit_acceptance(self):
        job = str(uuid4())
        with patch('src.backend.inquiry_dispatch.build_opener') as opener:
            opener.return_value.open.return_value = self.response()
            self.assertTrue(publish_jobs(SETTINGS, [job]))
            request = opener.return_value.open.call_args.args[0]
            self.assertEqual(request.full_url, f'https://api.cloudflare.com/client/v4/accounts/{"a" * 32}/queues/{"b" * 32}/messages/batch')
            self.assertEqual(json.loads(request.data), {'messages': [{'body': {
                'job_id': job, 'kind': 'inquiry_received', 'environment': 'production'}, 'content_type': 'json'}]})
            self.assertEqual(opener.return_value.open.call_args.kwargs['timeout'], 5)
            self.assertIsNone(opener.call_args.args[0].redirect_request(None, None, 302, '', {}, 'https://other.invalid'))

    def test_false_html_redirect_oversize_and_lost_responses_do_not_count(self):
        cases = [(b'{"success":false}', 200, 'application/json'), (b'{"success":1}', 200, 'application/json'),
                 (b'{"success":true,"errors":[{}]}', 200, 'application/json'),
                 (b'{"success":true}', 302, 'application/json'), (b'<html>Login</html>', 200, 'text/html'),
                 (b'x' * 16385, 200, 'application/json'), (b'[]', 200, 'application/json')]
        for body, status, content_type in cases:
            with self.subTest(status=status, content_type=content_type), patch('src.backend.inquiry_dispatch.build_opener') as opener:
                opener.return_value.open.return_value = self.response(body, status, content_type)
                with self.assertRaises(StorageUnavailable): publish_jobs(SETTINGS, [uuid4()])
        with patch('src.backend.inquiry_dispatch.build_opener') as opener:
            opener.return_value.open.side_effect = TimeoutError('private information')
            with self.assertRaisesRegex(StorageUnavailable, '^Inquiry dispatch could not be confirmed.$'):
                publish_jobs(SETTINGS, [uuid4()])

    def test_bad_configuration_and_batches_never_call_network(self):
        with patch('src.backend.inquiry_dispatch.build_opener') as opener:
            for settings in (Settings(), replace(SETTINGS, cloudflare_account_id='../private'),
                             replace(SETTINGS, cloudflare_queue_token='bad\r\nheader')):
                self.assertFalse(queue_configured(settings))
                with self.assertRaises(StorageUnavailable): publish_jobs(settings, [uuid4()])
            for ids in ([], [uuid4()] * 26, ['bad-id'], 'not-a-list'):
                with self.assertRaises(ValueError): publish_jobs(SETTINGS, ids)
            opener.assert_not_called()


@unittest.skipUnless(os.getenv('ASTRO_TEST_DATABASE_URL'), 'Requires isolated local database.')
class DispatchTests(unittest.TestCase):
    setUpClass = classmethod(foundation.PostgresTests.setUpClass.__func__)
    verified = foundation.PostgresTests.verified

    def setUp(self):
        foundation.PostgresTests.setUp(self)
        self.payload = dict(kind='contact', name='Synthetic', email='synthetic@example.com', subject='Help', message='Private question')
        self.request_id = uuid4()
        self.inquiry_id = self.store.save_inquiry(self.payload, self.request_id,
            self.verified(self.payload['email'], 'contact'), 'a' * 64)
        self.published = []
        def publish(ids):
            # Separate connection proves both inquiry and jobs committed BEFORE HTTP.
            with self.store.transaction() as conn:
                self.assertEqual(conn.execute('SELECT count(*) AS n FROM inquiries WHERE id=%s', (self.inquiry_id,)).fetchone()['n'], 1)
            self.published.append(ids)
            return True
        self.publish = publish
        self.dispatch = InquiryDispatch(self.store, SETTINGS, publisher=publish)

    def jobs(self):
        with self.store.transaction() as conn:
            return conn.execute('SELECT * FROM delivery_jobs ORDER BY id').fetchall()

    def test_publishes_after_commit_records_acceptance_but_not_delivery(self):
        self.assertEqual(self.dispatch.run(self.inquiry_id), {'selected': 2, 'published': 2})
        self.assertEqual(len(self.published), 1)
        self.assertTrue(all(row['dispatched_at'] and row['state'] == 'pending' and row['attempts'] == 0 for row in self.jobs()))
        self.assertEqual(self.dispatch.run(self.inquiry_id), {'selected': 0, 'published': 0})

    def test_zero_visitors_recovers_unpublished_or_expired_queue_work(self):
        self.time += timedelta(days=2)
        self.assertEqual(self.dispatch.run()['published'], 2)
        self.time += timedelta(days=2)  # Free queue retention passed; SQL remains.
        self.assertEqual(self.dispatch.run()['published'], 2)
        self.assertEqual(self.published[0], self.published[1])

    def test_publisher_outage_cannot_unsave_and_recovery_retries_same_ids(self):
        self.dispatch.publisher = lambda ids: (_ for _ in ()).throw(TimeoutError('private network error'))
        with self.assertLogs('src.backend.inquiry_dispatch', level='WARNING') as logs:
            self.dispatch.after_save(self.inquiry_id)
        self.assertNotIn('private network', str(logs.output))
        self.assertEqual(self.store.inquiry_status(self.request_id, 'a' * 64)['status'], 'success')
        self.assertTrue(all(row['dispatch_error'] == 'queue_acceptance_unconfirmed' for row in self.jobs()))
        self.time += timedelta(minutes=15)
        self.dispatch.publisher = self.publish
        self.assertEqual(self.dispatch.run()['published'], 2)
        self.assertTrue(all(row['dispatch_error'] is None for row in self.jobs()))

    def test_lost_writeback_republishes_without_duplicate_email(self):
        with patch.object(self.dispatch, '_record', side_effect=StorageUnavailable('synthetic failure')):
            with self.assertRaises(StorageUnavailable): self.dispatch.run()
        self.time += timedelta(minutes=15)
        self.dispatch.run()
        self.assertEqual(self.published[0], self.published[1])
        sends = []
        worker = InquiryDelivery(self.store, replace(SETTINGS, sender='studio@example.com', resend_key='synthetic'),
            sender=lambda *args: (sends.append(args), str(uuid4()))[1])
        for batch in self.published:
            for job in batch: worker.run(job)
        self.assertEqual(len(sends), 2)

    def test_overlapping_publications_skip_claimed_rows(self):
        entered, release = Event(), Event()
        def slow(ids):
            entered.set()
            self.assertTrue(release.wait(5))
            return self.publish(ids)
        self.dispatch.publisher = slow
        with ThreadPoolExecutor(max_workers=1) as pool:
            future = pool.submit(self.dispatch.run)
            try:
                self.assertTrue(entered.wait(3))
                self.assertEqual(self.dispatch.run()['published'], 0)
            finally: release.set()
            self.assertEqual(future.result(timeout=5)['published'], 2)
        self.assertEqual(len(self.published), 1)

    def test_stale_publisher_cannot_overwrite_newer_receipt(self):
        ids, old = self.dispatch._claim()
        self.time += timedelta(seconds=91)
        _, newer = self.dispatch._claim()
        self.dispatch._record(ids, newer, True)
        self.dispatch._record(ids, old, False)
        self.assertTrue(all(row['dispatched_at'] and row['dispatch_error'] is None for row in self.jobs()))

    def test_missing_configuration_does_not_claim_saved_work(self):
        with self.assertRaises(StorageUnavailable): InquiryDispatch(self.store, Settings()).run()
        self.assertTrue(all(row['dispatch_attempts'] == 0 and row['dispatch_token'] is None for row in self.jobs()))

    def test_future_active_terminal_and_booking_work_are_not_published(self):
        with self.store.transaction() as conn:
            conn.execute("UPDATE delivery_jobs SET next_attempt_at=%s", (self.time + timedelta(hours=1),))
            self.store.enqueue(conn, 'booking_confirmed', uuid4(), self.time)
        self.assertEqual(self.dispatch.run()['selected'], 0)
        with self.store.transaction() as conn:
            conn.execute("UPDATE delivery_jobs SET state='processing',lease_token=%s,lease_until=%s WHERE kind='inquiry_received'",
                         (uuid4(), self.time + timedelta(seconds=90)))
        self.assertEqual(self.dispatch.run()['selected'], 0)
        self.time += timedelta(seconds=91)
        self.assertEqual(self.dispatch.run()['selected'], 2)
        with self.store.transaction() as conn:
            conn.execute("UPDATE delivery_jobs SET state='sent',lease_token=NULL,lease_until=NULL WHERE kind='inquiry_received'")
        self.time += timedelta(hours=2)
        self.assertEqual(self.dispatch.run()['selected'], 0)

    def test_bounded_recovery_does_not_starve_later_jobs(self):
        with self.store.transaction() as conn:
            for _ in range(20): self.store.enqueue(conn, 'inquiry_received', uuid4(), self.time)
        first = self.dispatch.run()
        second = self.dispatch.run()
        self.assertEqual((first['selected'], second['selected']), (25, 17))
        self.assertFalse(set(self.published[0]) & set(self.published[1]))

    def test_recovery_requires_own_secret_before_storage_and_returns_run_identity(self):
        client = TestClient(create_app(SETTINGS, store=self.store, queue_publisher=self.publish))
        body = {'run_id': str(uuid4())}
        with patch.object(self.store, 'transaction', side_effect=AssertionError('unauthorized storage')):
            for secret in ('', SETTINGS.delivery_secret):
                self.assertEqual(client.post('/api/internal/recovery/inquiries', json=body,
                    headers={'Authorization': 'Bearer ' + secret}).status_code, 403)
        response = client.post('/api/internal/recovery/inquiries', json=body,
            headers={'Authorization': 'Bearer ' + SETTINGS.recovery_secret})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {'application': 'astro-advice-booking', 'environment': 'production',
            **body, 'selected': 2, 'published': 2})
        self.assertNotIn(self.payload['email'], response.text)
        self.assertEqual(response.headers['cache-control'], 'no-store')

    def test_recovery_cleans_expired_authentication_without_deleting_inquiry(self):
        with self.store.transaction() as conn:
            conn.execute("INSERT INTO rate_limits VALUES ('expired-cleanup',1,%s)", (self.time,))
        client = TestClient(create_app(SETTINGS, store=self.store, queue_publisher=self.publish))
        response = client.post('/api/internal/recovery/inquiries', json={'run_id': str(uuid4())},
            headers={'Authorization': 'Bearer ' + SETTINGS.recovery_secret})
        self.assertEqual(response.status_code, 200)
        with self.store.transaction() as conn:
            self.assertIsNone(conn.execute("SELECT key FROM rate_limits WHERE key='expired-cleanup'").fetchone())
            self.assertEqual(conn.execute('SELECT count(*) AS n FROM inquiries').fetchone()['n'], 1)
            self.assertEqual(conn.execute('SELECT count(*) AS n FROM delivery_jobs').fetchone()['n'], 2)

    def test_recovery_failure_is_not_success_and_payload_cannot_select_urls(self):
        client = TestClient(create_app(SETTINGS, store=self.store, queue_publisher=lambda ids: False))
        headers = {'Authorization': 'Bearer ' + SETTINGS.recovery_secret}
        self.assertEqual(client.post('/api/internal/recovery/inquiries', json={'run_id': str(uuid4())}, headers=headers).status_code, 503)
        self.assertEqual(client.post('/api/internal/recovery/inquiries', json={'run_id': str(uuid4()), 'url': 'https://evil.invalid'}, headers=headers).status_code, 422)

    def test_both_inquiry_routes_dispatch_only_after_successful_save(self):
        for route, purpose in (('/api/contact', 'contact'), ('/api/prashna', 'prashna')):
            request_id = uuid4()
            client = TestClient(create_app(replace(SETTINGS, otp_secret=foundation.TEST_SECRET), store=self.store,
                queue_publisher=lambda ids: self.published.append(ids) or True))
            body = {'name': 'Synthetic', 'email': 'new@example.com', 'phone': '+918000000000',
                    'request_id': str(request_id), 'verification_token': 'synthetic-verification-token-32-characters'}
            if purpose == 'contact': body.update(subject='Help', message='A valid synthetic message')
            else: body.update(question='A valid synthetic question', location='Delhi')
            with patch('src.backend.verification.EmailVerification.digest', return_value=self.verified('new@example.com', purpose)):
                response = client.post(route, json=body, headers={'X-Astro-Receipt': 'c' * 64})
                self.assertEqual(response.status_code, 200, response.text)
                count = len(self.published)
                self.assertEqual(client.post(route, json=body, headers={'X-Astro-Receipt': 'c' * 64}).status_code, 200)
                self.assertEqual(len(self.published), count)
            body['request_id'] = str(uuid4())
            self.assertNotEqual(client.post(route, json=body, headers={'X-Astro-Receipt': 'c' * 64}).status_code, 200)
            self.assertEqual(len(self.published), count)
            self.time += timedelta(seconds=61)

    def test_migration_backfills_without_changing_delivery_results(self):
        migrations = Path(__file__).parents[1] / 'migrations'
        with self.store.transaction() as conn:
            schema = sql.Identifier('dispatch_migration_' + uuid4().hex)
            conn.execute(sql.SQL('CREATE SCHEMA {}').format(schema))
            conn.execute(sql.SQL('SET LOCAL search_path TO {}').format(schema))
            for path in sorted(migrations.glob('00[1-5]_*.sql')): conn.execute(path.read_text())
            job = uuid4()
            conn.execute("""INSERT INTO delivery_jobs(id,dedupe_key,kind,record_id,state,created_at,next_attempt_at,recipient_role)
                VALUES (%s,'synthetic','inquiry_received',%s,'sent',%s,%s,'customer')""", (job, uuid4(), self.time, self.time))
            conn.execute((migrations / '006_inquiry_dispatch.sql').read_text())
            row = conn.execute('SELECT * FROM delivery_jobs WHERE id=%s', (job,)).fetchone()
            self.assertEqual(row['dispatch_after'], row['created_at'])
            self.assertEqual(row['state'], 'sent')
            self.assertIsNone(row['dispatched_at'])
            conn.rollback()
