"""Shared Free-plan daily allowance, independent of API key and deployment.

Reservations count conservatively even when a provider result is uncertain.
Resend remains authoritative for monthly usage and traffic outside this database.
"""
from datetime import timedelta, timezone

DAILY_LIMIT = 100
VERIFICATION_LIMIT = 80  # Leave 20 for already-saved inquiry/booking notifications.
TOTAL_KEY = 'resend:daily:all'
VERIFICATION_KEY = 'resend:daily:verification'


def reserve_email(conn, clock, *, verification=False):
    """Return None on reservation, or next UTC midnight when unavailable.

    Caller commits before sending. One shared row serializes both sender paths;
    locks are released before any provider call. No credentials are stored here.
    """
    # count must be positive in the existing rate_limits schema. An absent row
    # is locked via a stable advisory lock until its first reservation is saved.
    conn.execute('SELECT pg_advisory_xact_lock(83124020)')
    # Read time AFTER the shared lock: a request waiting across midnight must
    # not restore yesterday's expiry over a newer counter.
    now = clock(conn).astimezone(timezone.utc)
    reset = now.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
    rows = {row['key']: row for row in conn.execute(
        'SELECT key,count,resets_at FROM rate_limits WHERE key IN (%s,%s) FOR UPDATE',
        (TOTAL_KEY, VERIFICATION_KEY))}
    def used(key):
        row = rows.get(key)
        return row['count'] if row and row['resets_at'] > now else 0
    if used(TOTAL_KEY) >= DAILY_LIMIT or (verification and used(VERIFICATION_KEY) >= VERIFICATION_LIMIT):
        return reset
    for key in ((TOTAL_KEY, VERIFICATION_KEY) if verification else (TOTAL_KEY,)):
        conn.execute('''INSERT INTO rate_limits(key,count,resets_at) VALUES (%s,%s,%s)
            ON CONFLICT(key) DO UPDATE SET count=EXCLUDED.count,resets_at=EXCLUDED.resets_at''',
            (key, used(key) + 1, reset))
    return None
