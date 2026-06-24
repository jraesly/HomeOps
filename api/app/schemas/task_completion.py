from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.log import LogRead
from app.schemas.task import TaskRead


class TaskCompletion(BaseModel):
    """Payload sent when completing a maintenance task."""

    completed_at: datetime | None = None
    notes: str | None = None
    cost_cents: int | None = Field(default=None, ge=0)
    performed_by: str | None = None
    title: str | None = None


class TaskCompletionResult(BaseModel):
    task: TaskRead
    log: LogRead
