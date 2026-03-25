"""add_risk_narratives_table

Revision ID: a1b2c3d4e5f6
Revises: f72bea6738d4
Create Date: 2026-03-25 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'f72bea6738d4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('risk_narratives',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('province_code', sa.String(length=2), nullable=False),
        sa.Column('narrative_type', sa.String(length=20), nullable=False),
        sa.Column('content_es', sa.Text(), nullable=False),
        sa.Column('content_en', sa.Text(), nullable=False),
        sa.Column('generated_at', sa.DateTime(), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_risk_narratives_province_code'), 'risk_narratives', ['province_code'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_risk_narratives_province_code'), table_name='risk_narratives')
    op.drop_table('risk_narratives')
