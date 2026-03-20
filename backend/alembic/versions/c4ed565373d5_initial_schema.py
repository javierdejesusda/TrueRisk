"""initial schema

Revision ID: c4ed565373d5
Revises:
Create Date: 2026-03-18 20:08:48.099961

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c4ed565373d5'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('users',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('nickname', sa.String(length=50), nullable=False),
        sa.Column('password_hash', sa.String(length=128), nullable=False),
        sa.Column('role', sa.String(length=20), nullable=False),
        sa.Column('province_code', sa.String(length=2), nullable=False),
        sa.Column('residence_type', sa.String(length=30), nullable=False),
        sa.Column('special_needs', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_users_nickname'), 'users', ['nickname'], unique=True)

    op.create_table('provinces',
        sa.Column('ine_code', sa.String(length=2), nullable=False),
        sa.Column('name', sa.String(length=50), nullable=False),
        sa.Column('region', sa.String(length=50), nullable=False),
        sa.Column('capital_name', sa.String(length=50), nullable=False),
        sa.Column('capital_municipality_code', sa.String(length=5), nullable=False),
        sa.Column('latitude', sa.Float(), nullable=False),
        sa.Column('longitude', sa.Float(), nullable=False),
        sa.Column('elevation_m', sa.Float(), nullable=False),
        sa.Column('river_basin', sa.String(length=50), nullable=False),
        sa.Column('coastal', sa.Boolean(), nullable=False),
        sa.Column('mediterranean', sa.Boolean(), nullable=False),
        sa.Column('flood_risk_weight', sa.Float(), nullable=False),
        sa.Column('wildfire_risk_weight', sa.Float(), nullable=False),
        sa.Column('drought_risk_weight', sa.Float(), nullable=False),
        sa.Column('heatwave_risk_weight', sa.Float(), nullable=False),
        sa.PrimaryKeyConstraint('ine_code'),
    )

    op.create_table('weather_records',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('province_code', sa.String(length=2), nullable=False),
        sa.Column('source', sa.String(length=20), nullable=False),
        sa.Column('temperature', sa.Float(), nullable=False),
        sa.Column('humidity', sa.Float(), nullable=False),
        sa.Column('precipitation', sa.Float(), nullable=False),
        sa.Column('wind_speed', sa.Float(), nullable=True),
        sa.Column('wind_direction', sa.Float(), nullable=True),
        sa.Column('wind_gusts', sa.Float(), nullable=True),
        sa.Column('pressure', sa.Float(), nullable=True),
        sa.Column('soil_moisture', sa.Float(), nullable=True),
        sa.Column('uv_index', sa.Float(), nullable=True),
        sa.Column('dew_point', sa.Float(), nullable=True),
        sa.Column('cloud_cover', sa.Float(), nullable=True),
        sa.Column('raw_data', sa.JSON(), nullable=False),
        sa.Column('recorded_at', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_weather_records_province_code'), 'weather_records', ['province_code'], unique=False)
    op.create_index(op.f('ix_weather_records_recorded_at'), 'weather_records', ['recorded_at'], unique=False)

    op.create_table('risk_scores',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('province_code', sa.String(length=2), nullable=False),
        sa.Column('flood_score', sa.Float(), nullable=False),
        sa.Column('wildfire_score', sa.Float(), nullable=False),
        sa.Column('drought_score', sa.Float(), nullable=False),
        sa.Column('heatwave_score', sa.Float(), nullable=False),
        sa.Column('composite_score', sa.Float(), nullable=False),
        sa.Column('dominant_hazard', sa.String(length=20), nullable=False),
        sa.Column('severity', sa.String(length=20), nullable=False),
        sa.Column('features_snapshot', sa.JSON(), nullable=False),
        sa.Column('computed_at', sa.DateTime(), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_risk_scores_province_code'), 'risk_scores', ['province_code'], unique=False)

    op.create_table('alerts',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('severity', sa.Integer(), nullable=False),
        sa.Column('hazard_type', sa.String(length=20), nullable=False),
        sa.Column('province_code', sa.String(length=2), nullable=True),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('source', sa.String(length=20), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('onset', sa.DateTime(), nullable=True),
        sa.Column('expires', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_alerts_province_code'), 'alerts', ['province_code'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_alerts_province_code'), table_name='alerts')
    op.drop_table('alerts')
    op.drop_index(op.f('ix_risk_scores_province_code'), table_name='risk_scores')
    op.drop_table('risk_scores')
    op.drop_index(op.f('ix_weather_records_recorded_at'), table_name='weather_records')
    op.drop_index(op.f('ix_weather_records_province_code'), table_name='weather_records')
    op.drop_table('weather_records')
    op.drop_table('provinces')
    op.drop_index(op.f('ix_users_nickname'), table_name='users')
    op.drop_table('users')
