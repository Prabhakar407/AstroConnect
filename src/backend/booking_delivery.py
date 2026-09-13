"""Durable Google Meet, participant-email and payment-attention delivery."""

import html
from datetime import timedelta
from uuid import UUID, uuid4

from cryptography.fernet import InvalidToken
from psycopg.types.json import Jsonb

from .domain import CLIENT_EMAIL, CLIENT_PHONE, IST
from .email_budget import reserve_email
from .google_calendar import GoogleCalendar, GoogleFailure, event_body, event_identity, meeting_result
from .google_connection import cipher
from .inquiry_delivery import MAX_ATTEMPTS, LEASE, outcome
from .resend_email import EmailDeliveryError, send_message
from .storage import StorageUnavailable

KINDS = frozenset(('booking_confirmed', 'booking_cancelled', 'payment_review'))


def format_when(value):
    return value.astimezone(IST).strftime('%A, %d %B %Y at %I:%M %p IST').replace(' 0', ' ')


def booking_message(sender, booking, kind, role, meet_url=None):
    if role not in ('customer', 'client') or kind not in KINDS:
        raise ValueError('Unsupported booking email.')
    reference = str(booking['id'])
    when = format_when(booking['starts_at'])
    fee = f"₹{booking['amount_paise'] // 100:,}"
    question_line = (f"Questions paid for: {booking['question_count']}"
                     if booking['service_id'] == 'prashna-kundali' else None)
    if kind == 'booking_confirmed' and not meet_url:
        raise ValueError('A confirmed-booking email requires its saved meeting link.')
    if role == 'customer':
        recipient, reply = booking['email'], CLIENT_EMAIL
        if kind == 'booking_confirmed':
            subject = 'Your consultation is confirmed — Astro Advice'
            lines = [f"Hello {booking['full_name']},", 'Your payment and appointment are confirmed.',
                     'This is an online consultation on Google Meet.',
                     f"Consultation: {booking['service_name']}", f"When: {when}",
                     'Duration: 30 minutes', f"Payment received: {fee}"]
            if question_line:
                lines.append(question_line)
            lines += ['Use the Google Meet link below to join at your appointment time.',
                     f"Google Meet: {meet_url}",
                     f"Reference: {reference}",
                     f"To cancel, call {CLIENT_PHONE}. Refund to be done manually.",
                     'Astro Advice by Kundan Singh']
        else:
            subject = 'Your consultation has been cancelled — Astro Advice'
            lines = [f"Hello {booking['full_name']},", f"Your consultation for {when} has been cancelled.",
                     f"Reference: {reference}",
                     'Refund to be done manually. Please speak with the studio about any payment question.',
                     f"Call {CLIENT_PHONE} if you need help.", 'Astro Advice by Kundan Singh']
    else:
        recipient, reply = CLIENT_EMAIL, booking['email']
        if kind == 'booking_confirmed':
            subject = 'New paid consultation — Astro Advice'
            lines = ['A paid consultation is confirmed.', f"Customer: {booking['full_name']}",
                     f"Phone: {booking['phone']}", f"Email: {booking['email']}",
                     f"Consultation: {booking['service_name']}", f"When: {when}",
                     f"Payment received: {fee}", f"Google Meet: {meet_url}", f"Reference: {reference}"]
            if question_line:
                lines.append(question_line)
            if booking.get('birth_date'):
                lines.append(f"Birth date: {booking['birth_date']}")
            if booking.get('birth_time'):
                lines.append(f"Birth time: {booking['birth_time']}")
            if booking.get('birth_place'):
                lines.append(f"Birth place: {booking['birth_place']}")
            if booking.get('notes'):
                lines.append(f"Customer notes: {booking['notes']}")
        elif kind == 'booking_cancelled':
            subject = 'Consultation cancelled — Astro Advice'
            lines = ['A consultation has been cancelled on the private calendar.',
                     f"Customer: {booking['full_name']}", f"Phone: {booking['phone']}",
                     f"Email: {booking['email']}", f"Consultation: {booking['service_name']}",
                     f"When: {when}", f"Payment received: {fee}",
                     f"Reference: {reference}", 'Refund to be done manually.']
        else:
            subject = 'Payment needs attention — Astro Advice'
            lines = ['A website payment needs a manual check. Do not ask the customer to pay again until it is reviewed.',
                     f"Customer: {booking['full_name']}", f"Phone: {booking['phone']}",
                     f"Email: {booking['email']}", f"Consultation: {booking['service_name']}",
                     f"Requested time: {when}", f"Expected amount: {fee}", f"Reference: {reference}"]
    return {
        'from': sender, 'to': [recipient], 'reply_to': reply, 'subject': subject,
        'text': '\n\n'.join(lines),
        'html': '<div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;'
                'color:#231b2e;max-width:560px;padding:16px;margin:0 auto;overflow-wrap:anywhere;">' +
                ''.join(f'<p>{html.escape(line)}</p>' for line in lines) + '</div>',
    }


class BookingDelivery:
    def __init__(self, store, settings, *, google=None, sender=None):
        self.store, self.settings = store, settings
        self.google = google or GoogleCalendar(settings.google_client_id, settings.google_client_secret)
        self.sender = sender or (lambda payload, key: send_message(settings, payload, key))

    def _booking(self, conn, job):
        row = conn.execute('SELECT * FROM bookings WHERE id=%s', (job['record_id'],)).fetchone()
        if not row:
            raise ValueError('missing_booking')
        return row

    def _access(self):
        crypt = cipher(self.settings)
        with self.store.transaction() as conn:
            row = conn.execute('SELECT * FROM google_connection WHERE singleton=true').fetchone()
        if not row:
            raise GoogleFailure('reconnect_required')
        try:
            refresh = crypt.decrypt(row['refresh_token_encrypted'].encode()).decode()
        except InvalidToken:
            raise GoogleFailure('reconnect_required') from None
        tokens = self.google.tokens(refresh_token=refresh)
        replacement = tokens.get('refresh_token')
        if replacement:
            encrypted = crypt.encrypt(replacement.encode()).decode()
            with self.store.transaction() as conn:
                conn.execute('''UPDATE google_connection SET refresh_token_encrypted=%s
                    WHERE singleton=true AND refresh_token_encrypted=%s''',
                    (encrypted, row['refresh_token_encrypted']))
        return tokens['access_token'], row['calendar_id']

    def _claim(self, job_id):
        with self.store.transaction() as conn:
            job = conn.execute('SELECT * FROM delivery_jobs WHERE id=%s FOR UPDATE', (job_id,)).fetchone()
            if not job or job['kind'] not in KINDS:
                raise ValueError('unsupported_booking_job')
            now = self.store.now(conn)
            if job['state'] in ('sent', 'failed'):
                return job, None, None
            if job['state'] == 'processing' and job['lease_until'] and job['lease_until'] > now:
                return job, None, None
            if job['state'] == 'pending' and job['next_attempt_at'] > now:
                return job, None, None
            if job['attempts'] >= MAX_ATTEMPTS:
                job = conn.execute("""UPDATE delivery_jobs SET state='failed',last_error_code='retry_limit',
                    lease_token=NULL,lease_until=NULL WHERE id=%s RETURNING *""", (job_id,)).fetchone()
                return job, None, None
            booking = self._booking(conn, job)
            if job['kind'] == 'booking_confirmed' and booking['state'] != 'confirmed':
                job = conn.execute("""UPDATE delivery_jobs SET state='sent',
                    last_error_code='superseded_by_cancellation',lease_token=NULL,lease_until=NULL
                    WHERE id=%s RETURNING *""", (job_id,)).fetchone()
                return job, None, None
            if job['kind'] == 'booking_confirmed' and job['recipient_role'] in ('customer', 'client'):
                event = conn.execute("SELECT meet_url FROM booking_calendar_events WHERE booking_id=%s AND state='ready'",
                                     (booking['id'],)).fetchone()
                if not event:
                    job = conn.execute("""UPDATE delivery_jobs SET state='pending',next_attempt_at=%s,
                        last_error_code='meeting_pending',lease_token=NULL,lease_until=NULL
                        WHERE id=%s RETURNING *""", (now + timedelta(seconds=30), job_id)).fetchone()
                    return job, None, None
            payload = job['message_payload']
            if job['recipient_role'] in ('customer', 'client') and payload is None:
                meet_url = None
                if job['kind'] == 'booking_confirmed':
                    meet_url = conn.execute('SELECT meet_url FROM booking_calendar_events WHERE booking_id=%s',
                                            (booking['id'],)).fetchone()['meet_url']
                payload = booking_message(self.settings.sender, booking, job['kind'], job['recipient_role'], meet_url)
                budget_reset = reserve_email(conn, self.store.now)
                if budget_reset:
                    job = conn.execute("""UPDATE delivery_jobs SET state='pending',next_attempt_at=%s,
                        last_error_code='email_allowance' WHERE id=%s RETURNING *""", (budget_reset, job_id)).fetchone()
                    return job, None, None
            token = uuid4()
            job = conn.execute("""UPDATE delivery_jobs SET state='processing',attempts=attempts+1,
                message_payload=COALESCE(message_payload,%s),first_attempt_at=COALESCE(first_attempt_at,%s),
                lease_token=%s,lease_until=%s WHERE id=%s RETURNING *""",
                (Jsonb(payload) if payload else None, now, token, now + LEASE, job_id)).fetchone()
            return job, booking, payload

    def _finish(self, claimed, *, provider_id=None, code=None, retryable=False, retry_after=0):
        with self.store.transaction() as conn:
            row = conn.execute('SELECT * FROM delivery_jobs WHERE id=%s FOR UPDATE', (claimed['id'],)).fetchone()
            now = self.store.now(conn)
            if provider_id:
                if row['provider_id'] and str(row['provider_id']) != str(provider_id):
                    code, provider_id = 'provider_result_conflict', None
                else:
                    conn.execute('UPDATE delivery_jobs SET provider_id=%s,accepted_at=COALESCE(accepted_at,%s) WHERE id=%s',
                                 (provider_id, now, row['id']))
            if row['lease_token'] != claimed['lease_token'] or row['lease_until'] <= now:
                return outcome(row)
            if provider_id or code is None:
                row = conn.execute("""UPDATE delivery_jobs SET state='sent',last_error_code=NULL,
                    next_attempt_at=%s,lease_token=NULL,lease_until=NULL WHERE id=%s RETURNING *""", (now, row['id'])).fetchone()
            else:
                delay = max(retry_after, min(3600, 60 * 2 ** max(0, row['attempts'] - 1)))
                retry = retryable and row['attempts'] < MAX_ATTEMPTS
                row = conn.execute("""UPDATE delivery_jobs SET state=%s,last_error_code=%s,next_attempt_at=%s,
                    lease_token=NULL,lease_until=NULL WHERE id=%s RETURNING *""",
                    ('pending' if retry else 'failed', code, now + timedelta(seconds=delay), row['id'])).fetchone()
            return outcome(row)

    def _calendar_create(self, booking):
        event_id, _ = event_identity(booking['id'])
        with self.store.transaction() as conn:
            now = self.store.now(conn)
            current = conn.execute('SELECT state FROM bookings WHERE id=%s', (booking['id'],)).fetchone()
            if not current or current['state'] != 'confirmed':
                return False
            connection = conn.execute('SELECT calendar_id FROM google_connection WHERE singleton=true').fetchone()
            if not connection:
                raise GoogleFailure('reconnect_required')
            saved = conn.execute('''INSERT INTO booking_calendar_events
                (booking_id,calendar_id,event_id,state,created_at,updated_at)
                VALUES (%s,%s,%s,'preparing',%s,%s) ON CONFLICT(booking_id) DO UPDATE
                SET updated_at=booking_calendar_events.updated_at RETURNING *''',
                (booking['id'], connection['calendar_id'], event_id, now, now)).fetchone()
        token, calendar_id = self._access()
        if saved['calendar_id'] != calendar_id:
            raise GoogleFailure('calendar_mismatch')
        if saved['state'] == 'cancelled':
            return False
        if saved['state'] == 'ready':
            return True
        if saved['state'] == 'waiting':
            event = self.google.event(token, calendar_id, event_id)
        else:
            try:
                event = self.google.insert(token, calendar_id,
                                           event_body(booking))
            except GoogleFailure as error:
                if error.code != 'already_exists':
                    raise
                event = self.google.event(token, calendar_id, event_id)
        result = meeting_result(event, event_id)
        cancelled = False
        with self.store.transaction() as conn:
            now = self.store.now(conn)
            current = conn.execute('SELECT state FROM bookings WHERE id=%s', (booking['id'],)).fetchone()
            saved_now = conn.execute('SELECT state FROM booking_calendar_events WHERE booking_id=%s',
                                     (booking['id'],)).fetchone()
            cancelled = not current or current['state'] != 'confirmed' or saved_now['state'] == 'cancelled'
            if cancelled:
                conn.execute("""UPDATE booking_calendar_events SET state='cancelled',meet_url=NULL,updated_at=%s
                    WHERE booking_id=%s""", (now, booking['id']))
            elif result['state'] == 'ready':
                conn.execute("""UPDATE booking_calendar_events SET state='ready',meet_url=%s,updated_at=%s
                    WHERE booking_id=%s""", (result['meet_url'], now, booking['id']))
            elif result['state'] == 'pending':
                conn.execute("UPDATE booking_calendar_events SET state='waiting',updated_at=%s WHERE booking_id=%s",
                             (now, booking['id']))
            else:
                conn.execute("UPDATE booking_calendar_events SET state='failed',updated_at=%s WHERE booking_id=%s",
                             (now, booking['id']))
        if cancelled:
            try:
                self.google.delete(token, calendar_id, event_id)
            except GoogleFailure as error:
                if error.code != 'not_found':
                    raise
            return False
        if result['state'] != 'ready':
            raise GoogleFailure('conference_pending' if result['state'] == 'pending' else 'conference_failed',
                                retryable=result['state'] == 'pending')
        return True

    def _calendar_cancel(self, booking):
        with self.store.transaction() as conn:
            saved = conn.execute('SELECT * FROM booking_calendar_events WHERE booking_id=%s', (booking['id'],)).fetchone()
        if not saved or saved['state'] == 'cancelled':
            return
        token, calendar_id = self._access()
        if saved['calendar_id'] != calendar_id:
            raise GoogleFailure('calendar_mismatch')
        try:
            self.google.delete(token, calendar_id, saved['event_id'])
        except GoogleFailure as error:
            if error.code != 'not_found':
                raise
        with self.store.transaction() as conn:
            conn.execute("""UPDATE booking_calendar_events SET state='cancelled',meet_url=NULL,updated_at=%s
                WHERE booking_id=%s""", (self.store.now(conn), booking['id']))

    def run(self, job_id):
        claimed, booking, payload = self._claim(UUID(str(job_id)))
        if booking is None:
            return outcome(claimed)
        role, kind = claimed['recipient_role'], claimed['kind']
        try:
            if role == 'calendar':
                self._calendar_create(booking) if kind == 'booking_confirmed' else self._calendar_cancel(booking)
                return self._finish(claimed)
            if kind == 'booking_confirmed':
                with self.store.transaction() as conn:
                    current = conn.execute('SELECT state FROM bookings WHERE id=%s', (booking['id'],)).fetchone()
                if not current or current['state'] != 'confirmed':
                    return self._finish(claimed)
            provider_id = self.sender(payload, f"booking/{booking['id']}/{kind}/{role}/v{claimed['message_version']}")
            return self._finish(claimed, provider_id=UUID(str(provider_id)))
        except EmailDeliveryError as error:
            return self._finish(claimed, code=error.code, retryable=error.retryable,
                                retry_after=error.retry_after)
        except GoogleFailure as error:
            return self._finish(claimed, code=error.code, retryable=error.retryable)
        except Exception:
            return self._finish(claimed, code='delivery_unconfirmed', retryable=True)
