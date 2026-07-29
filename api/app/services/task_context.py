from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.device import Device
from app.models.maintenance_task import MaintenanceTask
from app.models.room import Room


def attach_task_context(
    db: Session, tasks: Sequence[MaintenanceTask]
) -> Sequence[MaintenanceTask]:
    """Annotate tasks with device_name / room_name for display.

    One batched query for all referenced devices (no N+1); TaskRead picks the
    attributes up via from_attributes. Tasks without a device are left as-is.
    """
    device_ids = {t.device_id for t in tasks if t.device_id is not None}
    if not device_ids:
        return tasks

    rows = db.execute(
        select(Device.id, Device.name, Room.name)
        .outerjoin(Room, Device.room_id == Room.id)
        .where(Device.id.in_(device_ids))
    ).all()
    context = {device_id: (device, room) for device_id, device, room in rows}

    for task in tasks:
        device_name, room_name = context.get(task.device_id, (None, None))
        task.device_name = device_name  # type: ignore[attr-defined]
        task.room_name = room_name  # type: ignore[attr-defined]
    return tasks
