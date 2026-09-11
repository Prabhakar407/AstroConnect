import os
import unittest
from uuid import uuid4

from src.backend.tests import test_admin as admin
from src.backend.tests import test_foundation as foundation


@unittest.skipUnless(os.getenv('ASTRO_TEST_DATABASE_URL'), 'Requires isolated local database.')
class InquiryAccessTests(unittest.TestCase):
    setUpClass = classmethod(foundation.PostgresTests.setUpClass.__func__)
    setUp = admin.AdminTests.setUp
    start = admin.AdminTests.start
    login = admin.AdminTests.login
    verified = foundation.PostgresTests.verified

    def save(self, source='home'):
        payload = dict(kind='contact', source=source, name='Synthetic Person', email='synthetic@example.com',
                       subject='Career guidance', message='Synthetic private message', phone='+918000000000')
        return self.store.save_inquiry(payload, uuid4(), self.verified(payload['email'], 'contact'), 'a'*64)

    def test_all_routes_require_auth_and_seen_requires_csrf(self):
        inquiry = self.save()
        root = '/api/admin/inquiries'
        for path in (root, f'{root}/{inquiry}', root+'?attention=true'):
            self.assertEqual(self.client.get(path).status_code, 401)
        self.assertEqual(self.client.post(f'{root}/{inquiry}/seen').status_code, 401)
        self.login()
        self.assertEqual(self.client.post(f'{root}/{inquiry}/seen').status_code, 403)
        self.assertEqual(self.client.post(f'{root}/{inquiry}/seen', headers=self.headers).status_code, 200)
        self.assertEqual(self.client.post(f'{root}/{inquiry}/seen', headers=self.headers).status_code, 200)

    def test_list_is_minimal_and_detail_does_not_leak_tokens_or_payloads(self):
        inquiry = self.save()
        self.login()
        response = self.client.get('/api/admin/inquiries')
        self.assertEqual(response.status_code, 200)
        self.assertNotIn('Synthetic private message', response.text)
        self.assertNotIn('synthetic@example.com', response.text)
        detail = self.client.get(f'/api/admin/inquiries/{inquiry}')
        self.assertEqual(detail.json()['source'], 'home')
        self.assertEqual(len(detail.json()['notifications']), 2)
        for forbidden in ('receipt_digest','request_hash','message_payload','token_digest','lease_token'):
            self.assertNotIn(forbidden, detail.text)
        self.assertEqual(detail.headers['cache-control'], 'no-store')

    def test_early_webhook_correlates_when_reference_arrives_and_seen_does_not_hide_problem(self):
        inquiry = self.save()
        provider = uuid4()
        with self.store.transaction() as conn:
            conn.execute('INSERT INTO email_events VALUES (%s,%s,%s,%s,%s)',
                         ('synthetic-event', provider, 'email.bounced', self.time, self.time))
            conn.execute("UPDATE delivery_jobs SET provider_id=%s,state='sent' WHERE record_id=%s AND recipient_role='client'", (provider,inquiry))
        self.login()
        self.client.post(f'/api/admin/inquiries/{inquiry}/seen', headers=self.headers)
        response = self.client.get('/api/admin/inquiries?attention=true')
        self.assertEqual(len(response.json()['items']), 1)
        detail = self.client.get(f'/api/admin/inquiries/{inquiry}').json()
        self.assertIn('Bounced', [row['status'] for row in detail['notifications']])

    def test_stable_pages_and_invalid_cursor(self):
        inquiry = self.save()
        with self.store.transaction() as conn:
            for _ in range(27):
                conn.execute('''INSERT INTO inquiries(id,request_id,request_hash,kind,source,name,email,subject,message,created_at)
                    SELECT %s,%s,request_hash,kind,source,name,email,subject,message,created_at FROM inquiries WHERE id=%s''',
                    (uuid4(),uuid4(),inquiry))
        self.login()
        first = self.client.get('/api/admin/inquiries').json()
        second = self.client.get('/api/admin/inquiries?before='+first['next_cursor']).json()
        self.assertEqual((len(first['items']),len(second['items'])), (25,3))
        self.assertFalse({x['id'] for x in first['items']} & {x['id'] for x in second['items']})
        self.assertEqual(self.client.get('/api/admin/inquiries?before=bad').status_code, 422)
