import uuid

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models.consumable import Consumable
from app.models.device import Device
from app.models.maintenance_log import MaintenanceLog
from app.models.maintenance_task import MaintenanceTask
from app.models.room import Room

PER_CATEGORY_LIMIT = 20


def search_home(db: Session, home_id: uuid.UUID, query: str) -> dict:
    """Case-insensitive search across the home's entities."""
    like = f"%{query}%"

    rooms = db.scalars(
        select(Room)
        .where(
            Room.home_id == home_id,
            or_(Room.name.ilike(like), Room.notes.ilike(like)),
        )
        .order_by(Room.name)
        .limit(PER_CATEGORY_LIMIT)
    ).all()

    devices = db.scalars(
        select(Device)
        .where(
            Device.home_id == home_id,
            or_(
                Device.name.ilike(like),
                Device.manufacturer.ilike(like),
                Device.model_number.ilike(like),
                Device.serial_number.ilike(like),
                Device.notes.ilike(like),
            ),
        )
        .order_by(Device.name)
        .limit(PER_CATEGORY_LIMIT)
    ).all()

    tasks = db.scalars(
        select(MaintenanceTask)
        .where(
            MaintenanceTask.home_id == home_id,
            or_(
                MaintenanceTask.title.ilike(like),
                MaintenanceTask.description.ilike(like),
                MaintenanceTask.instructions.ilike(like),
            ),
        )
        .order_by(MaintenanceTask.due_date)
        .limit(PER_CATEGORY_LIMIT)
    ).all()

    logs = db.scalars(
        select(MaintenanceLog)
        .where(
            MaintenanceLog.home_id == home_id,
            or_(
                MaintenanceLog.title.ilike(like),
                MaintenanceLog.notes.ilike(like),
            ),
        )
        .order_by(MaintenanceLog.completed_at.desc())
        .limit(PER_CATEGORY_LIMIT)
    ).all()

    consumables = db.scalars(
        select(Consumable)
        .where(
            Consumable.home_id == home_id,
            or_(
                Consumable.name.ilike(like),
                Consumable.brand.ilike(like),
                Consumable.category.ilike(like),
                Consumable.notes.ilike(like),
            ),
        )
        .order_by(Consumable.name)
        .limit(PER_CATEGORY_LIMIT)
    ).all()

    return {
        "rooms": list(rooms),
        "devices": list(devices),
        "tasks": list(tasks),
        "logs": list(logs),
        "consumables": list(consumables),
    }
