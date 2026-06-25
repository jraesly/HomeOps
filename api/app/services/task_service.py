import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.consumable import TaskConsumable
from app.models.enums import RecurrenceType, TaskStatus
from app.models.maintenance_log import MaintenanceLog
from app.models.maintenance_task import MaintenanceTask
from app.schemas.task_completion import TaskCompletion
from app.services.recurrence import calculate_next_due_date


def complete_task(
    db: Session, task_id: uuid.UUID, payload: TaskCompletion
) -> tuple[MaintenanceTask, MaintenanceLog]:
    """Complete a maintenance task.

    1. Load the task
    2. Validate that it is active
    3. Create a MaintenanceLog
    4. Set ``last_completed_at``
    5. Calculate and store the next due date
    6. Return the updated task plus the created log
    """
    task = db.get(MaintenanceTask, task_id)
    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
        )

    if task.status not in (
        TaskStatus.active.value,
        TaskStatus.completed_once.value,
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Task is not active (status: {task.status})",
        )

    completed_at = payload.completed_at or datetime.now(timezone.utc)

    log = MaintenanceLog(
        home_id=task.home_id,
        device_id=task.device_id,
        task_id=task.id,
        completed_at=completed_at,
        title=payload.title or task.title,
        notes=payload.notes,
        cost_cents=payload.cost_cents,
        performed_by=payload.performed_by,
    )
    db.add(log)

    task.last_completed_at = completed_at

    if payload.deduct_inventory:
        _deduct_consumables(db, task.id)

    next_due = calculate_next_due_date(
        completed_at.date(), task.recurrence_type, task.recurrence_interval
    )
    task.due_date = next_due

    # A non-recurring task is finished once completed; a recurring task rolls
    # forward to its next due date and stays active.
    if task.recurrence_type == RecurrenceType.none.value:
        task.status = TaskStatus.completed_once.value
    else:
        task.status = TaskStatus.active.value

    db.commit()
    db.refresh(task)
    db.refresh(log)
    return task, log


def _deduct_consumables(db: Session, task_id: uuid.UUID) -> None:
    """Decrement on-hand inventory for each consumable linked to the task."""
    links = db.scalars(
        select(TaskConsumable).where(TaskConsumable.task_id == task_id)
    ).all()
    for link in links:
        consumable = link.consumable
        consumable.quantity_on_hand = max(
            0, consumable.quantity_on_hand - link.quantity_required
        )
