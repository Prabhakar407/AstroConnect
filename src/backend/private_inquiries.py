"""Small authenticated inbox queries; never expose raw rows or receipt secrets."""
from .domain import RuleViolation
from .email_events import delivery_label

PROBLEM_EVENTS = ['email.bounced','email.complained','email.suppressed','email.failed','email.delivery_delayed']


def page(store, before=None, attention=False):
    with store.transaction() as conn:
        cursor = None
        if before:
            cursor = conn.execute('SELECT created_at,id FROM inquiries WHERE id=%s', (before,)).fetchone()
            if not cursor:
                raise RuleViolation('Please refresh the inquiry list.', 400)
        conditions, args = [], []
        if cursor:
            conditions.append('(i.created_at,i.id)<(%s,%s)')
            args += [cursor['created_at'], cursor['id']]
        if attention:
            conditions.append('''EXISTS (SELECT 1 FROM delivery_jobs j WHERE j.kind='inquiry_received'
                AND j.record_id=i.id AND (j.state='failed' OR j.last_error_code IS NOT NULL
                OR (j.state IN ('pending','processing') AND j.created_at < %s)
                OR EXISTS (SELECT 1 FROM email_events e WHERE e.provider_id=j.provider_id
                   AND (e.event_type=ANY(%s) AND (e.event_type<>'email.delivery_delayed' OR NOT EXISTS (
                     SELECT 1 FROM email_events d WHERE d.provider_id=j.provider_id AND d.event_type='email.delivered'))))))''')
            from datetime import timedelta
            args += [store.now(conn) - timedelta(hours=1), PROBLEM_EVENTS]
        where = ' WHERE ' + ' AND '.join(conditions) if conditions else ''
        rows = conn.execute('SELECT i.id,i.name,i.source,i.subject,i.created_at,i.seen_at FROM inquiries i' + where +
                            ' ORDER BY i.created_at DESC,i.id DESC LIMIT 26', args).fetchall()
        return {'items': rows[:25], 'next_cursor': str(rows[24]['id']) if len(rows)>25 else None}


def detail(store, inquiry_id):
    with store.transaction() as conn:
        row = conn.execute('''SELECT id,name,email,phone,dob,subject,message,location,source,created_at,seen_at
            FROM inquiries WHERE id=%s''', (inquiry_id,)).fetchone()
        if not row:
            raise RuleViolation('Inquiry not found.', 404)
        jobs = conn.execute('''SELECT j.recipient_role,j.state,j.last_error_code,
            ARRAY(SELECT DISTINCT e.event_type FROM email_events e WHERE e.provider_id=j.provider_id) AS events
            FROM delivery_jobs j WHERE j.record_id=%s AND j.kind='inquiry_received'
            ORDER BY j.recipient_role,j.message_version DESC''', (inquiry_id,)).fetchall()
        row['notifications'] = [{'recipient': j['recipient_role'],
                                 'status': delivery_label(j['state'],j['events'],j['last_error_code'])} for j in jobs]
        return row


def mark_seen(store, inquiry_id, actor):
    with store.transaction() as conn:
        row = conn.execute('''UPDATE inquiries SET seen_at=COALESCE(seen_at,%s),seen_by=COALESCE(seen_by,%s)
            WHERE id=%s RETURNING id''', (store.now(conn), actor, inquiry_id)).fetchone()
        if not row:
            raise RuleViolation('Inquiry not found.', 404)
