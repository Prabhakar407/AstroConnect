"""Run with unittest. Integration tests require the dedicated isolated test database."""

import importlib
import os
import threading
import unittest
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta
from unittest.mock import patch
from uuid import uuid4

from fastapi.testclient import TestClient
from psycopg.conninfo import conninfo_to_dict

from src.backend.application import Settings, create_app
from src.backend.domain import IST, UTC, RuleViolation, booking_start, closure_slots, quote, validate_day
from src.backend.models import BookingInput
from src.backend.storage import Store, StorageUnavailable
from src.backend.verification import EmailVerification

NOW = datetime(2026, 9, 9, 9, 0, tzinfo=IST)
TEST_SECRET = "isolated-unit-test-secret-not-a-real-credential"


class DomainTests(unittest.TestCase):
    def test_all_prices(self):
        expected = {"vedic-astrology": 210000, "numerology": 310000, "vastu": 510000, "laal-kitaab": 110000, "prashna-kundali": 110000, "name-change": 510000}
        for service_id, amount in expected.items():
            with self.subTest(service=service_id):
                self.assertEqual(quote(service_id)["amount_paise"], amount)
                self.assertEqual(quote(service_id)["duration_minutes"], 30)

    def test_question_bounds_and_duration(self):
        for count in range(1, 11):
            result = quote("prashna-kundali", count)
            self.assertEqual(result["amount_paise"], 110000 * count)
            self.assertEqual(result["duration_minutes"], 30)
        for count in (0, 11, True, 1.0, "2", None):
            with self.subTest(count=count), self.assertRaises(RuleViolation):
                quote("prashna-kundali", count)
        with self.assertRaises(RuleViolation):
            quote("numerology", 2)
        with self.assertRaises(RuleViolation):
            quote("unknown")

    def test_ten_day_horizon(self):
        self.assertEqual(validate_day("2026-09-19", NOW).isoformat(), "2026-09-19")
        for day in ("2026-09-20", "2026-09-08", "20260909", "2026-02-30", "garbage", None):
            with self.subTest(day=day), self.assertRaises(RuleViolation):
                validate_day(day, NOW)

    def test_ist_midnight(self):
        before = datetime(2026, 9, 9, 18, 29, 59, tzinfo=UTC)
        after = before + timedelta(seconds=1)
        with self.assertRaises(RuleViolation):
            validate_day("2026-09-20", before)
        self.assertEqual(validate_day("2026-09-20", after).day, 20)

    def test_slots_reject_sunday_lunch_past_and_non_grid(self):
        for day, slot in (("2026-09-13", "10:00"), ("2026-09-09", "12:00"), ("2026-09-09", "10:15"), ("2026-09-09", "18:00")):
            with self.subTest(day=day, slot=slot), self.assertRaises(RuleViolation):
                booking_start(day, slot, NOW)
        with self.assertRaises(RuleViolation):
            booking_start("2026-09-09", "10:00", NOW.replace(hour=10))
        self.assertEqual(booking_start("2026-09-09", "10:30", NOW).astimezone(IST).minute, 30)

    def test_closures_can_be_farther_ahead(self):
        self.assertEqual(len(closure_slots("2026-12-01", None, None, NOW)), 10)
        self.assertEqual(len(closure_slots("2026-09-10", "11:30", "15:30", NOW)), 2)
        for start, end in ((None, "12:00"), ("10:15", "11:00"), ("11:00", "10:00"), ("12:00", "15:00"), ("10:00:00", "11:00"), ("10:00+05:30", "11:00")):
            with self.subTest(start=start), self.assertRaises(RuleViolation):
                closure_slots("2026-09-10", start, end, NOW)

    def test_no_import_time_network_or_sqlite(self):
        with patch("socket.socket", side_effect=AssertionError("network on import")), patch("sqlite3.connect", side_effect=AssertionError("file on import")):
            import src.backend.main as main
            importlib.reload(main)

    def test_bad_origins_fail_configuration(self):
        for origin in ("*", "http://example.com", "https://example.com/path", "https://user@example.com"):
            with patch.dict(os.environ, {"ASTRO_ALLOWED_ORIGINS": origin}), self.assertRaises(ValueError):
                Settings.from_environment()

    def test_no_storage_fallback(self):
        with self.assertRaises(StorageUnavailable):
            Store("").availability("2026-09-09")

    def test_request_validation_is_strict(self):
        base = dict(full_name="Test Person", email="test@example.com", phone="+919000000001", service_id="numerology", date="2026-09-10", time_slot="10:00", verification_token="t" * 43)
        for change in ({"duration_minutes": 60}, {"question_count": True}, {"question_count": "2"}, {"amount_paise": 1}):
            with self.subTest(change=change), self.assertRaises(ValueError):
                BookingInput(**(base | change))


class UnconfiguredApiTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(create_app(Settings()))

    def test_health_is_not_readiness(self):
        self.assertEqual(self.client.get("/").json(), {"status": "online"})
        self.assertEqual(self.client.get("/api/ready").status_code, 503)

    def test_booking_cannot_bypass_payment(self):
        self.assertEqual(self.client.post("/api/book-appointment", json={"paid": True}).status_code, 410)

    def test_unconfigured_email_and_availability_fail_closed(self):
        self.assertEqual(self.client.post("/api/auth/send-otp", json={"email": "test@example.com", "purpose": "contact"}).status_code, 503)
        self.assertEqual(self.client.get("/api/availability?date=2026-09-09").status_code, 503)

    def test_old_help_route_does_not_dispatch(self):
        self.assertEqual(self.client.post("/api/help", json={}).status_code, 410)

    def test_private_operations_are_not_public(self):
        for path in ("/api/admin/close", "/api/admin/cancel", "/api/confirm-paid", "/api/bookings"):
            self.assertEqual(self.client.post(path, json={}).status_code, 404)

    def test_errors_do_not_echo_secrets(self):
        response = self.client.post("/api/auth/verify-otp", json={"email": "test@example.com", "purpose": "contact", "otp": "private-test-value"})
        self.assertEqual(response.status_code, 422)
        self.assertNotIn("private-test-value", response.text)
        self.assertEqual(response.headers["cache-control"], "no-store")

    def test_oversized_body_is_rejected(self):
        self.assertEqual(self.client.post("/api/contact", content=b"a" * 17000).status_code, 413)

    def test_unapproved_cors_origin(self):
        response = self.client.options("/api/contact", headers={"Origin": "https://unapproved.example", "Access-Control-Request-Method": "POST"})
        self.assertEqual(response.status_code, 400)
        self.assertNotIn("access-control-allow-origin", response.headers)


@unittest.skipUnless(os.getenv("ASTRO_TEST_DATABASE_URL"), "Set the dedicated ASTRO_TEST_DATABASE_URL to run PostgreSQL integration tests.")
class PostgresTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dsn = os.environ["ASTRO_TEST_DATABASE_URL"]
        cls.admin_dsn = os.environ.get("ASTRO_TEST_DATABASE_ADMIN_URL", cls.dsn)
        parts = conninfo_to_dict(cls.dsn)
        if parts.get("dbname") != "astro_booking_test" or not parts.get("host", "").startswith("/tmp/astro-booking-check."):
            raise RuntimeError("Refusing destructive tests outside the named isolated local test database.")
        admin_parts = conninfo_to_dict(cls.admin_dsn)
        if admin_parts.get("dbname") != "astro_booking_test" or admin_parts.get("host") != parts.get("host"):
            raise RuntimeError("Refusing a test owner outside the same named isolated local test database.")
        Store(cls.admin_dsn).migrate()

    def setUp(self):
        self.time = NOW
        self.admin_store = Store(self.admin_dsn, clock=lambda: self.time)
        self.store = Store(self.dsn, clock=lambda: self.time)
        with self.admin_store.transaction() as conn:
            conn.execute("""TRUNCATE payment_events,booking_calendar_events,payment_cases,
                slot_claims,payments,bookings,closures,inquiries,delivery_jobs,email_challenges,
                email_verifications,rate_limits,email_events,verification_emails CASCADE""")
        self.codes = []
        self.verification = EmailVerification(self.store, TEST_SECRET, lambda email, code, purpose, challenge_id: self.codes.append((email, code, purpose)) or True)

    def verified(self, email="test@example.com", purpose="booking"):
        self.verification.issue(email, purpose, "test-client")
        token = self.verification.verify(email, purpose, self.codes[-1][1], "test-client")
        return self.verification.digest(token)

    def held(self, payload, request_id, token_digest):
        return self.store.hold(payload, request_id, token_digest, "a" * 64)

    def saved_inquiry(self, payload, request_id, token_digest):
        return self.store.save_inquiry(payload, request_id, token_digest, "a" * 64)

    def payload(self, **overrides):
        data = dict(full_name="Test Person", email="test@example.com", phone="+919000000001", service_id="prashna-kundali", question_count=2, date="2026-09-10", time_slot="10:00", birth_date="1990-01-01", notes="Synthetic test only") | overrides
        data["quote_version"] = quote(data["service_id"], data["question_count"])["quote_version"]
        return data

    def hold(self, **overrides):
        data = self.payload(**overrides)
        return self.held(data, uuid4(), self.verified(data["email"]))

    def test_migrations_repeat_safely(self):
        self.admin_store.migrate()
        self.assertTrue(self.store.ready())

    def test_application_connection_has_restricted_production_shape(self):
        with self.store.transaction() as conn:
            role = conn.execute(
                "SELECT current_user AS name, rolsuper, rolcreatedb, rolcreaterole, "
                "rolreplication, rolbypassrls FROM pg_roles WHERE rolname=current_user"
            ).fetchone()
            schema = conn.execute(
                "SELECT has_schema_privilege(current_user,'public','CREATE') AS create_schema"
            ).fetchone()
            deletion = conn.execute(
                "SELECT has_table_privilege(current_user,'public.bookings','DELETE') AS delete_bookings"
            ).fetchone()
        if self.admin_dsn != self.dsn:
            self.assertEqual(role["name"], "astro_booking_test_app")
        self.assertFalse(any(role[key] for key in ("rolsuper", "rolcreatedb", "rolcreaterole", "rolreplication", "rolbypassrls")))
        self.assertFalse(schema["create_schema"])
        self.assertFalse(deletion["delete_bookings"])

    def test_hold_price_and_duration(self):
        row = self.hold(question_count=10)
        self.assertEqual(row["amount_paise"], 1100000)
        self.assertEqual(row["duration_minutes"], 30)
        self.assertEqual(row["state"], "held")
        self.assertFalse(self.store.availability("2026-09-10")["slots"]["10:00"])
        self.assertTrue(self.store.availability("2026-09-10")["slots"]["10:30"])

    def test_double_booking_rejected(self):
        self.hold()
        with self.assertRaises(RuleViolation):
            self.hold(email="second@example.com")

    def test_idempotent_hold_and_changed_request(self):
        request_id = uuid4()
        digest = self.verified()
        first = self.held(self.payload(), request_id, digest)
        second = self.held(self.payload(), request_id, digest)
        self.assertEqual(first["id"], second["id"])
        with self.assertRaises(RuleViolation):
            self.held(self.payload(question_count=3), request_id, digest)

    def test_full_day_and_partial_closure_protect_hold(self):
        self.hold()
        for start, end in ((None, None), ("10:00", "11:00")):
            with self.assertRaises(RuleViolation):
                self.store.close_time("2026-09-10", start, end, "Holiday", "test-owner")
        self.store.close_time("2026-09-10", "10:30", "12:00", "Break", "test-owner")
        self.assertFalse(self.store.availability("2026-09-10")["slots"]["11:30"])
        self.assertTrue(self.store.availability("2026-09-10")["slots"]["15:00"])

    def test_confirmed_booking_cannot_be_closed(self):
        row = self.hold()
        self.assertEqual(self.store.confirm_paid(row["id"], "synthetic_payment_1", row["amount_paise"], "INR"), "accepted")
        with self.assertRaises(RuleViolation):
            self.store.close_time("2026-09-10", None, None, "Holiday", "test-owner")

    def test_expired_hold_releases_without_erasing_record(self):
        row = self.hold()
        self.time += timedelta(minutes=10)
        self.assertTrue(self.store.availability("2026-09-10")["slots"]["10:00"])
        with self.store.transaction() as conn:
            self.assertEqual(conn.execute("SELECT state FROM bookings WHERE id=%s", (row["id"],)).fetchone()["state"], "expired")

    def test_late_payment_cannot_steal_slot(self):
        row = self.hold()
        self.time += timedelta(minutes=11)
        second = self.hold(email="second@example.com")
        self.assertEqual(self.store.confirm_paid(row["id"], "synthetic_late", row["amount_paise"], "INR"), "review")
        with self.store.transaction() as conn:
            self.assertEqual(conn.execute("SELECT booking_id FROM slot_claims WHERE starts_at=%s", (row["starts_at"],)).fetchone()["booking_id"], second["id"])

    def test_payment_replay_and_amount_mismatch(self):
        row = self.hold()
        for _ in range(2):
            self.assertEqual(self.store.confirm_paid(row["id"], "synthetic_once", row["amount_paise"], "INR"), "accepted")
        with self.assertRaises(RuleViolation):
            self.store.confirm_paid(row["id"], "synthetic_once", 1, "INR")
        self.assertEqual(self.store.confirm_paid(row["id"], "synthetic_second", 1, "INR"), "review")
        with self.store.transaction() as conn:
            self.assertEqual(conn.execute("SELECT count(*) AS n FROM delivery_jobs WHERE kind='booking_confirmed'").fetchone()["n"], 3)
            self.assertEqual(conn.execute("SELECT state FROM bookings WHERE id=%s", (row["id"],)).fetchone()["state"], "confirmed")

    def test_cancel_releases_slot_preserves_payment_and_record(self):
        row = self.hold()
        self.store.confirm_paid(row["id"], "synthetic_cancel", row["amount_paise"], "INR")
        self.store.cancel(row["id"], "test-owner")
        self.store.cancel(row["id"], "test-owner")
        self.assertTrue(self.store.availability("2026-09-10")["slots"]["10:00"])
        status = self.store.booking_status(row['request_id'], 'a' * 64)
        self.assertEqual(status['appointment_state'], 'cancelled')
        self.assertEqual(status['confirmation_email_state'], 'pending')
        with self.store.transaction() as conn:
            self.assertEqual(conn.execute("SELECT state FROM bookings WHERE id=%s", (row["id"],)).fetchone()["state"], "cancelled")
            self.assertEqual(conn.execute("SELECT count(*) AS n FROM payments").fetchone()["n"], 1)
            self.assertEqual(conn.execute("SELECT count(*) AS n FROM delivery_jobs WHERE kind='booking_cancelled'").fetchone()["n"], 3)

    def test_reopen_only_its_own_claims(self):
        self.hold()
        closure_id = self.store.close_time("2026-09-10", "10:30", "12:00", "Break", "test-owner")
        self.store.reopen(closure_id, "test-owner")
        self.assertFalse(self.store.availability("2026-09-10")["slots"]["10:00"])
        self.assertTrue(self.store.availability("2026-09-10")["slots"]["10:30"])

    def test_persistence_across_new_store(self):
        self.hold()
        self.assertFalse(Store(self.dsn, clock=lambda: self.time).availability("2026-09-10")["slots"]["10:00"])

    def test_database_key_rejects_conflicting_claim(self):
        row = self.hold()
        with self.assertRaises(StorageUnavailable):
            with self.store.transaction() as conn:
                conn.execute("INSERT INTO slot_claims (starts_at,booking_id) VALUES (%s,%s)", (row["starts_at"], row["id"]))

    def test_concurrent_customers_only_one_wins(self):
        entries = [(self.payload(email=f"person{i}@example.com"), self.verified(f"person{i}@example.com")) for i in range(8)]
        barrier = threading.Barrier(len(entries))
        def attempt(entry):
            barrier.wait()
            try:
                self.held(entry[0], uuid4(), entry[1])
                return True
            except RuleViolation:
                return False
        with ThreadPoolExecutor(max_workers=8) as executor:
            self.assertEqual(sum(executor.map(attempt, entries)), 1)

    def test_booking_and_closure_race(self):
        digest = self.verified()
        barrier = threading.Barrier(2)
        def attempt(close):
            barrier.wait()
            try:
                if close:
                    self.store.close_time("2026-09-10", None, None, "Holiday", "test-owner")
                else:
                    self.held(self.payload(), uuid4(), digest)
                return True
            except RuleViolation:
                return False
        with ThreadPoolExecutor(max_workers=2) as executor:
            self.assertEqual(sum(executor.map(attempt, (False, True))), 1)

    def test_code_cannot_be_replayed_or_cross_purpose(self):
        self.verification.issue("test@example.com", "contact", "test-client")
        code = self.codes[-1][1]
        with self.assertRaises(RuleViolation):
            self.verification.verify("test@example.com", "booking", code, "test-client")
        token = self.verification.verify("test@example.com", "contact", code, "test-client")
        self.assertTrue(token)
        with self.assertRaises(RuleViolation):
            self.verification.verify("test@example.com", "contact", code, "test-client")
        with self.assertRaises(RuleViolation):
            self.held(self.payload(), uuid4(), self.verification.digest(token))

    def test_wrong_attempts_commit_and_lock_code(self):
        self.verification.issue("test@example.com", "contact", "test-client")
        code = self.codes[-1][1]
        wrong = "000000" if code != "000000" else "111111"
        for _ in range(5):
            with self.assertRaises(RuleViolation):
                self.verification.verify("test@example.com", "contact", wrong, "test-client")
        with self.assertRaises(RuleViolation) as raised:
            self.verification.verify("test@example.com", "contact", code, "test-client")
        self.assertEqual(raised.exception.status, 429)

    def test_code_expires_and_delivery_failure_never_verifies(self):
        self.verification.issue("test@example.com", "contact", "test-client")
        code = self.codes[-1][1]
        self.time += timedelta(minutes=5)
        with self.assertRaises(RuleViolation):
            self.verification.verify("test@example.com", "contact", code, "test-client")
        failing = EmailVerification(self.store, TEST_SECRET, lambda *args: False)
        with self.assertRaises(StorageUnavailable):
            failing.issue("other@example.com", "contact", "test-client")
        with self.store.transaction() as conn:
            self.assertFalse(conn.execute("SELECT send_accepted FROM email_challenges WHERE email='other@example.com'").fetchone()["send_accepted"])

    def test_resend_cooldown(self):
        self.verification.issue("test@example.com", "contact", "test-client")
        with self.assertRaises(RuleViolation) as raised:
            self.verification.issue("test@example.com", "contact", "test-client")
        self.assertEqual(raised.exception.status, 429)
        self.assertEqual(len(self.codes), 1)

    def test_token_expires_and_is_not_in_booking_records(self):
        digest = self.verified()
        self.time += timedelta(minutes=15)
        with self.assertRaises(RuleViolation):
            self.held(self.payload(), uuid4(), digest)
        with self.store.transaction() as conn:
            fields = [r["column_name"] for r in conn.execute("SELECT column_name FROM information_schema.columns WHERE table_name='bookings'")]
            self.assertNotIn("verification_token", fields)

    def test_inquiry_is_durable_idempotent_and_has_email(self):
        data = dict(kind="contact", name="Test Person", email="test@example.com", phone="", dob="2000-01-01", subject="Synthetic inquiry", message="Please ignore this test.")
        request_id = uuid4()
        digest = self.verified(purpose="contact")
        first = self.saved_inquiry(data, request_id, digest)
        self.assertEqual(first, self.saved_inquiry(data, request_id, digest))
        with self.store.transaction() as conn:
            row = conn.execute("SELECT * FROM inquiries WHERE id=%s", (first,)).fetchone()
            self.assertEqual(row["email"], data["email"])
            self.assertEqual(row["dob"], data["dob"])
            self.assertEqual(conn.execute("SELECT state FROM delivery_jobs WHERE record_id=%s", (first,)).fetchone()["state"], "pending")

    def test_contact_api_end_to_end_with_test_only_sender(self):
        client = TestClient(create_app(Settings(otp_secret=TEST_SECRET), store=self.store, code_sender=self.verification.send_code))
        self.assertEqual(client.post("/api/auth/send-otp", json={"email": "test@example.com", "purpose": "contact"}).status_code, 200)
        response = client.post("/api/auth/verify-otp", json={"email": "test@example.com", "purpose": "contact", "otp": self.codes[-1][1]})
        token = response.json()["verification_token"]
        payload = dict(name="Test Person", email="test@example.com", subject="Synthetic", message="No real notification", request_id=str(uuid4()), verification_token=token)
        response = client.post("/api/contact", json=payload, headers={"X-Astro-Receipt": "a" * 64})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["email_status"], "pending")
        self.assertEqual(client.post("/api/contact", json=payload, headers={"X-Astro-Receipt": "a" * 64}).json()["inquiry_id"], response.json()["inquiry_id"])

    def test_failed_inquiry_rolls_back_record_and_token_consumption(self):
        data = dict(kind="contact", name="Test Person", email="test@example.com", subject="Synthetic", message="Rollback test")
        digest = self.verified(purpose="contact")
        request_id = uuid4()
        with patch.object(self.store, "enqueue", side_effect=StorageUnavailable("Synthetic database failure")):
            with self.assertRaises(StorageUnavailable):
                self.saved_inquiry(data, request_id, digest)
        with self.store.transaction() as conn:
            self.assertEqual(conn.execute("SELECT count(*) AS n FROM inquiries").fetchone()["n"], 0)
        self.assertTrue(self.saved_inquiry(data, request_id, digest))

    def test_verification_race_issues_exactly_one_token(self):
        self.verification.issue("test@example.com", "contact", "test-client")
        code = self.codes[-1][1]
        barrier = threading.Barrier(2)
        def attempt(_):
            barrier.wait()
            try:
                return bool(self.verification.verify("test@example.com", "contact", code, "test-client"))
            except RuleViolation:
                return False
        with ThreadPoolExecutor(max_workers=2) as executor:
            self.assertEqual(sum(executor.map(attempt, (0, 1))), 1)

    def test_token_is_bound_to_customer_email(self):
        digest = self.verified()
        with self.assertRaises(RuleViolation):
            self.held(self.payload(email="wrong@example.com"), uuid4(), digest)
        self.assertTrue(self.held(self.payload(), uuid4(), digest))

    def test_hold_expires_no_later_than_session_start(self):
        self.time = NOW.replace(hour=9, minute=30)
        row = self.hold(date="2026-09-09")
        self.assertEqual(row["hold_expires_at"], self.time + timedelta(minutes=10))
        self.assertLessEqual(row["hold_expires_at"], row["starts_at"])
        self.time += timedelta(minutes=30)
        self.assertEqual(self.store.confirm_paid(row["id"], "synthetic_at_start", row["amount_paise"], "INR"), "review")

    def test_replayed_payment_after_cancellation_does_not_revive_booking(self):
        row = self.hold()
        self.store.confirm_paid(row["id"], "synthetic_confirmed", row["amount_paise"], "INR")
        self.store.cancel(row["id"], "test-owner")
        self.store.confirm_paid(row["id"], "synthetic_confirmed", row["amount_paise"], "INR")
        self.assertTrue(self.store.availability("2026-09-10")["slots"]["10:00"])
        with self.store.transaction() as conn:
            self.assertEqual(conn.execute("SELECT state FROM bookings WHERE id=%s", (row["id"],)).fetchone()["state"], "cancelled")

    def test_booking_storage_revalidates_date_and_service(self):
        digest = self.verified()
        for change in ({"date": "2026-09-20"}, {"date": "2026-09-13"}, {"time_slot": "14:00"}, {"service_id": "unknown"}, {"question_count": 11}):
            with self.subTest(change=change), self.assertRaises(RuleViolation):
                self.held(self.payload(**change), uuid4(), digest)
        self.assertTrue(self.held(self.payload(), uuid4(), digest))


if __name__ == "__main__":
    unittest.main()
