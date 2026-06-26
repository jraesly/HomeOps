import uuid
from datetime import datetime

from pydantic import BaseModel

from app.schemas.common import ORMModel
from app.schemas.consumable import ConsumableRead
from app.schemas.device import DeviceRead
from app.schemas.log import LogRead
from app.schemas.room import RoomRead
from app.schemas.task import TaskRead


class HomeEventRead(ORMModel):
    id: uuid.UUID
    home_id: uuid.UUID
    device_id: uuid.UUID | None
    entity_type: str
    entity_id: uuid.UUID | None
    event_type: str
    title: str
    description: str | None
    occurred_at: datetime
    created_at: datetime


class SearchResults(BaseModel):
    query: str
    rooms: list[RoomRead]
    devices: list[DeviceRead]
    tasks: list[TaskRead]
    logs: list[LogRead]
    consumables: list[ConsumableRead]
