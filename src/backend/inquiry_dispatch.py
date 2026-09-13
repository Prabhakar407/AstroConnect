"""Publish durable inquiry work; queue loss is recovered from the same SQL rows."""
import json
import logging
import re
from datetime import timedelta
from http.client import HTTPException
from urllib.error import HTTPError, URLError
from urllib.request import HTTPRedirectHandler, Request, build_opener
from uuid import UUID, uuid4

from .storage import StorageUnavailable

APPLICATION = 'astro-advice-booking'
ENVIRONMENT = 'production'
BATCH_SIZE = 25
DISPATCH_LEASE = timedelta(seconds=90)
logger = logging.getLogger(__name__)


class NoQueueRedirects(HTTPRedirectHandler):
    def redirect_request(self, request, response, code, message, headers, new_url):
        return None


def queue_configured(settings):
    return (all(re.fullmatch(r'[a-f0-9]{32}', value or '') for value in
                (settings.cloudflare_account_id, settings.cloudflare_queue_id)) and
            bool(re.fullmatch(r'[A-Za-z0-9_-]{20,256}', settings.cloudflare_queue_token or '')))


def publish_jobs(settings, job_ids, *, kind='inquiry_received'):
    """One fixed Cloudflare HTTP request; acceptance is not email delivery."""
    if not queue_configured(settings):
        raise StorageUnavailable('The inquiry queue connection is not configured.')
    if not isinstance(job_ids, list) or not 1 <= len(job_ids) <= BATCH_SIZE:
        raise ValueError('Invalid inquiry publication batch.')
    ids = [str(UUID(str(value))) for value in job_ids]
    if kind not in ('inquiry_received', 'payment_event', 'booking_confirmed', 'booking_cancelled', 'payment_review'):
        raise ValueError('Invalid publication kind.')
    body = {'messages': [{'body': {'job_id': value, 'kind': kind,
                                  'environment': ENVIRONMENT}, 'content_type': 'json'} for value in ids]}
    url = (f'https://api.cloudflare.com/client/v4/accounts/{settings.cloudflare_account_id}'
           f'/queues/{settings.cloudflare_queue_id}/messages/batch')
    request = Request(url, data=json.dumps(body, separators=(',', ':')).encode(), method='POST', headers={
        'Authorization': f'Bearer {settings.cloudflare_queue_token}', 'Content-Type': 'application/json',
        'Accept': 'application/json', 'User-Agent': 'AstroAdvice/1.0'})
    try:
        with build_opener(NoQueueRedirects()).open(request, timeout=5) as response:
            if response.status != 200 or response.headers.get_content_type() != 'application/json':
                raise ValueError('Unconfirmed queue response')
            raw = response.read(16385)
            if len(raw) > 16384:
                raise ValueError('Oversized queue response')
            result = json.loads(raw)
            if not isinstance(result, dict) or result.get('success') is not True or result.get('errors'):
                raise ValueError('Unconfirmed queue acceptance')
    except HTTPError as error:
        error.close()
        raise StorageUnavailable('Inquiry dispatch could not be confirmed.') from None
    except (URLError, TimeoutError, OSError, ValueError, HTTPException):
        raise StorageUnavailable('Inquiry dispatch could not be confirmed.') from None
    return True


class InquiryDispatch:
    def __init__(self, store, settings, *, publisher=None, kind='inquiry_received'):
        self.store, self.settings = store, settings
        if kind not in ('inquiry_received', 'payment_event', 'booking_confirmed', 'booking_cancelled', 'payment_review'):
            raise ValueError('Invalid publication kind.')
        self.kind = kind
        self.publisher = publisher or (lambda ids: publish_jobs(settings, ids, kind=kind))
        self.injected_publisher = publisher is not None

    def _claim(self, inquiry_id=None):
        with self.store.transaction() as conn:
            now, token = self.store.now(conn), uuid4()
            condition, args = (' AND record_id=%s', [UUID(str(inquiry_id))]) if inquiry_id else ('', [])
            rows = conn.execute("""SELECT id FROM delivery_jobs WHERE kind=%s
                AND dispatch_after<=%s AND ((state='pending' AND next_attempt_at<=%s)
                OR (state='processing' AND lease_until<=%s))""" + condition + """
                ORDER BY dispatch_after,id LIMIT %s FOR UPDATE SKIP LOCKED""",
                [self.kind, now, now, now, *args, BATCH_SIZE]).fetchall()
            ids = [row['id'] for row in rows]
            if ids:
                conn.execute("""UPDATE delivery_jobs SET dispatch_after=%s,dispatch_token=%s,
                    dispatch_attempts=dispatch_attempts+1 WHERE id=ANY(%s)""", (now + DISPATCH_LEASE, token, ids))
            return ids, token

    def _record(self, ids, token, accepted):
        with self.store.transaction() as conn:
            now = self.store.now(conn)
            # A stale publisher cannot overwrite a newer publication result or
            # affect the delivery lease/provider outcome. Replays stay safe.
            conn.execute("""UPDATE delivery_jobs SET dispatch_token=NULL,
                dispatched_at=CASE WHEN %s THEN %s ELSE dispatched_at END,
                dispatch_error=%s WHERE id=ANY(%s) AND dispatch_token=%s""",
                (accepted, now, None if accepted else 'queue_acceptance_unconfirmed', ids, token))

    def run(self, inquiry_id=None):
        if not self.injected_publisher and not queue_configured(self.settings):
            raise StorageUnavailable('The inquiry queue connection is not configured.')
        ids, token = self._claim(inquiry_id)
        if not ids:
            return {'selected': 0, 'published': 0}
        try:
            accepted = self.publisher([str(value) for value in ids]) is True
        except Exception:
            # Neither provider error bodies nor credentials go to logs/visitors.
            accepted = False
        self._record(ids, token, accepted)
        if not accepted:
            raise StorageUnavailable('Inquiry dispatch could not be confirmed.')
        return {'selected': len(ids), 'published': len(ids)}

    def after_save(self, inquiry_id):
        """Best effort only AFTER durable save; failure cannot unsave an inquiry.

        One bounded call in the request, no background thread or visitor-driven
        recovery loop. The independent scheduled call repairs the commit gap.
        """
        try:
            self.run(inquiry_id)
        except Exception:
            logger.warning('inquiry_dispatch_pending_recovery')


class BookingDispatch:
    """Publish every due booking operation in one mixed, bounded queue batch."""
    kinds = ('booking_confirmed', 'booking_cancelled', 'payment_review')

    def __init__(self, store, settings, *, publisher=None):
        self.store, self.settings = store, settings
        self.publisher = publisher or self._publish
        self.injected_publisher = publisher is not None

    def _publish(self, jobs):
        if not queue_configured(self.settings):
            raise StorageUnavailable('The booking delivery connection is not configured.')
        body = {'messages': [{'body': {'job_id': str(job['id']), 'kind': job['kind'],
                                      'environment': ENVIRONMENT}, 'content_type': 'json'} for job in jobs]}
        url = (f'https://api.cloudflare.com/client/v4/accounts/{self.settings.cloudflare_account_id}'
               f'/queues/{self.settings.cloudflare_queue_id}/messages/batch')
        request = Request(url, data=json.dumps(body, separators=(',', ':')).encode(), method='POST', headers={
            'Authorization': f'Bearer {self.settings.cloudflare_queue_token}', 'Content-Type': 'application/json',
            'Accept': 'application/json', 'User-Agent': 'AstroAdvice/1.0'})
        try:
            with build_opener(NoQueueRedirects()).open(request, timeout=5) as response:
                raw = response.read(16385)
                result = json.loads(raw) if len(raw) <= 16384 else None
                if (response.status != 200 or response.headers.get_content_type() != 'application/json' or
                        not isinstance(result, dict) or result.get('success') is not True or result.get('errors')):
                    raise ValueError('Unconfirmed queue response')
        except HTTPError as error:
            error.close()
            raise StorageUnavailable('Booking dispatch could not be confirmed.') from None
        except (URLError, TimeoutError, OSError, ValueError, HTTPException):
            raise StorageUnavailable('Booking dispatch could not be confirmed.') from None
        return True

    def _claim(self, booking_id=None, limit=BATCH_SIZE):
        if type(limit) is not int or not 0 <= limit <= BATCH_SIZE:
            raise ValueError('Invalid booking dispatch batch size.')
        if limit == 0:
            return [], None
        with self.store.transaction() as conn:
            now, token = self.store.now(conn), uuid4()
            condition, args = (' AND record_id=%s', [UUID(str(booking_id))]) if booking_id else ('', [])
            rows = conn.execute("""SELECT id,kind FROM delivery_jobs WHERE kind=ANY(%s)
                AND dispatch_after<=%s AND ((state='pending' AND next_attempt_at<=%s)
                OR (state='processing' AND lease_until<=%s))""" + condition + """
                ORDER BY dispatch_after,id LIMIT %s FOR UPDATE SKIP LOCKED""",
                [list(self.kinds), now, now, now, *args, limit]).fetchall()
            ids = [row['id'] for row in rows]
            if ids:
                conn.execute("""UPDATE delivery_jobs SET dispatch_after=%s,dispatch_token=%s,
                    dispatch_attempts=dispatch_attempts+1 WHERE id=ANY(%s)""", (now + DISPATCH_LEASE, token, ids))
            return rows, token

    def _record(self, jobs, token, accepted):
        ids = [job['id'] for job in jobs]
        with self.store.transaction() as conn:
            now = self.store.now(conn)
            conn.execute("""UPDATE delivery_jobs SET dispatch_token=NULL,
                dispatched_at=CASE WHEN %s THEN %s ELSE dispatched_at END,
                dispatch_error=%s WHERE id=ANY(%s) AND dispatch_token=%s""",
                (accepted, now, None if accepted else 'queue_acceptance_unconfirmed', ids, token))

    def run(self, booking_id=None, *, limit=BATCH_SIZE):
        if not self.injected_publisher and not queue_configured(self.settings):
            raise StorageUnavailable('The booking delivery connection is not configured.')
        jobs, token = self._claim(booking_id, limit)
        if not jobs:
            return {'selected': 0, 'published': 0}
        try:
            accepted = self.publisher(jobs) is True
        except Exception:
            accepted = False
        self._record(jobs, token, accepted)
        if not accepted:
            raise StorageUnavailable('Booking dispatch could not be confirmed.')
        return {'selected': len(jobs), 'published': len(jobs)}

    def after_save(self, booking_id):
        try:
            self.run(booking_id)
        except Exception:
            logger.warning('booking_dispatch_pending_recovery')
