import uuid
from datetime import date

from sqlalchemy import Date, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import DeviceStatus, DeviceType


class Device(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "devices"

    home_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("homes.id", ondelete="CASCADE"), index=True
    )
    room_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("rooms.id", ondelete="SET NULL"), nullable=True, index=True
    )
    name: Mapped[str] = mapped_column(String(255))
    device_type: Mapped[str] = mapped_column(
        String(32), default=DeviceType.other.value
    )
    manufacturer: Mapped[str | None] = mapped_column(String(255), nullable=True)
    model_number: Mapped[str | None] = mapped_column(String(255), nullable=True)
    serial_number: Mapped[str | None] = mapped_column(String(255), nullable=True)
    install_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    purchase_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    warranty_end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(
        String(32), default=DeviceStatus.active.value
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    home: Mapped["Home"] = relationship(back_populates="devices")  # noqa: F821
    room: Mapped["Room | None"] = relationship(  # noqa: F821
        back_populates="devices"
    )
    tasks: Mapped[list["MaintenanceTask"]] = relationship(  # noqa: F821
        back_populates="device"
    )
    logs: Mapped[list["MaintenanceLog"]] = relationship(  # noqa: F821
        back_populates="device"
    )
