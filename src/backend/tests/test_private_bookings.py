import os
import unittest
from datetime import timedelta

from src.backend.tests import test_admin as admin
from src.backend.tests import test_foundation as foundation


@unittest.skipUnless(os.getenv("ASTRO_TEST_DATABASE_URL"), "Requires isolated local database.")
class PrivateBookingTests(unittest.TestCase):
    setUpClass = classmethod(foundation.PostgresTests.setUpClass.__func__)
    setUp = admin.AdminTests.setUp
    start = admin.AdminTests.start
    login = admin.AdminTests.login
    payload = foundation.PostgresTests.payload
    hold = foundation.PostgresTests.hold
    held = foundation.PostgresTests.held
    verified = foundation.PostgresTests.verified

    def confirmed(self, payment_id="synthetic-private-payment"):
        row = self.hold()
        self.store.confirm_paid(row["id"], payment_id, row["amount_paise"], "INR")
        return row

    def test_routes_are_private_and_list_contains_complete_operational_record(self):
        booking = self.confirmed()
        for path in ("/api/admin/bookings", "/api/admin/booking-days?month=2026-09"):
            self.assertEqual(self.client.get(path).status_code, 401)
        self.login()
        item = self.client.get("/api/admin/bookings?view=upcoming").json()["items"][0]
        self.assertEqual(item["id"], str(booking["id"]))
        self.assertEqual(item["payment_state"], "received")
        self.assertEqual(item["payment_reference"], "synthetic-private-payment")
        self.assertIn("birth_date", item)
        self.assertIn("notes", item)
        for forbidden in ("receipt_digest", "request_hash", "message_payload", "token_digest", "lease_token"):
            self.assertNotIn(forbidden, item)
        counts = self.client.get("/api/admin/booking-days?month=2026-09").json()
        self.assertEqual(counts["days"], {"2026-09-10": 1})

    def test_views_separate_upcoming_past_and_cancelled(self):
        upcoming = self.confirmed()
        self.login()
        self.assertEqual(len(self.client.get("/api/admin/bookings?view=upcoming").json()["items"]), 1)
        self.assertEqual(
            self.client.get(f"/api/admin/bookings?view=past&before={upcoming['id']}").status_code,
            400,
        )
        self.client.post(f"/api/admin/bookings/{upcoming['id']}/cancel", headers=self.headers)
        self.assertEqual(len(self.client.get("/api/admin/bookings?view=cancelled").json()["items"]), 1)
        with self.store.transaction() as conn:
            conn.execute("UPDATE bookings SET state='confirmed',cancelled_at=NULL,starts_at=%s WHERE id=%s",
                         (self.time - timedelta(hours=1), upcoming["id"]))
        self.assertEqual(len(self.client.get("/api/admin/bookings?view=past").json()["items"]), 1)
        self.assertEqual(self.client.get("/api/admin/bookings?view=other").status_code, 400)
        self.assertEqual(self.client.get("/api/admin/booking-days?month=2026-13").status_code, 400)

    def test_cancel_response_uses_plain_manual_refund_instruction(self):
        booking = self.confirmed()
        self.login()
        result = self.client.post(f"/api/admin/bookings/{booking['id']}/cancel", headers=self.headers)
        self.assertEqual(result.status_code, 200)
        self.assertEqual(result.json()["refund_instruction"], "Refund to be done manually.")
        self.assertNotIn("refund_issued", result.json())
