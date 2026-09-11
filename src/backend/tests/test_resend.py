"""No real email or network: transport contracts and verification races."""
import io
import json
import os
import unittest
from datetime import timedelta
from email.message import Message
from urllib.error import HTTPError, URLError
from unittest.mock import patch
from uuid import uuid4

from src.backend.application import Settings
from src.backend.domain import RuleViolation
from src.backend.resend_email import ENDPOINT, MAX_RESPONSE_BYTES, NoEmailRedirects, send_code, verification_message
from src.backend.storage import StorageUnavailable
from src.backend.verification import EmailVerification
from src.backend.tests import test_foundation as foundation

PROVIDER_ID = '7f134617-0471-49c8-9410-4ffbced9d250'


class ResendTransportTests(unittest.TestCase):
    def setUp(self):
        self.settings = Settings(resend_key='synthetic-provider-key', sender='Astro Advice <bookings@mail.astroadvicebykundansingh.com>')

    def response(self, provider, body=None, status=200, content_type='application/json'):
        response = provider.return_value.open.return_value.__enter__.return_value
        response.status = status
        response.read.return_value = body if body is not None else json.dumps({'id': PROVIDER_ID}).encode()
        response.headers = Message()
        response.headers['Content-Type'] = content_type
        return response

    def send(self, challenge=None):
        return send_code(self.settings, 'synthetic@example.com', '123456', 'contact', challenge or uuid4())

    def test_only_fixed_endpoint_and_client_reply_address_are_used(self):
        with patch('src.backend.resend_email.build_opener') as provider:
            response = self.response(provider)
            self.assertEqual(self.send(), PROVIDER_ID)
            self.assertIsInstance(provider.call_args.args[0], NoEmailRedirects)
            call = provider.return_value.open.call_args
            request = call.args[0]
            self.assertEqual(request.full_url, ENDPOINT)
            self.assertEqual(request.method, 'POST')
            self.assertEqual(call.kwargs, {'timeout': 10})
            payload = json.loads(request.data)
            self.assertEqual(payload['from'], self.settings.sender)
            self.assertEqual(payload['to'], ['synthetic@example.com'])
            self.assertEqual(payload['reply_to'], 'astroadvicebyks@gmail.com')
            self.assertIn('five minutes', payload['text'])
            self.assertNotIn('birth', payload['text'])
            self.assertNotIn('synthetic-provider-key', payload['html'])
            response.read.assert_called_once_with(MAX_RESPONSE_BYTES + 1)

    def test_repeat_attempt_has_same_key_but_new_challenge_never_reuses_it(self):
        challenge = uuid4()
        with patch('src.backend.resend_email.build_opener') as provider:
            self.response(provider)
            for value in (challenge, challenge, uuid4()):
                self.send(value)
            requests = [call.args[0] for call in provider.return_value.open.call_args_list]
            keys = [request.get_header('Idempotency-key') for request in requests]
            self.assertEqual(keys[0], keys[1])
            self.assertNotEqual(keys[0], keys[2])
            self.assertNotIn('synthetic@example.com', keys[0])
            self.assertNotIn('123456', keys[0])

    def test_invalid_success_responses_are_not_accepted(self):
        for body, status, content_type in [
            (b'{}', 200, 'application/json'), (b'[]', 200, 'application/json'),
            (b'{"id":true}', 200, 'application/json'), (b'{"id":"not-an-email-reference"}', 200, 'application/json'),
            (b'not-json', 200, 'application/json'), (b'x' * (MAX_RESPONSE_BYTES + 1), 200, 'application/json'),
            (json.dumps({'id': PROVIDER_ID}).encode(), 202, 'application/json'),
            (json.dumps({'id': PROVIDER_ID}).encode(), 200, 'text/html'),
        ]:
            with self.subTest(status=status, content_type=content_type), patch('src.backend.resend_email.build_opener') as provider:
                self.response(provider, body, status, content_type)
                with self.assertRaises(StorageUnavailable):
                    self.send()
                provider.return_value.open.assert_called_once()

    def test_network_quota_and_provider_errors_never_leak_or_auto_retry(self):
        private_marker = 'private-provider-response-never-for-browser'
        for error in (TimeoutError(private_marker), URLError(private_marker),
                      HTTPError(ENDPOINT, 429, private_marker, Message(), io.BytesIO(private_marker.encode())),
                      HTTPError(ENDPOINT, 500, private_marker, Message(), io.BytesIO(private_marker.encode()))):
            with self.subTest(error=type(error).__name__), patch('src.backend.resend_email.build_opener') as provider:
                provider.return_value.open.side_effect = error
                with self.assertRaises(StorageUnavailable) as caught:
                    self.send()
                self.assertNotIn(private_marker, str(caught.exception))
                self.assertNotIn(self.settings.resend_key, str(caught.exception))
                provider.return_value.open.assert_called_once()
                if isinstance(error, HTTPError):
                    self.assertTrue(error.closed)

    def test_redirects_cannot_forward_the_credential(self):
        for status in (301, 302, 303, 307, 308):
            self.assertIsNone(NoEmailRedirects().redirect_request(None, None, status, '', {}, 'https://unapproved.example'))

    def test_quota_response_is_distinct_and_provider_text_is_not_exposed(self):
        from src.backend.resend_email import EmailDeliveryError
        for name in ('daily_quota_exceeded', 'monthly_quota_exceeded'):
            error = HTTPError(ENDPOINT,429,'private',Message(),io.BytesIO(json.dumps({'name':name,'message':'private'}).encode()))
            with patch('src.backend.resend_email.build_opener') as provider:
                provider.return_value.open.side_effect = error
                with self.assertRaises(EmailDeliveryError) as caught: self.send()
                self.assertEqual(caught.exception.code,name)
                self.assertEqual(caught.exception.retry_after,86400)
                self.assertNotIn('private',str(caught.exception))

    def test_bad_input_and_header_injection_never_reach_provider(self):
        for sender, email, code, purpose in (
            ('sender@example.com\r\nBcc: other@example.com', 'test@example.com', '123456', 'contact'),
            ('sender@example.com', 'test@example.com\r\nBcc: other@example.com', '123456', 'contact'),
            ('sender@example.com', 'test@example.com', '<img>', 'contact'),
            ('sender@example.com', 'test@example.com', '123456', 'admin'),
        ):
            with self.subTest(purpose=purpose), patch('src.backend.resend_email.build_opener') as provider:
                with self.assertRaises(StorageUnavailable):
                    send_code(Settings(resend_key='synthetic', sender=sender), email, code, purpose, uuid4())
                provider.assert_not_called()

    def test_all_purposes_have_clear_text_without_an_appointment_claim(self):
        for purpose in ('booking', 'contact', 'prashna'):
            payload = verification_message(self.settings.sender, 'synthetic@example.com', '123456', purpose)
            self.assertIn('123456', payload['text'])
            self.assertNotIn('Appointment confirmed', payload['text'])
            self.assertIn('Do not share', payload['text'])


@unittest.skipUnless(os.getenv('ASTRO_TEST_DATABASE_URL'), 'Requires isolated local test database.')
class VerificationSendTests(unittest.TestCase):
    setUpClass = classmethod(foundation.PostgresTests.setUpClass.__func__)
    setUp = foundation.PostgresTests.setUp

    def test_sender_receives_the_saved_challenge_id_outside_transaction(self):
        def sender(email, code, purpose, challenge_id):
            with self.store.transaction() as conn:
                saved = conn.execute('SELECT challenge_id,send_accepted FROM email_challenges WHERE email=%s AND purpose=%s', (email, purpose)).fetchone()
            self.assertEqual(saved['challenge_id'], challenge_id)
            self.assertFalse(saved['send_accepted'])
            return PROVIDER_ID
        verification = EmailVerification(self.store, foundation.TEST_SECRET, sender)
        verification.issue('synthetic@example.com', 'contact', 'synthetic-ip')
        with self.store.transaction() as conn:
            self.assertTrue(conn.execute("SELECT send_accepted FROM email_challenges WHERE email='synthetic@example.com'").fetchone()['send_accepted'])

    def test_replaced_or_expired_code_cannot_be_marked_accepted(self):
        for replace in (True, False):
            self.setUp()
            def sender(email, code, purpose, challenge_id):
                if replace:
                    with self.store.transaction() as conn:
                        conn.execute('UPDATE email_challenges SET challenge_id=%s WHERE email=%s AND purpose=%s', (uuid4(), email, purpose))
                else:
                    self.time += timedelta(minutes=5)
                return PROVIDER_ID
            verification = EmailVerification(self.store, foundation.TEST_SECRET, sender)
            with self.subTest(replaced=replace), self.assertRaises(RuleViolation) as caught:
                verification.issue('synthetic@example.com', 'contact', 'synthetic-ip')
            self.assertEqual(caught.exception.status, 409)
            with self.store.transaction() as conn:
                self.assertFalse(conn.execute("SELECT send_accepted FROM email_challenges WHERE email='synthetic@example.com'").fetchone()['send_accepted'])
