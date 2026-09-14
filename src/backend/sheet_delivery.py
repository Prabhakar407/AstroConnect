"""Idempotent Google Sheet mirrors for confirmed bookings and inquiries.

Neon is authoritative. A mirror outage is retained as recoverable work and can
never roll back a customer submission or payment confirmation.
"""

import json
import re
from datetime import timedelta
from http.client import HTTPException
from urllib.error import HTTPError, URLError
from urllib.parse import quote as url_quote
from urllib.request import HTTPRedirectHandler, Request, build_opener
from uuid import UUID, uuid4

from google.auth.transport.requests import Request as GoogleRequest
from google.oauth2 import service_account

from .domain import IST
from .inquiry_delivery import outcome
from .storage import StorageUnavailable

KINDS = ('sheet_booking', 'sheet_inquiry')
ROLES = ('client_sheet', 'agency_sheet')
MAX_ATTEMPTS = 8
LEASE = timedelta(seconds=90)
MAX_RESPONSE_BYTES = 1048576
SCOPE = 'https://www.googleapis.com/auth/spreadsheets'


class NoSheetRedirects(HTTPRedirectHandler):
    def redirect_request(self, request, response, code, message, headers, new_url):
        return None


class TimedGoogleRequest(GoogleRequest):
    def __call__(self, *args, **kwargs):
        kwargs['timeout'] = 10
        return super().__call__(*args, **kwargs)


class SheetFailure(RuntimeError):
    def __init__(self, code, *, retryable=False, retry_after=0):
        super().__init__(code)
        self.code = code
        self.retryable = retryable
        self.retry_after = retry_after


def _safe_text(value):
    """Keep numbers sortable and all customer text literal through RAW mode."""
    if value is None:
        return ''
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return value
    return str(value)


def _date_time(value):
    if not value:
        return ''
    return value.astimezone(IST).strftime('%d %b %Y, %I:%M %p IST')


def _date(value):
    return value.astimezone(IST).strftime('%d %b %Y') if value else ''


def _time(value):
    return value.astimezone(IST).strftime('%I:%M %p') if value else ''


class GoogleSheets:
    """Small fixed-scope REST adapter; never accepts a URL from a job payload."""

    def __init__(self, service_account_json, *, opener=None, token=None):
        self.opener = opener or build_opener(NoSheetRedirects())
        self._token = token
        if token is None:
            try:
                info = json.loads(service_account_json)
                credentials = service_account.Credentials.from_service_account_info(info, scopes=[SCOPE])
            except (ValueError, TypeError, KeyError):
                raise StorageUnavailable('Google Sheet delivery is not configured.') from None
            try:
                credentials.refresh(TimedGoogleRequest())
                self._token = credentials.token
            except Exception:
                raise SheetFailure('sheet_auth_unavailable', retryable=True) from None
        if not isinstance(self._token, str) or len(self._token) < 20 or '\r' in self._token or '\n' in self._token:
            raise StorageUnavailable('Google Sheet delivery is not configured.')

    def _request(self, method, url, body=None):
        data = json.dumps(body, separators=(',', ':')).encode() if body is not None else None
        request = Request(url, data=data, method=method, headers={
            'Authorization': f'Bearer {self._token}', 'Accept': 'application/json',
            'Content-Type': 'application/json', 'User-Agent': 'AstroAdvice/1.0'})
        try:
            with self.opener.open(request, timeout=10) as response:
                if response.status != 200 or response.headers.get_content_type() != 'application/json':
                    raise SheetFailure('sheet_response_invalid', retryable=True)
                raw = response.read(MAX_RESPONSE_BYTES + 1)
                if len(raw) > MAX_RESPONSE_BYTES:
                    raise SheetFailure('sheet_response_too_large')
                value = json.loads(raw)
                if not isinstance(value, dict):
                    raise SheetFailure('sheet_response_invalid', retryable=True)
                return value
        except HTTPError as error:
            status = error.code
            error.close()
            if status in (401, 403, 404):
                raise SheetFailure('sheet_access_required') from None
            raise SheetFailure('sheet_provider_unavailable', retryable=status in (408, 409, 429) or status >= 500,
                               retry_after=60 if status == 429 else 0) from None
        except SheetFailure:
            raise
        except (URLError, TimeoutError, OSError, ValueError, HTTPException):
            raise SheetFailure('sheet_request_unconfirmed', retryable=True) from None

    @staticmethod
    def _base(spreadsheet_id, cell_range):
        if not re.fullmatch(r'[A-Za-z0-9_-]{20,100}', spreadsheet_id or ''):
            raise SheetFailure('sheet_destination_invalid')
        return (f'https://sheets.googleapis.com/v4/spreadsheets/{spreadsheet_id}/values/'
                f'{url_quote(cell_range, safe="")}')

    def upsert(self, spreadsheet_id, tab, row):
        if tab not in ('Appointments', 'Inquiries') or not row or not row[0]:
            raise SheetFailure('sheet_record_invalid')
        last_column = 'S' if tab == 'Appointments' else 'K'
        lookup_url = self._base(spreadsheet_id, f"'{tab}'!A2:A10000")
        values = self._request('GET', lookup_url).get('values', [])
        matches = [index + 2 for index, existing in enumerate(values)
                   if existing and str(existing[0]) == str(row[0])]
        if len(matches) > 1:
            raise SheetFailure('duplicate_sheet_rows')
        safe_row = [_safe_text(value) for value in row]
        if matches:
            target = f"'{tab}'!A{matches[0]}:{last_column}{matches[0]}"
            url = self._base(spreadsheet_id, target) + '?valueInputOption=RAW'
            self._request('PUT', url, {'range': target, 'majorDimension': 'ROWS', 'values': [safe_row]})
        else:
            target = f"'{tab}'!A:{last_column}"
            url = self._base(spreadsheet_id, target) + ':append?valueInputOption=RAW&insertDataOption=INSERT_ROWS'
            self._request('POST', url, {'range': target, 'majorDimension': 'ROWS', 'values': [safe_row]})
        # A timeout after Google committed is safe: the next attempt finds the
        # permanent reference. A confirmed response is checked immediately.
        confirmed = self._request('GET', lookup_url).get('values', [])
        if sum(1 for existing in confirmed if existing and str(existing[0]) == str(row[0])) != 1:
            raise SheetFailure('sheet_write_unconfirmed', retryable=True)


class SheetDelivery:
    def __init__(self, store, settings, *, provider=None):
        self.store, self.settings = store, settings
        self.provider = provider

    def _destination(self, role):
        value = (self.settings.client_sheet_id if role == 'client_sheet'
                 else self.settings.agency_sheet_id if role == 'agency_sheet' else '')
        if not value:
            raise SheetFailure('sheet_destination_not_configured', retryable=True, retry_after=86400)
        return value

    def _provider(self):
        if self.provider is not None:
            return self.provider
        return GoogleSheets(self.settings.google_sheets_service_account_json)

    def _current_booking_row(self, record_id):
        with self.store.transaction() as conn:
            booking = self._booking(conn, record_id)
        return self._booking_row(booking) if booking else None

    @staticmethod
    def _booking(conn, record_id):
        return conn.execute("""SELECT b.*,
            accepted.payment_id AS payment_reference,accepted.received_at AS paid_at,
            ce.meet_url
            FROM bookings b
            LEFT JOIN LATERAL (
                SELECT payment_id,received_at FROM payments
                WHERE booking_id=b.id AND disposition='accepted'
                UNION ALL
                SELECT payment_id,observed_at AS received_at FROM payment_observations
                WHERE booking_id=b.id AND disposition='accepted'
                ORDER BY received_at DESC LIMIT 1
            ) accepted ON true
            LEFT JOIN booking_calendar_events ce ON ce.booking_id=b.id
            WHERE b.id=%s""", (record_id,)).fetchone()

    @staticmethod
    def _booking_row(booking):
        starts = booking['starts_at']
        return [str(booking['id']), booking['state'].title(), _date_time(booking['created_at']),
                booking['full_name'], booking['email'], booking['phone'], booking['service_name'],
                booking['question_count'] if booking['service_id'] == 'prashna-kundali' else '',
                booking['amount_paise'] / 100, booking['currency'], _date(starts), _time(starts),
                booking['birth_date'].isoformat() if booking.get('birth_date') else '',
                str(booking.get('birth_time') or ''), booking.get('birth_place') or '', booking.get('notes') or '',
                booking.get('meet_url') or '', booking.get('payment_reference') or '',
                _date_time(booking.get('cancelled_at'))]

    @staticmethod
    def _inquiry_row(inquiry):
        source = {'home': 'Homepage', 'contact': 'Contact page', 'prashna': 'Prashna Kundali page'}.get(
            inquiry.get('source'), 'Website')
        kind = 'Prashna Kundali' if inquiry['kind'] == 'prashna' else 'General inquiry'
        return [str(inquiry['id']), _date_time(inquiry['created_at']), source, kind, inquiry['name'],
                inquiry['email'], inquiry.get('phone') or '', inquiry.get('dob') or '',
                inquiry.get('location') or '', inquiry['subject'], inquiry['message']]

    def _claim(self, job_id):
        with self.store.transaction() as conn:
            job = conn.execute('SELECT * FROM delivery_jobs WHERE id=%s FOR UPDATE', (job_id,)).fetchone()
            if not job or job['kind'] not in KINDS or job['recipient_role'] not in ROLES:
                raise ValueError('unsupported_sheet_job')
            now = self.store.now(conn)
            if job['state'] in ('sent', 'failed'):
                return job, None, None, None
            if job['state'] == 'processing' and job['lease_until'] and job['lease_until'] > now:
                return job, None, None, None
            if job['state'] == 'pending' and job['next_attempt_at'] > now:
                return job, None, None, None
            if job['attempts'] >= MAX_ATTEMPTS:
                job = conn.execute("""UPDATE delivery_jobs SET state='failed',last_error_code='retry_limit',
                    lease_token=NULL,lease_until=NULL WHERE id=%s RETURNING *""", (job_id,)).fetchone()
                return job, None, None, None
            if job['kind'] == 'sheet_booking':
                record = self._booking(conn, job['record_id'])
                if not record:
                    code = 'missing_booking'
                elif record['state'] == 'confirmed' and not record.get('meet_url'):
                    job = conn.execute("""UPDATE delivery_jobs SET state='pending',next_attempt_at=%s,
                        last_error_code='meeting_pending',lease_token=NULL,lease_until=NULL
                        WHERE id=%s RETURNING *""", (now + timedelta(seconds=30), job_id)).fetchone()
                    return job, None, None, None
                else:
                    code = None
                tab = 'Appointments'
                row = self._booking_row(record) if record else None
            else:
                record = conn.execute('SELECT * FROM inquiries WHERE id=%s', (job['record_id'],)).fetchone()
                code = None if record else 'missing_inquiry'
                tab = 'Inquiries'
                row = self._inquiry_row(record) if record else None
            if code:
                job = conn.execute("""UPDATE delivery_jobs SET state='failed',last_error_code=%s,
                    lease_token=NULL,lease_until=NULL WHERE id=%s RETURNING *""", (code, job_id)).fetchone()
                return job, None, None, None
            try:
                destination = self._destination(job['recipient_role'])
            except SheetFailure as error:
                job = conn.execute("""UPDATE delivery_jobs SET state='failed',last_error_code=%s,
                    lease_token=NULL,lease_until=NULL WHERE id=%s RETURNING *""", (error.code, job_id)).fetchone()
                return job, None, None, None
            token = uuid4()
            job = conn.execute("""UPDATE delivery_jobs SET state='processing',attempts=attempts+1,
                first_attempt_at=COALESCE(first_attempt_at,%s),lease_token=%s,lease_until=%s
                WHERE id=%s RETURNING *""", (now, token, now + LEASE, job_id)).fetchone()
            return job, destination, tab, row

    def _finish(self, claimed, error=None):
        with self.store.transaction() as conn:
            row = conn.execute('SELECT * FROM delivery_jobs WHERE id=%s FOR UPDATE', (claimed['id'],)).fetchone()
            if not row:
                raise StorageUnavailable('The spreadsheet result could not be recorded.')
            now = self.store.now(conn)
            if row['lease_token'] != claimed['lease_token'] or row['lease_until'] <= now:
                return outcome(row)
            if error is None:
                row = conn.execute("""UPDATE delivery_jobs SET state='sent',accepted_at=COALESCE(accepted_at,%s),
                    last_error_code=NULL,next_attempt_at=%s,lease_token=NULL,lease_until=NULL
                    WHERE id=%s RETURNING *""", (now, now, row['id'])).fetchone()
            else:
                delay = max(error.retry_after, min(3600, 60 * 2 ** max(0, row['attempts'] - 1)))
                retry = error.retryable and row['attempts'] < MAX_ATTEMPTS
                row = conn.execute("""UPDATE delivery_jobs SET state=%s,last_error_code=%s,next_attempt_at=%s,
                    lease_token=NULL,lease_until=NULL WHERE id=%s RETURNING *""",
                    ('pending' if retry else 'failed', error.code, now + timedelta(seconds=delay), row['id'])).fetchone()
            return outcome(row)

    def run(self, job_id):
        claimed, spreadsheet_id, tab, row = self._claim(UUID(str(job_id)))
        if row is None:
            return outcome(claimed)
        try:
            self._provider().upsert(spreadsheet_id, tab, row)
            # A cancellation can happen while Google is accepting an older
            # confirmed row. Recheck Neon after the remote write and retry the
            # same permanent reference when the truth changed mid-flight.
            if tab == 'Appointments' and self._current_booking_row(claimed['record_id']) != row:
                raise SheetFailure('sheet_record_changed', retryable=True, retry_after=1)
        except SheetFailure as error:
            return self._finish(claimed, error)
        except StorageUnavailable:
            return self._finish(claimed, SheetFailure('sheet_configuration_unavailable'))
        except Exception:
            return self._finish(claimed, SheetFailure('sheet_request_unconfirmed', retryable=True))
        return self._finish(claimed)
