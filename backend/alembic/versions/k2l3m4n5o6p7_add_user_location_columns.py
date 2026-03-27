"""add last_latitude, last_longitude, last_location_at to users

Revision ID: k2l3m4n5o6p7
Revises: j1k2l3m4n5o6
Create Date: 2026-03-27 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "k2l3m4n5o6p7"
down_revision: Union[str, None] = "j1k2l3m4n5o6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("last_latitude", sa.Float(), nullable=True))
    op.add_column("users", sa.Column("last_longitude", sa.Float(), nullable=True))
    op.add_column("users", sa.Column("last_location_at", sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "last_location_at")
    op.drop_column("users", "last_longitude")
    op.drop_column("users", "last_latitude")
