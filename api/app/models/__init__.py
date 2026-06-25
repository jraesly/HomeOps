"""SQLAlchemy models and the shared declarative ``Base``.

Importing this package imports every model so that ``Base.metadata`` is fully
populated for table creation and Alembic autogenerate.
"""

from app.models.area import Area
from app.models.base import Base
from app.models.consumable import Consumable, TaskConsumable
from app.models.device import Device
from app.models.home import Home
from app.models.maintenance_log import MaintenanceLog
from app.models.maintenance_task import MaintenanceTask
from app.models.room import Room
from app.models.user import User

__all__ = [
    "Area",
    "Base",
    "Consumable",
    "Device",
    "Home",
    "MaintenanceLog",
    "MaintenanceTask",
    "Room",
    "TaskConsumable",
    "User",
]
