"""Verified, minimal provider observations. Arrival order never erases evidence."""
import re
import json
from datetime import datetime
from uuid import UUID

from svix.webhooks import Webhook

from .domain import RuleViolation
from .storage import StorageUnavailable

EVENTS = frozenset(('email.sent', 'email.delivered', 'email.delivery_delayed',
                   'email.bounced', 'email.complained', 'email.suppressed', 'email.failed'))


def receive_event(store, secret, body, headers):
    if not secret:
        raise StorageUnavailable('Email delivery updates are not configured.')
    try:
        Webhook(secret).verify(body, dict(headers))
    except Exception:
        raise RuleViolation('This delivery update could not be verified.', 400, 'invalid_signature') from None
    try:
        event = json.loads(body)
        event_id = headers.get('svix-id', '')
        if not re.fullmatch(r'[A-Za-z0-9_-]{1,200}', event_id) or not isinstance(event, dict):
            raise ValueError()
        kind = event['type']
        if kind not in EVENTS:
            return  # Signed but irrelevant event (e.g. tracking) is not retained.
        provider_id = UUID(event['data']['email_id'])
        when = datetime.fromisoformat(event['created_at'].replace('Z', '+00:00'))
        if when.tzinfo is None:
            raise ValueError()
    except (ValueError, TypeError, KeyError, AttributeError):
        raise RuleViolation('This delivery update is incomplete.', 400, 'invalid_event') from None
    with store.transaction() as conn:
        conn.execute('''INSERT INTO email_events(event_id,provider_id,event_type,occurred_at,received_at)
            VALUES (%s,%s,%s,%s,%s) ON CONFLICT(event_id) DO NOTHING''',
            (event_id, provider_id, kind, when, store.now(conn)))
        saved = conn.execute('SELECT provider_id,event_type,occurred_at FROM email_events WHERE event_id=%s', (event_id,)).fetchone()
        if saved != {'provider_id': provider_id, 'event_type': kind, 'occurred_at': when}:
            raise RuleViolation('This delivery update conflicts with an earlier update.', 409, 'event_conflict')


def delivery_label(state, events, error):
    observed = set(events or [])
    for event, label in (('email.complained', 'Reported as spam'), ('email.bounced', 'Bounced'),
                         ('email.suppressed', 'Blocked by email provider'), ('email.failed', 'Delivery failed'),
                         ('email.delivered', 'Delivered to mail server'), ('email.delivery_delayed', 'Delivery delayed'),
                         ('email.sent', 'Accepted for sending')):
        if event in observed:
            return label
    if state == 'sent': return 'Accepted for sending'
    if state == 'failed': return 'Needs checking'
    if error in ('email_allowance', 'daily_quota_exceeded', 'monthly_quota_exceeded'):
        return 'Waiting for email allowance'
    return 'Waiting to send'
