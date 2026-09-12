"""Real signature library, synthetic bodies, isolated database only."""
import base64
import json
import os
import unittest
from dataclasses import replace
from datetime import datetime, timedelta, timezone
from unittest.mock import patch
from uuid import uuid4

from fastapi.testclient import TestClient
from svix.webhooks import Webhook
from src.backend.application import Settings, create_app
from src.backend.email_events import delivery_label
from src.backend.tests import test_foundation as foundation

SECRET = 'whsec_' + base64.b64encode(b'synthetic-webhook-secret-not-real').decode()


class ObservationTests(unittest.TestCase):
    def test_late_acceptance_or_delivery_never_erases_bounce(self):
        self.assertEqual(delivery_label('sent', ['email.bounced','email.sent','email.delivered'], None), 'Bounced')
        self.assertEqual(delivery_label('sent', ['email.delivery_delayed','email.delivered'], None), 'Delivered to mail server')


@unittest.skipUnless(os.getenv('ASTRO_TEST_DATABASE_URL'), 'Requires isolated local database.')
class EventTests(unittest.TestCase):
    setUpClass = classmethod(foundation.PostgresTests.setUpClass.__func__)
    def setUp(self):
        foundation.PostgresTests.setUp(self)
        self.client = TestClient(create_app(Settings(resend_webhook_secret=SECRET), store=self.store))
        self.provider = str(uuid4())

    def signed(self, *, kind='email.delivered', event_id=None, offset=0):
        event_id = event_id or 'msg_' + uuid4().hex
        when = datetime.now(timezone.utc) + timedelta(seconds=offset)
        body = json.dumps({'type': kind, 'created_at': when.isoformat(),
                           'data': {'email_id': self.provider, 'subject': 'private message not retained'}})
        headers = {'svix-id': event_id, 'svix-timestamp': str(int(when.timestamp())),
                   'svix-signature': Webhook(SECRET).sign(event_id, when, body), 'Content-Type': 'application/json'}
        return body, headers

    def test_signed_unknown_reference_retained_and_duplicate_is_noop(self):
        body, headers = self.signed()
        for _ in range(2):
            self.assertEqual(self.client.post('/api/webhooks/resend', content=body, headers=headers).status_code, 200)
        with self.store.transaction() as conn:
            rows = conn.execute('SELECT * FROM email_events').fetchall()
            self.assertEqual(len(rows), 1)
            self.assertEqual(str(rows[0]['provider_id']), self.provider)
            self.assertNotIn('private message', str(rows))

    def test_bad_missing_stale_future_and_tampered_signatures_do_not_touch_store(self):
        samples = [self.signed(offset=-3600), self.signed(offset=3600)]
        body, headers = self.signed()
        samples += [(body, {}), (body + ' ', headers), (body, headers | {'svix-signature':'v1,bad'})]
        with patch.object(self.store, 'transaction', side_effect=AssertionError('unauthorized storage')):
            for body, headers in samples:
                self.assertEqual(self.client.post('/api/webhooks/resend', content=body, headers=headers).status_code, 400)

    def test_signed_irrelevant_events_ignored_and_conflicting_id_rejected(self):
        body, headers = self.signed(kind='email.opened')
        self.assertEqual(self.client.post('/api/webhooks/resend', content=body, headers=headers).status_code, 200)
        body, headers = self.signed()
        self.assertEqual(self.client.post('/api/webhooks/resend', content=body, headers=headers).status_code, 200)
        new_body, new_headers = self.signed(kind='email.bounced', event_id=headers['svix-id'])
        self.assertEqual(self.client.post('/api/webhooks/resend', content=new_body, headers=new_headers).status_code, 409)

    def test_missing_configuration_and_oversized_bodies(self):
        client = TestClient(create_app(Settings(), store=self.store))
        self.assertEqual(client.post('/api/webhooks/resend', content=b'{}').status_code, 503)
        self.assertEqual(self.client.post('/api/webhooks/resend', content=b'x'*16385).status_code, 413)
