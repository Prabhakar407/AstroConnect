"""Signed payment inbox: persist before acknowledgment, fetch before finalizing."""
import hashlib
import json
import re
from datetime import timedelta
from uuid import uuid4

from .domain import RuleViolation
from .razorpay import RazorpayFailure, identifier, merchant_identity, verify_signature
from .storage import StorageUnavailable

EVENTS = frozenset(('payment.authorized', 'payment.captured', 'payment.failed', 'order.paid',
                    'refund.created', 'refund.processed', 'refund.failed',
                    'payment.dispute.created', 'payment.dispute.won', 'payment.dispute.lost',
                    'payment.dispute.closed', 'payment.dispute.under_review', 'payment.dispute.action_required'))

class PaymentEvents:
    def __init__(self, store, checkout, secret, account_id):
        self.store, self.checkout = store, checkout
        self.secret, self.account_id = secret, account_id

    def receive(self, body, headers):
        if not self.secret or not self.account_id:
            raise StorageUnavailable('Payment notifications are not configured.')
        if not verify_signature(body, headers.get('x-razorpay-signature'), self.secret):
            raise RuleViolation('This payment update could not be verified.', 400, 'invalid_signature')
        try:
            data = json.loads(body)
            event_id = headers.get('x-razorpay-event-id', '')
            if not re.fullmatch(r'[A-Za-z0-9_-]{1,200}', event_id) or not isinstance(data, dict):
                raise ValueError()
            expected = merchant_identity(self.account_id)
            if not expected or merchant_identity(data.get('account_id')) != expected:
                raise ValueError()
            kind = data['event']
            if kind not in EVENTS:
                return None
            payload = data['payload']
            if kind.startswith('refund.'):
                payment_id = payload['refund']['entity']['payment_id']
            else:
                payment_id = payload['payment']['entity']['id']
            identifier(payment_id, 'pay')
        except (ValueError, TypeError, KeyError, AttributeError):
            raise RuleViolation('This payment update is incomplete or belongs to another account.', 400, 'invalid_event') from None
        key = self.checkout.provider.key_id
        digest = hashlib.sha256(body).hexdigest()
        with self.store.transaction() as conn:
            now = self.store.now(conn)
            conn.execute('''INSERT INTO payment_events
                (key_id,event_id,account_id,kind,payment_id,payload_hash,received_at,next_attempt_at)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s) ON CONFLICT(key_id,event_id) DO NOTHING''',
                (key, event_id, self.account_id, kind, payment_id, digest, now, now))
            previous = conn.execute('SELECT payload_hash,record_id,processed_at FROM payment_events WHERE key_id=%s AND event_id=%s',
                                    (key, event_id)).fetchone()
            if previous['payload_hash'] != digest:
                raise RuleViolation('This payment update conflicts with an earlier update.', 409, 'event_conflict')
            if previous['processed_at'] is None:
                self.store.enqueue(conn, 'payment_event', previous['record_id'], now)
        return event_id

    def record_id(self, event_id):
        with self.store.transaction() as conn:
            return conn.execute('SELECT record_id FROM payment_events WHERE key_id=%s AND event_id=%s',
                                (self.checkout.provider.key_id, event_id)).fetchone()['record_id']

    def deliver(self, job_id):
        with self.store.transaction() as conn:
            row = conn.execute('''SELECT e.event_id FROM delivery_jobs j
                JOIN payment_events e ON e.record_id=j.record_id
                WHERE j.id=%s AND j.kind='payment_event' AND e.key_id=%s''',
                (job_id, self.checkout.provider.key_id)).fetchone()
        if not row:
            raise RuleViolation('This payment task is unavailable.', 404, 'delivery_unavailable')
        self.process_one(row['event_id'])
        with self.store.transaction() as conn:
            job = conn.execute('SELECT state,next_attempt_at FROM delivery_jobs WHERE id=%s', (job_id,)).fetchone()
        terminal = job['state'] in ('sent', 'failed')
        return {'job_id': str(job_id), 'state': job['state'], 'terminal': terminal,
                'retry_at': job['next_attempt_at'].isoformat()}

    def process_one(self, event_id=None):
        """One bounded provider fetch. A crashed claim becomes due after 90 sec.

        Finalization is idempotent; duplicate external reads are harmless. Future
        webhook retries and independent recovery both call this same processor.
        """
        key = self.checkout.provider.key_id
        with self.store.transaction() as conn:
            now = self.store.now(conn)
            # A crash on the final leased attempt must not leave an endlessly
            # retried pending job. Keep the inbox and failed task for attention.
            conn.execute('''UPDATE delivery_jobs j SET state='failed'
                FROM payment_events e WHERE j.record_id=e.record_id AND j.kind='payment_event'
                AND e.key_id=%s AND e.processed_at IS NULL AND e.attempts>=12
                AND e.next_attempt_at<=%s AND j.state='pending' ''', (key, now))
            event = conn.execute('''SELECT * FROM payment_events WHERE key_id=%s
                AND processed_at IS NULL AND next_attempt_at<=%s AND attempts<12
                AND (%s::text IS NULL OR event_id=%s)
                ORDER BY next_attempt_at,event_id LIMIT 1 FOR UPDATE SKIP LOCKED''', (key, now, event_id, event_id)).fetchone()
            if not event:
                return False
            attempt = event['attempts'] + 1
            conn.execute('''UPDATE payment_events SET attempts=%s,next_attempt_at=%s
                WHERE key_id=%s AND event_id=%s''', (attempt, now + timedelta(seconds=90), key, event['event_id']))
            conn.execute('''UPDATE delivery_jobs SET next_attempt_at=%s WHERE kind='payment_event'
                AND record_id=%s AND state='pending' ''', (now + timedelta(seconds=90), event['record_id']))
        try:
            payment = self.checkout.provider.payment(event['payment_id'])
            with self.store.transaction() as conn:
                order = conn.execute('SELECT booking_id FROM payment_orders WHERE key_id=%s AND order_id=%s',
                                      (key, payment.get('order_id'))).fetchone()
            if not order:
                raise RazorpayFailure('payment_order_unmatched')
            if not event['kind'].startswith('payment.dispute.'):
                self.checkout.observe(order['booking_id'], event['payment_id'], payment)
            with self.store.transaction(schedule=True) as conn:
                now = self.store.now(conn)
                if event['kind'].startswith('payment.dispute.'):
                    # Disputes need the merchant's attention, not automatic refund
                    # or cancellation; the original booking remains unchanged.
                    self.store.enqueue(conn, 'payment_review', order['booking_id'], now,
                                       suffix='dispute:' + event['event_id'])
                    conn.execute('''INSERT INTO payment_cases
                        (id,booking_id,key_id,external_reference,kind,created_at)
                        VALUES (%s,%s,%s,%s,'dispute',%s)
                        ON CONFLICT(key_id,external_reference,kind) DO NOTHING''',
                        (uuid4(), order['booking_id'], key, event['event_id'], now))
                saved = conn.execute('''UPDATE payment_events SET processed_at=%s,last_error=NULL
                    WHERE key_id=%s AND event_id=%s AND attempts=%s RETURNING record_id''', (now, key, event['event_id'], attempt)).fetchone()
                if saved:
                    conn.execute("UPDATE delivery_jobs SET state='sent' WHERE kind='payment_event' AND record_id=%s", (saved['record_id'],))
            return True
        except (RazorpayFailure, RuleViolation) as error:
            with self.store.transaction() as conn:
                now = self.store.now(conn)
                retry_at = now + timedelta(seconds=min(900, 30 * 2 ** min(attempt, 5)))
                saved = conn.execute('''UPDATE payment_events SET last_error=%s,next_attempt_at=%s
                    WHERE key_id=%s AND event_id=%s AND attempts=%s RETURNING record_id''',
                    (error.code, retry_at, key, event['event_id'], attempt)).fetchone()
                if saved:
                    conn.execute('''UPDATE delivery_jobs SET state=%s,next_attempt_at=%s
                        WHERE kind='payment_event' AND record_id=%s''',
                        ('failed' if attempt >= 12 else 'pending', retry_at, saved['record_id']))
            return False
