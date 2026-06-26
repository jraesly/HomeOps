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


def test_daily() -> None:
    assert calculate_next_due_date(date(2026, 1, 1), "daily", 3) == date(
        2026, 1, 4
    )


def test_seasonal_is_three_months() -> None:
    assert calculate_next_due_date(date(2026, 1, 15), "seasonal", 1) == date(
        2026, 4, 15
    )


def test_invalid_recurrence_type_returns_none() -> None:
    assert calculate_next_due_date(date(2026, 1, 1), "bogus", 1) is None


def test_interval_below_one_is_clamped() -> None:
    # interval 0 is treated as 1, not "same day".
    assert calculate_next_due_date(date(2026, 1, 1), "monthly", 0) == date(
        2026, 2, 1
    )


def test_leap_day_into_non_leap_year_clamps() -> None:
    # Feb 29, 2024 + 1 year clamps to Feb 28, 2025.
    assert calculate_next_due_date(date(2024, 2, 29), "yearly", 1) == date(
        2025, 2, 28
    )
