"""add dana_score to risk_scores

Revision ID: 7901d9da7df8
Revises: 86bb471717f0
Create Date: 2026-03-24 21:35:29.190389

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7901d9da7df8'
down_revision: Union[str, None] = '86bb471717f0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('risk_scores') as batch_op:
        batch_op.add_column(sa.Column('dana_score', sa.Float(), nullable=False, server_default='0.0'))


def downgrade() -> None:
    with op.batch_alter_table('risk_scores') as batch_op:
        batch_op.drop_column('dana_score')
