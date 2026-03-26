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
    # Create municipalities table if it doesn't exist yet
    # (it may have been created by Base.metadata.create_all at app startup)
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "municipalities" not in inspector.get_table_names():
        op.create_table(
            "municipalities",
            sa.Column("ine_code", sa.String(5), primary_key=True),
            sa.Column("name", sa.String(200), nullable=False),
            sa.Column("province_code", sa.String(2), sa.ForeignKey("provinces.ine_code"), nullable=False, index=True),
            sa.Column("latitude", sa.Float(), nullable=False),
            sa.Column("longitude", sa.Float(), nullable=False),
            sa.Column("population", sa.Integer(), nullable=True),
            sa.Column("area_km2", sa.Float(), nullable=True),
            sa.Column("elevation_m", sa.Float(), nullable=True),
            sa.Column("is_coastal", sa.Boolean(), server_default="false", nullable=False),
            sa.Column("land_use_type", sa.String(20), nullable=True),
            sa.Column("elderly_pct", sa.Float(), nullable=True),
            sa.Column("distance_river_km", sa.Float(), nullable=True),
            sa.Column("is_mediterranean", sa.Boolean(), server_default="false", nullable=False),
            sa.Column("flood_zone_area_pct", sa.Float(), nullable=True),
        )
    else:
        # Table exists — add the new columns
        existing_cols = {c["name"] for c in inspector.get_columns("municipalities")}
        if "land_use_type" not in existing_cols:
            op.add_column("municipalities", sa.Column("land_use_type", sa.String(20), nullable=True))
        if "elderly_pct" not in existing_cols:
            op.add_column("municipalities", sa.Column("elderly_pct", sa.Float(), nullable=True))
        if "distance_river_km" not in existing_cols:
            op.add_column("municipalities", sa.Column("distance_river_km", sa.Float(), nullable=True))
        if "is_mediterranean" not in existing_cols:
            op.add_column("municipalities", sa.Column("is_mediterranean", sa.Boolean(), server_default="false", nullable=False))
        if "flood_zone_area_pct" not in existing_cols:
            op.add_column("municipalities", sa.Column("flood_zone_area_pct", sa.Float(), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "municipalities" in inspector.get_table_names():
        existing_cols = {c["name"] for c in inspector.get_columns("municipalities")}
        for col in ["flood_zone_area_pct", "is_mediterranean", "distance_river_km", "elderly_pct", "land_use_type"]:
            if col in existing_cols:
                op.drop_column("municipalities", col)
