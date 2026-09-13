"""Public checkout contract against only the isolated local database/provider."""

import hashlib
import hmac
import os
import unittest
from uuid import uuid4

from fastapi.testclient import TestClient

from src.backend.application import Settings, create_app
from src.backend.razorpay import order_receipt
from src.backend.tests import test_foundation as foundation


class Provider:
    key_id = 'rzp_test_publicroute'
    mode = 'test'
    _secret = 'synthetic-checkout-secret'

    def __init__(self):
        self.orders = 0
        self.last_order = None

    def create_order(self, booking_id, amount):
        self.orders += 1
        self.last_order = {
            'id': 'order_' + booking_id.hex,
            'entity': 'order',
            'receipt': order_receipt(booking_id, self.mode),
            'amount': amount,
            'currency': 'INR',
            'partial_payment': False,
        }
        return self.last_order

    def payment(self, payment_id):
        return {
            'entity': 'payment',
            'id': payment_id,
            'order_id': self.last_order['id'],
            'amount': self.last_order['amount'],
            'currency': 'INR',
            'status': 'captured',
            'captured': True,
            'amount_refunded': 0,
        }

    def order_payments(self, order_id):
        return {'entity': 'collection', 'count': 0, 'items': []}


@unittest.skipUnless(os.getenv('ASTRO_TEST_DATABASE_URL'), 'Requires isolated local database.')
class CheckoutRouteTests(unittest.TestCase):
    setUpClass = classmethod(foundation.PostgresTests.setUpClass.__func__)
    payload = foundation.PostgresTests.payload

    def setUp(self):
        foundation.PostgresTests.setUp(self)
        self.provider = Provider()
        self.codes = []
        settings = Settings(otp_secret=foundation.TEST_SECRET)
        self.client = TestClient(create_app(
            settings,
            store=self.store,
            payment_provider=self.provider,
            code_sender=lambda email, code, purpose, challenge_id: self.codes.append(code) or True,
        ))
        self.request_id = uuid4()
        self.receipt = 'a' * 64

    def verified_token(self):
        response = self.client.post('/api/auth/send-otp', json={'email': 'test@example.com', 'purpose': 'booking'})
        self.assertEqual(response.status_code, 200)
        response = self.client.post('/api/auth/verify-otp', json={
            'email': 'test@example.com', 'purpose': 'booking', 'otp': self.codes[-1],
        })
        self.assertEqual(response.status_code, 200)
        return response.json()['verification_token']

    def begin(self):
        return self.client.post('/api/checkout', json={
            **self.payload(), 'request_id': str(self.request_id),
            'verification_token': self.verified_token(),
        }, headers={'X-Astro-Receipt': self.receipt})

    def test_begin_resume_and_server_verified_capture(self):
        started = self.begin()
        self.assertEqual(started.status_code, 200)
        safe = started.json()
        self.assertEqual(safe['order_state'], 'ready')
        self.assertEqual(safe['appointment_state'], 'held')
        self.assertEqual(safe['payment_state'], 'not_received')
        self.assertEqual(safe['payment_key_id'], self.provider.key_id)
        self.assertNotIn('email', safe)
        self.assertNotIn('phone', safe)

        resumed = self.client.post('/api/checkout/resume', json={'request_id': str(self.request_id)},
                                   headers={'X-Astro-Receipt': self.receipt})
        self.assertEqual(resumed.status_code, 200)
        self.assertEqual(resumed.json()['order_id'], safe['order_id'])
        self.assertEqual(self.provider.orders, 1)

        payment_id = 'pay_checkoutroute'
        signature = hmac.new(self.provider._secret.encode(),
                             f"{safe['order_id']}|{payment_id}".encode(), hashlib.sha256).hexdigest()
        confirmed = self.client.post('/api/checkout/verify-payment', json={
            'request_id': str(self.request_id), 'payment_id': payment_id, 'signature': signature,
        }, headers={'X-Astro-Receipt': self.receipt})
        self.assertEqual(confirmed.status_code, 200)
        self.assertEqual(confirmed.json()['appointment_state'], 'confirmed')
        self.assertEqual(confirmed.json()['payment_state'], 'received')

    def test_wrong_receipt_and_signature_never_confirm(self):
        started = self.begin().json()
        resumed = self.client.post('/api/checkout/resume', json={'request_id': str(self.request_id)},
                                   headers={'X-Astro-Receipt': 'b' * 64})
        self.assertEqual(resumed.status_code, 403)
        rejected = self.client.post('/api/checkout/verify-payment', json={
            'request_id': str(self.request_id), 'payment_id': 'pay_checkoutroute',
            'signature': '0' * 64,
        }, headers={'X-Astro-Receipt': self.receipt})
        self.assertEqual(rejected.status_code, 400)
        self.assertEqual(rejected.json()['code'], 'payment_signature_invalid')
        status = self.store.booking_status(self.request_id, self.receipt)
        self.assertEqual(status['appointment_state'], 'held')
        self.assertEqual(status['payment_state'], 'not_received')
        self.assertEqual(started['order_id'], self.provider.last_order['id'])
