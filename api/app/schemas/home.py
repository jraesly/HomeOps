import uuid
from datetime import datetime

from pydantic import BaseModel

from app.schemas.common import ORMModel


class HomeCreate(BaseModel):
    name: str
    address: str | None = None
    timezone: str = "America/New_York"


class HomeUpdate(BaseModel):
    name: str | None = None
    address: str | None = None
    timezone: str | None = None


class HomeRead(ORMModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    address: str | None
    timezone: str
    created_at: datetime
    updated_at: datetime
