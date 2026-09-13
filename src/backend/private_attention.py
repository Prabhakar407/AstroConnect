"""Small private work list for payment and booking-delivery exceptions."""

from .domain import RuleViolation


def overview(store):
    with store.transaction() as conn:
        cases = conn.execute('''SELECT c.id,c.kind,c.created_at,b.id AS booking_id,b.full_name,b.email,b.phone,
            b.service_name,b.amount_paise,b.starts_at,b.state AS booking_state
            FROM payment_cases c JOIN bookings b ON b.id=c.booking_id
            WHERE c.state='open' ORDER BY c.created_at,id LIMIT 100''').fetchall()
        delivery = conn.execute('''SELECT j.id,j.kind,j.recipient_role,j.last_error_code,j.next_attempt_at,j.attempts,
            b.id AS booking_id,b.full_name,b.service_name,b.starts_at
            FROM delivery_jobs j JOIN bookings b ON b.id=j.record_id
            WHERE j.kind IN ('booking_confirmed','booking_cancelled','payment_review')
            AND j.state='failed' ORDER BY j.next_attempt_at,j.id LIMIT 100''').fetchall()
        payment_events = conn.execute('''SELECT j.id,e.event_id,e.kind,e.payment_id,e.last_error,
            e.received_at,e.next_attempt_at,e.attempts
            FROM delivery_jobs j JOIN payment_events e ON e.record_id=j.record_id
            WHERE j.kind='payment_event' AND j.state='failed' AND e.processed_at IS NULL
            ORDER BY e.received_at,e.event_id LIMIT 100''').fetchall()
    return {
        'payment_cases': [{**row, 'id': str(row['id']), 'booking_id': str(row['booking_id']),
                           'created_at': row['created_at'].isoformat(), 'starts_at': row['starts_at'].isoformat()}
                          for row in cases],
        'delivery_problems': [{**row, 'id': str(row['id']), 'booking_id': str(row['booking_id']),
                               'next_attempt_at': row['next_attempt_at'].isoformat(),
                               'starts_at': row['starts_at'].isoformat()} for row in delivery],
        'payment_event_problems': [{**row, 'id': str(row['id']),
                                    'received_at': row['received_at'].isoformat(),
                                    'next_attempt_at': row['next_attempt_at'].isoformat()}
                                   for row in payment_events],
    }


def pending_count(store):
    """Return only a count for the independent scheduled health check."""
    with store.transaction() as conn:
        row = conn.execute('''SELECT
            (SELECT count(*) FROM payment_cases WHERE state='open') +
            (SELECT count(*) FROM delivery_jobs WHERE state='failed' AND kind IN
                ('payment_event','booking_confirmed','booking_cancelled','payment_review')) AS total''').fetchone()
    return row['total']


def handle_case(store, case_id, actor, resolution, note):
    with store.transaction() as conn:
        row = conn.execute('SELECT state FROM payment_cases WHERE id=%s FOR UPDATE', (case_id,)).fetchone()
        if not row:
            raise RuleViolation('This payment item was not found.', 404, 'payment_case_missing')
        if row['state'] == 'handled':
            return
        conn.execute('''UPDATE payment_cases SET state='handled',handled_at=%s,handled_by=%s,
            resolution=%s,note=%s WHERE id=%s''', (store.now(conn), actor, resolution, note, case_id))


def retry_delivery(store, job_id):
    with store.transaction() as conn:
        job = conn.execute('''SELECT * FROM delivery_jobs WHERE id=%s FOR UPDATE''', (job_id,)).fetchone()
        if not job or job['kind'] not in ('payment_event', 'booking_confirmed', 'booking_cancelled', 'payment_review'):
            raise RuleViolation('This delivery item was not found.', 404, 'delivery_case_missing')
        if job['provider_id']:
            conn.execute("UPDATE delivery_jobs SET state='sent',last_error_code=NULL WHERE id=%s", (job_id,))
            return {'record_id': job['record_id'], 'kind': job['kind'], 'republish': False}
        now = store.now(conn)
        conn.execute('''UPDATE delivery_jobs SET state='pending',attempts=0,next_attempt_at=%s,
            dispatch_after=%s,dispatch_token=NULL,dispatch_error=NULL,last_error_code=NULL,
            lease_token=NULL,lease_until=NULL WHERE id=%s''', (now, now, job_id))
        if job['kind'] == 'payment_event':
            conn.execute('''UPDATE payment_events SET attempts=0,next_attempt_at=%s,last_error=NULL
                WHERE record_id=%s AND processed_at IS NULL''', (now, job['record_id']))
        return {'record_id': job['record_id'], 'kind': job['kind'], 'republish': True}
