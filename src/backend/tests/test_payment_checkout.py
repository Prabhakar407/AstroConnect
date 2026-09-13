"""Transactional payment coordination against the isolated local fixture only."""
import os
import unittest
from concurrent.futures import ThreadPoolExecutor
from datetime import timedelta
from unittest.mock import patch
from uuid import uuid4

from src.backend.domain import RuleViolation
from src.backend.payment_checkout import PaymentCheckout
from src.backend.razorpay import RazorpayFailure, order_receipt
from src.backend.tests import test_foundation as foundation


class Provider:
    key_id = 'rzp_test_synthetic'
    mode = 'test'
    _secret = 'synthetic-secret'

    def __init__(self):
        self.creates = 0
        self.remote = None
        self.fail = False
        self.payments = []
        self.payment_reads = 0

    def create_order(self, booking_id, amount):
        self.creates += 1
        self.remote = {'id': 'order_' + booking_id.hex, 'entity': 'order',
                       'receipt': order_receipt(booking_id, self.mode), 'amount': amount,
                       'currency': 'INR', 'partial_payment': False}
        if self.fail:
            raise RazorpayFailure('payment_provider_unavailable', uncertain=True)
        return self.remote

    def orders_page(self, booking_id, skip=0):
        return {'items': [self.remote] if self.remote else []}

    def order(self, order_id):
        return self.remote

    def order_payments(self, order_id):
        self.payment_reads += 1
        return {'entity': 'collection', 'count': len(self.payments), 'items': self.payments}


@unittest.skipUnless(os.getenv('ASTRO_TEST_DATABASE_URL'), 'Requires isolated local database.')
class CheckoutTests(unittest.TestCase):
    setUpClass = classmethod(foundation.PostgresTests.setUpClass.__func__)
    payload = foundation.PostgresTests.payload
    verified = foundation.PostgresTests.verified

    def setUp(self):
        foundation.PostgresTests.setUp(self)
        self.provider = Provider()
        self.checkout = PaymentCheckout(self.store, self.provider)
        self.request_id = uuid4()

    def start(self):
        return self.checkout.start(self.payload(), self.request_id, self.verified(), 'a'*64)

    def payment(self, order, **changes):
        return {'entity': 'payment', 'id': 'pay_synthetic', 'order_id': order['order_id'],
                'amount': order['amount_paise'], 'currency': 'INR', 'status': 'captured',
                'captured': True, 'amount_refunded': 0} | changes

    def test_intent_hold_and_verification_roll_back_together(self):
        token = self.verified()
        with self.assertRaises(RuleViolation):
            self.store.hold(self.payload(), self.request_id, token, 'a'*64, payment_key_id='invalid')
        with self.store.transaction() as conn:
            self.assertEqual(conn.execute('SELECT count(*) AS n FROM bookings').fetchone()['n'], 0)
        order = self.checkout.start(self.payload(), self.request_id, token, 'a'*64)
        self.assertEqual(order['state'], 'ready')

    def test_retry_does_not_create_twice_or_extend_hold(self):
        first = self.start()
        again = self.checkout.start(self.payload(), self.request_id, 'consumed', 'a'*64)
        self.assertEqual(first['order_id'], again['order_id'])
        self.assertEqual(self.provider.creates, 1)
        with self.assertRaises(RuleViolation):
            self.checkout.start(self.payload(), self.request_id, 'consumed', 'b'*64)

    def test_uncertain_order_is_recovered_not_recreated(self):
        self.provider.fail = True
        row = self.start()
        self.assertEqual(row['state'], 'creation_unknown')
        self.checkout.prepare(row['booking_id'])
        self.assertEqual(self.provider.creates, 1)
        row = self.checkout.reconcile_creation(row['booking_id'])
        self.assertEqual(row['state'], 'ready')
        self.assertEqual(self.provider.creates, 1)

    def test_order_binding_accepts_provider_default_when_partial_payment_is_omitted(self):
        original_create = self.provider.create_order

        def create_without_default_field(booking_id, amount):
            remote = original_create(booking_id, amount)
            remote.pop('partial_payment')
            return remote

        self.provider.create_order = create_without_default_field
        self.assertEqual(self.start()['state'], 'ready')

    def test_empty_lookup_never_recreates(self):
        self.provider.fail = True
        row = self.start()
        self.provider.remote = None
        for _ in range(2):
            self.checkout.reconcile_creation(row['booking_id'])
            self.checkout.prepare(row['booking_id'])
        self.assertEqual(self.provider.creates, 1)

    def test_verified_capture_confirms_once_with_one_delivery_intent(self):
        row = self.start()
        for _ in range(2):
            self.assertEqual(self.checkout.observe(row['booking_id'], 'pay_synthetic', self.payment(row)), 'accepted')
        with self.store.transaction() as conn:
            self.assertEqual(conn.execute('SELECT state FROM bookings').fetchone()['state'], 'confirmed')
            self.assertEqual(conn.execute("SELECT count(*) AS n FROM delivery_jobs WHERE kind='booking_confirmed'").fetchone()['n'], 3)
            self.assertEqual(conn.execute('SELECT count(*) AS n FROM payments').fetchone()['n'], 1)

    def test_confirmation_and_observation_are_atomic(self):
        row = self.start()
        with patch.object(self.store, 'enqueue', side_effect=RuntimeError('synthetic failure')):
            with self.assertRaises(RuntimeError):
                self.checkout.observe(row['booking_id'], 'pay_synthetic', self.payment(row))
        with self.store.transaction() as conn:
            self.assertEqual(conn.execute('SELECT state FROM bookings').fetchone()['state'], 'held')
            self.assertEqual(conn.execute('SELECT count(*) AS n FROM payments').fetchone()['n'], 0)
            self.assertEqual(conn.execute('SELECT count(*) AS n FROM payment_observations').fetchone()['n'], 0)

    def test_late_payment_does_not_steal_reassigned_slot(self):
        row = self.start()
        self.time += timedelta(minutes=11)
        other = self.store.hold(self.payload(email='other@example.com'), uuid4(),
                                self.verified('other@example.com'), 'b'*64)
        self.assertEqual(self.checkout.observe(row['booking_id'], 'pay_synthetic', self.payment(row)), 'review')
        with self.store.transaction() as conn:
            self.assertEqual(conn.execute('SELECT booking_id FROM slot_claims').fetchone()['booking_id'], other['id'])

    def test_authorized_then_capture_then_stale_failure(self):
        row = self.start()
        self.assertEqual(self.checkout.observe(row['booking_id'], 'pay_synthetic',
            self.payment(row, status='authorized', captured=False)), 'pending')
        self.assertEqual(self.checkout.observe(row['booking_id'], 'pay_synthetic', self.payment(row)), 'accepted')
        self.assertEqual(self.checkout.observe(row['booking_id'], 'pay_synthetic',
            self.payment(row, status='failed', captured=False)), 'accepted')

    def test_mismatched_money_and_refund_remain_review_on_stale_capture(self):
        row = self.start()
        self.assertEqual(self.checkout.observe(row['booking_id'], 'pay_synthetic',
            self.payment(row, amount_refunded=100)), 'review')
        self.assertEqual(self.checkout.observe(row['booking_id'], 'pay_synthetic', self.payment(row)), 'review')
        status = self.store.booking_status(self.request_id, 'a'*64)
        self.assertEqual(status['payment_state'], 'needs_attention')
        self.assertNotIn('key_id', status)
        with self.store.transaction() as conn:
            self.assertEqual(conn.execute('SELECT state FROM bookings').fetchone()['state'], 'payment_review')
            self.assertEqual(conn.execute('SELECT count(*) AS n FROM payments').fetchone()['n'], 0)

    def test_account_change_cannot_use_new_keys_for_old_order(self):
        row = self.start()
        self.provider.key_id = 'rzp_live_other'
        self.provider.mode = 'live'
        with self.assertRaises(RuleViolation):
            self.checkout.observe(row['booking_id'], 'pay_synthetic', self.payment(row))

    def test_concurrent_duplicate_capture_is_one_booking(self):
        row = self.start()
        with ThreadPoolExecutor(max_workers=2) as pool:
            results = list(pool.map(lambda _: self.checkout.observe(row['booking_id'], 'pay_synthetic', self.payment(row)), range(2)))
        self.assertEqual(results, ['accepted', 'accepted'])

    def test_wrong_order_never_writes_observation(self):
        row = self.start()
        with self.assertRaises(RazorpayFailure):
            self.checkout.observe(row['booking_id'], 'pay_synthetic', self.payment(row, order_id='order_other'))
        with self.store.transaction() as conn:
            self.assertEqual(conn.execute('SELECT count(*) AS n FROM payment_observations').fetchone()['n'], 0)

    def test_independent_reconciliation_confirms_without_browser_or_webhook(self):
        row = self.start()
        self.provider.payments = [self.payment(row)]
        self.assertTrue(self.checkout.reconcile_one())
        self.assertEqual(self.store.booking_status(self.request_id, 'a' * 64)['appointment_state'], 'confirmed')
        self.assertEqual(self.provider.payment_reads, 1)
        # The five-minute due window prevents a busy scheduled loop.
        self.assertFalse(self.checkout.reconcile_one())
        self.assertEqual(self.provider.payment_reads, 1)

    def test_independent_reconciliation_validates_collection(self):
        self.start()
        self.provider.order_payments = lambda order_id: {'entity': 'collection', 'count': 2, 'items': []}
        with self.assertRaises(RazorpayFailure):
            self.checkout.reconcile_one()
