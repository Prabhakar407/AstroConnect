"""Plan 1 hosting/scheduling preparation. No real providers or hosted database."""

import os
import unittest
from datetime import timedelta
from email.message import Message
from types import SimpleNamespace
from unittest.mock import patch
from uuid import uuid4

import psycopg
from fastapi.testclient import TestClient

from src.backend.application import Settings, create_app, send_code
from src.backend.domain import RuleViolation, booking_start, validate_day
from src.backend.migrate import main as migrate
from src.backend.storage import StorageUnavailable, Store
from src.backend.tests import test_foundation as foundation


class PreparationTests(unittest.TestCase):
    def test_connection_settings_do_not_need_enable_switches(self):
        environment = {"ASTRO_RESEND_API_KEY": "synthetic-key", "ASTRO_EMAIL_FROM": "studio@example.com",
                       "ASTRO_GOOGLE_CLIENT_ID": "synthetic-client-id"}
        with patch.dict(os.environ, environment, clear=True):
            settings = Settings.from_environment()
        self.assertFalse(hasattr(settings, "email_enabled"))
        self.assertFalse(hasattr(settings, "admin_enabled"))
        with patch.dict(os.environ, environment | {"ASTRO_EMAIL_ENABLED": "false", "ASTRO_ADMIN_ENABLED": "false"}, clear=True):
            self.assertEqual(Settings.from_environment(), settings, "Retired switches cannot disable configured features")

    def test_configured_email_adapter_has_no_extra_off_switch(self):
        settings = Settings(resend_key="synthetic-key", sender="studio@example.com")
        with patch("src.backend.resend_email.build_opener") as provider:
            response = provider.return_value.open.return_value.__enter__.return_value
            response.read.return_value = b'{"id":"7f134617-0471-49c8-9410-4ffbced9d250"}'
            response.status = 200
            response.headers = Message()
            response.headers['Content-Type'] = 'application/json'
            self.assertTrue(send_code(settings, "customer@example.com", "123456", "contact", uuid4()))
            provider.return_value.open.assert_called_once()

    def test_incomplete_email_settings_never_call_provider(self):
        for settings in (Settings(), Settings(resend_key="synthetic-key"), Settings(sender="studio@example.com")):
            with self.subTest(settings=settings), patch("src.backend.resend_email.build_opener") as provider:
                with self.assertRaises(StorageUnavailable):
                    send_code(settings, "customer@example.com", "123456", "contact", uuid4())
                provider.assert_not_called()

    def test_email_request_needs_verification_secret_and_storage(self):
        for secret in ("", foundation.TEST_SECRET):
            settings = Settings(resend_key="synthetic-key", sender="studio@example.com", otp_secret=secret)
            with self.subTest(has_secret=bool(secret)), patch("src.backend.resend_email.build_opener") as provider:
                response = TestClient(create_app(settings)).post("/api/auth/send-otp", json={"email":"customer@example.com", "purpose":"contact"})
                self.assertEqual(response.status_code, 503)
                provider.assert_not_called()

    def test_notice_exact_boundary_and_one_second_short(self):
        now = foundation.NOW.replace(hour=9, minute=30)
        self.assertEqual(booking_start("2026-09-09", "10:00", now) - now, timedelta(minutes=30))
        with self.assertRaisesRegex(RuleViolation, "later available time"):
            booking_start("2026-09-09", "10:00", now + timedelta(seconds=1))

    def test_services_envelope_and_uncached_liveness(self):
        client = TestClient(create_app(Settings()))
        response = client.get("/api/services")
        self.assertEqual(len(response.json()["services"]), 6)
        self.assertEqual(response.headers["cache-control"], "no-store")
        health = client.get("/api/health")
        self.assertEqual(health.status_code, 200)
        self.assertEqual(health.json(), {"status": "online"})
        self.assertEqual(client.get("/api/not-a-route").status_code, 404)

    def test_booking_readiness_requires_official_origin_and_valid_core_secrets(self):
        complete = dict(
            database_url='unused', otp_secret='o' * 32, resend_key='resend', resend_webhook_secret='e' * 32,
            sender='Astro Advice <bookings@mail.astroadvicebykundansingh.com>', delivery_secret='d' * 32,
            recovery_secret='r' * 32, google_client_id='google-client', google_client_secret='google-secret',
            google_token_key='saved-key', razorpay_key_id='rzp_test_valid', razorpay_key_secret='payment-secret',
            razorpay_webhook_secret='w' * 32, razorpay_account_id='syntheticMerchantId',
            cloudflare_account_id='a' * 32, cloudflare_queue_id='b' * 32,
            cloudflare_queue_token='queue-token-value-long-enough',
        )
        policy_store = SimpleNamespace(policy=lambda: {})
        with patch('src.backend.google_connection.saved_connection_ready', return_value=True):
            official = Settings(**complete, origins=('https://preview.example', 'https://astroadvicebykundansingh.com'))
            self.assertTrue(TestClient(create_app(official, store=policy_store)).get('/api/booking-policy').json()['booking_enabled'])
            preview_only = Settings(**complete, origins=('https://preview.example',))
            self.assertFalse(TestClient(create_app(preview_only, store=policy_store)).get('/api/booking-policy').json()['booking_enabled'])
            short = Settings(**(complete | {'otp_secret': 'short'}), origins=('https://astroadvicebykundansingh.com',))
            self.assertFalse(TestClient(create_app(short, store=policy_store)).get('/api/booking-policy').json()['booking_enabled'])
            for name in ('resend_webhook_secret', 'razorpay_webhook_secret', 'delivery_secret', 'recovery_secret'):
                with self.subTest(short_secret=name):
                    short = Settings(**(complete | {name: 'short'}), origins=('https://astroadvicebykundansingh.com',))
                    self.assertFalse(TestClient(create_app(short, store=policy_store)).get('/api/booking-policy').json()['booking_enabled'])

    def test_policy_cannot_invent_clock_when_storage_is_missing(self):
        response = TestClient(create_app(Settings())).get("/api/booking-policy")
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json()["code"], "storage_unavailable")

    def test_remote_connection_requires_explicit_tls_and_no_session_options(self):
        for dsn in (
            "host=db.example dbname=test sslmode=disable",
            "host=db.example dbname=test",
            "host=db.example dbname=test sslmode=require options='-c statement_timeout=0'",
            "dbname=test",
            "host=localhost hostaddr=192.0.2.1 dbname=test",
            "host=/tmp/local,remote.example dbname=test",
        ):
            with self.subTest(dsn=dsn), patch("psycopg.connect") as connect:
                with self.assertRaises(StorageUnavailable):
                    with Store(dsn).transaction():
                        self.fail("Unsafe configuration was accepted")
                connect.assert_not_called()

    def test_maintenance_requires_separate_direct_configuration(self):
        for value in ("", "host=ep-example-pooler.neon.tech dbname=test sslmode=require", "not a valid connection"):
            with patch.dict(os.environ, {"ASTRO_DATABASE_URL": "runtime-must-not-be-used", "ASTRO_MIGRATION_DATABASE_URL": value}), patch.object(Store, "migrate") as apply:
                with self.assertRaises(SystemExit):
                    migrate()
                apply.assert_not_called()

    def test_horizon_crosses_year_and_leap_day(self):
        for now, allowed, rejected in (
            (foundation.NOW.replace(month=12, day=25), "2027-01-04", "2027-01-05"),
            (foundation.NOW.replace(year=2028, month=2, day=19), "2028-02-29", "2028-03-01"),
        ):
            self.assertEqual(validate_day(allowed, now).isoformat(), allowed)
            with self.assertRaises(RuleViolation):
                validate_day(rejected, now)


@unittest.skipUnless(os.getenv("ASTRO_TEST_DATABASE_URL"), "Requires isolated local test database.")
class PreparationPostgresTests(unittest.TestCase):
    setUpClass = classmethod(foundation.PostgresTests.setUpClass.__func__)
    setUp = foundation.PostgresTests.setUp
    verified = foundation.PostgresTests.verified
    payload = foundation.PostgresTests.payload
    hold = foundation.PostgresTests.hold
    held = foundation.PostgresTests.held

    def test_policy_uses_store_clock_and_notice(self):
        self.time = foundation.NOW.replace(hour=23, minute=59)
        client = TestClient(create_app(Settings(), store=self.store))
        policy = client.get("/api/booking-policy").json()
        self.assertEqual(policy["first_date"], "2026-09-09")
        self.assertEqual(policy["last_date"], "2026-09-19")
        self.assertEqual(policy["minimum_notice_minutes"], 30)
        self.assertEqual(len(policy["slot_times"]), 10)
        self.assertEqual(policy["server_now"], self.time.astimezone(foundation.UTC).isoformat())
        self.time += timedelta(minutes=1)
        self.assertEqual(client.get("/api/booking-policy").json()["first_date"], "2026-09-10")

    def test_availability_notice_matches_hold_and_preserves_verification(self):
        self.time = foundation.NOW.replace(hour=9, minute=30)
        self.assertTrue(self.store.availability("2026-09-09")["slots"]["10:00"])
        self.time += timedelta(seconds=1)
        self.assertFalse(self.store.availability("2026-09-09")["slots"]["10:00"])
        digest = self.verified()
        with self.assertRaises(RuleViolation):
            self.held(self.payload(date="2026-09-09"), uuid4(), digest)
        row = self.held(self.payload(date="2026-09-09", time_slot="10:30"), uuid4(), digest)
        self.assertEqual(row["state"], "held")

    def test_existing_hold_retry_does_not_restart_notice_or_reprice(self):
        self.time = foundation.NOW.replace(hour=9, minute=30)
        request_id = uuid4()
        payload = self.payload(date="2026-09-09")
        first = self.held(payload, request_id, self.verified())
        self.time += timedelta(minutes=1)
        with patch("src.backend.storage.quote", side_effect=AssertionError("Existing terms must be retained")):
            second = self.held(payload, request_id, "already-consumed")
        self.assertEqual(first["id"], second["id"])
        self.assertEqual(first["hold_expires_at"], second["hold_expires_at"])
        self.assertEqual(first["amount_paise"], second["amount_paise"])

    def test_private_history_read_does_not_allow_past_closures(self):
        row = self.hold()
        self.store.confirm_paid(row["id"], "synthetic-history", row["amount_paise"], "INR")
        self.time += timedelta(days=2)
        detail = self.store.private_day("2026-09-10")
        self.assertEqual(detail["slots"][0]["state"], "booked")
        self.assertFalse(detail["slots"][0]["can_cancel"])
        with self.assertRaises(RuleViolation):
            self.store.close_time("2026-09-10", None, None, "Test", "test-owner")

    def test_today_whole_day_protects_past_confirmed_booking(self):
        row = self.hold(date="2026-09-09")
        self.store.confirm_paid(row["id"], "synthetic-past", row["amount_paise"], "INR")
        self.time = foundation.NOW.replace(hour=11)
        with self.assertRaises(RuleViolation):
            self.store.close_time("2026-09-09", None, None, "Test", "test-owner")
        self.assertTrue(self.store.availability("2026-09-09")["slots"]["15:00"])

    def test_today_closure_only_claims_future_and_rejects_empty_or_past_ranges(self):
        self.time = foundation.NOW.replace(hour=11)
        for day, start, end in (("2026-09-09", "10:00", "12:00"), ("2026-09-13", None, None)):
            with self.assertRaises(RuleViolation):
                self.store.close_time(day, start, end, "Test", "test-owner")
        closure_id = self.store.close_time("2026-09-09", None, None, "Test", "test-owner")
        with self.store.transaction() as conn:
            claims = list(conn.execute("SELECT starts_at FROM slot_claims WHERE closure_id=%s", (closure_id,)))
            self.assertEqual(len(claims), 7)
            self.assertTrue(all(claim["starts_at"] > self.time for claim in claims))
        self.store.reopen(closure_id, "test-owner")
        self.time = foundation.NOW.replace(hour=18)
        with self.assertRaises(RuleViolation):
            self.store.close_time("2026-09-09", None, None, "Test", "test-owner")

    def test_ready_verifies_checksums_not_just_names(self):
        with self.store.transaction() as conn:
            original = conn.execute("SELECT checksum FROM schema_migrations WHERE name='001_booking_foundation.sql'").fetchone()["checksum"]
            conn.execute("UPDATE schema_migrations SET checksum='wrong' WHERE name='001_booking_foundation.sql'")
        try:
            self.assertFalse(self.store.ready())
            with self.assertRaises(StorageUnavailable):
                self.store.migrate()
        finally:
            with self.store.transaction() as conn:
                conn.execute("UPDATE schema_migrations SET checksum=%s WHERE name='001_booking_foundation.sql'", (original,))
        self.assertTrue(self.store.ready())

    def test_timeouts_are_transaction_local_and_connections_close(self):
        connections = []
        original_connect = psycopg.connect
        def connect(*args, **kwargs):
            self.assertNotIn("options", kwargs)
            self.assertIsNone(kwargs["prepare_threshold"])
            conn = original_connect(*args, **kwargs)
            connections.append(conn)
            return conn
        with patch("psycopg.connect", side_effect=connect):
            with self.store.transaction() as conn:
                self.assertEqual(conn.execute("SHOW statement_timeout").fetchone()["statement_timeout"], "10s")
                self.assertEqual(conn.execute("SHOW lock_timeout").fetchone()["lock_timeout"], "5s")
            with self.assertRaises(StorageUnavailable), self.store.transaction() as conn:
                conn.execute("SET LOCAL statement_timeout = '5ms'")
                conn.execute("SELECT pg_sleep(0.05)")
        self.assertTrue(all(conn.closed for conn in connections))
        self.assertTrue(self.store.ready())
