"""Structured bookings, quote agreement, receipt privacy and coordinated policy."""
import os
import unittest
from datetime import timedelta
from unittest.mock import patch
from uuid import uuid4

from fastapi.testclient import TestClient

from src.backend.application import Settings, create_app
from src.backend.domain import RuleViolation, quote
from src.backend.models import BookingInput
from src.backend.tests import test_foundation as foundation


@unittest.skipUnless(os.getenv("ASTRO_TEST_DATABASE_URL"), "Requires isolated local test database.")
class ContractTests(unittest.TestCase):
    setUpClass = classmethod(foundation.PostgresTests.setUpClass.__func__)
    setUp = foundation.PostgresTests.setUp
    payload = foundation.PostgresTests.payload
    verified = foundation.PostgresTests.verified
    hold = foundation.PostgresTests.hold
    held = foundation.PostgresTests.held

    def test_public_booking_requires_structured_birth_quote_and_request(self):
        data = self.payload() | {"request_id": uuid4(), "verification_token": "t" * 43}
        self.assertEqual(BookingInput(**data).birth_time, "")
        for field in ("birth_date", "quote_version", "request_id"):
            candidate = data.copy()
            candidate.pop(field)
            with self.subTest(field=field), self.assertRaises(ValueError):
                BookingInput(**candidate)
        for changes in ({"birth_date": "2026-02-30"}, {"birth_time": "24:00"},
                        {"birth_time": "12:00+05:30"}, {"birth_place": "x" * 201}, {"notes": "x" * 4001}):
            with self.subTest(changes=changes), self.assertRaises(ValueError):
                BookingInput(**(data | changes))

    def test_birth_fields_stored_separately_unknown_time_stays_missing(self):
        row = self.hold(birth_place="New Delhi", notes="Private synthetic notes")
        self.assertEqual(str(row["birth_date"]), "1990-01-01")
        self.assertIsNone(row["birth_time"])
        self.assertEqual(row["birth_place"], "New Delhi")
        self.assertEqual(row["notes"], "Private synthetic notes")
        self.assertEqual(row["birth_details"], "")
        self.assertNotEqual(row["receipt_digest"], "a" * 64)

    def test_future_birth_date_rejected_without_consuming_verification(self):
        digest = self.verified()
        with self.assertRaises(RuleViolation) as error:
            self.held(self.payload(birth_date="2026-09-10"), uuid4(), digest)
        self.assertEqual(error.exception.fields, ["birth_date"])
        self.assertTrue(self.held(self.payload(), uuid4(), digest))

    def test_changed_quote_requires_review_and_preserves_token(self):
        digest = self.verified()
        payload = self.payload() | {"quote_version": "0" * 64}
        with self.assertRaises(RuleViolation) as error:
            self.held(payload, uuid4(), digest)
        self.assertEqual(error.exception.code, "quote_changed")
        self.assertTrue(self.held(self.payload(), uuid4(), digest))

    def test_frozen_retry_checks_receipt_before_content(self):
        request_id, payload = uuid4(), self.payload()
        first = self.held(payload, request_id, self.verified())
        with self.assertRaises(RuleViolation) as error:
            self.store.hold(payload | {"notes": "Different"}, request_id, "consumed", "b" * 64)
        self.assertEqual(error.exception.code, "receipt_unavailable")
        with patch("src.backend.storage.quote", side_effect=AssertionError("Must use frozen quote")):
            retry = self.held(payload, request_id, "consumed")
        self.assertEqual(retry["amount_paise"], first["amount_paise"])
        self.assertEqual(retry["hold_expires_at"], first["hold_expires_at"])

    def test_receipt_expires_at_appointment_end_plus_one_day(self):
        request_id, payload = uuid4(), self.payload()
        row = self.held(payload, request_id, self.verified())
        self.time = row["receipt_expires_at"]
        with self.assertRaises(RuleViolation) as error:
            self.held(payload, request_id, "consumed")
        self.assertEqual(error.exception.code, "receipt_unavailable")

    def test_only_one_active_hold_per_email(self):
        self.hold()
        with self.assertRaises(RuleViolation) as unverified:
            self.held(self.payload(time_slot="10:30"), uuid4(), "not-a-valid-token")
        self.assertNotEqual(unverified.exception.code, "checkout_in_progress")
        self.assertNotIn("payment in progress", str(unverified.exception))
        self.time += timedelta(seconds=61)
        digest = self.verified()
        with self.assertRaises(RuleViolation) as error:
            self.held(self.payload(time_slot="10:30"), uuid4(), digest)
        self.assertEqual(error.exception.code, "checkout_in_progress")
        with self.store.transaction() as conn:
            self.assertEqual(conn.execute("SELECT count(*) AS n FROM bookings").fetchone()["n"], 1)
            self.assertIsNotNone(conn.execute("SELECT token_digest FROM email_verifications WHERE token_digest=%s", (digest,)).fetchone())

    def test_inquiry_receipt_status_is_minimal_and_expires(self):
        data = dict(kind="contact", name="Synthetic Person", email="test@example.com", subject="Synthetic", message="Private notes")
        request_id = uuid4()
        saved = self.store.save_inquiry(data, request_id, self.verified(purpose="contact"), "a" * 64)
        self.assertEqual(saved, self.store.save_inquiry(data, request_id, "consumed", "a" * 64))
        result = self.store.inquiry_status(request_id, "a" * 64)
        self.assertEqual(set(result), {"status", "inquiry_id", "message", "email_status"})
        self.assertEqual(result['email_status'], 'pending')
        self.assertNotIn("Private notes", str(result))
        for key, secret in ((request_id, "b" * 64), (uuid4(), "a" * 64), (request_id, "short")):
            with self.subTest(key=key), self.assertRaises(RuleViolation):
                self.store.inquiry_status(key, secret)
        self.time += timedelta(hours=24)
        with self.assertRaises(RuleViolation):
            self.store.inquiry_status(request_id, "a" * 64)

    def test_missing_receipt_cannot_consume_email_proof(self):
        data = dict(kind="contact", name="Synthetic Person", email="test@example.com", subject="Synthetic", message="Private notes")
        digest = self.verified(purpose="contact")
        with self.assertRaises(RuleViolation):
            self.store.save_inquiry(data, uuid4(), digest, None)
        self.assertTrue(self.store.save_inquiry(data, uuid4(), digest, "a" * 64))

    def test_policy_and_availability_share_clock_and_never_expose_claims(self):
        self.hold()
        client = TestClient(create_app(Settings(), store=self.store))
        policy = client.get('/api/booking-policy').json()
        available = client.get('/api/availability?date=2026-09-10').json()
        for key, value in policy.items():
            self.assertEqual(available[key], value)
        self.assertFalse(available['slots']['10:00'])
        self.assertNotIn('test@example.com', str(available))
        self.assertNotIn('Test Person', str(available))

    def test_quote_version_covers_every_pricing_term(self):
        self.assertEqual(quote('numerology')['quote_version'], quote('numerology')['quote_version'])
        self.assertNotEqual(quote('prashna-kundali', 1)['quote_version'], quote('prashna-kundali', 2)['quote_version'])

    def test_booking_status_does_not_expose_customer_or_receipt_fields(self):
        request_id, payload = uuid4(), self.payload()
        row = self.held(payload, request_id, self.verified())
        client = TestClient(create_app(Settings(), store=self.store))
        request = {"request_id": str(request_id)}
        for secret in (None, 'b' * 64):
            headers = {"X-Astro-Receipt": secret} if secret else {}
            self.assertEqual(client.post('/api/booking-status', json=request, headers=headers).status_code, 403)
        response = client.post('/api/booking-status', json=request, headers={"X-Astro-Receipt": 'a' * 64})
        self.assertEqual(response.status_code, 200)
        for private in ('email', 'phone', 'full_name', 'notes', 'birth_date', 'receipt_digest', 'request_hash'):
            self.assertNotIn(private, response.json())
        self.assertEqual(response.json()['appointment_state'], 'held')
        self.store.confirm_paid(row['id'], 'synthetic_contract_payment', row['amount_paise'], 'INR')
        result = self.store.booking_status(request_id, 'a' * 64)
        self.assertEqual(result['appointment_state'], 'confirmed')
        self.assertEqual(result['payment_state'], 'received')

    def test_status_expiry_releases_hold_without_extending_deadline(self):
        request_id, payload = uuid4(), self.payload()
        row = self.held(payload, request_id, self.verified())
        self.time = row['hold_expires_at']
        result = self.store.booking_status(request_id, 'a' * 64)
        self.assertEqual(result['appointment_state'], 'expired')
        self.assertEqual(result['hold_expires_at'], row['hold_expires_at'].isoformat())
        self.assertTrue(self.store.availability(payload['date'])['slots'][payload['time_slot']])

    def test_receipt_reads_are_rate_limited_across_requests(self):
        client = TestClient(create_app(Settings(), store=self.store))
        with patch.object(self.verification.__class__, 'bump', return_value=False):
            response = client.post('/api/booking-status', json={'request_id': str(uuid4())}, headers={'X-Astro-Receipt': 'a' * 64})
        self.assertEqual(response.status_code, 429)
