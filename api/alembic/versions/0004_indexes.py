"""Add indexes on frequently-filtered foreign-key columns.

Postgres does not auto-index foreign keys; the API filters heavily by home_id
(and device_id / task_id / consumable_id), so add covering indexes.

Revision ID: 0004_indexes
Revises: 0003_consumables
Create Date: 2026-06-25
"""

from collections.abc import Sequence

from alembic import op

revision: str = "0004_indexes"
down_revision: str | None = "0003_consumables"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

# (index_name, table, column)
_INDEXES = [
    ("ix_areas_home_id", "areas", "home_id"),
    ("ix_rooms_home_id", "rooms", "home_id"),
    ("ix_devices_home_id", "devices", "home_id"),
    ("ix_devices_room_id", "devices", "room_id"),
    ("ix_maintenance_tasks_home_id", "maintenance_tasks", "home_id"),
    ("ix_maintenance_tasks_device_id", "maintenance_tasks", "device_id"),
    ("ix_maintenance_logs_home_id", "maintenance_logs", "home_id"),
    ("ix_maintenance_logs_device_id", "maintenance_logs", "device_id"),
    ("ix_maintenance_logs_task_id", "maintenance_logs", "task_id"),
    ("ix_consumables_home_id", "consumables", "home_id"),
    ("ix_task_consumables_task_id", "task_consumables", "task_id"),
    ("ix_task_consumables_consumable_id", "task_consumables", "consumable_id"),
]


def upgrade() -> None:
    for name, table, column in _INDEXES:
        op.create_index(name, table, [column])


def downgrade() -> None:
    for name, table, _column in reversed(_INDEXES):
        op.drop_index(name, table_name=table)
