import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class HomeEvent(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """An entry in the home's activity timeline (the house's "memory")."""

    __tablename__ = "home_events"

    home_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("homes.id", ondelete="CASCADE"), index=True
    )
    # Optional device association so a device-specific timeline is a cheap query.
    device_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("devices.id", ondelete="SET NULL"), nullable=True, index=True
    )
    entity_type: Mapped[str] = mapped_column(String(32))
    entity_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, nullable=True)
    event_type: Mapped[str] = mapped_column(String(32))
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
