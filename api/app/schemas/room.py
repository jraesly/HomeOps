import uuid
from datetime import datetime

from pydantic import BaseModel

from app.schemas.common import ORMModel


class RoomCreate(BaseModel):
    name: str
    area_id: uuid.UUID | None = None
    room_type: str | None = None
    notes: str | None = None


class RoomUpdate(BaseModel):
    name: str | None = None
    area_id: uuid.UUID | None = None
    room_type: str | None = None
    notes: str | None = None


class RoomRead(ORMModel):
    id: uuid.UUID
    home_id: uuid.UUID
    area_id: uuid.UUID | None
    name: str
    room_type: str | None
    notes: str | None
    created_at: datetime
    updated_at: datetime
