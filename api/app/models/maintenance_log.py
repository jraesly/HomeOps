import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class MaintenanceLog(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "maintenance_logs"

    home_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("homes.id", ondelete="CASCADE")
    )
    device_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("devices.id", ondelete="SET NULL"), nullable=True
    )
    task_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("maintenance_tasks.id", ondelete="SET NULL"), nullable=True
    )
    completed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    title: Mapped[str] = mapped_column(String(255))
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    cost_cents: Mapped[int | None] = mapped_column(Integer, nullable=True)
    performed_by: Mapped[str | None] = mapped_column(String(255), nullable=True)

    device: Mapped["Device | None"] = relationship(  # noqa: F821
        back_populates="logs"
    )
    task: Mapped["MaintenanceTask | None"] = relationship(  # noqa: F821
        back_populates="logs"
    )
