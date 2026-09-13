"""Bounded, authenticated appointment views for the studio page."""

import re
from datetime import date

from .domain import RuleViolation


def _condition(view, now):
    if view == "upcoming":
        return "b.state='confirmed' AND b.starts_at>=%s", [now], "b.starts_at ASC,b.id ASC", ">"
    if view == "past":
        return "b.state='confirmed' AND b.starts_at<%s", [now], "b.starts_at DESC,b.id DESC", "<"
    if view == "cancelled":
        return "b.state='cancelled'", [], "b.cancelled_at DESC NULLS LAST,b.id DESC", "<"
    raise RuleViolation("Please choose upcoming, past or cancelled appointments.", 400, "invalid_booking_view")


def page(store, view="upcoming", before=None):
    """Return at most 25 appointments and a stable cursor; never expose receipts."""
    with store.transaction() as conn:
        now = store.now(conn)
        where, args, order, direction = _condition(view, now)
        cursor_column = "b.cancelled_at" if view == "cancelled" else "b.starts_at"
        if before:
            cursor = conn.execute(
                f"SELECT {cursor_column} AS position,id FROM bookings b WHERE id=%s AND {where}",
                [before, *args],
            ).fetchone()
            if not cursor or cursor["position"] is None:
                raise RuleViolation("Please refresh the appointment list.", 400, "invalid_booking_cursor")
            where += f" AND ({cursor_column},b.id){direction}(%s,%s)"
            args += [cursor["position"], cursor["id"]]
        rows = conn.execute(
            f"""SELECT b.id,b.service_id,b.service_name,b.question_count,b.amount_paise,b.currency,
                b.duration_minutes,b.starts_at,b.full_name,b.email,b.phone,b.birth_date,b.birth_time,
                b.birth_place,b.notes,b.state,b.created_at,b.cancelled_at,
                accepted.payment_id AS payment_reference,po.order_id AS payment_order_reference,
                CASE WHEN accepted.payment_id IS NOT NULL THEN 'received' ELSE 'not_received' END AS payment_state,
                ce.state AS calendar_state,ce.meet_url
                FROM bookings b
                LEFT JOIN LATERAL (
                    SELECT payment_id FROM (
                        SELECT payment_id,received_at FROM payments
                        WHERE booking_id=b.id AND disposition='accepted'
                        UNION ALL
                        SELECT payment_id,observed_at AS received_at FROM payment_observations
                        WHERE booking_id=b.id AND disposition='accepted'
                    ) paid ORDER BY received_at DESC LIMIT 1
                ) accepted ON true
                LEFT JOIN payment_orders po ON po.booking_id=b.id
                LEFT JOIN booking_calendar_events ce ON ce.booking_id=b.id
                WHERE {where} ORDER BY {order} LIMIT 26""",
            args,
        ).fetchall()
        items = rows[:25]
        return {
            "items": items,
            "next_cursor": str(items[-1]["id"]) if len(rows) > 25 else None,
        }


def booking_days(store, month):
    """Return confirmed-booking counts for one calendar month in India time."""
    if not isinstance(month, str) or not re.fullmatch(r"\d{4}-(0[1-9]|1[0-2])", month):
        raise RuleViolation("Please choose a valid calendar month.", 400, "invalid_calendar_month")
    start = date.fromisoformat(month + "-01")
    end = date(start.year + (start.month == 12), 1 if start.month == 12 else start.month + 1, 1)
    with store.transaction() as conn:
        rows = conn.execute(
            """SELECT (starts_at AT TIME ZONE 'Asia/Kolkata')::date AS day,count(*)::integer AS count
                FROM bookings WHERE state='confirmed'
                AND (starts_at AT TIME ZONE 'Asia/Kolkata')::date >= %s
                AND (starts_at AT TIME ZONE 'Asia/Kolkata')::date < %s
                GROUP BY day ORDER BY day""",
            (start, end),
        ).fetchall()
    return {"month": month, "days": {row["day"].isoformat(): row["count"] for row in rows}}
