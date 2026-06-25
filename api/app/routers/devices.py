import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.device import Device
from app.models.home import Home
from app.models.room import Room
from app.routers.deps import get_or_404
from app.schemas.device import DeviceCreate, DeviceRead, DeviceUpdate

router = APIRouter(tags=["devices"])


def _validate_room(db: Session, home_id: uuid.UUID, room_id: uuid.UUID | None) -> None:
    if room_id is None:
        return
    room = get_or_404(db, Room, room_id, "Room")
    if room.home_id != home_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Room belongs to a different home",
        )


@router.post(
    "/rooms/{room_id}/devices",
    response_model=DeviceRead,
    status_code=status.HTTP_201_CREATED,
)
def create_device_in_room(
    room_id: uuid.UUID, payload: DeviceCreate, db: Session = Depends(get_db)
) -> Device:
    room = get_or_404(db, Room, room_id, "Room")
    data = payload.model_dump()
    data["room_id"] = room_id
    device = Device(home_id=room.home_id, **data)
    db.add(device)
    db.commit()
    db.refresh(device)
    return device


@router.post(
    "/homes/{home_id}/devices",
    response_model=DeviceRead,
    status_code=status.HTTP_201_CREATED,
)
def create_device_in_home(
    home_id: uuid.UUID, payload: DeviceCreate, db: Session = Depends(get_db)
) -> Device:
    get_or_404(db, Home, home_id, "Home")
    _validate_room(db, home_id, payload.room_id)
    device = Device(home_id=home_id, **payload.model_dump())
    db.add(device)
    db.commit()
    db.refresh(device)
    return device


@router.get("/homes/{home_id}/devices", response_model=list[DeviceRead])
def list_devices(home_id: uuid.UUID, db: Session = Depends(get_db)) -> list[Device]:
    get_or_404(db, Home, home_id, "Home")
    return list(
        db.scalars(
            select(Device).where(Device.home_id == home_id).order_by(Device.name)
        ).all()
    )


@router.get("/devices/{device_id}", response_model=DeviceRead)
def get_device(device_id: uuid.UUID, db: Session = Depends(get_db)) -> Device:
    return get_or_404(db, Device, device_id, "Device")


@router.patch("/devices/{device_id}", response_model=DeviceRead)
def update_device(
    device_id: uuid.UUID, payload: DeviceUpdate, db: Session = Depends(get_db)
) -> Device:
    device = get_or_404(db, Device, device_id, "Device")
    data = payload.model_dump(exclude_unset=True)
    if "room_id" in data:
        _validate_room(db, device.home_id, data["room_id"])
    for field, value in data.items():
        setattr(device, field, value)
    db.commit()
    db.refresh(device)
    return device


@router.delete("/devices/{device_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_device(device_id: uuid.UUID, db: Session = Depends(get_db)) -> None:
    device = get_or_404(db, Device, device_id, "Device")
    db.delete(device)
    db.commit()
