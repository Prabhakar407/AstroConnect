import hashlib
import hmac
import json
import os
import unittest
from datetime import timedelta
from unittest.mock import patch

from fastapi.testclient import TestClient

from src.backend.application import Settings, create_app
from src.backend.domain import RuleViolation
from src.backend.payment_events import PaymentEvents
from src.backend.tests import test_payment_checkout as checkout_tests


@unittest.skipUnless(os.getenv('ASTRO_TEST_DATABASE_URL'), 'Requires isolated local database.')
class EventTests(unittest.TestCase):
    setUpClass = classmethod(checkout_tests.CheckoutTests.setUpClass.__func__)
    payload = checkout_tests.CheckoutTests.payload
    verified = checkout_tests.CheckoutTests.verified
    start = checkout_tests.CheckoutTests.start
    payment = checkout_tests.CheckoutTests.payment

    def setUp(self):
        checkout_tests.CheckoutTests.setUp(self)
        with self.store.transaction() as conn:
            conn.execute('TRUNCATE payment_events')
        self.events = PaymentEvents(self.store, self.checkout, 'synthetic-webhook-secret', 'acc_synthetic')

    def event(self, **changes):
        data = {'event': 'payment.captured', 'account_id': 'acc_synthetic',
                'payload': {'payment': {'entity': {'id': 'pay_synthetic', 'email': 'private@example.com'}}}} | changes
        body = json.dumps(data).encode()
        headers = {'x-razorpay-event-id': 'evt_synthetic',
                   'x-razorpay-signature': hmac.new(self.events.secret.encode(), body, hashlib.sha256).hexdigest()}
        return body, headers

    def test_unsigned_or_wrong_account_rejected_without_write(self):
        body, headers = self.event()
        with self.assertRaises(RuleViolation):
            self.events.receive(body + b' ', headers)
        with self.assertRaises(RuleViolation):
            self.events.receive(*self.event(account_id='acc_other'))
        with self.store.transaction() as conn:
            self.assertEqual(conn.execute('SELECT count(*) AS n FROM payment_events').fetchone()['n'], 0)

    def test_duplicate_is_saved_once_without_personal_payload(self):
        for _ in range(2):
            self.events.receive(*self.event())
        with self.store.transaction() as conn:
            rows = conn.execute('SELECT * FROM payment_events').fetchall()
        self.assertEqual(len(rows), 1)
        self.assertNotIn('private@example.com', str(rows))
        with self.assertRaises(RuleViolation):
            self.events.receive(*self.event(event='payment.failed'))

    def test_event_before_order_binding_remains_saved_and_recovers(self):
        self.provider.fail = True
        order = self.start()
        remote_payment = self.payment(order, order_id=self.provider.remote['id'])
        self.provider.payment = lambda payment_id: remote_payment
        self.events.receive(*self.event())
        self.assertFalse(self.events.process_one())
        with self.store.transaction() as conn:
            row = conn.execute('SELECT * FROM payment_events').fetchone()
        self.assertIsNone(row['processed_at'])
        self.assertEqual(row['last_error'], 'payment_order_unmatched')
        self.checkout.reconcile_creation(order['booking_id'])
        self.time += timedelta(seconds=61)
        self.assertTrue(self.events.process_one())
        with self.store.transaction() as conn:
            self.assertEqual(conn.execute('SELECT state FROM bookings').fetchone()['state'], 'confirmed')

    def test_provider_failure_keeps_event_for_recovery(self):
        from src.backend.razorpay import RazorpayFailure
        self.events.receive(*self.event())
        self.provider.payment = lambda payment_id: (_ for _ in ()).throw(RazorpayFailure('payment_provider_unavailable'))
        self.assertFalse(self.events.process_one())
        with self.store.transaction() as conn:
            row = conn.execute('SELECT * FROM payment_events').fetchone()
        self.assertEqual(row['attempts'], 1)
        self.assertIsNone(row['processed_at'])

    def test_endpoint_saves_job_without_provider_processing(self):
        settings = Settings(razorpay_key_id=self.provider.key_id, razorpay_key_secret=self.provider._secret,
                            razorpay_webhook_secret=self.events.secret, razorpay_account_id='acc_synthetic')
        app = TestClient(create_app(settings, store=self.store))
        body, headers = self.event()
        with patch.object(PaymentEvents, 'process_one', side_effect=AssertionError('Provider call in webhook')):
            result = app.post('/api/webhooks/razorpay', content=body, headers=headers)
        self.assertEqual(result.status_code, 200)
        with self.store.transaction() as conn:
            self.assertEqual(conn.execute("SELECT count(*) AS n FROM delivery_jobs WHERE kind='payment_event'").fetchone()['n'], 1)
        self.assertEqual(app.post('/api/webhooks/razorpay', json={}).status_code, 400)

    def test_queue_delivery_is_idempotent_and_bound_to_saved_job(self):
        row = self.start()
        self.provider.payment = lambda payment_id: self.payment(row)
        self.events.receive(*self.event())
        with self.store.transaction() as conn:
            job_id = conn.execute("SELECT id FROM delivery_jobs WHERE kind='payment_event'").fetchone()['id']
        for _ in range(2):
            result = self.events.deliver(job_id)
            self.assertTrue(result['terminal'])
            self.assertEqual(result['state'], 'sent')
        with self.store.transaction() as conn:
            self.assertEqual(conn.execute("SELECT count(*) AS n FROM delivery_jobs WHERE kind='booking_confirmed'").fetchone()['n'], 1)

    def test_payment_consumer_requires_internal_credential(self):
        from uuid import uuid4
        app = TestClient(create_app(Settings(delivery_secret='d'*43), store=self.store))
        with patch.object(PaymentEvents, 'deliver') as deliver:
            response = app.post('/api/internal/delivery/payment', json={'job_id': str(uuid4())})
            self.assertEqual(response.status_code, 403)
            deliver.assert_not_called()

    def test_dispute_does_not_cancel_confirmed_appointment(self):
        row = self.start()
        self.checkout.observe(row['booking_id'], 'pay_synthetic', self.payment(row))
        self.provider.payment = lambda payment_id: self.payment(row)
        self.events.receive(*self.event(event='payment.dispute.created'))
        self.assertTrue(self.events.process_one())
        with self.store.transaction() as conn:
            self.assertEqual(conn.execute('SELECT state FROM bookings').fetchone()['state'], 'confirmed')
            self.assertEqual(conn.execute("SELECT count(*) AS n FROM delivery_jobs WHERE kind='payment_review'").fetchone()['n'], 1)

    def test_dispute_alone_does_not_confirm_a_hold(self):
        row = self.start()
        self.provider.payment = lambda payment_id: self.payment(row)
        self.events.receive(*self.event(event='payment.dispute.created'))
        self.assertTrue(self.events.process_one())
        with self.store.transaction() as conn:
            self.assertEqual(conn.execute('SELECT state FROM bookings').fetchone()['state'], 'held')

    def test_missing_settings_returns_unavailable(self):
        app = TestClient(create_app(Settings(), store=self.store))
        self.assertEqual(app.post('/api/webhooks/razorpay', json={}).status_code, 503)

    def test_scheduled_recovery_authenticates_before_payment_processing(self):
        from uuid import uuid4
        settings = Settings(razorpay_key_id=self.provider.key_id, razorpay_key_secret=self.provider._secret,
                            razorpay_webhook_secret=self.events.secret, razorpay_account_id='acc_synthetic',
                            recovery_secret='r'*43)
        app = TestClient(create_app(settings, store=self.store, queue_publisher=lambda jobs: None))
        with patch.object(PaymentEvents, 'process_one', return_value=False) as process:
            self.assertEqual(app.post('/api/internal/recovery/inquiries', json={'run_id': str(uuid4())}).status_code, 403)
            process.assert_not_called()
            response = app.post('/api/internal/recovery/inquiries', json={'run_id': str(uuid4())},
                                headers={'Authorization': 'Bearer ' + 'r'*43})
            self.assertEqual(response.status_code, 200)
            process.assert_called_once()

    def test_inquiry_dispatch_failure_does_not_block_payment_recovery(self):
        from uuid import uuid4
        from src.backend.inquiry_dispatch import InquiryDispatch
        from src.backend.storage import StorageUnavailable
        settings = Settings(razorpay_key_id=self.provider.key_id, razorpay_key_secret=self.provider._secret,
                            razorpay_webhook_secret=self.events.secret, razorpay_account_id='acc_synthetic',
                            recovery_secret='r'*43)
        app = TestClient(create_app(settings, store=self.store))
        with patch.object(InquiryDispatch, 'run', side_effect=StorageUnavailable('Queue unavailable')):
            with patch.object(PaymentEvents, 'process_one', return_value=False) as process:
                response = app.post('/api/internal/recovery/inquiries', json={'run_id': str(uuid4())},
                                    headers={'Authorization': 'Bearer ' + 'r'*43})
                self.assertEqual(response.status_code, 503)
                process.assert_called_once()
