"""One bounded inquiry-email attempt; no automatic polling or provider calls.

Only inquiry jobs are supported. The hosting helper is wired separately; it must
authenticate before invoking this processor. Booking/meeting jobs stay untouched.
"""
import html
from datetime import timedelta
from uuid import UUID, uuid4

from psycopg.types.json import Jsonb

from .domain import CLIENT_EMAIL, CLIENT_PHONE
from .resend_email import EmailDeliveryError, send_message
from .storage import StorageUnavailable
from .email_budget import reserve_email

MAX_ATTEMPTS = 8
LEASE = timedelta(seconds=90)
DEDUPE_WINDOW = timedelta(hours=24)
REQUEST_MARGIN = timedelta(seconds=30)


def inquiry_message(sender, inquiry, recipient_role):
    if recipient_role not in ('customer', 'client'):
        raise ValueError('Unsupported inquiry recipient.')
    reference = str(inquiry['id'])
    if recipient_role == 'customer':
        recipient, reply = inquiry['email'], CLIENT_EMAIL
        phone_label = f'{CLIENT_PHONE[:3]} {CLIENT_PHONE[3:8]} {CLIENT_PHONE[8:]}'
        subject = 'Your inquiry has been saved — Astro Advice'
        lines = [f"Hello {inquiry['name']},", 'Your inquiry has been saved. The studio will contact you.',
                 'This is an inquiry, not a confirmed appointment or a payment receipt.',
                 f'Reference: {reference}', f'You can reply to this email or call {phone_label}.',
                 'Astro Advice by Kundan Singh']
    else:
        recipient, reply = CLIENT_EMAIL, inquiry['email']
        subject = 'New website inquiry — Astro Advice'
        lines = [f"A new inquiry from {inquiry['name']} has been saved.",
                 'Reply to this email to contact the sender.', f'Reference: {reference}',
                 'The complete inquiry is stored privately on your website.',
                 'This inquiry does not reserve an appointment or record a payment.',
                 'Astro Advice by Kundan Singh']
    return {'from': sender, 'to': [recipient], 'reply_to': reply, 'subject': subject,
            'text': '\n\n'.join(lines),
            'html': '<div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;'
                    'color:#231b2e;max-width:560px;padding:16px;margin:0 auto;overflow-wrap:anywhere;">'
                    + ''.join(f'<p>{html.escape(line)}</p>' for line in lines) + '</div>'}


def outcome(row):
    retry_at = row['lease_until'] if row['state'] == 'processing' else row['next_attempt_at']
    return {'job_id': str(row['id']), 'state': row['state'],
            'terminal': row['state'] in ('sent', 'failed'), 'error_code': row['last_error_code'],
            'retry_at': retry_at.isoformat() if retry_at and row['state'] in ('pending', 'processing') else None}


class InquiryDelivery:
    def __init__(self, store, settings, *, sender=None):
        self.store, self.settings = store, settings
        self.sender = sender or (lambda payload, key: send_message(settings, payload, key))

    def _claim(self, job_id):
        with self.store.transaction() as conn:
            row = conn.execute('SELECT * FROM delivery_jobs WHERE id=%s FOR UPDATE', (job_id,)).fetchone()
            if not row or row['kind'] != 'inquiry_received':
                raise ValueError('No supported inquiry delivery job.')
            now = self.store.now(conn)
            if row['state'] in ('sent', 'failed'):
                return row, False
            if row['state'] == 'processing' and row['lease_until'] and row['lease_until'] > now:
                return row, False
            if row['state'] == 'pending' and row['next_attempt_at'] > now:
                return row, False
            if row['provider_id']:
                row = conn.execute("""UPDATE delivery_jobs SET state='sent',lease_token=NULL,lease_until=NULL,
                    last_error_code=NULL WHERE id=%s RETURNING *""", (job_id,)).fetchone()
                return row, False
            exhausted = row['attempts'] >= MAX_ATTEMPTS
            outside_window = row['first_attempt_at'] and now + REQUEST_MARGIN >= row['first_attempt_at'] + DEDUPE_WINDOW
            if exhausted or outside_window:
                code = 'retry_limit' if exhausted else 'send_outcome_needs_review'
                row = conn.execute("""UPDATE delivery_jobs SET state='failed',last_error_code=%s,
                    lease_token=NULL,lease_until=NULL WHERE id=%s RETURNING *""", (code, job_id)).fetchone()
                return row, False
            payload = row['message_payload']
            if not self.settings.resend_key or (payload is None and not self.settings.sender):
                raise StorageUnavailable('Email delivery is not configured.')
            if payload is None:
                inquiry = conn.execute('SELECT id,name,email FROM inquiries WHERE id=%s', (row['record_id'],)).fetchone()
                if not inquiry:
                    row = conn.execute("""UPDATE delivery_jobs SET state='failed',last_error_code='missing_inquiry',
                        lease_token=NULL,lease_until=NULL WHERE id=%s RETURNING *""", (job_id,)).fetchone()
                    return row, False
                payload = inquiry_message(self.settings.sender, inquiry, row['recipient_role'])
            budget_reset = reserve_email(conn, self.store.now)
            if budget_reset:
                # Waiting for allowance is not a send attempt. Do not consume
                # the retry limit or start a provider deduplication window.
                row = conn.execute("""UPDATE delivery_jobs SET state='pending',
                    next_attempt_at=%s,last_error_code='email_allowance',
                    lease_token=NULL,lease_until=NULL WHERE id=%s RETURNING *""",
                    (budget_reset, job_id)).fetchone()
                return row, False
            previous_uncertainty = row['send_uncertain']
            row = conn.execute("""UPDATE delivery_jobs SET state='processing',attempts=attempts+1,send_uncertain=true,
                message_payload=%s,first_attempt_at=COALESCE(first_attempt_at,%s),lease_token=%s,lease_until=%s
                WHERE id=%s RETURNING *""", (Jsonb(payload), now, uuid4(), now + LEASE, job_id)).fetchone()
            row['previous_uncertainty'] = previous_uncertainty
            return row, True

    def _finish(self, claimed, provider_id=None, error=None):
        with self.store.transaction() as conn:
            row = conn.execute('SELECT * FROM delivery_jobs WHERE id=%s FOR UPDATE', (claimed['id'],)).fetchone()
            if not row:
                raise StorageUnavailable('The delivery result could not be recorded.')
            now = self.store.now(conn)
            same_message = row['message_version'] == claimed['message_version'] and row['message_payload'] == claimed['message_payload']
            if provider_id and same_message:
                # Preserve external evidence after lease loss, never overwrite a
                # newer worker's state. A later claim can adopt accepted evidence.
                if row['provider_id'] and row['provider_id'] != provider_id:
                    raise StorageUnavailable('The delivery result needs review.')
                conn.execute('UPDATE delivery_jobs SET provider_id=%s,accepted_at=COALESCE(accepted_at,%s) WHERE id=%s',
                             (provider_id, now, row['id']))
            if not same_message or row['lease_token'] != claimed['lease_token'] or row['lease_until'] <= now:
                return outcome(row)
            if provider_id or row['provider_id']:
                state, code, retry_at = 'sent', None, now
                uncertain, first_attempt = False, row['first_attempt_at']
            elif error.code in ('daily_quota_exceeded', 'monthly_quota_exceeded') and error.definitely_rejected and not claimed['previous_uncertainty']:
                # A refused send is not an uncertain email. Keep its intent and
                # check once a day until Resend's actual allowance resets, rather
                # than guessing its monthly cycle or exhausting transport retries.
                row = conn.execute("""UPDATE delivery_jobs SET state='pending',attempts=attempts-1,
                    next_attempt_at=%s,last_error_code=%s,send_uncertain=false,
                    first_attempt_at=NULL,lease_token=NULL,lease_until=NULL WHERE id=%s RETURNING *""",
                    (now + timedelta(seconds=max(86400, error.retry_after)), error.code, row['id'])).fetchone()
                return outcome(row)
            else:
                uncertain = claimed['previous_uncertainty'] or not error.definitely_rejected
                first_attempt = row['first_attempt_at'] if uncertain else None
                delay = min(3600, 60 * 2 ** (row['attempts'] - 1))
                retry_at = now + timedelta(seconds=max(delay, error.retry_after))
                retry = error.retryable and row['attempts'] < MAX_ATTEMPTS and (not first_attempt or retry_at + REQUEST_MARGIN < first_attempt + DEDUPE_WINDOW)
                state, code = ('pending' if retry else 'failed'), error.code
            row = conn.execute("""UPDATE delivery_jobs SET state=%s,last_error_code=%s,next_attempt_at=%s,
                send_uncertain=%s,first_attempt_at=%s,lease_token=NULL,lease_until=NULL WHERE id=%s RETURNING *""",
                (state, code, retry_at, uncertain, first_attempt, row['id'])).fetchone()
            return outcome(row)

    def run(self, job_id):
        claimed, send = self._claim(UUID(str(job_id)))
        if not send:
            return outcome(claimed)
        key = f"inquiry/{claimed['id']}/v{claimed['message_version']}"
        try:
            provider_id = self.sender(claimed['message_payload'], key)
            if not isinstance(provider_id, str):
                raise ValueError('Unconfirmed provider reference')
            provider_id = UUID(provider_id)
        except EmailDeliveryError as error:
            return self._finish(claimed, error=error)
        except Exception:
            return self._finish(claimed, error=EmailDeliveryError('send_unconfirmed', retryable=True))
        return self._finish(claimed, provider_id=provider_id)

    def due(self, limit=25):
        if type(limit) is not int or not 1 <= limit <= 100:
            raise ValueError('Delivery batch size must be between 1 and 100.')
        with self.store.transaction() as conn:
            now = self.store.now(conn)
            rows = conn.execute("""SELECT id FROM delivery_jobs WHERE kind='inquiry_received' AND
                ((state='pending' AND next_attempt_at<=%s) OR (state='processing' AND lease_until<=%s))
                ORDER BY next_attempt_at,id LIMIT %s""", (now, now, limit)).fetchall()
            return [str(row['id']) for row in rows]
