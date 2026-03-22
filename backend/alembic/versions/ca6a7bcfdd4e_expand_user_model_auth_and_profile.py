"""expand_user_model_auth_and_profile

Revision ID: ca6a7bcfdd4e
Revises: 4022f8178e27
Create Date: 2026-03-21 22:45:54.852909

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ca6a7bcfdd4e'
down_revision: Union[str, None] = '4022f8178e27'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('email', sa.String(255), nullable=True))
    op.add_column('users', sa.Column('display_name', sa.String(100), nullable=True))
    op.add_column('users', sa.Column('avatar_url', sa.String(500), nullable=True))
    op.add_column('users', sa.Column('auth_provider', sa.String(20), nullable=False, server_default='credentials'))
    op.add_column('users', sa.Column('provider_account_id', sa.String(255), nullable=True))
    op.add_column('users', sa.Column('emergency_contact_name', sa.String(100), nullable=True))
    op.add_column('users', sa.Column('emergency_contact_phone', sa.String(20), nullable=True))
    op.add_column('users', sa.Column('phone_number', sa.String(20), nullable=True))
    op.add_column('users', sa.Column('medical_conditions', sa.String(500), nullable=True))
    op.add_column('users', sa.Column('mobility_level', sa.String(20), nullable=False, server_default='full'))
    op.add_column('users', sa.Column('has_vehicle', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('users', sa.Column('alert_severity_threshold', sa.Integer(), nullable=False, server_default='3'))
    op.add_column('users', sa.Column('alert_delivery', sa.String(10), nullable=False, server_default='push'))
    op.add_column('users', sa.Column('hazard_preferences', sa.JSON(), nullable=False, server_default='[]'))

    op.create_index('ix_users_email', 'users', ['email'], unique=True)

    # Make existing columns nullable for OAuth users
    op.alter_column('users', 'nickname', existing_type=sa.String(50), nullable=True)
    op.alter_column('users', 'password_hash', existing_type=sa.String(128), nullable=True)


def downgrade() -> None:
    op.alter_column('users', 'password_hash', existing_type=sa.String(128), nullable=False)
    op.alter_column('users', 'nickname', existing_type=sa.String(50), nullable=False)
    op.drop_index('ix_users_email', table_name='users')
    op.drop_column('users', 'hazard_preferences')
    op.drop_column('users', 'alert_delivery')
    op.drop_column('users', 'alert_severity_threshold')
    op.drop_column('users', 'has_vehicle')
    op.drop_column('users', 'mobility_level')
    op.drop_column('users', 'medical_conditions')
    op.drop_column('users', 'phone_number')
    op.drop_column('users', 'emergency_contact_phone')
    op.drop_column('users', 'emergency_contact_name')
    op.drop_column('users', 'provider_account_id')
    op.drop_column('users', 'auth_provider')
    op.drop_column('users', 'avatar_url')
    op.drop_column('users', 'display_name')
    op.drop_column('users', 'email')
