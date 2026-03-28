"""add enhanced user settings columns

Revision ID: f12735c4507a
Revises: m3n4o5p6q7r8
Create Date: 2026-03-28 10:40:31.921518

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from app.security.field_encryption import EncryptedString


# revision identifiers, used by Alembic.
revision: str = 'f12735c4507a'
down_revision: Union[str, None] = 'm3n4o5p6q7r8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _column_exists(table: str, column: str) -> bool:
    bind = op.get_bind()
    result = bind.execute(sa.text(f"PRAGMA table_info({table})"))
    return any(row[1] == column for row in result.fetchall())


def _add_column_if_missing(table: str, column: sa.Column) -> None:
    if not _column_exists(table, column.name):
        op.add_column(table, column)


def upgrade() -> None:
    # New user profile columns (Task 11)
    _add_column_if_missing('users', sa.Column('whatsapp_enabled', sa.Boolean(), nullable=False, server_default='false'))
    _add_column_if_missing('users', sa.Column('telegram_chat_id', sa.String(50), nullable=True))
    _add_column_if_missing('users', sa.Column('has_ac', sa.Boolean(), nullable=False, server_default='true'))
    _add_column_if_missing('users', sa.Column('floor_level', sa.Integer(), nullable=True))
    _add_column_if_missing('users', sa.Column('age_range', sa.String(10), nullable=True))
    _add_column_if_missing('users', sa.Column('preparedness_score', sa.Float(), nullable=False, server_default='0.0'))
    _add_column_if_missing('users', sa.Column('last_latitude', sa.Float(), nullable=True))
    _add_column_if_missing('users', sa.Column('last_longitude', sa.Float(), nullable=True))
    _add_column_if_missing('users', sa.Column('last_location_at', sa.DateTime(), nullable=True))

    # Household composition
    _add_column_if_missing('users', sa.Column('household_members', sa.JSON(), nullable=True))
    _add_column_if_missing('users', sa.Column('pet_details', sa.JSON(), nullable=True))

    # Building details
    _add_column_if_missing('users', sa.Column('construction_year', sa.Integer(), nullable=True))
    _add_column_if_missing('users', sa.Column('building_materials', sa.String(30), nullable=True))
    _add_column_if_missing('users', sa.Column('building_stories', sa.Integer(), nullable=True))
    _add_column_if_missing('users', sa.Column('has_basement', sa.Boolean(), nullable=True))
    _add_column_if_missing('users', sa.Column('has_elevator', sa.Boolean(), nullable=True))
    _add_column_if_missing('users', sa.Column('building_condition', sa.Integer(), nullable=True))

    # Economic vulnerability
    _add_column_if_missing('users', sa.Column('income_bracket', sa.String(20), nullable=True))
    _add_column_if_missing('users', sa.Column('has_property_insurance', sa.Boolean(), nullable=True))
    _add_column_if_missing('users', sa.Column('has_life_insurance', sa.Boolean(), nullable=True))
    _add_column_if_missing('users', sa.Column('property_value_range', sa.String(20), nullable=True))
    _add_column_if_missing('users', sa.Column('has_emergency_savings', sa.Boolean(), nullable=True))

    # Infrastructure dependencies
    _add_column_if_missing('users', sa.Column('has_power_dependent_medical', sa.Boolean(), nullable=True))
    _add_column_if_missing('users', sa.Column('has_water_storage', sa.Boolean(), nullable=True))
    _add_column_if_missing('users', sa.Column('has_generator_or_solar', sa.Boolean(), nullable=True))
    _add_column_if_missing('users', sa.Column('depends_public_water', sa.Boolean(), nullable=True))

    # Precise home location
    _add_column_if_missing('users', sa.Column('home_latitude', sa.Float(), nullable=True))
    _add_column_if_missing('users', sa.Column('home_longitude', sa.Float(), nullable=True))
    _add_column_if_missing('users', sa.Column('home_address', EncryptedString(500), nullable=True))

    # Work/school location
    _add_column_if_missing('users', sa.Column('work_latitude', sa.Float(), nullable=True))
    _add_column_if_missing('users', sa.Column('work_longitude', sa.Float(), nullable=True))
    _add_column_if_missing('users', sa.Column('work_address', EncryptedString(500), nullable=True))
    _add_column_if_missing('users', sa.Column('work_province_code', sa.String(2), nullable=True))

    # Language preference and disaster experience
    _add_column_if_missing('users', sa.Column('language_preference', sa.String(5), nullable=True))
    _add_column_if_missing('users', sa.Column('disaster_experience', sa.JSON(), nullable=True))

    # Other tables: add missing columns
    _add_column_if_missing('push_subscriptions', sa.Column('user_id', sa.Integer(), nullable=True))
    _add_column_if_missing('risk_scores', sa.Column('dana_score', sa.Float(), nullable=False, server_default='0.0'))
    _add_column_if_missing('weather_records', sa.Column('deleted_at', sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column('weather_records', 'deleted_at')
    op.drop_column('risk_scores', 'dana_score')
    op.drop_column('push_subscriptions', 'user_id')
    op.drop_column('users', 'disaster_experience')
    op.drop_column('users', 'language_preference')
    op.drop_column('users', 'work_province_code')
    op.drop_column('users', 'work_address')
    op.drop_column('users', 'work_longitude')
    op.drop_column('users', 'work_latitude')
    op.drop_column('users', 'home_address')
    op.drop_column('users', 'home_longitude')
    op.drop_column('users', 'home_latitude')
    op.drop_column('users', 'depends_public_water')
    op.drop_column('users', 'has_generator_or_solar')
    op.drop_column('users', 'has_water_storage')
    op.drop_column('users', 'has_power_dependent_medical')
    op.drop_column('users', 'has_emergency_savings')
    op.drop_column('users', 'property_value_range')
    op.drop_column('users', 'has_life_insurance')
    op.drop_column('users', 'has_property_insurance')
    op.drop_column('users', 'income_bracket')
    op.drop_column('users', 'building_condition')
    op.drop_column('users', 'has_elevator')
    op.drop_column('users', 'has_basement')
    op.drop_column('users', 'building_stories')
    op.drop_column('users', 'building_materials')
    op.drop_column('users', 'construction_year')
    op.drop_column('users', 'pet_details')
    op.drop_column('users', 'household_members')
    op.drop_column('users', 'last_location_at')
    op.drop_column('users', 'last_longitude')
    op.drop_column('users', 'last_latitude')
    op.drop_column('users', 'preparedness_score')
    op.drop_column('users', 'age_range')
    op.drop_column('users', 'floor_level')
    op.drop_column('users', 'has_ac')
    op.drop_column('users', 'telegram_chat_id')
    op.drop_column('users', 'whatsapp_enabled')
