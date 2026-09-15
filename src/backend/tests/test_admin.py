"""Private-calendar security and scheduling integration tests, isolated DB only."""

import os
import unittest
from datetime import timedelta

from fastapi.testclient import TestClient

from src.backend.application import Settings, create_app
from src.backend.domain import CLIENT_EMAIL
from src.backend.tests import test_foundation as foundation

NOW = foundation.NOW


@unittest.skipUnless(os.getenv('ASTRO_TEST_DATABASE_URL'), 'Requires the isolated local test database.')
class AdminTests(unittest.TestCase):
    setUpClass = classmethod(foundation.PostgresTests.setUpClass.__func__)
    payload = foundation.PostgresTests.payload
    hold = foundation.PostgresTests.hold
    held = foundation.PostgresTests.held
    verified = foundation.PostgresTests.verified

    def setUp(self):
        foundation.PostgresTests.setUp(self)
        with self.admin_store.transaction() as conn:
            conn.execute('TRUNCATE admin_identity,admin_sessions,admin_login_challenges CASCADE')
        self.identity = {'email': CLIENT_EMAIL, 'email_verified': True, 'sub': 'synthetic-google-subject'}
        self.settings = Settings(google_client_id='synthetic-client-id', origins=('https://studio.example',))
        self.client = TestClient(create_app(self.settings, store=self.store, identity_verifier=lambda credential, audience: self.identity), base_url='https://studio.example')
        self.headers = {'Origin': 'https://studio.example'}

    def start(self):
        response = self.client.post('/api/admin/login/start', headers=self.headers)
        self.assertEqual(response.status_code, 200)
        self.identity['nonce'] = response.json()['nonce']
        return self.headers | {'X-Astro-CSRF': response.json()['nonce']}

    def login(self):
        headers = self.start()
        response = self.client.post('/api/admin/login', headers=headers, json={'credential': 'synthetic-credential-not-a-real-google-token'})
        self.assertEqual(response.status_code, 200)
        self.headers['X-Astro-CSRF'] = response.json()['csrf_token']
        return response

    def test_locked_when_unconfigured(self):
        client = TestClient(create_app(Settings(), store=self.store))
        self.assertEqual(client.post('/api/admin/login/start', headers=self.headers).status_code, 503)

    def test_no_anonymous_calendar_or_changes(self):
        self.assertEqual(self.client.get('/api/admin/day?date=2026-09-10').status_code, 401)
        self.assertEqual(self.client.post('/api/admin/closures', json={'date':'2026-09-10'}, headers=self.headers).status_code, 401)

    def test_origin_and_csrf_required_for_login(self):
        self.assertEqual(self.client.post('/api/admin/login/start').status_code, 403)
        self.assertEqual(self.client.post('/api/admin/login/start', headers={'Origin':'https://evil.example'}).status_code, 403)
        self.start()
        self.assertEqual(self.client.post('/api/admin/login', headers=self.headers, json={'credential':'synthetic-invalid-credential'}).status_code, 403)

    def test_wrong_account_unverified_email_and_nonce_rejected(self):
        for change in ({'email':'someone@example.com'}, {'email_verified':False}, {'nonce':'wrong'}):
            self.identity = {'email':CLIENT_EMAIL,'email_verified':True,'sub':'synthetic-google-subject'}
            headers = self.start()
            self.identity.update(change)
            response = self.client.post('/api/admin/login', headers=headers, json={'credential':'synthetic-invalid-credential'})
            self.assertEqual(response.status_code, 403)

    def test_session_cookie_security_and_logout(self):
        response = self.login()
        cookies = response.headers.get_list('set-cookie')
        session = next(value for value in cookies if value.startswith('__Host-astro_session='))
        for flag in ('HttpOnly','Secure','SameSite=strict','Path=/'):
            self.assertIn(flag, session)
        self.assertNotIn('Domain=', session)
        self.assertEqual(self.client.get('/api/admin/session').json()['email'], CLIENT_EMAIL)
        self.assertEqual(self.client.post('/api/admin/logout', headers=self.headers).status_code, 200)
        self.assertEqual(self.client.get('/api/admin/session').status_code, 401)

    def test_nonce_cannot_be_replayed(self):
        headers = self.start()
        data = {'credential':'synthetic-google-credential'}
        self.assertEqual(self.client.post('/api/admin/login', headers=headers, json=data).status_code, 200)
        self.assertEqual(self.client.post('/api/admin/login', headers=headers, json=data).status_code, 403)

    def test_session_and_challenge_expiry(self):
        headers = self.start()
        self.time = NOW + timedelta(minutes=6)
        self.assertEqual(self.client.post('/api/admin/login', headers=headers, json={'credential':'synthetic-google-credential'}).status_code, 403)
        self.login()
        self.time += timedelta(hours=8)
        self.assertEqual(self.client.get('/api/admin/session').status_code, 401)

    def test_stable_subject_is_pinned(self):
        self.login()
        self.identity['sub'] = 'different-subject-same-email'
        headers = self.start()
        response = self.client.post('/api/admin/login', headers=headers, json={'credential':'synthetic-google-credential'})
        self.assertEqual(response.status_code, 403)

    def test_mutations_require_origin_and_csrf(self):
        self.login()
        payload = {'date':'2026-09-10'}
        for headers in ({}, {'Origin':'https://studio.example'}, self.headers | {'Origin':'https://evil.example'}, self.headers | {'X-Astro-CSRF':'wrong'}):
            self.assertEqual(self.client.post('/api/admin/closures', json=payload, headers=headers).status_code, 403)
        self.assertTrue(all(self.store.availability('2026-09-10')["slots"].values()))

    def test_close_reopen_day_and_far_future(self):
        self.login()
        for day in ('2026-09-10', '2026-12-01'):
            response = self.client.post('/api/admin/closures', json={'date':day,'reason':'Synthetic test closure'}, headers=self.headers)
            self.assertEqual(response.status_code, 200)
            closure_id = response.json()['closure_id']
            detail = self.client.get('/api/admin/day', params={'date':day}).json()
            self.assertTrue(all(slot['state']=='closed' for slot in detail['slots']))
            self.assertEqual(self.client.post(f'/api/admin/closures/{closure_id}/reopen', headers=self.headers).status_code, 200)
            self.assertTrue(all(slot['state']=='open' for slot in self.client.get('/api/admin/day', params={'date':day}).json()['slots']))

    def test_booked_and_held_slots_protected_and_cancelled_by_phone(self):
        row = self.hold()
        self.login()
        for state in ('held', 'booked'):
            self.assertEqual(self.client.get('/api/admin/day?date=2026-09-10').json()['slots'][0]['state'], state)
            self.assertEqual(self.client.post('/api/admin/closures', json={'date':'2026-09-10'}, headers=self.headers).status_code, 409)
            if state == 'held':
                self.store.confirm_paid(row['id'], 'synthetic-payment', row['amount_paise'], 'INR')
        response = self.client.post(f"/api/admin/bookings/{row['id']}/cancel", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['refund_instruction'], 'Refund to be done manually.')
        self.assertTrue(self.store.availability('2026-09-10')["slots"]['10:00'])

    def test_login_throttle_commits_failures(self):
        for _ in range(20):
            self.assertEqual(self.client.post('/api/admin/login/start', headers=self.headers).status_code, 200)
        self.assertEqual(self.client.post('/api/admin/login/start', headers=self.headers).status_code, 429)
