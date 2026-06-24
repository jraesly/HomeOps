from calendar import monthrange
from datetime import date, timedelta

from app.models.enums import RecurrenceType

# Recurrence types that translate into a fixed number of months per interval.
_MONTHS_PER_INTERVAL = {
    RecurrenceType.monthly: 1,
    RecurrenceType.quarterly: 3,
    RecurrenceType.seasonal: 3,
    RecurrenceType.yearly: 12,
}


def _add_months(start: date, months: int) -> date:
    """Add a number of months to a date, clamping to the month's last day."""
    month_index = start.month - 1 + months
    year = start.year + month_index // 12
    month = month_index % 12 + 1
    last_day = monthrange(year, month)[1]
    return date(year, month, min(start.day, last_day))


def calculate_next_due_date(
    completed_at: date,
    recurrence_type: str,
    recurrence_interval: int,
) -> date | None:
    """Compute the next due date for a recurring task.

    Returns ``None`` for non-recurring tasks. A V1 implementation: simple
    day/week/month/year arithmetic, no RRULE support.
    """
    interval = max(1, recurrence_interval)

    try:
        recurrence = RecurrenceType(recurrence_type)
    except ValueError:
        return None

    if recurrence == RecurrenceType.none:
        return None
    if recurrence == RecurrenceType.daily:
        return completed_at + timedelta(days=interval)
    if recurrence == RecurrenceType.weekly:
        return completed_at + timedelta(days=interval * 7)
    if recurrence == RecurrenceType.custom_days:
        return completed_at + timedelta(days=interval)

    months = _MONTHS_PER_INTERVAL.get(recurrence)
    if months is not None:
        return _add_months(completed_at, months * interval)

    return None
