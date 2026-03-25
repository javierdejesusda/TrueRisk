"""add report_verifications table

Revision ID: b1e4a7f29c03
Revises: 6a290f8ac736
Create Date: 2026-03-25 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b1e4a7f29c03'
down_revision: Union[str, None] = '6a290f8ac736'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'report_verifications',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('report_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.ForeignKeyConstraint(['report_id'], ['community_reports.id']),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('report_id', 'user_id', name='uq_report_user_verification'),
    )
    op.create_index(op.f('ix_report_verifications_report_id'), 'report_verifications', ['report_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_report_verifications_report_id'), table_name='report_verifications')
    op.drop_table('report_verifications')
