"""make all datetime columns timezone-aware

Revision ID: q1w2e3r4t5y6
Revises: n4o5p6q7r8s9
Create Date: 2026-03-30
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "q1w2e3r4t5y6"
down_revision: Union[str, None] = "n4o5p6q7r8s9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # In PostgreSQL, ALTER COLUMN TYPE from TIMESTAMP to TIMESTAMPTZ is metadata-only (fast, no rewrite)
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        # alerts
        op.execute("ALTER TABLE alerts ALTER COLUMN onset TYPE TIMESTAMPTZ USING onset AT TIME ZONE 'UTC'")
        op.execute("ALTER TABLE alerts ALTER COLUMN expires TYPE TIMESTAMPTZ USING expires AT TIME ZONE 'UTC'")
        op.execute("ALTER TABLE alerts ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC'")
        op.execute("ALTER TABLE alerts ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC'")
        op.execute("ALTER TABLE alerts ALTER COLUMN deleted_at TYPE TIMESTAMPTZ USING deleted_at AT TIME ZONE 'UTC'")

        # alert_preferences
        op.execute("ALTER TABLE alert_preferences ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC'")
        op.execute("ALTER TABLE alert_preferences ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC'")

        # alert_deliveries
        op.execute("ALTER TABLE alert_deliveries ALTER COLUMN delivered_at TYPE TIMESTAMPTZ USING delivered_at AT TIME ZONE 'UTC'")
        op.execute("ALTER TABLE alert_deliveries ALTER COLUMN read_at TYPE TIMESTAMPTZ USING read_at AT TIME ZONE 'UTC'")

        # api_keys
        op.execute("ALTER TABLE api_keys ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC'")
        op.execute("ALTER TABLE api_keys ALTER COLUMN last_used_at TYPE TIMESTAMPTZ USING last_used_at AT TIME ZONE 'UTC'")

        # arpsi_flood_zones
        op.execute("ALTER TABLE arpsi_flood_zones ALTER COLUMN loaded_at TYPE TIMESTAMPTZ USING loaded_at AT TIME ZONE 'UTC'")

        # community_reports
        op.execute("ALTER TABLE community_reports ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC'")
        op.execute("ALTER TABLE community_reports ALTER COLUMN expires_at TYPE TIMESTAMPTZ USING expires_at AT TIME ZONE 'UTC'")
        op.execute("ALTER TABLE community_reports ALTER COLUMN deleted_at TYPE TIMESTAMPTZ USING deleted_at AT TIME ZONE 'UTC'")

        # report_verifications
        op.execute("ALTER TABLE report_verifications ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC'")

        # emergency_plans
        op.execute("ALTER TABLE emergency_plans ALTER COLUMN last_reviewed_at TYPE TIMESTAMPTZ USING last_reviewed_at AT TIME ZONE 'UTC'")
        op.execute("ALTER TABLE emergency_plans ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC'")
        op.execute("ALTER TABLE emergency_plans ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC'")

        # user_badges
        op.execute("ALTER TABLE user_badges ALTER COLUMN earned_at TYPE TIMESTAMPTZ USING earned_at AT TIME ZONE 'UTC'")

        # geocode_cache
        op.execute("ALTER TABLE geocode_cache ALTER COLUMN cached_at TYPE TIMESTAMPTZ USING cached_at AT TIME ZONE 'UTC'")

        # preparedness_items
        op.execute("ALTER TABLE preparedness_items ALTER COLUMN completed_at TYPE TIMESTAMPTZ USING completed_at AT TIME ZONE 'UTC'")
        op.execute("ALTER TABLE preparedness_items ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC'")

        # preparedness_snapshots
        op.execute("ALTER TABLE preparedness_snapshots ALTER COLUMN computed_at TYPE TIMESTAMPTZ USING computed_at AT TIME ZONE 'UTC'")

        # property_reports
        op.execute("ALTER TABLE property_reports ALTER COLUMN computed_at TYPE TIMESTAMPTZ USING computed_at AT TIME ZONE 'UTC'")
        op.execute("ALTER TABLE property_reports ALTER COLUMN expires_at TYPE TIMESTAMPTZ USING expires_at AT TIME ZONE 'UTC'")
        op.execute("ALTER TABLE property_reports ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC'")

        # push_subscriptions
        op.execute("ALTER TABLE push_subscriptions ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC'")

        # risk_forecasts
        op.execute("ALTER TABLE risk_forecasts ALTER COLUMN computed_at TYPE TIMESTAMPTZ USING computed_at AT TIME ZONE 'UTC'")

        # risk_narratives
        op.execute("ALTER TABLE risk_narratives ALTER COLUMN generated_at TYPE TIMESTAMPTZ USING generated_at AT TIME ZONE 'UTC'")

        # risk_scores
        op.execute("ALTER TABLE risk_scores ALTER COLUMN computed_at TYPE TIMESTAMPTZ USING computed_at AT TIME ZONE 'UTC'")
        op.execute("ALTER TABLE risk_scores ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC'")

        # river_gauges
        op.execute("ALTER TABLE river_gauges ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC'")

        # river_readings
        op.execute("ALTER TABLE river_readings ALTER COLUMN recorded_at TYPE TIMESTAMPTZ USING recorded_at AT TIME ZONE 'UTC'")
        op.execute("ALTER TABLE river_readings ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC'")

        # safety_check_ins
        op.execute("ALTER TABLE safety_check_ins ALTER COLUMN checked_in_at TYPE TIMESTAMPTZ USING checked_in_at AT TIME ZONE 'UTC'")
        op.execute("ALTER TABLE safety_check_ins ALTER COLUMN expires_at TYPE TIMESTAMPTZ USING expires_at AT TIME ZONE 'UTC'")

        # family_links
        op.execute("ALTER TABLE family_links ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC'")

        # sms_subscriptions
        op.execute("ALTER TABLE sms_subscriptions ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC'")

        # telegram_link_codes
        op.execute("ALTER TABLE telegram_link_codes ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC'")

        # users
        op.execute("ALTER TABLE users ALTER COLUMN last_location_at TYPE TIMESTAMPTZ USING last_location_at AT TIME ZONE 'UTC'")
        op.execute("ALTER TABLE users ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC'")
        op.execute("ALTER TABLE users ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC'")

        # water_restrictions
        op.execute("ALTER TABLE water_restrictions ALTER COLUMN effective_date TYPE TIMESTAMPTZ USING effective_date AT TIME ZONE 'UTC'")
        op.execute("ALTER TABLE water_restrictions ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC'")

        # weather_records
        op.execute("ALTER TABLE weather_records ALTER COLUMN recorded_at TYPE TIMESTAMPTZ USING recorded_at AT TIME ZONE 'UTC'")
        op.execute("ALTER TABLE weather_records ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC'")
        op.execute("ALTER TABLE weather_records ALTER COLUMN deleted_at TYPE TIMESTAMPTZ USING deleted_at AT TIME ZONE 'UTC'")

    # SQLite doesn't distinguish TIMESTAMP vs TIMESTAMPTZ — no-op


def downgrade() -> None:
    pass  # Not reversing timezone awareness
