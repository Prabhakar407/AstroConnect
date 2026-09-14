"""Google Sheet copying uses synthetic providers and isolated local SQL only."""

import io
import json
import os
import unittest
from datetime import timedelta
from email.message import Message
from unittest.mock import patch
from urllib.error import HTTPError
from uuid import uuid4

from src.backend.application import Settings
from src.backend.sheet_delivery import GoogleSheets, SheetDelivery, SheetFailure
from src.backend.tests import test_foundation as foundation


class Response(io.BytesIO):
    def __init__(self, value, status=200):
        super().__init__(json.dumps(value).encode())
        self.status = status
        self.headers = Message()
        self.headers['Content-Type'] = 'application/json'


class Opener:
    def __init__(self, *responses):
        self.responses = list(responses)
        self.requests = []

    def open(self, request, timeout):
        self.requests.append((request, timeout))
        value = self.responses.pop(0)
        if isinstance(value, Exception):
            raise value
        return value


class GoogleSheetsTests(unittest.TestCase):
    def test_append_uses_raw_literal_values_and_confirms_exactly_one_reference(self):
        reference = str(uuid4())
        opener = Opener(Response({'values': []}), Response({'updates': {'updatedRows': 1}}),
                        Response({'values': [[reference]]}))
        GoogleSheets('', opener=opener, token='synthetic-access-token-value').upsert(
            'a' * 30, 'Inquiries', [reference, '=literal customer text'])
        self.assertEqual([request.method for request, _ in opener.requests], ['GET', 'POST', 'GET'])
        write = opener.requests[1][0]
        self.assertIn('valueInputOption=RAW', write.full_url)
        self.assertEqual(json.loads(write.data)['values'][0][1], '=literal customer text')
        self.assertTrue(all(timeout == 10 for _, timeout in opener.requests))

    def test_existing_reference_is_updated_in_place(self):
        reference = str(uuid4())
        opener = Opener(Response({'values': [[reference]]}), Response({'updatedRows': 1}),
                        Response({'values': [[reference]]}))
        GoogleSheets('', opener=opener, token='synthetic-access-token-value').upsert(
            'b' * 30, 'Appointments', [reference, 'Cancelled'])
        self.assertEqual(opener.requests[1][0].method, 'PUT')
        self.assertIn('A2%3AS2', opener.requests[1][0].full_url)

    def test_duplicate_reference_stops_without_overwriting_any_row(self):
        reference = str(uuid4())
        opener = Opener(Response({'values': [[reference], [reference]]}))
        with self.assertRaisesRegex(SheetFailure, 'duplicate_sheet_rows'):
            GoogleSheets('', opener=opener, token='synthetic-access-token-value').upsert(
                'c' * 30, 'Inquiries', [reference])
        self.assertEqual(len(opener.requests), 1)

    def test_access_error_is_safe_and_not_retried_blindly(self):
        headers = Message()
        failure = HTTPError('https://sheets.googleapis.com/private', 403, 'private', headers, io.BytesIO(b'private'))
        opener = Opener(failure)
        with self.assertRaises(SheetFailure) as caught:
            GoogleSheets('', opener=opener, token='synthetic-access-token-value').upsert(
                'd' * 30, 'Inquiries', [str(uuid4())])
        self.assertEqual(caught.exception.code, 'sheet_access_required')
        self.assertFalse(caught.exception.retryable)
        self.assertNotIn('private', str(caught.exception))


class Provider:
    def __init__(self, after_write=None):
        self.calls = []
        self.after_write = after_write

    def upsert(self, spreadsheet_id, tab, row):
        self.calls.append((spreadsheet_id, tab, row))
        if self.after_write:
            callback, self.after_write = self.after_write, None
            callback()


@unittest.skipUnless(os.getenv('ASTRO_TEST_DATABASE_URL'), 'Requires isolated local database.')
class SheetDeliveryTests(unittest.TestCase):
    setUpClass = classmethod(foundation.PostgresTests.setUpClass.__func__)
    setUp = foundation.PostgresTests.setUp
    payload = foundation.PostgresTests.payload
    verified = foundation.PostgresTests.verified

    def worker(self):
        provider = Provider()
        settings = Settings(client_sheet_id='c' * 30, agency_sheet_id='a' * 30)
        return SheetDelivery(self.store, settings, provider=provider), provider

    def test_inquiry_is_copied_once_to_each_independent_workbook(self):
        payload = dict(kind='contact', name='Synthetic', email='synthetic@example.com',
                       subject='Help', message='=literal inquiry')
        inquiry = self.store.save_inquiry(payload, uuid4(), self.verified(payload['email'], 'contact'), 'a' * 64)
        worker, provider = self.worker()
        with self.store.transaction() as conn:
            jobs = conn.execute("SELECT id FROM delivery_jobs WHERE kind='sheet_inquiry' AND record_id=%s",
                                (inquiry,)).fetchall()
        for job in jobs:
            self.assertEqual(worker.run(job['id'])['state'], 'sent')
            self.assertEqual(worker.run(job['id'])['state'], 'sent')
        self.assertEqual(len(provider.calls), 2)
        self.assertEqual({call[0] for call in provider.calls}, {'c' * 30, 'a' * 30})
        self.assertTrue(all(call[1] == 'Inquiries' and call[2][0] == str(inquiry) for call in provider.calls))

    def test_confirmed_booking_waits_for_meet_then_cancellation_updates_same_reference(self):
        booking = self.store.hold(self.payload(), uuid4(), self.verified(), 'a' * 64)
        self.store.confirm_paid(booking['id'], 'synthetic-paid', booking['amount_paise'], 'INR')
        worker, provider = self.worker()
        with self.store.transaction() as conn:
            jobs = conn.execute("SELECT id FROM delivery_jobs WHERE kind='sheet_booking' AND record_id=%s",
                                (booking['id'],)).fetchall()
        self.assertTrue(all(worker.run(job['id'])['error_code'] == 'meeting_pending' for job in jobs))
        with self.store.transaction() as conn:
            conn.execute("""INSERT INTO booking_calendar_events
                (booking_id,calendar_id,event_id,state,meet_url,created_at,updated_at)
                VALUES (%s,'calendar','event','ready','https://meet.google.com/abc-defg-hij',%s,%s)""",
                (booking['id'], self.time, self.time))
        self.time = self.time.replace(second=31)
        for job in jobs:
            self.assertEqual(worker.run(job['id'])['state'], 'sent')
        self.store.cancel(booking['id'], 'synthetic-studio')
        with self.store.transaction() as conn:
            cancelled = conn.execute("""SELECT id FROM delivery_jobs WHERE kind='sheet_booking'
                AND record_id=%s AND message_version=2""", (booking['id'],)).fetchall()
        for job in cancelled:
            self.assertEqual(worker.run(job['id'])['state'], 'sent')
        self.assertEqual(len(provider.calls), 4)
        self.assertTrue(all(call[2][0] == str(booking['id']) for call in provider.calls))
        self.assertTrue(all(call[2][1] == 'Cancelled' for call in provider.calls[-2:]))

    def test_missing_destination_is_visible_without_calling_google(self):
        payload = dict(kind='contact', name='Synthetic', email='synthetic@example.com',
                       subject='Help', message='Safe')
        inquiry = self.store.save_inquiry(payload, uuid4(), self.verified(payload['email'], 'contact'), 'a' * 64)
        provider = Provider()
        worker = SheetDelivery(self.store, Settings(), provider=provider)
        with self.store.transaction() as conn:
            job = conn.execute("SELECT id FROM delivery_jobs WHERE kind='sheet_inquiry' LIMIT 1").fetchone()
        result = worker.run(job['id'])
        self.assertEqual((result['state'], result['error_code']), ('failed', 'sheet_destination_not_configured'))
        self.assertEqual(provider.calls, [])

    def test_cancellation_during_remote_write_converges_on_cancelled_truth(self):
        booking = self.store.hold(self.payload(), uuid4(), self.verified(), 'a' * 64)
        self.store.confirm_paid(booking['id'], 'synthetic-paid', booking['amount_paise'], 'INR')
        with self.store.transaction() as conn:
            conn.execute("""INSERT INTO booking_calendar_events
                (booking_id,calendar_id,event_id,state,meet_url,created_at,updated_at)
                VALUES (%s,'calendar','event','ready','https://meet.google.com/abc-defg-hij',%s,%s)""",
                (booking['id'], self.time, self.time))
            job = conn.execute("""SELECT id FROM delivery_jobs WHERE kind='sheet_booking'
                AND recipient_role='client_sheet' AND record_id=%s""", (booking['id'],)).fetchone()
        provider = Provider(after_write=lambda: self.store.cancel(booking['id'], 'synthetic-studio'))
        worker = SheetDelivery(self.store, Settings(client_sheet_id='c' * 30, agency_sheet_id='a' * 30),
                               provider=provider)
        first = worker.run(job['id'])
        self.assertEqual((first['state'], first['error_code']), ('pending', 'sheet_record_changed'))
        self.time += timedelta(seconds=60)
        self.assertEqual(worker.run(job['id'])['state'], 'sent')
        self.assertEqual([call[2][1] for call in provider.calls], ['Confirmed', 'Cancelled'])
