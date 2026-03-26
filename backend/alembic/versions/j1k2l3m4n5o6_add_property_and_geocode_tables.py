"""add property_reports, geocode_cache, arpsi_flood_zones tables

Revision ID: j1k2l3m4n5o6
Revises: h2b3c4d5e6f7
Create Date: 2026-03-26 18:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "j1k2l3m4n5o6"
down_revision: Union[str, None] = "h2b3c4d5e6f7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing = set(inspector.get_table_names())

    if "property_reports" not in existing:
        op.create_table(
            "property_reports",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("report_id", sa.String(36), unique=True, index=True, nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=True),
            sa.Column("address_text", sa.String(500), nullable=False),
            sa.Column("formatted_address", sa.String(500), nullable=False),
            sa.Column("latitude", sa.Float(), nullable=False),
            sa.Column("longitude", sa.Float(), nullable=False),
            sa.Column("province_code", sa.String(2), nullable=False),
            sa.Column("municipality_code", sa.String(5), nullable=True),
            sa.Column("flood_score", sa.Float(), nullable=False, server_default="0"),
            sa.Column("wildfire_score", sa.Float(), nullable=False, server_default="0"),
            sa.Column("drought_score", sa.Float(), nullable=False, server_default="0"),
            sa.Column("heatwave_score", sa.Float(), nullable=False, server_default="0"),
            sa.Column("seismic_score", sa.Float(), nullable=False, server_default="0"),
            sa.Column("coldwave_score", sa.Float(), nullable=False, server_default="0"),
            sa.Column("windstorm_score", sa.Float(), nullable=False, server_default="0"),
            sa.Column("composite_score", sa.Float(), nullable=False, server_default="0"),
            sa.Column("dominant_hazard", sa.String(20), nullable=False, server_default="none"),
            sa.Column("severity", sa.String(20), nullable=False, server_default="low"),
            sa.Column("flood_details", sa.JSON(), nullable=False, server_default="{}"),
            sa.Column("wildfire_details", sa.JSON(), nullable=False, server_default="{}"),
            sa.Column("terrain_details", sa.JSON(), nullable=False, server_default="{}"),
            sa.Column("province_flood_score", sa.Float(), nullable=False, server_default="0"),
            sa.Column("province_wildfire_score", sa.Float(), nullable=False, server_default="0"),
            sa.Column("province_composite_score", sa.Float(), nullable=False, server_default="0"),
            sa.Column("province_severity", sa.String(20), nullable=False, server_default="low"),
            sa.Column("computed_at", sa.DateTime(), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
            sa.Column("expires_at", sa.DateTime(), nullable=True),
            sa.Column("pdf_url", sa.String(500), nullable=True),
            sa.Column("access_count", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("created_at", sa.DateTime(), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        )

    if "geocode_cache" not in existing:
        op.create_table(
            "geocode_cache",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("address_hash", sa.String(64), unique=True, index=True, nullable=False),
            sa.Column("address_text", sa.String(500), nullable=False),
            sa.Column("formatted_address", sa.String(500), nullable=False),
            sa.Column("latitude", sa.Float(), nullable=False),
            sa.Column("longitude", sa.Float(), nullable=False),
            sa.Column("province_code", sa.String(2), nullable=False),
            sa.Column("municipality_code", sa.String(5), nullable=True),
            sa.Column("confidence", sa.Float(), nullable=False),
            sa.Column("source", sa.String(20), nullable=False),
            sa.Column("cached_at", sa.DateTime(), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        )

    if "arpsi_flood_zones" not in existing:
        op.create_table(
            "arpsi_flood_zones",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("zone_id", sa.String(50), unique=True, index=True, nullable=False),
            sa.Column("zone_name", sa.String(200), nullable=False),
            sa.Column("zone_type", sa.String(50), nullable=False),
            sa.Column("return_period", sa.String(20), nullable=False),
            sa.Column("province_code", sa.String(2), index=True, nullable=False),
            sa.Column("municipality_code", sa.String(5), nullable=True),
            sa.Column("min_lat", sa.Float(), nullable=False),
            sa.Column("max_lat", sa.Float(), nullable=False),
            sa.Column("min_lon", sa.Float(), nullable=False),
            sa.Column("max_lon", sa.Float(), nullable=False),
            sa.Column("geometry_geojson", sa.Text(), nullable=False),
            sa.Column("area_km2", sa.Float(), nullable=True),
            sa.Column("risk_level", sa.String(20), nullable=False),
            sa.Column("source_url", sa.String(500), nullable=True),
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing = set(inspector.get_table_names())
    if "arpsi_flood_zones" in existing:
        op.drop_table("arpsi_flood_zones")
    if "geocode_cache" in existing:
        op.drop_table("geocode_cache")
    if "property_reports" in existing:
        op.drop_table("property_reports")
