from datetime import date

from app.services.recurrence import calculate_next_due_date


def test_none_returns_null() -> None:
    assert calculate_next_due_date(date(2026, 1, 1), "none", 1) is None


def test_monthly_interval_one() -> None:
    assert calculate_next_due_date(date(2026, 1, 15), "monthly", 1) == date(
        2026, 2, 15
    )


def test_monthly_interval_three() -> None:
    assert calculate_next_due_date(date(2026, 1, 15), "monthly", 3) == date(
        2026, 4, 15
    )


def test_yearly_interval_one() -> None:
    assert calculate_next_due_date(date(2026, 3, 1), "yearly", 1) == date(
        2027, 3, 1
    )


def test_custom_days() -> None:
    assert calculate_next_due_date(date(2026, 1, 1), "custom_days", 90) == date(
        2026, 4, 1
    )


def test_weekly() -> None:
    assert calculate_next_due_date(date(2026, 1, 1), "weekly", 2) == date(
        2026, 1, 15
    )


def test_quarterly() -> None:
    assert calculate_next_due_date(date(2026, 1, 31), "quarterly", 1) == date(
        2026, 4, 30
    )


def test_month_end_clamps() -> None:
    # Jan 31 + 1 month clamps to the last day of February.
    assert calculate_next_due_date(date(2026, 1, 31), "monthly", 1) == date(
        2026, 2, 28
    )
