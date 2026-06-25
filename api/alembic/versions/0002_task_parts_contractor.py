"""Add requires_parts and contractor_required to maintenance_tasks.

Revision ID: 0002_task_flags
Revises: 0001_initial
Create Date: 2026-06-24
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0002_task_flags"
down_revision: str | None = "0001_initial"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "maintenance_tasks",
        sa.Column(
            "requires_parts",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )
    op.add_column(
        "maintenance_tasks",
        sa.Column(
            "contractor_required",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )


def downgrade() -> None:
    op.drop_column("maintenance_tasks", "contractor_required")
    op.drop_column("maintenance_tasks", "requires_parts")
