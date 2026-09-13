"""OAuth callback integration against the disposable local database only."""
import os
import unittest
from datetime import timedelta
from urllib.parse import parse_qs, urlsplit
from unittest.mock import patch

from cryptography.fernet import Fernet

from src.backend.google_calendar import SCOPES, GoogleFailure
from src.backend.google_connection import COOKIE, saved_connection_ready
from src.backend.tests import test_admin as admin_tests


@unittest.skipUnless(os.getenv('ASTRO_TEST_DATABASE_URL'), 'Requires isolated local database.')
class GoogleConnectionTests(unittest.TestCase):
    setUpClass = classmethod(admin_tests.AdminTests.setUpClass.__func__)
    start = admin_tests.AdminTests.start
    login = admin_tests.AdminTests.login

    def setUp(self):
        admin_tests.AdminTests.setUp(self)
        self.settings.google_client_secret = 'synthetic-secret'
        self.settings.google_token_key = Fernet.generate_key().decode()
        self.login()
        self.tokens = {'access_token': 'synthetic-access', 'refresh_token': 'synthetic-refresh',
                       'id_token': 'synthetic-identity', 'scope': ' '.join(SCOPES)}
        self.mock = patch('src.backend.google_calendar.GoogleCalendar.tokens', return_value=self.tokens)
        self.exchange = self.mock.start()
        self.addCleanup(self.mock.stop)

    def begin(self):
        response = self.client.post('/api/admin/google/start', headers=self.headers)
        self.assertEqual(response.status_code, 200)
        query = parse_qs(urlsplit(response.json()['authorization_url']).query)
        self.identity['nonce'] = query['nonce'][0]
        self.state = query['state'][0]
        return response

    def callback(self, **extra):
        return self.client.get('/api/admin/google/callback', params={'state': self.state, 'code': 'synthetic-code', **extra}, follow_redirects=False)

    def connected(self):
        return self.client.get('/api/admin/google/status').json()['connected']

    def test_start_requires_login_origin_csrf_and_configuration(self):
        self.assertEqual(self.client.post('/api/admin/google/start').status_code, 403)
        self.assertEqual(self.client.post('/api/admin/google/start', headers={'Origin':'https://evil.example'}).status_code, 403)
        self.settings.google_token_key = ''
        self.assertEqual(self.client.post('/api/admin/google/start', headers=self.headers).status_code, 503)

    def test_correct_callback_works_without_strict_cookie_and_encrypts_refresh(self):
        response = self.begin()
        cookie = response.headers['set-cookie'].lower()
        self.assertIn('samesite=lax', cookie)
        self.assertIn('httponly', cookie)
        self.assertIn('secure', cookie)
        self.client.cookies.delete('__Host-astro_session')
        response = self.callback()
        self.assertEqual(response.status_code, 303)
        self.assertEqual(response.headers['location'], 'https://studio.example/#/studio/calendar?google=connected')
        with self.store.transaction() as conn:
            row = conn.execute('SELECT * FROM google_connection').fetchone()
        self.assertNotEqual(row['refresh_token_encrypted'], 'synthetic-refresh')
        self.assertEqual(Fernet(self.settings.google_token_key.encode()).decrypt(row['refresh_token_encrypted'].encode()), b'synthetic-refresh')
        self.assertNotIn('synthetic', response.headers['location'])

    def test_replay_is_rejected(self):
        self.begin()
        self.callback()
        self.assertEqual(self.callback().status_code, 400)
        self.assertEqual(self.exchange.call_count, 1)

    def test_wrong_browser_rejected_before_provider(self):
        self.begin()
        self.client.cookies.delete(COOKIE)
        self.assertEqual(self.callback().status_code, 400)
        self.exchange.assert_not_called()

    def test_denial_burns_state_without_touching_google(self):
        self.begin()
        response = self.callback(error='access_denied')
        self.assertTrue(response.headers['location'].endswith('google=denied'))
        self.assertFalse(self.connected())
        self.exchange.assert_not_called()

    def test_wrong_google_account_and_nonce_never_connect(self):
        for field, value in (('sub', 'different-subject'), ('email', 'another@example.com'),
                             ('email_verified', False), ('nonce', 'wrong')):
            with self.subTest(field=field):
                self.begin()
                old = self.identity[field]
                self.identity[field] = value
                self.assertTrue(self.callback().headers['location'].endswith('google=failed'))
                self.assertFalse(self.connected())
                self.identity[field] = old

    def test_expired_state_or_original_session_prevents_exchange(self):
        self.begin()
        self.time += timedelta(minutes=11)
        self.assertTrue(self.callback().headers['location'].endswith('google=failed'))
        self.exchange.assert_not_called()

    def test_logout_invalidates_pending_authorization(self):
        self.begin()
        self.assertEqual(self.client.post('/api/admin/logout', headers=self.headers).status_code, 200)
        self.assertEqual(self.callback().status_code, 400)
        self.exchange.assert_not_called()

    def test_new_tab_invalidates_old_state(self):
        self.begin()
        old = self.state
        self.begin()
        self.assertEqual(self.callback(state=old).status_code, 400)
        self.exchange.assert_not_called()

    def test_missing_refresh_first_connection_rejected(self):
        del self.tokens['refresh_token']
        self.begin()
        self.assertTrue(self.callback().headers['location'].endswith('google=failed'))
        self.assertFalse(self.connected())

    def test_reconnect_preserves_existing_refresh_when_omitted(self):
        self.begin()
        self.callback()
        del self.tokens['refresh_token']
        self.begin()
        self.assertTrue(self.callback().headers['location'].endswith('google=connected'))
        self.assertTrue(self.connected())

    def test_provider_failure_preserves_working_connection(self):
        self.begin()
        self.callback()
        self.begin()
        self.exchange.side_effect = GoogleFailure('google_unavailable', retryable=True)
        response = self.callback()
        self.assertTrue(response.headers['location'].endswith('google=failed'))
        self.assertTrue(self.connected())

    def test_missing_scope_rejected(self):
        self.tokens['scope'] = 'openid email'
        self.begin()
        self.assertTrue(self.callback().headers['location'].endswith('google=failed'))
        self.assertFalse(self.connected())

    def test_saved_connection_readiness_checks_scope_and_encryption_key(self):
        self.begin()
        self.callback()
        self.assertTrue(saved_connection_ready(self.settings, self.store))
        original_key = self.settings.google_token_key
        self.settings.google_token_key = Fernet.generate_key().decode()
        self.assertFalse(saved_connection_ready(self.settings, self.store))
        self.settings.google_token_key = original_key
        with self.store.transaction() as conn:
            conn.execute("UPDATE google_connection SET scopes='openid email'")
        self.assertFalse(saved_connection_ready(self.settings, self.store))

    def test_access_check_refreshes_under_lock_and_checks_meet_without_creating_event(self):
        self.begin()
        self.callback()
        with patch('src.backend.google_calendar.GoogleCalendar.calendar', return_value={
            'id': 'astroadvicebyks@gmail.com', 'conferenceProperties': {'allowedConferenceSolutionTypes': ['hangoutsMeet']}
        }) as calendar:
            response = self.client.post('/api/admin/google/check', headers=self.headers)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {'calendar_access': True, 'meet_supported': True})
        calendar.assert_called_once_with('synthetic-access', 'astroadvicebyks@gmail.com')
        self.exchange.assert_called_with(refresh_token='synthetic-refresh')

    def test_connection_check_requires_csrf_and_handles_revocation(self):
        self.assertEqual(self.client.post('/api/admin/google/check').status_code, 403)
        self.begin()
        self.callback()
        self.exchange.side_effect = GoogleFailure('reconnect_required')
        response = self.client.post('/api/admin/google/check', headers=self.headers)
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json()['code'], 'reconnect_required')

    def test_session_expires_during_google_exchange(self):
        self.begin()
        def expires(**kwargs):
            self.time += timedelta(hours=9)
            return self.tokens
        self.exchange.side_effect = expires
        self.assertTrue(self.callback().headers['location'].endswith('google=failed'))
        with self.store.transaction() as conn:
            self.assertIsNone(conn.execute('SELECT * FROM google_connection').fetchone())
