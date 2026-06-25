import uuid
from datetime import date, datetime

from pydantic import BaseModel

from app.models.enums import DeviceStatus, DeviceType
from app.schemas.common import ORMModel


class DeviceCreate(BaseModel):
    name: str
    device_type: DeviceType = DeviceType.other
    room_id: uuid.UUID | None = None
    manufacturer: str | None = None
    model_number: str | None = None
    serial_number: str | None = None
    install_date: date | None = None
    purchase_date: date | None = None
    warranty_end_date: date | None = None
    status: DeviceStatus = DeviceStatus.active
    notes: str | None = None


class DeviceUpdate(BaseModel):
    name: str | None = None
    device_type: DeviceType | None = None
    room_id: uuid.UUID | None = None
    manufacturer: str | None = None
    model_number: str | None = None
    serial_number: str | None = None
    install_date: date | None = None
    purchase_date: date | None = None
    warranty_end_date: date | None = None
    status: DeviceStatus | None = None
    notes: str | None = None


class DeviceRead(ORMModel):
    id: uuid.UUID
    home_id: uuid.UUID
    room_id: uuid.UUID | None
    name: str
    device_type: str
    manufacturer: str | None
    model_number: str | None
    serial_number: str | None
    install_date: date | None
    purchase_date: date | None
    warranty_end_date: date | None
    status: str
    notes: str | None
    created_at: datetime
    updated_at: datetime
