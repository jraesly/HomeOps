"""Add home_events (activity timeline).

Revision ID: 0005_home_events
Revises: 0004_indexes
Create Date: 2026-06-26
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0005_home_events"
down_revision: str | None = "0004_indexes"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "home_events",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("home_id", sa.Uuid(), nullable=False),
        sa.Column("device_id", sa.Uuid(), nullable=True),
        sa.Column("entity_type", sa.String(length=32), nullable=False),
        sa.Column("entity_id", sa.Uuid(), nullable=True),
        sa.Column("event_type", sa.String(length=32), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("occurred_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["home_id"], ["homes.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["device_id"], ["devices.id"], ondelete="SET NULL"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_home_events_home_id", "home_events", ["home_id"])
    op.create_index("ix_home_events_device_id", "home_events", ["device_id"])


def downgrade() -> None:
    op.drop_index("ix_home_events_device_id", table_name="home_events")
    op.drop_index("ix_home_events_home_id", table_name="home_events")
    op.drop_table("home_events")
