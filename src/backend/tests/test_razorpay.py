"""Synthetic provider checks: no network, orders, payments or notifications."""
import hashlib
import hmac
import json
import os
import unittest
from unittest.mock import patch
from uuid import uuid4

import httpx

from src.backend.application import Settings
from src.backend.razorpay import (
    MAX_RESPONSE, Razorpay, RazorpayFailure, order_receipt,
    payment_matches, verify_checkout, verify_signature,
)


class RazorpayTests(unittest.TestCase):
    def provider(self, handler):
        self.calls = []
        def call(request):
            self.calls.append(request)
            return handler(request)
        return Razorpay('rzp_test_synthetic', 'synthetic-secret', transport=httpx.MockTransport(call))

    def test_settings_load_without_enabling_checkout_or_leaking_secrets(self):
        with patch.dict(os.environ, {'ASTRO_RAZORPAY_KEY_ID': 'rzp_test_synthetic',
                                    'ASTRO_RAZORPAY_KEY_SECRET': 'private-value'}, clear=True):
            settings = Settings.from_environment()
        self.assertEqual(settings.razorpay_key_secret, 'private-value')
        self.assertNotIn('private-value', repr(settings))

    def test_receipts_stable_short_and_mode_distinct(self):
        intent = uuid4()
        self.assertEqual(order_receipt(intent, 'test'), order_receipt(str(intent), 'test'))
        self.assertLessEqual(len(order_receipt(intent, 'test')), 40)
        self.assertNotEqual(order_receipt(intent, 'test'), order_receipt(intent, 'live'))
        with self.assertRaises(ValueError):
            order_receipt(intent, 'unknown')

    def test_order_is_inr_integer_no_partial_payment_or_personal_data(self):
        intent = uuid4()
        def handler(request):
            body = json.loads(request.content)
            self.assertEqual(body, {'amount': 310000, 'currency': 'INR',
                'receipt': order_receipt(intent, 'test'), 'partial_payment': False})
            self.assertEqual(str(request.url), 'https://api.razorpay.com/v1/orders')
            self.assertTrue(request.headers['authorization'].startswith('Basic '))
            return httpx.Response(200, json={**body, 'id': 'order_synthetic', 'entity': 'order'})
        provider = self.provider(handler)
        self.assertEqual(provider.create_order(intent, 310000)['id'], 'order_synthetic')
        self.assertEqual(len(self.calls), 1)
        for invalid in (True, 1.5, '310000', 0, -1):
            with self.assertRaises(ValueError):
                provider.create_order(intent, invalid)
        self.assertEqual(len(self.calls), 1)

    def test_timeout_never_retries_and_write_is_uncertain(self):
        def timeout(request):
            raise httpx.ReadTimeout('private provider detail', request=request)
        provider = self.provider(timeout)
        with self.assertRaises(RazorpayFailure) as caught:
            provider.create_order(uuid4(), 110000)
        self.assertTrue(caught.exception.uncertain)
        self.assertNotIn('private', str(caught.exception))
        self.assertEqual(len(self.calls), 1)

    def test_redirects_errors_and_malformed_success_never_adopt_orders(self):
        responses = [httpx.Response(302, headers={'location': 'https://attacker.example'}),
                     httpx.Response(500, text='private-provider-body'),
                     httpx.Response(200, text='not json'),
                     httpx.Response(200, json=[]),
                     httpx.Response(200, json={'id': 'order_wrong'}),
                     httpx.Response(200, content=b'x' * (MAX_RESPONSE + 1),
                                    headers={'content-type': 'application/json'})]
        for response in responses:
            with self.subTest(status=response.status_code):
                provider = self.provider(lambda request: response)
                with self.assertRaises(RazorpayFailure) as caught:
                    provider.create_order(uuid4(), 100)
                self.assertTrue(caught.exception.uncertain)
                self.assertEqual(len(self.calls), 1)
                self.assertNotIn('private-provider-body', str(caught.exception))

    def test_rejected_credentials_are_not_success(self):
        provider = self.provider(lambda request: httpx.Response(401))
        with self.assertRaises(RazorpayFailure) as caught:
            provider.create_order(uuid4(), 100)
        self.assertEqual(caught.exception.code, 'payment_credentials_rejected')

    def test_signature_uses_exact_bytes_and_saved_order(self):
        secret = 'synthetic-secret'
        body = b'order_saved|pay_saved'
        signature = hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
        self.assertTrue(verify_checkout('order_saved', 'pay_saved', signature, secret))
        self.assertFalse(verify_checkout('order_other', 'pay_saved', signature, secret))
        self.assertFalse(verify_signature(body + b' ', signature, secret))
        for bad in (None, '', 'z'*64, signature + '0'):
            self.assertFalse(verify_signature(body, bad, secret))
        self.assertFalse(verify_signature(body, signature, ''))

    def test_capture_requires_exact_order_amount_currency_and_no_refund(self):
        payment = {'entity': 'payment', 'id': 'pay_saved', 'order_id': 'order_saved',
                   'amount': 310000, 'currency': 'INR', 'status': 'captured',
                   'captured': True, 'amount_refunded': 0}
        def matches(value):
            return payment_matches(value, payment_id='pay_saved', order_id='order_saved', amount=310000)
        self.assertTrue(matches(payment))
        for field, wrong in (('id', 'pay_other'), ('order_id', 'order_other'),
                             ('amount', 110000), ('amount', True), ('currency', 'USD'),
                             ('status', 'authorized'), ('captured', False), ('captured', 1),
                             ('amount_refunded', 100), ('amount_refunded', False)):
            with self.subTest(field=field, wrong=wrong):
                self.assertFalse(matches({**payment, field: wrong}))

    def test_lookup_page_and_identifier_injection(self):
        provider = self.provider(lambda request: httpx.Response(200, json={'items': []}))
        intent = uuid4()
        self.assertEqual(provider.orders_page(intent, skip=100), {'items': []})
        self.assertEqual(self.calls[0].url.params['receipt'], order_receipt(intent, 'test'))
        self.assertEqual(self.calls[0].url.params['skip'], '100')
        for bad in ('../orders', 'pay_good?secret=value', 'https://attacker.example'):
            with self.assertRaises(ValueError):
                provider.payment(bad)
        self.assertEqual(len(self.calls), 1)

    def test_missing_configuration_never_calls_provider(self):
        for key, secret in (('', ''), ('rzp_other_value', 'secret'), ('rzp_test_ok', ' ')):
            with self.assertRaises(RazorpayFailure):
                Razorpay(key, secret)

    def test_merchant_identity_preserves_case_and_rejects_arbitrary_prefixes(self):
        from src.backend.payment_events import merchant_identity
        self.assertEqual(merchant_identity('Example123'), merchant_identity('acc_Example123'))
        self.assertNotEqual(merchant_identity('Example123'), merchant_identity('example123'))
        for invalid in (None, '', 'acc_', 'acc_acc_Example123', 'merchant_Example123', 'Example123 '):
            self.assertIsNone(merchant_identity(invalid))
