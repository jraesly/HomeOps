import uuid
from datetime import datetime

from pydantic import BaseModel

from app.schemas.common import ORMModel


class AreaCreate(BaseModel):
    name: str
    sort_order: int = 0


class AreaUpdate(BaseModel):
    name: str | None = None
    sort_order: int | None = None


class AreaRead(ORMModel):
    id: uuid.UUID
    home_id: uuid.UUID
    name: str
    sort_order: int
    created_at: datetime
    updated_at: datetime
