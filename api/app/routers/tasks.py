import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.device import Device
from app.models.enums import EventType
from app.models.home import Home
from app.models.maintenance_task import MaintenanceTask
from app.routers.deps import get_or_404
from app.schemas.log import LogRead
from app.schemas.task import TaskCreate, TaskRead, TaskUpdate
from app.schemas.task_completion import TaskCompletion, TaskCompletionResult
from app.services.event_service import record_event
from app.services.task_service import complete_task

router = APIRouter(tags=["tasks"])


@router.post(
    "/devices/{device_id}/tasks",
    response_model=TaskRead,
    status_code=status.HTTP_201_CREATED,
)
def create_task(
    device_id: uuid.UUID, payload: TaskCreate, db: Session = Depends(get_db)
) -> MaintenanceTask:
    device = get_or_404(db, Device, device_id, "Device")
    task = MaintenanceTask(
        home_id=device.home_id, device_id=device_id, **payload.model_dump()
    )
    db.add(task)
    db.flush()
    record_event(
        db,
        home_id=task.home_id,
        event_type=EventType.task_created,
        entity_type="task",
        entity_id=task.id,
        device_id=device_id,
        title=f"Added task: {task.title}",
        occurred_at=datetime.now(timezone.utc),
    )
    db.commit()
    db.refresh(task)
    return task


@router.get("/homes/{home_id}/tasks", response_model=list[TaskRead])
def list_home_tasks(
    home_id: uuid.UUID, db: Session = Depends(get_db)
) -> list[MaintenanceTask]:
    get_or_404(db, Home, home_id, "Home")
    return list(
        db.scalars(
            select(MaintenanceTask)
            .where(MaintenanceTask.home_id == home_id)
            .order_by(MaintenanceTask.due_date)
        ).all()
    )


@router.get("/devices/{device_id}/tasks", response_model=list[TaskRead])
def list_device_tasks(
    device_id: uuid.UUID, db: Session = Depends(get_db)
) -> list[MaintenanceTask]:
    get_or_404(db, Device, device_id, "Device")
    return list(
        db.scalars(
            select(MaintenanceTask)
            .where(MaintenanceTask.device_id == device_id)
            .order_by(MaintenanceTask.due_date)
        ).all()
    )


@router.get("/tasks/{task_id}", response_model=TaskRead)
def get_task(task_id: uuid.UUID, db: Session = Depends(get_db)) -> MaintenanceTask:
    return get_or_404(db, MaintenanceTask, task_id, "Task")


@router.patch("/tasks/{task_id}", response_model=TaskRead)
def update_task(
    task_id: uuid.UUID, payload: TaskUpdate, db: Session = Depends(get_db)
) -> MaintenanceTask:
    task = get_or_404(db, MaintenanceTask, task_id, "Task")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(task, field, value)
    db.commit()
    db.refresh(task)
    return task


@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: uuid.UUID, db: Session = Depends(get_db)) -> None:
    task = get_or_404(db, MaintenanceTask, task_id, "Task")
    db.delete(task)
    db.commit()


@router.post("/tasks/{task_id}/complete", response_model=TaskCompletionResult)
def complete_task_endpoint(
    task_id: uuid.UUID,
    payload: TaskCompletion | None = None,
    db: Session = Depends(get_db),
) -> TaskCompletionResult:
    task, log = complete_task(db, task_id, payload or TaskCompletion())
    return TaskCompletionResult(
        task=TaskRead.model_validate(task), log=LogRead.model_validate(log)
    )
