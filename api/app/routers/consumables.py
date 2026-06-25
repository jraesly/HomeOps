import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.consumable import Consumable, TaskConsumable
from app.models.home import Home
from app.models.maintenance_task import MaintenanceTask
from app.routers.deps import get_or_404
from app.schemas.consumable import (
    ConsumableCreate,
    ConsumableRead,
    ConsumableUpdate,
    TaskConsumableCreate,
    TaskConsumableRead,
)

router = APIRouter(tags=["consumables"])


@router.post(
    "/homes/{home_id}/consumables",
    response_model=ConsumableRead,
    status_code=status.HTTP_201_CREATED,
)
def create_consumable(
    home_id: uuid.UUID, payload: ConsumableCreate, db: Session = Depends(get_db)
) -> Consumable:
    get_or_404(db, Home, home_id, "Home")
    consumable = Consumable(home_id=home_id, **payload.model_dump())
    db.add(consumable)
    db.commit()
    db.refresh(consumable)
    return consumable


@router.get("/homes/{home_id}/consumables", response_model=list[ConsumableRead])
def list_consumables(
    home_id: uuid.UUID,
    low_stock: bool = False,
    db: Session = Depends(get_db),
) -> list[Consumable]:
    get_or_404(db, Home, home_id, "Home")
    stmt = select(Consumable).where(Consumable.home_id == home_id)
    if low_stock:
        stmt = stmt.where(
            Consumable.quantity_on_hand <= Consumable.reorder_threshold
        )
    return list(db.scalars(stmt.order_by(Consumable.name)).all())


@router.get("/consumables/{consumable_id}", response_model=ConsumableRead)
def get_consumable(
    consumable_id: uuid.UUID, db: Session = Depends(get_db)
) -> Consumable:
    return get_or_404(db, Consumable, consumable_id, "Consumable")


@router.patch("/consumables/{consumable_id}", response_model=ConsumableRead)
def update_consumable(
    consumable_id: uuid.UUID,
    payload: ConsumableUpdate,
    db: Session = Depends(get_db),
) -> Consumable:
    consumable = get_or_404(db, Consumable, consumable_id, "Consumable")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(consumable, field, value)
    db.commit()
    db.refresh(consumable)
    return consumable


@router.delete(
    "/consumables/{consumable_id}", status_code=status.HTTP_204_NO_CONTENT
)
def delete_consumable(
    consumable_id: uuid.UUID, db: Session = Depends(get_db)
) -> None:
    consumable = get_or_404(db, Consumable, consumable_id, "Consumable")
    db.delete(consumable)
    db.commit()


@router.post(
    "/tasks/{task_id}/consumables",
    response_model=TaskConsumableRead,
    status_code=status.HTTP_201_CREATED,
)
def link_task_consumable(
    task_id: uuid.UUID,
    payload: TaskConsumableCreate,
    db: Session = Depends(get_db),
) -> TaskConsumable:
    task = get_or_404(db, MaintenanceTask, task_id, "Task")
    consumable = get_or_404(db, Consumable, payload.consumable_id, "Consumable")
    if consumable.home_id != task.home_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Consumable belongs to a different home",
        )
    link = TaskConsumable(
        task_id=task_id,
        consumable_id=payload.consumable_id,
        quantity_required=payload.quantity_required,
    )
    db.add(link)
    db.commit()
    db.refresh(link)
    return link


@router.get(
    "/tasks/{task_id}/consumables", response_model=list[TaskConsumableRead]
)
def list_task_consumables(
    task_id: uuid.UUID, db: Session = Depends(get_db)
) -> list[TaskConsumable]:
    get_or_404(db, MaintenanceTask, task_id, "Task")
    return list(
        db.scalars(
            select(TaskConsumable).where(TaskConsumable.task_id == task_id)
        ).all()
    )


@router.delete(
    "/task-consumables/{link_id}", status_code=status.HTTP_204_NO_CONTENT
)
def unlink_task_consumable(
    link_id: uuid.UUID, db: Session = Depends(get_db)
) -> None:
    link = get_or_404(db, TaskConsumable, link_id, "Task consumable")
    db.delete(link)
    db.commit()
