import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import Priority, RecurrenceType, TaskStatus, TaskType


class MaintenanceTask(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "maintenance_tasks"

    home_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("homes.id", ondelete="CASCADE")
    )
    device_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("devices.id", ondelete="SET NULL"), nullable=True
    )
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    task_type: Mapped[str] = mapped_column(
        String(32), default=TaskType.other.value
    )
    priority: Mapped[str] = mapped_column(
        String(16), default=Priority.medium.value
    )
    recurrence_type: Mapped[str] = mapped_column(
        String(16), default=RecurrenceType.none.value
    )
    recurrence_interval: Mapped[int] = mapped_column(Integer, default=1)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    last_completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    estimated_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    instructions: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(16), default=TaskStatus.active.value
    )

    device: Mapped["Device | None"] = relationship(  # noqa: F821
        back_populates="tasks"
    )
    logs: Mapped[list["MaintenanceLog"]] = relationship(  # noqa: F821
        back_populates="task"
    )
