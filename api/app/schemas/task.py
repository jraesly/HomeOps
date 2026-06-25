import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field

from app.models.enums import Priority, RecurrenceType, TaskStatus, TaskType
from app.schemas.common import ORMModel


class TaskCreate(BaseModel):
    title: str
    description: str | None = None
    task_type: TaskType = TaskType.other
    priority: Priority = Priority.medium
    recurrence_type: RecurrenceType = RecurrenceType.none
    recurrence_interval: int = Field(default=1, ge=1)
    due_date: date | None = None
    estimated_minutes: int | None = Field(default=None, ge=0)
    instructions: str | None = None
    requires_parts: bool = False
    contractor_required: bool = False
    status: TaskStatus = TaskStatus.active


class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    task_type: TaskType | None = None
    priority: Priority | None = None
    recurrence_type: RecurrenceType | None = None
    recurrence_interval: int | None = Field(default=None, ge=1)
    due_date: date | None = None
    estimated_minutes: int | None = Field(default=None, ge=0)
    instructions: str | None = None
    requires_parts: bool | None = None
    contractor_required: bool | None = None
    status: TaskStatus | None = None


class TaskRead(ORMModel):
    id: uuid.UUID
    home_id: uuid.UUID
    device_id: uuid.UUID | None
    title: str
    description: str | None
    task_type: str
    priority: str
    recurrence_type: str
    recurrence_interval: int
    due_date: date | None
    last_completed_at: datetime | None
    estimated_minutes: int | None
    instructions: str | None
    requires_parts: bool
    contractor_required: bool
    status: str
    created_at: datetime
    updated_at: datetime
