"""Durable booking fulfilment against isolated providers and PostgreSQL."""

import os
import unittest
from uuid import UUID, uuid4

from cryptography.fernet import Fernet

from src.backend.application import Settings
from src.backend.booking_delivery import BookingDelivery
from src.backend.google_calendar import GoogleFailure, event_identity
from src.backend.tests import test_foundation as foundation


class Google:
    def __init__(self):
        self.inserted = []
        self.deleted = []
        self.fail = None

    def tokens(self, *, refresh_token=None, **kwargs):
        if self.fail:
            raise GoogleFailure(self.fail)
        return {'access_token': 'synthetic-access', 'token_type': 'Bearer', 'expires_in': 3600}

    @staticmethod
    def ready_event(event_id):
        return {'id': event_id, 'status': 'confirmed', 'conferenceData': {
            'createRequest': {'status': {'statusCode': 'success'}},
            'conferenceSolution': {'key': {'type': 'hangoutsMeet'}},
            'entryPoints': [{'entryPointType': 'video', 'uri': 'https://meet.google.com/abc-defg-hij'}],
        }}

    def insert(self, token, calendar_id, body):
        self.inserted.append((calendar_id, body))
        return self.ready_event(body['id'])

    def event(self, token, calendar_id, event_id):
        return self.ready_event(event_id)

    def delete(self, token, calendar_id, event_id):
        self.deleted.append((calendar_id, event_id))
        return {}


@unittest.skipUnless(os.getenv('ASTRO_TEST_DATABASE_URL'), 'Requires isolated local database.')
class BookingDeliveryTests(unittest.TestCase):
    setUpClass = classmethod(foundation.PostgresTests.setUpClass.__func__)
    payload = foundation.PostgresTests.payload
    verified = foundation.PostgresTests.verified

    def setUp(self):
        foundation.PostgresTests.setUp(self)
        self.key = Fernet.generate_key()
        self.google = Google()
        self.sent = []
        self.settings = Settings(google_client_id='synthetic-client', google_client_secret='synthetic-secret',
                                 google_token_key=self.key.decode(), sender='Astro Advice <bookings@example.com>',
                                 resend_key='synthetic-resend')
        with self.store.transaction() as conn:
            conn.execute('TRUNCATE google_authorizations,google_connection,admin_sessions,admin_login_challenges,admin_identity CASCADE')
            conn.execute("INSERT INTO admin_identity VALUES (true,'synthetic-subject',%s)", (self.time,))
            token = Fernet(self.key).encrypt(b'synthetic-refresh').decode()
            conn.execute("INSERT INTO google_connection VALUES (true,'synthetic-subject','astroadvicebyks@gmail.com',%s,%s,%s)",
                         (token, 'calendar scopes', self.time))
        self.delivery = BookingDelivery(self.store, self.settings, google=self.google,
                                        sender=lambda payload, key: self.sent.append((payload, key)) or str(uuid4()))

    def confirmed(self):
        booking = self.store.hold(self.payload(), uuid4(), self.verified(), 'a' * 64)
        self.store.confirm_paid(booking['id'], 'synthetic-paid', booking['amount_paise'], 'INR')
        return booking

    def jobs(self, booking_id, kind='booking_confirmed'):
        with self.store.transaction() as conn:
            return {row['recipient_role']: row for row in conn.execute(
                'SELECT * FROM delivery_jobs WHERE record_id=%s AND kind=%s ORDER BY recipient_role',
                (booking_id, kind)).fetchall()}

    def test_meet_then_both_emails_have_separate_durable_results(self):
        booking = self.confirmed()
        jobs = self.jobs(booking['id'])
        self.assertEqual(set(jobs), {'calendar', 'customer', 'client'})

        waiting = self.delivery.run(jobs['customer']['id'])
        self.assertEqual(waiting['state'], 'pending')
        self.assertEqual(waiting['error_code'], 'meeting_pending')
        self.assertEqual(self.sent, [])

        self.assertEqual(self.delivery.run(jobs['calendar']['id'])['state'], 'sent')
        self.time = self.time.replace(second=31)
        for role in ('customer', 'client'):
            self.assertEqual(self.delivery.run(jobs[role]['id'])['state'], 'sent')
        self.assertEqual(len(self.google.inserted), 1)
        self.assertEqual(len(self.sent), 2)
        self.assertTrue(all('https://meet.google.com/abc-defg-hij' in message['text'] for message, _ in self.sent))
        with self.store.transaction() as conn:
            event = conn.execute('SELECT * FROM booking_calendar_events WHERE booking_id=%s', (booking['id'],)).fetchone()
            self.assertEqual(event['state'], 'ready')
            self.assertEqual(event['meet_url'], 'https://meet.google.com/abc-defg-hij')

    def test_cancellation_deletes_event_and_notifies_both_parties_without_refund_claim(self):
        booking = self.confirmed()
        jobs = self.jobs(booking['id'])
        self.delivery.run(jobs['calendar']['id'])
        self.store.cancel(booking['id'], 'synthetic-client')
        status = self.store.booking_status(booking['request_id'], 'a' * 64)
        self.assertEqual(status['appointment_state'], 'cancelled')
        self.assertIsNone(status['meet_url'])
        self.assertEqual(status['confirmation_email_state'], 'pending')
        cancelled = self.jobs(booking['id'], 'booking_cancelled')
        for role in ('calendar', 'customer', 'client'):
            self.assertEqual(self.delivery.run(cancelled[role]['id'])['state'], 'sent')
        self.assertEqual(self.google.deleted[0][1], event_identity(booking['id'])[0])
        cancellation_messages = [payload['text'] for payload, key in self.sent if '/booking_cancelled/' in key]
        self.assertEqual(len(cancellation_messages), 2)
        self.assertTrue(all('No refund' in text for text in cancellation_messages))

    def test_cancellation_supersedes_every_unsent_confirmation(self):
        booking = self.confirmed()
        confirmed = self.jobs(booking['id'])
        self.store.cancel(booking['id'], 'synthetic-client')
        for job in confirmed.values():
            result = self.delivery.run(job['id'])
            self.assertTrue(result['terminal'])
        self.assertEqual(self.google.inserted, [])
        self.assertEqual(self.sent, [])
        with self.store.transaction() as conn:
            rows = conn.execute("""SELECT state,last_error_code FROM delivery_jobs
                WHERE record_id=%s AND kind='booking_confirmed'""", (booking['id'],)).fetchall()
        self.assertTrue(all(row['state'] == 'sent' and row['last_error_code'] == 'superseded_by_cancellation'
                            for row in rows))

    def test_cancellation_during_calendar_creation_removes_the_new_event(self):
        booking = self.confirmed()
        job = self.jobs(booking['id'])['calendar']
        original_insert = self.google.insert

        def insert_then_cancel(token, calendar_id, body):
            event = original_insert(token, calendar_id, body)
            self.store.cancel(booking['id'], 'synthetic-client')
            return event

        self.google.insert = insert_then_cancel
        result = self.delivery.run(job['id'])
        self.assertTrue(result['terminal'])
        self.assertEqual(len(self.google.inserted), 1)
        self.assertEqual(self.google.deleted[0][1], event_identity(booking['id'])[0])
        with self.store.transaction() as conn:
            event = conn.execute('SELECT state,meet_url FROM booking_calendar_events WHERE booking_id=%s',
                                 (booking['id'],)).fetchone()
        self.assertEqual((event['state'], event['meet_url']), ('cancelled', None))

    def test_revoked_google_connection_is_visible_and_emails_wait(self):
        booking = self.confirmed()
        jobs = self.jobs(booking['id'])
        self.google.fail = 'reconnect_required'
        failed = self.delivery.run(jobs['calendar']['id'])
        self.assertEqual(failed['state'], 'failed')
        self.assertEqual(failed['error_code'], 'reconnect_required')
        self.time = self.time.replace(second=31)
        waiting = self.delivery.run(jobs['customer']['id'])
        self.assertEqual(waiting['state'], 'pending')
        self.assertEqual(waiting['error_code'], 'meeting_pending')
