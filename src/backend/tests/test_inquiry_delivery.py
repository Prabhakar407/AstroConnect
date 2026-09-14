"""Real local SQL, synthetic provider; never sends customer/client email."""
import io
import json
import os
import unittest
from concurrent.futures import ThreadPoolExecutor
from dataclasses import replace
from datetime import timedelta
from email.message import Message
from threading import Event
from pathlib import Path
from urllib.error import HTTPError
from unittest.mock import patch
from uuid import UUID, uuid4

from fastapi.testclient import TestClient
from psycopg import sql
from src.backend.application import Settings, create_app
from src.backend.domain import CLIENT_EMAIL
from src.backend.inquiry_delivery import InquiryDelivery, MAX_ATTEMPTS, inquiry_message
from src.backend.resend_email import EmailDeliveryError, send_message
from src.backend.storage import StorageUnavailable
from src.backend.tests import test_foundation as foundation

SETTINGS = Settings(sender='Astro Advice <bookings@mail.astroadvicebykundansingh.com>', resend_key='synthetic-key')


class InquiryMessageTests(unittest.TestCase):
    def test_recipients_replies_and_private_content(self):
        row = {'id': uuid4(), 'name': '<script>Synthetic & name</script>', 'email': 'synthetic@example.com',
               'message': 'private consultation notes', 'dob': 'private birth date'}
        customer = inquiry_message(SETTINGS.sender, row, 'customer')
        client = inquiry_message(SETTINGS.sender, row, 'client')
        self.assertEqual(customer['to'], [row['email']])
        self.assertEqual(customer['reply_to'], CLIENT_EMAIL)
        self.assertEqual(client['to'], [CLIENT_EMAIL])
        self.assertEqual(client['reply_to'], row['email'])
        for message in (customer, client):
            self.assertNotIn('<script>', message['html'])
            self.assertIn('&lt;script&gt;', message['html'])
            self.assertNotIn(row['name'], message['subject'])
        self.assertIn(row['message'], customer['text'])
        self.assertIn(row['message'], client['text'])
        self.assertIn(row['dob'], client['text'])
        self.assertIn('Astro Advice by Kundan Singh', customer['html'])
        with self.assertRaises(ValueError):
            inquiry_message(SETTINGS.sender, row, 'unapproved')

    def test_provider_errors_are_classified_without_returning_private_text(self):
        payload = inquiry_message(SETTINGS.sender, {'id': uuid4(), 'name': 'Synthetic', 'email': 'synthetic@example.com'}, 'client')
        for status, retry, certain in ((429, True, True), (500, True, False), (409, True, False), (422, False, True), (302, False, False)):
            headers = Message()
            headers['Retry-After'] = '120'
            failure = HTTPError('https://api.resend.com/emails', status, 'private-provider-error', headers, io.BytesIO(b'private'))
            with self.subTest(status=status), patch('src.backend.resend_email.build_opener') as provider:
                provider.return_value.open.side_effect = failure
                with self.assertRaises(EmailDeliveryError) as caught:
                    send_message(SETTINGS, payload, 'inquiry/synthetic/v1')
                self.assertEqual(caught.exception.retryable, retry)
                self.assertEqual(caught.exception.definitely_rejected, certain)
                self.assertEqual(caught.exception.retry_after, 120)
                self.assertNotIn('private', str(caught.exception))
                self.assertTrue(failure.closed)


@unittest.skipUnless(os.getenv('ASTRO_TEST_DATABASE_URL'), 'Requires isolated local database.')
class InquiryDeliveryTests(unittest.TestCase):
    setUpClass = classmethod(foundation.PostgresTests.setUpClass.__func__)
    verified = foundation.PostgresTests.verified

    def setUp(self):
        foundation.PostgresTests.setUp(self)
        self.payload = dict(kind='contact', name='Synthetic Person', email='synthetic@example.com',
                            subject='Synthetic', message='Private synthetic inquiry')
        self.request_id = uuid4()
        self.inquiry_id = self.store.save_inquiry(self.payload, self.request_id,
            self.verified(self.payload['email'], 'contact'), 'a' * 64)
        self.sends, self.accepted = [], {}
        self.worker = InquiryDelivery(self.store, SETTINGS, sender=self.send)

    def send(self, payload, key):
        self.sends.append((payload, key))
        self.accepted.setdefault(key, str(uuid4()))
        return self.accepted[key]

    def jobs(self):
        with self.store.transaction() as conn:
            return conn.execute("SELECT * FROM delivery_jobs WHERE kind='inquiry_received' ORDER BY recipient_role").fetchall()

    def test_two_atomic_jobs_and_no_duplicates_after_save_retry(self):
        self.store.save_inquiry(self.payload, self.request_id, 'consumed', 'a' * 64)
        jobs = self.jobs()
        self.assertEqual(len(jobs), 2)
        self.assertEqual({row['recipient_role'] for row in jobs}, {'customer', 'client'})
        self.assertTrue(all(row['state'] == 'pending' for row in jobs))
        self.assertEqual(self.sends, [])

    def test_complete_both_once_and_duplicate_delivery_is_noop(self):
        for row in self.jobs():
            self.assertEqual(self.worker.run(row['id'])['state'], 'sent')
            self.assertTrue(self.worker.run(row['id'])['terminal'])
        self.assertEqual(len(self.sends), 2)
        self.assertEqual({payload['to'][0] for payload, _ in self.sends}, {CLIENT_EMAIL, self.payload['email']})
        self.assertTrue(all(row['provider_id'] and row['accepted_at'] for row in self.jobs()))
        self.assertEqual(self.worker.due(), [])

    def test_receipt_status_reports_only_customers_acceptance_not_inbox_delivery(self):
        customer = next(row for row in self.jobs() if row['recipient_role'] == 'customer')
        client = next(row for row in self.jobs() if row['recipient_role'] == 'client')
        self.worker.run(client['id'])
        self.assertEqual(self.store.inquiry_status(self.request_id, 'a' * 64)['email_status'], 'pending')
        self.worker.run(customer['id'])
        self.assertEqual(self.store.inquiry_status(self.request_id, 'a' * 64)['email_status'], 'accepted')

    def test_one_party_failure_cannot_resend_the_other(self):
        jobs = self.jobs()
        self.worker.run(jobs[0]['id'])
        self.worker.sender = lambda *args: (_ for _ in ()).throw(TimeoutError('private error'))
        failed = self.worker.run(jobs[1]['id'])
        self.assertEqual(failed['state'], 'pending')
        self.assertNotIn('private', str(failed))
        self.time += timedelta(minutes=1)
        self.worker.sender = self.send
        for job in jobs:
            self.worker.run(job['id'])
        self.assertEqual(len(self.sends), 2)

    def test_lost_database_write_after_send_reuses_exact_payload_and_key(self):
        job = self.jobs()[0]
        with patch.object(self.worker, '_finish', side_effect=StorageUnavailable('synthetic storage outage')):
            with self.assertRaises(StorageUnavailable):
                self.worker.run(job['id'])
        self.time += timedelta(seconds=91)
        # Even a future template/config revision cannot change an in-flight email.
        self.worker.settings = Settings(sender='Changed <different@example.com>', resend_key='synthetic-key')
        with patch('src.backend.inquiry_delivery.inquiry_message', side_effect=AssertionError('Must use frozen payload')):
            self.assertEqual(self.worker.run(job['id'])['state'], 'sent')
        self.assertEqual(len(self.sends), 2)
        self.assertEqual(self.sends[0], self.sends[1])
        self.assertEqual(len(self.accepted), 1)

    def test_overlapping_worker_cannot_send_twice(self):
        job = self.jobs()[0]
        entered, release = Event(), Event()
        def slow_send(payload, key):
            entered.set()
            if not release.wait(5):
                raise AssertionError('Synthetic sender was not released')
            return self.send(payload, key)
        self.worker.sender = slow_send
        with ThreadPoolExecutor(max_workers=1) as pool:
            first = pool.submit(self.worker.run, job['id'])
            try:
                self.assertTrue(entered.wait(3))
                self.assertEqual(self.worker.run(job['id'])['state'], 'processing')
            finally:
                release.set()
            self.assertEqual(first.result(timeout=5)['state'], 'sent')
        self.assertEqual(len(self.sends), 1)

    def test_expired_lease_late_acceptance_is_retained_without_old_state_overwrite(self):
        job = self.jobs()[0]
        old, _ = self.worker._claim(job['id'])
        self.time += timedelta(seconds=91)
        newer, _ = self.worker._claim(job['id'])
        provider_id = uuid4()
        self.assertEqual(self.worker._finish(old, provider_id=provider_id)['state'], 'processing')
        saved = next(row for row in self.jobs() if row['id'] == job['id'])
        self.assertEqual(saved['lease_token'], newer['lease_token'])
        self.assertEqual(saved['provider_id'], provider_id)
        result = self.worker._finish(newer, error=EmailDeliveryError('send_unconfirmed', retryable=True))
        self.assertEqual(result['state'], 'sent')
        self.assertEqual(self.sends, [])

    def test_known_rate_limit_can_resume_next_day_without_an_arbitrary_lockout(self):
        job = self.jobs()[0]
        self.worker.sender = lambda *args: (_ for _ in ()).throw(EmailDeliveryError('provider_rate_limited',
            retryable=True, retry_after=86400, definitely_rejected=True))
        self.assertEqual(self.worker.run(job['id'])['state'], 'pending')
        saved = next(row for row in self.jobs() if row['id'] == job['id'])
        self.assertIsNone(saved['first_attempt_at'])
        self.assertFalse(saved['send_uncertain'])
        self.time += timedelta(days=1)
        self.worker.sender = self.send
        self.assertEqual(self.worker.run(job['id'])['state'], 'sent')

    def test_later_rejection_cannot_erase_earlier_uncertainty(self):
        job = self.jobs()[0]
        self.worker.sender = lambda *args: (_ for _ in ()).throw(TimeoutError())
        self.worker.run(job['id'])
        self.time += timedelta(minutes=1)
        self.worker.sender = lambda *args: (_ for _ in ()).throw(EmailDeliveryError('provider_rate_limited',
            retryable=True, retry_after=86400, definitely_rejected=True))
        self.assertEqual(self.worker.run(job['id'])['state'], 'failed')
        self.assertTrue(next(row for row in self.jobs() if row['id'] == job['id'])['send_uncertain'])

    def test_monthly_exhaustion_waits_through_cycle_without_losing_saved_work(self):
        job = self.jobs()[0]
        self.worker.sender = lambda *args: (_ for _ in ()).throw(EmailDeliveryError(
            'monthly_quota_exceeded', retryable=True, retry_after=86400, definitely_rejected=True))
        for _ in range(32):
            result = self.worker.run(job['id'])
            self.assertEqual(result['state'], 'pending')
            saved = next(row for row in self.jobs() if row['id'] == job['id'])
            self.assertEqual(saved['attempts'], 0)
            self.assertIsNone(saved['first_attempt_at'])
            self.time += timedelta(days=1)
        self.worker.sender = self.send
        self.assertEqual(self.worker.run(job['id'])['state'], 'sent')
        self.assertEqual(len(self.sends), 1)

    def test_monthly_rejection_does_not_erase_previous_uncertain_send(self):
        job = self.jobs()[0]
        self.worker.sender = lambda *args: (_ for _ in ()).throw(TimeoutError())
        self.worker.run(job['id'])
        self.time += timedelta(minutes=1)
        self.worker.sender = lambda *args: (_ for _ in ()).throw(EmailDeliveryError(
            'monthly_quota_exceeded', retryable=True, retry_after=86400, definitely_rejected=True))
        self.assertEqual(self.worker.run(job['id'])['state'], 'failed')

    def test_unknown_send_outside_dedupe_window_never_blindly_replays(self):
        job = self.jobs()[0]
        self.worker._claim(job['id'])  # crash before the result is known
        self.time += timedelta(days=1)
        result = self.worker.run(job['id'])
        self.assertEqual(result['state'], 'failed')
        self.assertEqual(result['error_code'], 'send_outcome_needs_review')
        self.assertEqual(self.sends, [])

    def test_crashes_stop_at_bounded_attempt_count(self):
        job = self.jobs()[0]
        for _ in range(MAX_ATTEMPTS):
            _, send = self.worker._claim(job['id'])
            self.assertTrue(send)
            self.time += timedelta(seconds=91)
        self.assertEqual(self.worker.run(job['id'])['error_code'], 'retry_limit')
        self.assertEqual(self.sends, [])

    def test_missing_settings_cannot_freeze_broken_mail_or_consume_attempts(self):
        self.worker.settings = Settings()
        with self.assertRaises(StorageUnavailable):
            self.worker.run(self.jobs()[0]['id'])
        self.assertTrue(all(row['attempts'] == 0 and row['message_payload'] is None for row in self.jobs()))

    def test_already_accepted_job_does_not_depend_on_current_provider_configuration(self):
        job = self.jobs()[0]
        self.worker.run(job['id'])
        self.worker.settings = Settings()
        self.assertEqual(self.worker.run(job['id'])['state'], 'sent')
        self.assertEqual(len(self.sends), 1)

    def test_due_scan_is_bounded_and_excludes_active_leases_and_terminal_jobs(self):
        jobs = self.jobs()
        self.assertEqual(len(self.worker.due(1)), 1)
        self.worker._claim(jobs[0]['id'])
        self.assertEqual(self.worker.due(), [str(jobs[1]['id'])])
        self.worker.run(jobs[1]['id'])
        self.assertEqual(self.worker.due(), [])
        self.time += timedelta(seconds=91)
        self.assertEqual(self.worker.due(), [str(jobs[0]['id'])])
        for limit in (0, 101, True, '1'):
            with self.assertRaises(ValueError):
                self.worker.due(limit)

    def test_booking_jobs_and_missing_jobs_cannot_be_consumed(self):
        with self.store.transaction() as conn:
            self.store.enqueue(conn, 'booking_confirmed', uuid4(), self.time)
            job = conn.execute("SELECT id FROM delivery_jobs WHERE kind='booking_confirmed'").fetchone()
        for job_id in (job['id'], uuid4()):
            with self.assertRaises(ValueError):
                self.worker.run(job_id)
        self.assertEqual(self.sends, [])

    def test_internal_handler_requires_server_secret_before_storage_or_delivery(self):
        settings = replace(SETTINGS, delivery_secret='synthetic-worker-secret-at-least-32-characters')
        client = TestClient(create_app(settings, store=self.store, notification_sender=self.send))
        body = {'job_id': str(self.jobs()[0]['id'])}
        with patch.object(self.store, 'transaction', side_effect=AssertionError('No unauthenticated storage access')):
            for headers in ({}, {'Authorization': 'Bearer wrong'}, {'X-Astro-Receipt': 'a' * 64}):
                self.assertEqual(client.post('/api/internal/delivery/inquiry', json=body, headers=headers).status_code, 403)
        response = client.post('/api/internal/delivery/inquiry', json=body,
                               headers={'Authorization': 'Bearer ' + settings.delivery_secret})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['application'], 'astro-advice-booking')
        self.assertEqual(response.json()['job_id'], body['job_id'])
        self.assertTrue(response.json()['terminal'])
        self.assertNotIn(self.payload['email'], response.text)
        self.assertNotIn(settings.delivery_secret, response.text)
        self.assertEqual(response.headers['cache-control'], 'no-store')
        self.assertEqual(len(self.sends), 1)

    def test_internal_handler_reports_pending_and_missing_without_false_success(self):
        settings = replace(SETTINGS, delivery_secret='synthetic-worker-secret-at-least-32-characters')
        client = TestClient(create_app(settings, store=self.store, notification_sender=lambda *args: (_ for _ in ()).throw(TimeoutError())))
        headers = {'Authorization': 'Bearer ' + settings.delivery_secret}
        response = client.post('/api/internal/delivery/inquiry', headers=headers, json={'job_id': str(self.jobs()[0]['id'])})
        self.assertEqual(response.status_code, 202)
        self.assertFalse(response.json()['terminal'])
        self.assertEqual(client.post('/api/internal/delivery/inquiry', headers=headers, json={'job_id': str(uuid4())}).status_code, 404)
        self.assertEqual(client.post('/api/internal/delivery/inquiry', headers=headers, json={'job_id': str(uuid4()), 'to': CLIENT_EMAIL}).status_code, 422)

    def test_migration_preserves_other_jobs_and_does_not_invent_legacy_delivery(self):
        migrations = Path(__file__).parents[1] / 'migrations'
        with self.store.transaction() as conn:
            schema = sql.Identifier('delivery_migration_' + uuid4().hex)
            conn.execute(sql.SQL('CREATE SCHEMA {}').format(schema))
            conn.execute(sql.SQL('SET LOCAL search_path TO {}').format(schema))
            for path in sorted(migrations.glob('00[1-4]_*.sql')):
                conn.execute(path.read_text())
            pending, prior_sent, booking = uuid4(), uuid4(), uuid4()
            for record, kind, state in ((pending, 'inquiry_received', 'pending'), (prior_sent, 'inquiry_received', 'sent'), (booking, 'booking_confirmed', 'pending')):
                conn.execute('INSERT INTO delivery_jobs(id,dedupe_key,kind,record_id,state,created_at) VALUES (%s,%s,%s,%s,%s,%s)',
                             (uuid4(), f'{kind}:{record}:', kind, record, state, self.time))
            conn.execute((migrations / '005_inquiry_delivery.sql').read_text())
            rows = conn.execute('SELECT * FROM delivery_jobs').fetchall()
            self.assertEqual(len(rows), 5)
            self.assertEqual({row['recipient_role'] for row in rows if row['record_id'] == pending}, {'client', 'customer'})
            self.assertTrue(all(row['state'] == 'pending' for row in rows if row['record_id'] == pending))
            self.assertTrue(all(row['state'] == 'failed' and row['last_error_code'] == 'legacy_outcome_unknown' for row in rows if row['record_id'] == prior_sent))
            self.assertEqual(next(row['state'] for row in rows if row['record_id'] == booking), 'pending')
            conn.rollback()  # Removes only this transaction's isolated test schema.
