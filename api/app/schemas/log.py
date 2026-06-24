import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


class LogCreate(BaseModel):
    title: str
    completed_at: datetime | None = None
    notes: str | None = None
    cost_cents: int | None = Field(default=None, ge=0)
    performed_by: str | None = None
    task_id: uuid.UUID | None = None


class LogRead(ORMModel):
    id: uuid.UUID
    home_id: uuid.UUID
    device_id: uuid.UUID | None
    task_id: uuid.UUID | None
    completed_at: datetime
    title: str
    notes: str | None
    cost_cents: int | None
    performed_by: str | None
    created_at: datetime
    updated_at: datetime
