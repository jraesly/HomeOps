import uuid

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Home(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "homes"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE")
    )
    name: Mapped[str] = mapped_column(String(255))
    address: Mapped[str | None] = mapped_column(String(512), nullable=True)
    timezone: Mapped[str] = mapped_column(
        String(64), default="America/New_York"
    )

    areas: Mapped[list["Area"]] = relationship(  # noqa: F821
        back_populates="home",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    rooms: Mapped[list["Room"]] = relationship(  # noqa: F821
        back_populates="home",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    devices: Mapped[list["Device"]] = relationship(  # noqa: F821
        back_populates="home",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
