"""make all datetime columns timezone-aware

Revision ID: q1w2e3r4t5y6
Revises: n4o5p6q7r8s9
Create Date: 2026-03-30
"""
from typing import Sequence, Union

from alembic import op


revision: str = "q1w2e3r4t5y6"
down_revision: Union[str, None] = "n4o5p6q7r8s9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _safe_alter(table: str, column: str) -> None:
    """Alter a column to TIMESTAMPTZ, skipping if table/column doesn't exist."""
    from sqlalchemy import text
    bind = op.get_bind()
    # Check if the column exists before altering
    result = bind.execute(text(
        "SELECT 1 FROM information_schema.columns "
        "WHERE table_name = :table AND column_name = :col"
    ), {"table": table, "col": column})
    if result.fetchone():
        op.execute(f"ALTER TABLE {table} ALTER COLUMN {column} TYPE TIMESTAMPTZ USING {column} AT TIME ZONE 'UTC'")


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name != "postgresql":
        return  # SQLite doesn't distinguish TIMESTAMP vs TIMESTAMPTZ

    _alterations = [
        ("alerts", "onset"), ("alerts", "expires"), ("alerts", "created_at"),
        ("alerts", "updated_at"), ("alerts", "deleted_at"),
        ("alert_preferences", "created_at"), ("alert_preferences", "updated_at"),
        ("alert_deliveries", "delivered_at"), ("alert_deliveries", "read_at"),
        ("api_keys", "created_at"), ("api_keys", "last_used_at"),
        ("arpsi_flood_zones", "loaded_at"),
        ("community_reports", "created_at"), ("community_reports", "expires_at"),
        ("community_reports", "deleted_at"),
        ("report_verifications", "created_at"),
        ("emergency_plans", "last_reviewed_at"), ("emergency_plans", "created_at"),
        ("emergency_plans", "updated_at"),
        ("user_badges", "earned_at"),
        ("geocode_cache", "cached_at"),
        ("preparedness_items", "completed_at"), ("preparedness_items", "created_at"),
        ("preparedness_snapshots", "computed_at"),
        ("property_reports", "computed_at"), ("property_reports", "expires_at"),
        ("property_reports", "created_at"),
        ("push_subscriptions", "created_at"),
        ("risk_forecasts", "computed_at"),
        ("risk_narratives", "generated_at"),
        ("risk_scores", "computed_at"), ("risk_scores", "created_at"),
        ("river_gauges", "updated_at"),
        ("river_readings", "recorded_at"), ("river_readings", "created_at"),
        ("safety_check_ins", "checked_in_at"), ("safety_check_ins", "expires_at"),
        ("family_links", "created_at"),
        ("sms_subscriptions", "created_at"),
        ("telegram_link_codes", "created_at"),
        ("users", "last_location_at"), ("users", "created_at"), ("users", "updated_at"),
        ("water_restrictions", "effective_date"), ("water_restrictions", "created_at"),
        ("weather_records", "recorded_at"), ("weather_records", "created_at"),
        ("weather_records", "deleted_at"),
    ]
    for table, column in _alterations:
        _safe_alter(table, column)


def downgrade() -> None:
    pass  # Not reversing timezone awareness
