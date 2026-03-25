"""add whatsapp and telegram fields to users

Revision ID: d4a1e8f30b72
Revises: b1e4a7f29c03
Create Date: 2026-03-25 20:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd4a1e8f30b72'
down_revision: Union[str, None] = 'b1e4a7f29c03'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('whatsapp_enabled', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('users', sa.Column('telegram_chat_id', sa.String(50), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'telegram_chat_id')
    op.drop_column('users', 'whatsapp_enabled')
