"""add user_id to push_subscriptions

Revision ID: 6a290f8ac736
Revises: 7901d9da7df8
Create Date: 2026-03-25 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6a290f8ac736'
down_revision: Union[str, None] = '7901d9da7df8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('push_subscriptions') as batch_op:
        batch_op.add_column(sa.Column('user_id', sa.Integer(), nullable=True))
        batch_op.create_index(op.f('ix_push_subscriptions_user_id'), ['user_id'])
        batch_op.create_foreign_key(
            'fk_push_subscriptions_user_id', 'users', ['user_id'], ['id']
        )


def downgrade() -> None:
    with op.batch_alter_table('push_subscriptions') as batch_op:
        batch_op.drop_constraint('fk_push_subscriptions_user_id', type_='foreignkey')
        batch_op.drop_index(op.f('ix_push_subscriptions_user_id'))
        batch_op.drop_column('user_id')
