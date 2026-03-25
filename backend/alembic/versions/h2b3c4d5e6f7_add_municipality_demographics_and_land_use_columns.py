"""add municipality demographics and land use columns

Revision ID: h2b3c4d5e6f7
Revises: g1a2m3i4f5y6
Create Date: 2026-03-26 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "h2b3c4d5e6f7"
down_revision: Union[str, None] = "g1a2m3i4f5y6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("municipalities", sa.Column("land_use_type", sa.String(20), nullable=True))
    op.add_column("municipalities", sa.Column("elderly_pct", sa.Float(), nullable=True))
    op.add_column("municipalities", sa.Column("distance_river_km", sa.Float(), nullable=True))
    op.add_column("municipalities", sa.Column("is_mediterranean", sa.Boolean(), server_default="false", nullable=False))
    op.add_column("municipalities", sa.Column("flood_zone_area_pct", sa.Float(), nullable=True))


def downgrade() -> None:
    op.drop_column("municipalities", "flood_zone_area_pct")
    op.drop_column("municipalities", "is_mediterranean")
    op.drop_column("municipalities", "distance_river_km")
    op.drop_column("municipalities", "elderly_pct")
    op.drop_column("municipalities", "land_use_type")
