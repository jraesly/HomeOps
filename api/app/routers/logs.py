import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.device import Device
from app.models.home import Home
from app.models.maintenance_log import MaintenanceLog
from app.models.maintenance_task import MaintenanceTask
from app.routers.deps import get_or_404
from app.schemas.log import LogCreate, LogRead

router = APIRouter(tags=["logs"])


@router.post(
    "/devices/{device_id}/logs",
    response_model=LogRead,
    status_code=status.HTTP_201_CREATED,
)
def create_device_log(
    device_id: uuid.UUID, payload: LogCreate, db: Session = Depends(get_db)
) -> MaintenanceLog:
    device = get_or_404(db, Device, device_id, "Device")

    if payload.task_id is not None:
        task = get_or_404(db, MaintenanceTask, payload.task_id, "Task")
        if task.device_id != device_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Task belongs to a different device",
            )

    log = MaintenanceLog(
        home_id=device.home_id,
        device_id=device_id,
        task_id=payload.task_id,
        completed_at=payload.completed_at or datetime.now(timezone.utc),
        title=payload.title,
        notes=payload.notes,
        cost_cents=payload.cost_cents,
        performed_by=payload.performed_by,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@router.get("/devices/{device_id}/logs", response_model=list[LogRead])
def list_device_logs(
    device_id: uuid.UUID, db: Session = Depends(get_db)
) -> list[MaintenanceLog]:
    get_or_404(db, Device, device_id, "Device")
    return list(
        db.scalars(
            select(MaintenanceLog)
            .where(MaintenanceLog.device_id == device_id)
            .order_by(MaintenanceLog.completed_at.desc())
        ).all()
    )


@router.get("/homes/{home_id}/logs", response_model=list[LogRead])
def list_home_logs(
    home_id: uuid.UUID, db: Session = Depends(get_db)
) -> list[MaintenanceLog]:
    get_or_404(db, Home, home_id, "Home")
    return list(
        db.scalars(
            select(MaintenanceLog)
            .where(MaintenanceLog.home_id == home_id)
            .order_by(MaintenanceLog.completed_at.desc())
        ).all()
    )
