"""Provider contract tests: synthetic tokens; no Google traffic or invitations."""
import json
import unittest
from datetime import datetime
from urllib.parse import parse_qs, urlsplit
from uuid import uuid4

import httpx

from src.backend.domain import SERVICES, UTC
from src.backend.google_calendar import (
    AUTH_URL, CLIENT_EMAIL, MAX_RESPONSE, SCOPES, TOKEN_URL, GoogleCalendar,
    GoogleFailure, authorization_url, event_body, event_identity, meeting_result,
)


class GoogleCalendarTests(unittest.TestCase):
    def provider(self, status=200, data=None, *, handler=None):
        self.calls = []
        def request(req):
            self.calls.append(req)
            return handler(req) if handler else httpx.Response(status, json=data)
        return GoogleCalendar('synthetic-client', 'synthetic-secret', transport=httpx.MockTransport(request))

    def test_authorization_uses_offline_access_identity_and_pkce(self):
        url = authorization_url('client', 'https://website.example/api/admin/google/callback', 's'*43, 'n'*43, 'v'*43)
        self.assertTrue(url.startswith(AUTH_URL + '?'))
        query = parse_qs(urlsplit(url).query)
        self.assertEqual(query['scope'], [' '.join(SCOPES)])
        self.assertEqual(query['access_type'], ['offline'])
        self.assertEqual(query['code_challenge_method'], ['S256'])
        self.assertEqual(query['nonce'], ['n'*43])
        self.assertEqual(query['login_hint'], [CLIENT_EMAIL])
        self.assertNotIn('v'*43, url)

    def test_callback_must_be_https_backend_not_hash_or_arbitrary_path(self):
        for uri in ('https://website.example/#/studio/calendar', 'http://website.example/api/admin/google/callback',
                    'https://user@website.example/api/admin/google/callback',
                    'https://website.example/api/admin/google/callback?next=elsewhere'):
            with self.subTest(uri=uri), self.assertRaises(ValueError):
                authorization_url('client', uri, 's'*43, 'n'*43, 'v'*43)

    def test_all_six_services_are_thirty_minutes_in_indian_time(self):
        booking = uuid4()
        for service in SERVICES:
            body = event_body(booking, service, datetime(2026, 9, 15, 4, 30, tzinfo=UTC), 'guest@example.com')
            self.assertEqual(body['start']['dateTime'], '2026-09-15T10:00:00+05:30')
            self.assertEqual(body['end']['dateTime'], '2026-09-15T10:30:00+05:30')
            self.assertEqual(body['attendees'], [{'email': 'guest@example.com'}])
            self.assertEqual(body['visibility'], 'private')
            self.assertIn(SERVICES[service]['title'], body['summary'])
            self.assertNotIn('birth', json.dumps(body).lower())
            self.assertRegex(body['id'], r'^[a-v0-9]{5,1024}$')
            self.assertEqual(body['id'], event_identity(booking)[0])

    def test_event_identity_stays_stable_and_distinct(self):
        first, second = uuid4(), uuid4()
        self.assertEqual(event_identity(first), event_identity(str(first)))
        self.assertNotEqual(event_identity(first), event_identity(second))

    def test_bad_event_input_rejected(self):
        for email in ('bad', 'guest@example.com\r\nBcc:other@example.com', CLIENT_EMAIL):
            with self.assertRaises(ValueError):
                event_body(uuid4(), 'numerology', datetime.now(UTC), email)
        with self.assertRaises(ValueError):
            event_body(uuid4(), 'numerology', datetime(2026, 9, 15), 'guest@example.com')

    def test_pending_failure_cancellation_and_verified_meet_url(self):
        event = {'id': 'savedid', 'conferenceData': {'createRequest': {'status': {'statusCode': 'pending'}}}}
        self.assertEqual(meeting_result(event, 'savedid'), {'state': 'pending', 'meet_url': None})
        event['conferenceData']['createRequest']['status']['statusCode'] = 'failure'
        self.assertEqual(meeting_result(event, 'savedid')['state'], 'failed')
        event['conferenceData'].update(createRequest={'status': {'statusCode': 'success'}},
            conferenceSolution={'key': {'type': 'hangoutsMeet'}},
            entryPoints=[{'entryPointType': 'video', 'uri': 'https://meet.google.com/abc-defg-hij'}])
        self.assertEqual(meeting_result(event, 'savedid')['meet_url'], 'https://meet.google.com/abc-defg-hij')
        for uri in ('https://meet.google.com.attacker.example/abc-defg-hij', 'javascript:alert(1)',
                    'https://meet.google.com/abc-defg-hij?secret=value'):
            event['conferenceData']['entryPoints'][0]['uri'] = uri
            with self.assertRaises(GoogleFailure):
                meeting_result(event, 'savedid')
        event['status'] = 'cancelled'
        self.assertEqual(meeting_result(event, 'savedid')['state'], 'cancelled')
        with self.assertRaises(GoogleFailure):
            meeting_result(event, 'different-id')

    def test_exchange_credentials_are_body_only_and_refresh_absence_preserved(self):
        provider = self.provider(data={'access_token': 'synthetic-access', 'expires_in': 3600, 'token_type': 'Bearer'})
        result = provider.tokens(code='synthetic-code', redirect_uri='https://website.example/api/admin/google/callback', verifier='v'*43)
        self.assertNotIn('refresh_token', result)
        request = self.calls[0]
        self.assertEqual(str(request.url), TOKEN_URL)
        form = parse_qs(request.content.decode())
        self.assertEqual(form['client_secret'], ['synthetic-secret'])
        self.assertEqual(form['code_verifier'], ['v'*43])
        provider.tokens(refresh_token='synthetic-refresh')
        self.assertEqual(parse_qs(self.calls[1].content.decode())['grant_type'], ['refresh_token'])

    def test_rejects_invalid_token_shapes(self):
        for body in ({}, {'access_token': 'token', 'expires_in': True, 'token_type': 'Bearer'},
                     {'access_token': 'token', 'expires_in': 3600, 'token_type': 'Other'}):
            with self.subTest(body=body), self.assertRaises(GoogleFailure):
                self.provider(data=body).tokens(refresh_token='synthetic')

    def test_insert_requests_google_invitation_and_meet(self):
        body = event_body(uuid4(), 'name-change', datetime.now(UTC), 'guest@example.com')
        provider = self.provider(data=body)
        self.assertEqual(provider.insert('synthetic-access', CLIENT_EMAIL, body), body)
        request = self.calls[0]
        self.assertEqual(request.url.params['sendUpdates'], 'all')
        self.assertEqual(request.url.params['conferenceDataVersion'], '1')
        self.assertEqual(request.headers['authorization'], 'Bearer synthetic-access')
        self.assertEqual(json.loads(request.content)['id'], body['id'])

    def test_get_and_delete_target_exact_encoded_identifiers(self):
        provider = self.provider(data={'id': 'id'})
        provider.event('token', 'calendar@example.com', 'id')
        self.assertIn('calendar%40example.com/events/id', str(self.calls[0].url))
        provider = self.provider(handler=lambda req: httpx.Response(204))
        self.assertEqual(provider.delete('token', 'calendar@example.com', 'id'), {})
        self.assertEqual(self.calls[0].method, 'DELETE')
        self.assertEqual(self.calls[0].url.params['sendUpdates'], 'all')

    def test_fixed_errors_never_expose_provider_secrets(self):
        for status, code, retry in ((401, 'reconnect_required', False), (404, 'not_found', False),
                                   (409, 'already_exists', False), (410, 'gone', False),
                                   (429, 'google_unavailable', True), (503, 'google_unavailable', True),
                                   (403, 'google_request_rejected', False)):
            with self.subTest(status=status):
                provider = self.provider(status, {'error': 'private-provider-detail'})
                with self.assertRaises(GoogleFailure) as error:
                    provider.event('token', 'calendar', 'id')
                self.assertEqual(str(error.exception), code)
                self.assertEqual(error.exception.retryable, retry)
                self.assertEqual(len(self.calls), 1)

    def test_revoked_refresh_requires_reconnection(self):
        with self.assertRaises(GoogleFailure) as error:
            self.provider(400, {'error': 'invalid_grant', 'error_description': 'secret'}).tokens(refresh_token='synthetic')
        self.assertEqual(error.exception.code, 'reconnect_required')

    def test_redirect_never_follows_with_credentials(self):
        provider = self.provider(handler=lambda req: httpx.Response(302, headers={'Location': 'https://attacker.example'}, json={}))
        with self.assertRaises(GoogleFailure):
            provider.event('token', 'calendar', 'id')
        self.assertEqual(len(self.calls), 1)

    def test_timeout_does_not_blindly_retry_insert(self):
        def timeout(req):
            raise httpx.ReadTimeout('synthetic-secret URL detail', request=req)
        provider = self.provider(handler=timeout)
        with self.assertRaises(GoogleFailure) as error:
            provider.insert('token', 'calendar', {'id': 'saved'})
        self.assertEqual(str(error.exception), 'google_unavailable')
        self.assertEqual(len(self.calls), 1)

    def test_response_is_bounded_and_requires_json(self):
        for response in (httpx.Response(200, text='x'*(MAX_RESPONSE+1)),
                         httpx.Response(200, text='<html>not JSON</html>'), httpx.Response(200, json=[])):
            with self.subTest(response=response), self.assertRaises(GoogleFailure):
                self.provider(handler=lambda req: response).event('token', 'calendar', 'id')


if __name__ == '__main__':
    unittest.main()
