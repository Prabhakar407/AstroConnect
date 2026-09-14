"""PostgreSQL persistence. No JSON, spreadsheet or in-memory production fallback."""

import hashlib
import hmac
import json
import re
from contextlib import contextmanager, nullcontext
from datetime import timedelta
from pathlib import Path
from uuid import uuid4

import psycopg
from psycopg import sql
from psycopg.conninfo import conninfo_to_dict
from psycopg.rows import dict_row
from pydantic import ValidationError

from .domain import ADVANCE_DAYS, CLIENT_EMAIL, CLIENT_PHONE, DURATION_MINUTES, IST, MINIMUM_NOTICE_MINUTES, SLOT_TIMES, RuleViolation, aware_utc, booking_start, closure_slots, day_slots, parse_day, quote, validate_day
from .models import BookingDetails

SCHEDULE_LOCK = 83124001


class StorageUnavailable(RuntimeError):
    """Safe external message; connection strings and SQL never reach the customer."""


def fingerprint(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":"), default=str).encode()).hexdigest()


def receipt_digest(secret, purpose, request_id):
    if not isinstance(secret, str) or not re.fullmatch(r"[a-f0-9]{64}", secret):
        raise RuleViolation("This request cannot be verified. Please return to the original form.", 403, "receipt_required")
    return fingerprint([purpose, str(request_id), secret])


def check_receipt(row, digest, now):
    if (not row or not row["receipt_digest"] or not row["receipt_expires_at"] or
            row["receipt_expires_at"] <= now or not hmac.compare_digest(row["receipt_digest"], digest)):
        raise RuleViolation("This request cannot be verified. Please return to the original form.", 403, "receipt_unavailable")


class Store:
    def __init__(self, dsn, *, clock=None):
        self._dsn = dsn
        self._clock = clock  # Explicit test injection only; normal operation uses the database clock.

    @contextmanager
    def transaction(self, *, schedule=False):
        if not self._dsn:
            raise StorageUnavailable("Booking storage is not configured.")
        try:
            parts = conninfo_to_dict(self._dsn)
            host = parts.get("host", "")
            local = host in ("localhost", "127.0.0.1", "::1") or host.startswith("/")
            if (not host or ',' in host or not parts.get("dbname") or parts.get("options") or
                    parts.get("hostaddr") or parts.get("service") or
                    (not local and parts.get("sslmode") not in ("require", "verify-ca", "verify-full"))):
                raise StorageUnavailable("Database configuration needs an explicit host, database and secure connection without session options.")
            with psycopg.connect(self._dsn, connect_timeout=5, row_factory=dict_row, prepare_threshold=None) as conn:
                # PgBouncer releases the backend at commit. Never depend on
                # session/startup options following us to the next transaction.
                conn.execute("SET LOCAL statement_timeout = '10s'")
                conn.execute("SET LOCAL lock_timeout = '5s'")
                if schedule:
                    conn.execute("SELECT pg_advisory_xact_lock(%s)", (SCHEDULE_LOCK,))
                yield conn
        except psycopg.Error:
            raise StorageUnavailable("The booking service is temporarily unavailable. Please try again later.") from None

    def now(self, conn):
        return aware_utc(self._clock() if self._clock else conn.execute("SELECT clock_timestamp() AS now").fetchone()["now"])

    def migrate(self):
        """Explicit operator command, never an import-time or request-time migration."""
        with self.transaction() as conn:
            conn.execute("SELECT pg_advisory_xact_lock(%s)", (SCHEDULE_LOCK - 1,))
            conn.execute("CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, checksum text NOT NULL)")
            for path in sorted((Path(__file__).parent / "migrations").glob("*.sql")):
                sql = path.read_text()
                checksum = hashlib.sha256(sql.encode()).hexdigest()
                existing = conn.execute("SELECT checksum FROM schema_migrations WHERE name=%s", (path.name,)).fetchone()
                if existing and existing["checksum"] != checksum:
                    raise StorageUnavailable("An applied migration has changed; review the migration history before continuing.")
                if not existing:
                    conn.execute(sql)
                    conn.execute("INSERT INTO schema_migrations VALUES (%s,%s)", (path.name, checksum))

    def ready(self):
        with self.transaction() as conn:
            applied = {row['name']: row['checksum'] for row in conn.execute("SELECT name,checksum FROM schema_migrations")}
            expected = {path.name: hashlib.sha256(path.read_text().encode()).hexdigest()
                        for path in (Path(__file__).parent / 'migrations').glob('*.sql')}
            return bool(expected) and all(applied.get(name) == checksum for name, checksum in expected.items())

    def booking_integrations_ready(self):
        """Stored connection proof only; provider health is checked during work."""
        if not self.ready():
            return False
        with self.transaction() as conn:
            return bool(conn.execute("""SELECT 1 FROM google_connection WHERE singleton=true
                AND calendar_id=%s AND refresh_token_encrypted<>''""", (CLIENT_EMAIL,)).fetchone())

    def policy(self):
        with self.transaction() as conn:
            return self.policy_at(self.now(conn))

    def cleanup_ephemeral(self):
        """Bound each sweep; never delete business records or live access proofs."""
        counts = {}
        with self.transaction() as conn:
            # Keep housekeeping inside the helper's request deadline.
            conn.execute("SET LOCAL statement_timeout = '1s'")
            conn.execute("SET LOCAL lock_timeout = '1s'")
            now = self.now(conn)
            for table, expiry in (("rate_limits", "resets_at"),
                                  ("email_challenges", "expires_at"),
                                  ("email_verifications", "expires_at")):
                result = conn.execute(sql.SQL("""WITH expired AS (
                    SELECT ctid FROM {table} WHERE {expiry} <= %s
                    ORDER BY {expiry} LIMIT 250 FOR UPDATE SKIP LOCKED
                ) DELETE FROM {table} AS target USING expired
                  WHERE target.ctid = expired.ctid""").format(
                    table=sql.Identifier(table), expiry=sql.Identifier(expiry)), (now,))
                counts[table] = result.rowcount
        return counts

    @staticmethod
    def policy_at(now):
        today = now.astimezone(IST).date()
        return {"server_now": now.isoformat(), "timezone": "Asia/Kolkata",
                "first_date": today.isoformat(), "last_date": (today + timedelta(days=ADVANCE_DAYS)).isoformat(),
                "duration_minutes": DURATION_MINUTES, "minimum_notice_minutes": MINIMUM_NOTICE_MINUTES,
                "slot_times": list(SLOT_TIMES), "cancellation_phone": CLIENT_PHONE, "booking_enabled": False}

    def private_day(self, day_value):
        """Minimal day detail, available only through the authenticated API."""
        with self.transaction(schedule=True) as conn:
            now = self.now(conn)
            day = parse_day(day_value)  # Protected history reads must not inherit public booking restrictions.
            self.expire_holds(conn, now)
            slots = day_slots(day)
            claims = {r['starts_at']: r for r in conn.execute("""SELECT s.starts_at,s.booking_id,s.closure_id,
                b.state,b.full_name,b.service_name,b.phone,b.email,b.amount_paise,b.question_count
                FROM slot_claims s LEFT JOIN bookings b ON b.id=s.booking_id WHERE s.starts_at=ANY(%s)""", (slots,))}
            closures = list(conn.execute("SELECT id,start_time,end_time,reason FROM closures WHERE day=%s AND reopened_at IS NULL ORDER BY created_at", (day,)))
            result = []
            for label, start in zip(SLOT_TIMES, slots):
                claim = claims.get(start, {})
                state = ('booked' if claim.get('state') == 'confirmed' else 'held') if claim.get('booking_id') else 'closed' if claim.get('closure_id') else 'unavailable' if day.weekday() == 6 or start <= now else 'open'
                result.append({'time': label, 'state': state, 'can_cancel': state == 'booked' and start > now,
                               **{k: v for k, v in claim.items() if k not in ('starts_at', 'state')}})
            return {'date': day.isoformat(), 'timezone': 'Asia/Kolkata', 'slots': result, 'closures': closures}

    def expire_holds(self, conn, now):
        # All callers hold the schedule lock. Payment confirmation and closures
        # use this same cleanup, preventing an expired hold from being revived.
        conn.execute("DELETE FROM slot_claims WHERE booking_id IN (SELECT id FROM bookings WHERE state='held' AND hold_expires_at<=%s)", (now,))
        conn.execute("UPDATE bookings SET state='expired' WHERE state='held' AND hold_expires_at<=%s", (now,))

    def availability(self, day_value):
        with self.transaction(schedule=True) as conn:
            now = self.now(conn)
            day = validate_day(day_value, now)
            self.expire_holds(conn, now)
            slots = day_slots(day)
            occupied = {r["starts_at"] for r in conn.execute("SELECT starts_at FROM slot_claims WHERE starts_at = ANY(%s)", (slots,))}
            return {**self.policy_at(now), "date": day.isoformat(), "slots": {
                label: day.weekday() != 6 and start >= now + timedelta(minutes=MINIMUM_NOTICE_MINUTES) and start not in occupied
                for label, start in zip(SLOT_TIMES, slots)}}

    @staticmethod
    def consume_verification(conn, digest, email, purpose, now):
        row = conn.execute("DELETE FROM email_verifications WHERE token_digest=%s AND email=%s AND purpose=%s AND expires_at>%s RETURNING email",
                           (digest, email, purpose, now)).fetchone()
        if not row:
            raise RuleViolation("Please verify your email again before submitting.", 403)

    @staticmethod
    def enqueue(conn, kind, record_id, now, *, suffix="", message_version=1):
        roles = (("customer", "client") if kind == "inquiry_received" else
                 ("calendar", "customer", "client") if kind in ("booking_confirmed", "booking_cancelled") else
                 ("client_sheet", "agency_sheet") if kind in ("sheet_booking", "sheet_inquiry") else
                 ("client",) if kind == "payment_review" else (None,))
        for role in roles:
            version_suffix = f":v{message_version}" if message_version != 1 else ""
            key = f"{kind}:{record_id}:{suffix}" + (f":{role}" if role else "") + version_suffix
            conn.execute("""INSERT INTO delivery_jobs
                (id,dedupe_key,kind,record_id,created_at,next_attempt_at,recipient_role,dispatch_after,message_version)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s) ON CONFLICT (dedupe_key) DO NOTHING""",
                (uuid4(), key, kind, record_id, now, now, role, now, message_version))

    def hold(self, payload, request_id, token_digest, receipt_secret, *, payment_key_id=None):
        """Internal checkout primitive. A hold is not a confirmed/paid booking."""
        try:
            payload = BookingDetails(**payload).model_dump()
        except ValidationError as error:
            raise RuleViolation("Please check the booking details.", 422, "invalid_fields",
                                [str(item["loc"][0]) for item in error.errors()]) from None
        digest = receipt_digest(receipt_secret, "booking", request_id)
        request_hash = fingerprint(payload)
        with self.transaction(schedule=True) as conn:
            now = self.now(conn)
            self.expire_holds(conn, now)
            previous = conn.execute("SELECT * FROM bookings WHERE request_id=%s", (request_id,)).fetchone()
            if previous:
                check_receipt(previous, digest, now)
                if previous["request_hash"] != request_hash:
                    raise RuleViolation("This request has changed. Please start a new checkout.", 409)
                return previous
            price = quote(payload["service_id"], payload["question_count"])
            if not hmac.compare_digest(payload["quote_version"], price["quote_version"]):
                raise RuleViolation("The consultation fee has changed. Please review the updated total before continuing.", 409, "quote_changed", ("quote_version",))
            if parse_day(payload["birth_date"]) > now.astimezone(IST).date():
                raise RuleViolation("Birth date cannot be in the future.", 422, "invalid_fields", ("birth_date",))
            start = booking_start(payload["date"], payload["time_slot"], now)
            if conn.execute("SELECT 1 FROM slot_claims WHERE starts_at=%s", (start,)).fetchone():
                raise RuleViolation("That time is no longer available. Please choose another.", 409)
            # Verify identity before revealing an email's active-checkout state.
            # A later conflict rolls back this consumption in the same transaction.
            self.consume_verification(conn, token_digest, payload["email"], "booking", now)
            if conn.execute("SELECT 1 FROM bookings WHERE email=%s AND state='held'", (payload["email"],)).fetchone():
                raise RuleViolation("You already have a payment in progress. Return to it or wait for that reservation to expire.", 409, "checkout_in_progress")
            booking_id = uuid4()
            row = conn.execute("""INSERT INTO bookings
                (id,request_id,request_hash,service_id,service_name,question_count,amount_paise,currency,duration_minutes,
                 starts_at,full_name,email,phone,birth_date,birth_time,birth_place,notes,quote_version,
                 receipt_digest,receipt_expires_at,state,hold_expires_at,created_at)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,30,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,'held',%s,%s) RETURNING *""",
                (booking_id, request_id, request_hash, price["service_id"], price["service_name"], price["question_count"],
                 price["amount_paise"], price["currency"], start, payload["full_name"], payload["email"], payload["phone"],
                 payload["birth_date"], payload["birth_time"] or None, payload["birth_place"], payload["notes"], price["quote_version"],
                 digest, start + timedelta(minutes=DURATION_MINUTES, hours=24), min(now + timedelta(minutes=10), start), now)).fetchone()
            conn.execute("INSERT INTO slot_claims (starts_at,booking_id) VALUES (%s,%s)", (start, booking_id))
            if payment_key_id is not None:
                from .razorpay import order_receipt
                if not re.fullmatch(r'rzp_(test|live)_[A-Za-z0-9]+', payment_key_id):
                    raise RuleViolation('Payment configuration is unavailable.', 503)
                mode = payment_key_id.split('_')[1]
                conn.execute("""INSERT INTO payment_orders
                    (booking_id,key_id,mode,receipt,amount_paise,created_at)
                    VALUES (%s,%s,%s,%s,%s,%s)""",
                    (booking_id, payment_key_id, mode, order_receipt(booking_id, mode), row['amount_paise'], now))
            return row

    def confirm_paid(self, booking_id, payment_id, amount_paise, currency, *, _conn=None):
        """Internal only: the future Razorpay adapter must verify capture first.

        No public endpoint accepts these arguments as proof of payment.
        Late/mismatched/second payments are retained for human resolution.
        """
        if not isinstance(payment_id, str) or not 1 <= len(payment_id) <= 100:
            raise RuleViolation("Invalid payment reference.")
        if type(amount_paise) is not int or amount_paise <= 0 or currency != "INR":
            raise RuleViolation("Invalid payment amount or currency.")
        # A payment finalizer can share its already schedule-locked transaction,
        # making observation, booking, claim and delivery intent one commit.
        with (nullcontext(_conn) if _conn is not None else self.transaction(schedule=True)) as conn:
            now = self.now(conn)
            self.expire_holds(conn, now)
            booking = conn.execute("SELECT * FROM bookings WHERE id=%s FOR UPDATE", (booking_id,)).fetchone()
            if not booking:
                raise RuleViolation("Booking not found.", 404)
            previous = conn.execute("SELECT * FROM payments WHERE payment_id=%s", (payment_id,)).fetchone()
            if previous:
                if str(previous["booking_id"]) != str(booking_id) or previous["amount_paise"] != amount_paise or previous["currency"] != currency:
                    raise RuleViolation("Payment reference does not match this booking.", 409)
                return previous["disposition"]
            owned = conn.execute("SELECT 1 FROM slot_claims WHERE starts_at=%s AND booking_id=%s", (booking["starts_at"], booking_id)).fetchone()
            accepted = booking["state"] == "held" and owned and booking["hold_expires_at"] > now and amount_paise == booking["amount_paise"]
            disposition = "accepted" if accepted else "review"
            conn.execute("INSERT INTO payments VALUES (%s,%s,%s,%s,%s,%s)", (payment_id, booking_id, amount_paise, currency, now, disposition))
            if accepted:
                conn.execute("UPDATE bookings SET state='confirmed' WHERE id=%s", (booking_id,))
                self.enqueue(conn, "booking_confirmed", booking_id, now)
                self.enqueue(conn, "sheet_booking", booking_id, now)
            else:
                # Preserve a previously confirmed booking when a second payment
                # needs review. Never seize another booking/closure's slot.
                if booking["state"] in ("held", "expired"):
                    conn.execute("DELETE FROM slot_claims WHERE booking_id=%s", (booking_id,))
                    conn.execute("UPDATE bookings SET state='payment_review' WHERE id=%s", (booking_id,))
                self.enqueue(conn, "payment_review", booking_id, now, suffix=payment_id)
            return disposition

    def close_time(self, day, start_time, end_time, reason, actor):
        with self.transaction(schedule=True) as conn:
            now = self.now(conn)
            slots = closure_slots(day, start_time, end_time, now)
            self.expire_holds(conn, now)
            if conn.execute("SELECT 1 FROM slot_claims WHERE starts_at=ANY(%s)", (slots,)).fetchone():
                raise RuleViolation("That range contains booked, reserved or already closed time. Choose a free range instead.", 409)
            # Whole-day protection includes earlier confirmed appointments, but
            # a new closure must never write claims for already-started times.
            slots = [slot for slot in slots if slot > now]
            if not slots:
                raise RuleViolation("There are no future consultation times left to close on this day.")
            closure_id = uuid4()
            conn.execute("INSERT INTO closures (id,day,start_time,end_time,reason,created_by,created_at) VALUES (%s,%s,%s,%s,%s,%s,%s)",
                         (closure_id, day, start_time, end_time, reason, actor, now))
            with conn.cursor() as cursor:
                cursor.executemany("INSERT INTO slot_claims (starts_at,closure_id) VALUES (%s,%s)", [(slot, closure_id) for slot in slots])
            return closure_id

    def reopen(self, closure_id, actor):
        with self.transaction(schedule=True) as conn:
            row = conn.execute("SELECT id FROM closures WHERE id=%s", (closure_id,)).fetchone()
            if not row:
                raise RuleViolation("Closure not found.", 404)
            conn.execute("DELETE FROM slot_claims WHERE closure_id=%s", (closure_id,))
            conn.execute("UPDATE closures SET reopened_at=%s,reopened_by=%s WHERE id=%s AND reopened_at IS NULL", (self.now(conn), actor, closure_id))

    def cancel(self, booking_id, actor):
        with self.transaction(schedule=True) as conn:
            now = self.now(conn)
            row = conn.execute("SELECT state,starts_at FROM bookings WHERE id=%s", (booking_id,)).fetchone()
            if not row:
                raise RuleViolation("Booking not found.", 404)
            if row["state"] == "cancelled":
                return
            if row["state"] != "confirmed" or row["starts_at"] <= now:
                raise RuleViolation("Only an upcoming confirmed booking can be cancelled here.", 409)
            conn.execute("DELETE FROM slot_claims WHERE booking_id=%s", (booking_id,))
            conn.execute("UPDATE bookings SET state='cancelled',cancelled_at=%s,cancelled_by=%s WHERE id=%s", (now, actor, booking_id))
            # Invalidate confirmation work before cancellation work is visible.
            # A provider call already accepted remains historical evidence; an
            # unfinished or in-flight confirmation must not be replayed later.
            conn.execute("""UPDATE delivery_jobs SET state='sent',last_error_code='superseded_by_cancellation',
                lease_token=NULL,lease_until=NULL,dispatch_token=NULL
                WHERE record_id=%s AND kind='booking_confirmed' AND provider_id IS NULL
                AND state IN ('pending','processing','failed')""", (booking_id,))
            self.enqueue(conn, "booking_cancelled", booking_id, now)
            # A second version updates the existing appointment row to
            # cancelled. If a confirmed copy is already in flight, this later
            # version still converges both workbooks on the current DB truth.
            self.enqueue(conn, "sheet_booking", booking_id, now, message_version=2)

    def save_inquiry(self, payload, request_id, token_digest, receipt_secret):
        digest = receipt_digest(receipt_secret, "inquiry", request_id)
        request_hash = fingerprint(payload)
        with self.transaction() as conn:
            # Serialize duplicate submissions, including retries from separate workers.
            conn.execute("SELECT pg_advisory_xact_lock(%s)", (int(request_id.int % (2**63 - 1)),))
            now = self.now(conn)
            previous = conn.execute("SELECT id,request_hash,receipt_digest,receipt_expires_at FROM inquiries WHERE request_id=%s", (request_id,)).fetchone()
            if previous:
                check_receipt(previous, digest, now)
                if previous["request_hash"] != request_hash:
                    raise RuleViolation("This inquiry request has changed. Please submit it as a new request.", 409)
                return previous["id"]
            self.consume_verification(conn, token_digest, payload["email"], payload["kind"], now)
            inquiry_id = uuid4()
            conn.execute("""INSERT INTO inquiries (id,request_id,request_hash,kind,name,email,phone,dob,subject,message,location,created_at,receipt_digest,receipt_expires_at,source)
                          VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                         (inquiry_id, request_id, request_hash, payload["kind"], payload["name"], payload["email"], payload.get("phone", ""),
                          payload.get("dob", ""), payload["subject"], payload["message"], payload.get("location", ""), now, digest, now + timedelta(hours=24), payload.get('source', payload['kind'])))
            self.enqueue(conn, "inquiry_received", inquiry_id, now)
            self.enqueue(conn, "sheet_inquiry", inquiry_id, now)
            return inquiry_id

    def inquiry_status(self, request_id, receipt_secret):
        digest = receipt_digest(receipt_secret, "inquiry", request_id)
        with self.transaction() as conn:
            row = conn.execute("SELECT id,receipt_digest,receipt_expires_at FROM inquiries WHERE request_id=%s", (request_id,)).fetchone()
            check_receipt(row, digest, self.now(conn))
            email = conn.execute("""SELECT state,provider_id FROM delivery_jobs WHERE kind='inquiry_received'
                AND record_id=%s AND recipient_role='customer' AND message_version=1""", (row['id'],)).fetchone()
            email_status = ('accepted' if email['provider_id'] else 'needs_attention' if email['state'] == 'failed' else 'pending') if email else 'unavailable'
            return {"status": "success", "inquiry_id": str(row["id"]), "message": "Your inquiry has been saved.", "email_status": email_status}

    def booking_status(self, request_id, receipt_secret):
        digest = receipt_digest(receipt_secret, "booking", request_id)
        with self.transaction(schedule=True) as conn:
            now = self.now(conn)
            self.expire_holds(conn, now)
            row = conn.execute("""SELECT id,service_id,service_name,question_count,amount_paise,currency,
                duration_minutes,starts_at,state,hold_expires_at,receipt_digest,receipt_expires_at
                FROM bookings WHERE request_id=%s""", (request_id,)).fetchone()
            check_receipt(row, digest, now)
            payments = [record['disposition'] for record in conn.execute("SELECT disposition FROM payments WHERE booking_id=%s", (row['id'],))]
            payments += [record['disposition'] for record in conn.execute(
                'SELECT disposition FROM payment_observations WHERE booking_id=%s', (row['id'],))]
            event = conn.execute('SELECT state,meet_url FROM booking_calendar_events WHERE booking_id=%s',
                                 (row['id'],)).fetchone()
            message_kind = 'booking_cancelled' if row['state'] == 'cancelled' else 'booking_confirmed'
            customer_email = conn.execute("""SELECT state,provider_id FROM delivery_jobs
                WHERE kind=%s AND record_id=%s AND recipient_role='customer'
                ORDER BY created_at DESC,id DESC LIMIT 1""", (message_kind, row['id'])).fetchone()
            meeting_state = ('cancelled' if row['state'] == 'cancelled' and (not event or event['state'] == 'cancelled') else
                             'pending' if row['state'] == 'cancelled' else
                             'ready' if event and event['state'] == 'ready' else
                             'needs_attention' if event and event['state'] == 'failed' else
                             'pending' if row['state'] == 'confirmed' else 'unavailable')
            email_state = ('accepted' if customer_email and customer_email['provider_id'] else
                           'needs_attention' if customer_email and customer_email['state'] == 'failed' else
                           'pending' if customer_email else 'unavailable')
            return {"booking_id": str(row["id"]), "service_id": row["service_id"], "service_name": row["service_name"],
                    "question_count": row["question_count"], "amount_paise": row["amount_paise"], "currency": row["currency"],
                    "duration_minutes": row["duration_minutes"], "starts_at": row["starts_at"].isoformat(),
                    "ends_at": (row["starts_at"] + timedelta(minutes=row["duration_minutes"])).isoformat(),
                    "timezone": "Asia/Kolkata", "appointment_state": row["state"],
                    "payment_state": "needs_attention" if "review" in payments else "received" if "accepted" in payments else "not_received",
                    "meeting_state": meeting_state,
                    "meet_url": event['meet_url'] if row['state'] == 'confirmed' and event and event['state'] == 'ready' else None,
                    "confirmation_email_state": email_state,
                    "hold_expires_at": row["hold_expires_at"].isoformat(), "server_now": now.isoformat()}
