"""Add indexes, foreign keys, and soft delete columns

Revision ID: m3n4o5p6q7r8
Revises: k2l3m4n5o6p7
Create Date: 2026-03-27
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "m3n4o5p6q7r8"
down_revision: Union[str, None] = "k2l3m4n5o6p7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- A. Composite indexes ---
    op.create_index(
        "ix_weather_records_province_recorded",
        "weather_records",
        ["province_code", "recorded_at"],
    )
    op.create_index(
        "ix_alerts_severity_province",
        "alerts",
        ["severity", "province_code"],
    )
    op.create_index(
        "ix_risk_forecasts_hazard_province",
        "risk_forecasts",
        ["hazard", "province_code"],
    )
    op.create_index(
        "ix_community_reports_reporter",
        "community_reports",
        ["reporter_user_id"],
    )
    op.create_index(
        "ix_alert_deliveries_delivered",
        "alert_deliveries",
        ["delivered_at"],
    )

    # --- B. Missing foreign key constraints ---
    with op.batch_alter_table("weather_records") as batch_op:
        batch_op.create_foreign_key(
            "fk_weather_records_province",
            "provinces",
            ["province_code"],
            ["ine_code"],
        )

    with op.batch_alter_table("risk_scores") as batch_op:
        batch_op.create_foreign_key(
            "fk_risk_scores_province",
            "provinces",
            ["province_code"],
            ["ine_code"],
        )

    with op.batch_alter_table("alerts") as batch_op:
        batch_op.create_foreign_key(
            "fk_alerts_province",
            "provinces",
            ["province_code"],
            ["ine_code"],
        )

    # --- C. Soft delete columns ---
    op.add_column("alerts", sa.Column("deleted_at", sa.DateTime(), nullable=True))
    op.add_column("community_reports", sa.Column("deleted_at", sa.DateTime(), nullable=True))
    op.add_column("weather_records", sa.Column("deleted_at", sa.DateTime(), nullable=True))


def downgrade() -> None:
    # --- C. Drop soft delete columns ---
    op.drop_column("weather_records", "deleted_at")
    op.drop_column("community_reports", "deleted_at")
    op.drop_column("alerts", "deleted_at")

    # --- B. Drop foreign key constraints ---
    with op.batch_alter_table("alerts") as batch_op:
        batch_op.drop_constraint("fk_alerts_province", type_="foreignkey")

    with op.batch_alter_table("risk_scores") as batch_op:
        batch_op.drop_constraint("fk_risk_scores_province", type_="foreignkey")

    with op.batch_alter_table("weather_records") as batch_op:
        batch_op.drop_constraint("fk_weather_records_province", type_="foreignkey")

    # --- A. Drop composite indexes ---
    op.drop_index("ix_alert_deliveries_delivered", table_name="alert_deliveries")
    op.drop_index("ix_community_reports_reporter", table_name="community_reports")
    op.drop_index("ix_risk_forecasts_hazard_province", table_name="risk_forecasts")
    op.drop_index("ix_alerts_severity_province", table_name="alerts")
    op.drop_index("ix_weather_records_province_recorded", table_name="weather_records")
