"""add safe_points table

Revision ID: a3c7e9f12b45
Revises: d4a1e8f30b72
Create Date: 2026-03-25 22:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a3c7e9f12b45'
down_revision: Union[str, None] = 'd4a1e8f30b72'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'safe_points',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('province_code', sa.String(2), nullable=False),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('point_type', sa.String(30), nullable=False),
        sa.Column('latitude', sa.Float(), nullable=False),
        sa.Column('longitude', sa.Float(), nullable=False),
        sa.Column('capacity', sa.Integer(), nullable=True),
        sa.Column('address', sa.String(300), nullable=True),
        sa.Column('phone', sa.String(20), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_safe_points_province_code', 'safe_points', ['province_code'])


def downgrade() -> None:
    op.drop_index('ix_safe_points_province_code', table_name='safe_points')
    op.drop_table('safe_points')
