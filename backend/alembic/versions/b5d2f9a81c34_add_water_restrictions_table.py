"""add water_restrictions table

Revision ID: b5d2f9a81c34
Revises: a3c7e9f12b45
Create Date: 2026-03-25 23:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b5d2f9a81c34'
down_revision: Union[str, None] = 'a3c7e9f12b45'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'water_restrictions',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('province_code', sa.String(2), nullable=False),
        sa.Column('restriction_level', sa.Integer(), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('source', sa.String(100), nullable=False),
        sa.Column('effective_date', sa.DateTime(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_water_restrictions_province_code', 'water_restrictions', ['province_code'])


def downgrade() -> None:
    op.drop_index('ix_water_restrictions_province_code', table_name='water_restrictions')
    op.drop_table('water_restrictions')
