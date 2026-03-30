"""add refresh_tokens table

Revision ID: s3t4u5v6w7x8
Revises: r2s3t4u5v6w7
Create Date: 2026-03-30

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "s3t4u5v6w7x8"
down_revision: Union[str, None] = "r2s3t4u5v6w7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = inspector.get_table_names()

    if "refresh_tokens" not in existing_tables:
        op.create_table(
            "refresh_tokens",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column(
                "user_id",
                sa.Integer(),
                sa.ForeignKey("users.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column("token_hash", sa.String(64), nullable=False),
            sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("now()"),
                nullable=False,
            ),
            sa.Column("family_id", sa.String(36), nullable=False),
            sa.Column("replaced_by_hash", sa.String(64), nullable=True),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(
            op.f("ix_refresh_tokens_user_id"),
            "refresh_tokens",
            ["user_id"],
            unique=False,
        )
        op.create_index(
            op.f("ix_refresh_tokens_token_hash"),
            "refresh_tokens",
            ["token_hash"],
            unique=True,
        )
        op.create_index(
            op.f("ix_refresh_tokens_family_id"),
            "refresh_tokens",
            ["family_id"],
            unique=False,
        )


def downgrade() -> None:
    op.drop_index(op.f("ix_refresh_tokens_family_id"), table_name="refresh_tokens")
    op.drop_index(op.f("ix_refresh_tokens_token_hash"), table_name="refresh_tokens")
    op.drop_index(op.f("ix_refresh_tokens_user_id"), table_name="refresh_tokens")
    op.drop_table("refresh_tokens")
