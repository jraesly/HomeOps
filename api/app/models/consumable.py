import uuid

from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Consumable(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "consumables"

    home_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("homes.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(255))
    category: Mapped[str | None] = mapped_column(String(64), nullable=True)
    sku: Mapped[str | None] = mapped_column(String(128), nullable=True)
    brand: Mapped[str | None] = mapped_column(String(255), nullable=True)
    size: Mapped[str | None] = mapped_column(String(128), nullable=True)
    quantity_on_hand: Mapped[int] = mapped_column(Integer, default=0)
    reorder_threshold: Mapped[int] = mapped_column(Integer, default=0)
    preferred_vendor: Mapped[str | None] = mapped_column(String(255), nullable=True)
    reorder_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)


class TaskConsumable(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Links a maintenance task to a consumable it uses, and how much."""

    __tablename__ = "task_consumables"

    task_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("maintenance_tasks.id", ondelete="CASCADE"), index=True
    )
    consumable_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("consumables.id", ondelete="CASCADE"), index=True
    )
    quantity_required: Mapped[int] = mapped_column(Integer, default=1)

    consumable: Mapped["Consumable"] = relationship()
