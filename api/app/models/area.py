import uuid

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Area(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "areas"

    home_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("homes.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(255))
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    home: Mapped["Home"] = relationship(back_populates="areas")  # noqa: F821
    rooms: Mapped[list["Room"]] = relationship(  # noqa: F821
        back_populates="area"
    )
