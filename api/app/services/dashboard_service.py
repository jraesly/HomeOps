from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.enums import Priority, TaskStatus
from app.models.home import Home
from app.models.maintenance_log import MaintenanceLog
from app.models.maintenance_task import MaintenanceTask
from app.schemas.dashboard import Dashboard, DashboardCounts
from app.schemas.log import LogRead
from app.schemas.task import TaskRead

DUE_SOON_DAYS = 14
UPCOMING_DAYS = 60
RECENT_LOG_LIMIT = 10

# Home-health penalty applied per overdue task, weighted by priority.
_OVERDUE_PENALTY = {
    Priority.critical.value: 10,
    Priority.high.value: 5,
    Priority.medium.value: 2,
    Priority.low.value: 1,
}

# Priority ordering used to sort dashboard task lists (higher = more urgent).
_PRIORITY_RANK = {
    Priority.critical.value: 3,
    Priority.high.value: 2,
    Priority.medium.value: 1,
    Priority.low.value: 0,
}


def _sort_key(task: MaintenanceTask) -> tuple[int, date]:
    rank = _PRIORITY_RANK.get(task.priority, 0)
    return (-rank, task.due_date or date.max)


def build_dashboard(db: Session, home: Home, today: date | None = None) -> Dashboard:
    """Assemble the operational dashboard for a home.

    Buckets active tasks into overdue / due-soon / upcoming windows, computes a
    simple home-health score, and lists recently completed logs.
    """
    today = today or date.today()
    soon_cutoff = today + timedelta(days=DUE_SOON_DAYS)
    upcoming_cutoff = today + timedelta(days=UPCOMING_DAYS)

    active_tasks = db.scalars(
        select(MaintenanceTask).where(
            MaintenanceTask.home_id == home.id,
            MaintenanceTask.status == TaskStatus.active.value,
            MaintenanceTask.due_date.is_not(None),
        )
    ).all()

    overdue: list[MaintenanceTask] = []
    due_soon: list[MaintenanceTask] = []
    upcoming: list[MaintenanceTask] = []

    for task in active_tasks:
        due = task.due_date
        if due < today:
            overdue.append(task)
        elif due <= soon_cutoff:
            due_soon.append(task)
        elif due <= upcoming_cutoff:
            upcoming.append(task)

    overdue.sort(key=_sort_key)
    due_soon.sort(key=_sort_key)
    upcoming.sort(key=_sort_key)

    recent_logs = db.scalars(
        select(MaintenanceLog)
        .where(MaintenanceLog.home_id == home.id)
        .order_by(MaintenanceLog.completed_at.desc())
        .limit(RECENT_LOG_LIMIT)
    ).all()

    score = _home_health_score(overdue)

    return Dashboard(
        home_id=str(home.id),
        home_name=home.name,
        home_health_score=score,
        counts=DashboardCounts(
            overdue=len(overdue),
            due_soon=len(due_soon),
            upcoming=len(upcoming),
        ),
        overdue=[TaskRead.model_validate(t) for t in overdue],
        due_soon=[TaskRead.model_validate(t) for t in due_soon],
        upcoming=[TaskRead.model_validate(t) for t in upcoming],
        recently_completed=[LogRead.model_validate(log) for log in recent_logs],
    )


def _home_health_score(overdue_tasks: list[MaintenanceTask]) -> int:
    """100 minus a priority-weighted penalty per overdue task, floored at 0."""
    penalty = sum(
        _OVERDUE_PENALTY.get(task.priority, 1) for task in overdue_tasks
    )
    return max(0, 100 - penalty)
