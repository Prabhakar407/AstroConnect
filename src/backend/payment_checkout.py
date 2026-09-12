"""Durable payment coordination. No provider calls inside schedule transactions.

Public routes must authenticate the receipt and rate-limit requests. Background
reconciliation uses the same observe method after fetching through pinned keys.
"""
from .domain import RuleViolation
from .razorpay import RazorpayFailure, identifier, payment_matches, verify_checkout
from .storage import check_receipt, receipt_digest


class PaymentCheckout:
    def __init__(self, store, provider):
        self.store, self.provider = store, provider

    def start(self, payload, request_id, token_digest, secret):
        booking = self.store.hold(payload, request_id, token_digest, secret,
                                  payment_key_id=self.provider.key_id)
        return self.prepare(booking['id'])

    def _pinned(self, row):
        if not row or row['key_id'] != self.provider.key_id or row['mode'] != self.provider.mode:
            raise RuleViolation('This payment needs the original account connection.', 409, 'payment_account_changed')

    def authorized(self, request_id, secret):
        digest = receipt_digest(secret, 'booking', request_id)
        with self.store.transaction(schedule=True) as conn:
            now = self.store.now(conn)
            self.store.expire_holds(conn, now)
            booking = conn.execute('SELECT * FROM bookings WHERE request_id=%s', (request_id,)).fetchone()
            check_receipt(booking, digest, now)
            order = conn.execute('SELECT * FROM payment_orders WHERE booking_id=%s', (booking['id'],)).fetchone()
            self._pinned(order)
            return booking, order

    def prepare(self, booking_id):
        """Internal entrypoint; start authenticates before reaching this method."""
        with self.store.transaction(schedule=True) as conn:
            now = self.store.now(conn)
            self.store.expire_holds(conn, now)
            booking = conn.execute('SELECT * FROM bookings WHERE id=%s', (booking_id,)).fetchone()
            order = conn.execute('SELECT * FROM payment_orders WHERE booking_id=%s FOR UPDATE', (booking_id,)).fetchone()
            self._pinned(order)
            if order['state'] == 'ready':
                return order
            if not booking or booking['state'] != 'held' or booking['hold_expires_at'] <= now:
                return order
            if order['attempted_at'] is not None:
                # Concurrent retry/process restart must never create a new order.
                return order
            conn.execute("UPDATE payment_orders SET attempted_at=%s,state='creation_unknown' WHERE booking_id=%s",
                         (now, booking_id))
        try:
            remote = self.provider.create_order(booking_id, order['amount_paise'])
        except RazorpayFailure as error:
            with self.store.transaction() as conn:
                conn.execute("""UPDATE payment_orders SET last_error=%s,state=%s
                    WHERE booking_id=%s AND order_id IS NULL""",
                    (error.code, 'creation_unknown' if error.uncertain else 'failed', booking_id))
            return self.get_order(booking_id)
        return self.bind(booking_id, remote)

    def get_order(self, booking_id):
        with self.store.transaction() as conn:
            row = conn.execute('SELECT * FROM payment_orders WHERE booking_id=%s', (booking_id,)).fetchone()
            self._pinned(row)
            return row

    def bind(self, booking_id, remote):
        # This is also used by uncertain-order reconciliation after a direct
        # provider fetch. A late response is saved even after hold expiry.
        with self.store.transaction(schedule=True) as conn:
            row = conn.execute('SELECT * FROM payment_orders WHERE booking_id=%s FOR UPDATE', (booking_id,)).fetchone()
            self._pinned(row)
            valid = (isinstance(remote, dict) and remote.get('entity') == 'order' and
                     remote.get('receipt') == row['receipt'] and type(remote.get('amount')) is int and
                     remote['amount'] == row['amount_paise'] and remote.get('currency') == 'INR' and
                     remote.get('partial_payment') is False)
            try:
                remote_id = identifier(remote.get('id') if isinstance(remote, dict) else None, 'order')
            except ValueError:
                valid, remote_id = False, None
            if not valid or (row['order_id'] and row['order_id'] != remote_id):
                raise RazorpayFailure('payment_order_mismatch', uncertain=True)
            return conn.execute("""UPDATE payment_orders SET order_id=%s,state='ready',last_error=NULL
                WHERE booking_id=%s RETURNING *""", (remote_id, booking_id)).fetchone()

    def reconcile_creation(self, booking_id):
        row = self.get_order(booking_id)
        if row['order_id'] or row['attempted_at'] is None:
            return row
        # Bound total calls. Truncation/multiple matches remain unknown; never
        # interpret an empty or incomplete search as permission to create again.
        matches = []
        complete = False
        for skip in (0, 100):
            page = self.provider.orders_page(booking_id, skip=skip)
            items = page.get('items')
            if not isinstance(items, list) or len(items) > 100 or any(not isinstance(i, dict) for i in items):
                raise RazorpayFailure('payment_response_invalid')
            matches.extend(i for i in items if i.get('receipt') == row['receipt'])
            if len(items) < 100:
                complete = True
                break
        if complete and len(matches) == 1:
            remote_id = identifier(matches[0].get('id'), 'order')
            return self.bind(booking_id, self.provider.order(remote_id))
        return row

    def browser_confirmation(self, request_id, secret, payment_id, signature):
        booking, order = self.authorized(request_id, secret)
        if not order['order_id']:
            raise RuleViolation('Payment setup is still being checked.', 409, 'payment_pending')
        if not verify_checkout(order['order_id'], payment_id, signature, self.provider._secret):
            raise RuleViolation('The payment response could not be verified.', 400, 'payment_signature_invalid')
        remote = self.provider.payment(payment_id)
        return self.observe(booking['id'], payment_id, remote)

    def observe(self, booking_id, payment_id, payment):
        """Only accept authoritative server-fetched facts, never browser payloads.

        Shared finalizer for browser, signed-event processing and recovery. This
        is an internal method and is deliberately not a public API model.
        """
        identifier(payment_id, 'pay')
        if (not isinstance(payment, dict) or payment.get('entity') != 'payment' or
                payment.get('id') != payment_id or type(payment.get('amount')) is not int or
                payment['amount'] <= 0 or not isinstance(payment.get('currency'), str) or
                len(payment['currency']) != 3 or type(payment.get('amount_refunded')) is not int or
                payment['amount_refunded'] < 0 or payment.get('status') not in
                ('created', 'authorized', 'captured', 'refunded', 'failed') or
                type(payment.get('captured')) is not bool):
            raise RazorpayFailure('payment_response_invalid')
        with self.store.transaction(schedule=True) as conn:
            now = self.store.now(conn)
            self.store.expire_holds(conn, now)
            order = conn.execute('SELECT * FROM payment_orders WHERE booking_id=%s FOR UPDATE', (booking_id,)).fetchone()
            self._pinned(order)
            if not order['order_id'] or payment.get('order_id') != order['order_id']:
                raise RazorpayFailure('payment_order_mismatch')
            previous = conn.execute('SELECT * FROM payment_observations WHERE key_id=%s AND payment_id=%s',
                                    (order['key_id'], payment_id)).fetchone()
            if previous and previous['booking_id'] != order['booking_id']:
                raise RazorpayFailure('payment_order_mismatch')
            # A refunded/mismatched or late-payment review cannot later become
            # confirmed because an older capture response arrived out of order.
            if previous and previous['disposition'] == 'review':
                return 'review'
            captured = payment_matches(payment, payment_id=payment_id,
                                       order_id=order['order_id'], amount=order['amount_paise'])
            money_seen = payment['captured'] or payment['amount_refunded'] > 0 or payment['status'] in ('captured', 'refunded')
            if captured:
                # Persist a scoped ledger ID; test/live accounts cannot collide.
                ledger_id = order['key_id'] + ':' + payment_id
                disposition = self.store.confirm_paid(booking_id, ledger_id, payment['amount'], 'INR', _conn=conn)
            elif money_seen:
                disposition = 'review'
                booking = conn.execute('SELECT state FROM bookings WHERE id=%s', (booking_id,)).fetchone()
                if booking['state'] in ('held', 'expired'):
                    conn.execute('DELETE FROM slot_claims WHERE booking_id=%s', (booking_id,))
                    conn.execute("UPDATE bookings SET state='payment_review' WHERE id=%s", (booking_id,))
                self.store.enqueue(conn, 'payment_review', booking_id, now,
                                   suffix=order['key_id'] + ':' + payment_id)
            else:
                disposition = 'pending'
            if previous and previous['disposition'] in ('accepted', 'review'):
                # Stale authorization/failure cannot erase money already seen.
                if not money_seen:
                    return previous['disposition']
            conn.execute("""INSERT INTO payment_observations
                (key_id,payment_id,booking_id,order_id,status,amount_paise,currency,amount_refunded,disposition,observed_at)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                ON CONFLICT (key_id,payment_id) DO UPDATE SET status=excluded.status,
                amount_paise=excluded.amount_paise,currency=excluded.currency,
                amount_refunded=excluded.amount_refunded,disposition=excluded.disposition,observed_at=excluded.observed_at""",
                (order['key_id'], payment_id, booking_id, order['order_id'], payment['status'], payment['amount'],
                 payment['currency'], payment['amount_refunded'], disposition, now))
            return disposition
