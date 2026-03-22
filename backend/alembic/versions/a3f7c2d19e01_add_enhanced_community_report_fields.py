"""add enhanced community report fields

Revision ID: a3f7c2d19e01
Revises: cb76d942f4bc
Create Date: 2026-03-22 22:15:49.746663

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a3f7c2d19e01'
down_revision: Union[str, None] = 'cb76d942f4bc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "community_reports",
        sa.Column("photo_url", sa.String(length=500), nullable=True),
    )
    op.add_column(
        "community_reports",
        sa.Column("urgency", sa.Integer(), server_default="3", nullable=False),
    )
    op.add_column(
        "community_reports",
        sa.Column("reporter_user_id", sa.Integer(), nullable=True),
    )
    op.add_column(
        "community_reports",
        sa.Column("verified_count", sa.Integer(), server_default="0", nullable=False),
    )
    op.add_column(
        "community_reports",
        sa.Column("is_verified", sa.Boolean(), server_default="0", nullable=False),
    )
    # FK enforced at model level; SQLite does not support ALTER TABLE ADD CONSTRAINT.


def downgrade() -> None:
    op.drop_column("community_reports", "is_verified")
    op.drop_column("community_reports", "verified_count")
    op.drop_column("community_reports", "reporter_user_id")
    op.drop_column("community_reports", "urgency")
    op.drop_column("community_reports", "photo_url")
