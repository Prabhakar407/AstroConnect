"""Approved booking rules; pure functions with an explicit clock for boundary tests."""

import hashlib
import json
from datetime import date, datetime, time, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

IST = ZoneInfo("Asia/Kolkata")
UTC = timezone.utc
DURATION_MINUTES = 30
MINIMUM_NOTICE_MINUTES = 30
ADVANCE_DAYS = 10
CLIENT_EMAIL = "astroadvicebyks@gmail.com"
CLIENT_PHONE = "+918527790801"
SLOT_TIMES = ("10:00", "10:30", "11:00", "11:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30")
CATALOGUE = json.loads((Path(__file__).resolve().parents[1] / "data" / "consultationCatalogue.json").read_text())
SERVICES = {item["id"]: item for item in CATALOGUE}


class RuleViolation(ValueError):
    """A safe, customer-readable rejection, not a provider/database error."""

    def __init__(self, message, status=400, code="rule_violation", fields=()):
        super().__init__(message)
        self.status = status
        self.code, self.fields = code, list(fields)


def aware_utc(value):
    if value.tzinfo is None or value.utcoffset() is None:
        raise ValueError("An explicit time zone is required.")
    return value.astimezone(UTC)


def parse_day(value):
    try:
        parsed = date.fromisoformat(value)
        if parsed.isoformat() != value:
            raise ValueError
        return parsed
    except (ValueError, TypeError):
        raise RuleViolation("Please choose a valid date in YYYY-MM-DD format.") from None


def day_slots(day):
    return [datetime.combine(day, time.fromisoformat(slot), IST).astimezone(UTC) for slot in SLOT_TIMES]


def validate_day(value, now, *, booking=True):
    day = parse_day(value)
    today = aware_utc(now).astimezone(IST).date()
    if day < today:
        raise RuleViolation("Please choose today or a future date.")
    if booking and day > today + timedelta(days=ADVANCE_DAYS):
        raise RuleViolation("Appointments can only be booked up to 10 days ahead.")
    return day


def booking_start(day_value, slot, now):
    day = validate_day(day_value, now)
    if day.weekday() == 6:
        raise RuleViolation("Consultations are available Monday to Saturday.")
    if slot not in SLOT_TIMES:
        raise RuleViolation("Please choose an available appointment time.")
    start = datetime.combine(day, time.fromisoformat(slot), IST).astimezone(UTC)
    if start <= aware_utc(now):
        raise RuleViolation("That appointment time has already started. Please choose another.")
    if start < aware_utc(now) + timedelta(minutes=MINIMUM_NOTICE_MINUTES):
        raise RuleViolation("Please choose a later available time.")
    return start


def quote(service_id, question_count=1):
    service = SERVICES.get(service_id)
    if service is None:
        raise RuleViolation("Please choose one of the six consultation services.")
    if type(question_count) is not int or not 1 <= question_count <= 10:
        raise RuleViolation("Please choose between 1 and 10 questions.")
    if not service["per_question"] and question_count != 1:
        raise RuleViolation("A question count only applies to Prashna Kundali.")
    result = {
        "service_id": service_id,
        "service_name": service["title"],
        "question_count": question_count,
        "amount_paise": service["amount_paise"] * question_count,
        "currency": "INR",
        "duration_minutes": DURATION_MINUTES,
    }
    result["quote_version"] = hashlib.sha256(json.dumps(result, sort_keys=True, separators=(",", ":")).encode()).hexdigest()
    return result


def closure_slots(day_value, start_time, end_time, now):
    """A closure covers one day; missing start/end means all its business slots."""
    day = validate_day(day_value, now, booking=False)
    if day.weekday() == 6:
        raise RuleViolation("Sundays are already closed for consultations.")
    slots = day_slots(day)
    if start_time is None and end_time is None:
        return slots
    try:
        start = time.fromisoformat(start_time)
        end = time.fromisoformat(end_time)
        if any(t.tzinfo is not None or t.second or t.microsecond or t.minute not in (0, 30) for t in (start, end)):
            raise ValueError
        if start >= end or start.isoformat(timespec="minutes") != start_time or end.isoformat(timespec="minutes") != end_time:
            raise ValueError
    except (ValueError, TypeError):
        raise RuleViolation("Choose a start and end time on half-hour boundaries.") from None
    selected = [slot for slot in slots if start <= slot.astimezone(IST).time() < end]
    if not selected:
        raise RuleViolation("That range contains no consultation times.")
    if any(slot <= aware_utc(now) for slot in selected):
        raise RuleViolation("Please choose a range containing only future times.")
    return selected
