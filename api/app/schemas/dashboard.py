from pydantic import BaseModel

from app.schemas.device import DeviceRead
from app.schemas.log import LogRead
from app.schemas.task import TaskRead


class DashboardCounts(BaseModel):
    overdue: int
    due_soon: int
    upcoming: int


class Dashboard(BaseModel):
    home_id: str
    home_name: str
    home_health_score: int
    counts: DashboardCounts
    overdue: list[TaskRead]
    due_soon: list[TaskRead]
    upcoming: list[TaskRead]
    needs_attention: list[DeviceRead]
    recently_completed: list[LogRead]
