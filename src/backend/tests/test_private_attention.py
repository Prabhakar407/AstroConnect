"""Private payment/delivery follow-up remains authenticated and explicit."""

import os
import unittest
from uuid import uuid4

from src.backend.tests import test_admin as admin
from src.backend.tests import test_foundation as foundation


@unittest.skipUnless(os.getenv('ASTRO_TEST_DATABASE_URL'), 'Requires isolated local database.')
class PrivateAttentionTests(unittest.TestCase):
    setUpClass = classmethod(foundation.PostgresTests.setUpClass.__func__)
    setUp = admin.AdminTests.setUp
    start = admin.AdminTests.start
    login = admin.AdminTests.login
    hold = foundation.PostgresTests.hold
    payload = foundation.PostgresTests.payload
    held = foundation.PostgresTests.held
    verified = foundation.PostgresTests.verified

    def test_payment_case_requires_login_and_marking_handled_moves_no_money(self):
        booking = self.hold()
        case_id = uuid4()
        with self.store.transaction() as conn:
            conn.execute('''INSERT INTO payment_cases
                (id,booking_id,key_id,external_reference,kind,created_at)
                VALUES (%s,%s,'rzp_test_synthetic','pay_synthetic','late_or_mismatched_payment',%s)''',
                (case_id, booking['id'], self.time))
        self.assertEqual(self.client.get('/api/admin/attention').status_code, 401)
        self.login()
        data = self.client.get('/api/admin/attention').json()
        self.assertEqual(len(data['payment_cases']), 1)
        self.assertNotIn('birth_date', str(data))
        self.assertEqual(self.client.post(f'/api/admin/attention/payments/{case_id}/handled', json={
            'resolution': 'customer_contacted', 'note': 'Synthetic test only',
        }).status_code, 403)
        response = self.client.post(f'/api/admin/attention/payments/{case_id}/handled', headers=self.headers, json={
            'resolution': 'customer_contacted', 'note': 'Synthetic test only',
        })
        self.assertEqual(response.status_code, 200)
        self.assertIn('No refund', response.json()['message'])
        self.assertEqual(self.client.get('/api/admin/attention').json()['payment_cases'], [])
        with self.store.transaction() as conn:
            self.assertEqual(conn.execute('SELECT count(*) AS n FROM payments').fetchone()['n'], 0)

    def test_failed_delivery_can_be_explicitly_requeued(self):
        booking = self.hold()
        self.store.confirm_paid(booking['id'], 'synthetic-paid', booking['amount_paise'], 'INR')
        with self.store.transaction() as conn:
            job = conn.execute("""UPDATE delivery_jobs SET state='failed',last_error_code='reconnect_required'
                WHERE record_id=%s AND recipient_role='calendar' RETURNING id""", (booking['id'],)).fetchone()
        self.login()
        self.assertEqual(len(self.client.get('/api/admin/attention').json()['delivery_problems']), 1)
        response = self.client.post(f"/api/admin/attention/delivery/{job['id']}/retry", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        with self.store.transaction() as conn:
            state = conn.execute('SELECT state,last_error_code FROM delivery_jobs WHERE id=%s', (job['id'],)).fetchone()
        self.assertEqual((state['state'], state['last_error_code']), ('pending', None))

    def test_provider_accepted_delivery_is_not_republished(self):
        booking = self.hold()
        self.store.confirm_paid(booking['id'], 'synthetic-paid', booking['amount_paise'], 'INR')
        provider_id = uuid4()
        with self.store.transaction() as conn:
            job = conn.execute("""UPDATE delivery_jobs SET state='failed',provider_id=%s,
                last_error_code='synthetic_lost_reply' WHERE record_id=%s AND recipient_role='customer'
                RETURNING id""", (provider_id, booking['id'])).fetchone()
        self.login()
        response = self.client.post(f"/api/admin/attention/delivery/{job['id']}/retry", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        with self.store.transaction() as conn:
            state = conn.execute('SELECT state,provider_id,last_error_code FROM delivery_jobs WHERE id=%s',
                                 (job['id'],)).fetchone()
        self.assertEqual((state['state'], state['provider_id'], state['last_error_code']), ('sent', provider_id, None))

    def test_exhausted_payment_event_is_visible_and_can_be_retried(self):
        event_id, record_id, job_id = 'evt_synthetic_attention', uuid4(), uuid4()
        with self.store.transaction() as conn:
            conn.execute('''INSERT INTO payment_events
                (key_id,event_id,account_id,kind,payment_id,payload_hash,received_at,
                 next_attempt_at,attempts,last_error,record_id)
                VALUES ('rzp_test_synthetic',%s,'acc_synthetic','payment.captured',
                'pay_synthetic','digest',%s,%s,12,'payment_order_unmatched',%s)''',
                (event_id, self.time, self.time, record_id))
            conn.execute('''INSERT INTO delivery_jobs
                (id,dedupe_key,kind,record_id,state,attempts,created_at,next_attempt_at,dispatch_after)
                VALUES (%s,%s,'payment_event',%s,'failed',12,%s,%s,%s)''',
                (job_id, f'payment_event:{record_id}:', record_id, self.time, self.time, self.time))
        self.login()
        data = self.client.get('/api/admin/attention').json()
        self.assertEqual(len(data['payment_event_problems']), 1)
        self.assertEqual(data['payment_event_problems'][0]['event_id'], event_id)
        self.assertNotIn('payload_hash', str(data))
        response = self.client.post(f'/api/admin/attention/delivery/{job_id}/retry', headers=self.headers)
        self.assertEqual(response.status_code, 200)
        with self.store.transaction() as conn:
            event = conn.execute('SELECT attempts,last_error FROM payment_events WHERE record_id=%s', (record_id,)).fetchone()
            job = conn.execute('SELECT state,attempts,last_error_code FROM delivery_jobs WHERE id=%s', (job_id,)).fetchone()
        self.assertEqual((event['attempts'], event['last_error']), (0, None))
        self.assertEqual((job['state'], job['attempts'], job['last_error_code']), ('pending', 0, None))
