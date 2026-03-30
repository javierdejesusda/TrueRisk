"""add_chat_usage_and_messages_tables

Revision ID: r2s3t4u5v6w7
Revises: q1w2e3r4t5y6
Create Date: 2026-03-30

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "r2s3t4u5v6w7"
down_revision: Union[str, None] = "q1w2e3r4t5y6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = inspector.get_table_names()

    # --- chat_usage ---
    if "chat_usage" not in existing_tables:
        op.create_table(
            "chat_usage",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("date", sa.Date(), nullable=False),
            sa.Column("messages_count", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("input_tokens", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("output_tokens", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("total_tokens", sa.Integer(), nullable=False, server_default="0"),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("now()"),
                nullable=False,
            ),
            sa.Column(
                "updated_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("now()"),
                nullable=False,
            ),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("user_id", "date", name="uq_chat_usage_user_date"),
        )
        op.create_index(op.f("ix_chat_usage_user_id"), "chat_usage", ["user_id"], unique=False)
        op.create_index(op.f("ix_chat_usage_date"), "chat_usage", ["date"], unique=False)

    # --- chat_messages ---
    if "chat_messages" not in existing_tables:
        op.create_table(
            "chat_messages",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("conversation_id", sa.String(length=36), nullable=False),
            sa.Column("role", sa.String(length=10), nullable=False),
            sa.Column("content", sa.Text(), nullable=False),
            sa.Column("input_tokens", sa.Integer(), nullable=True),
            sa.Column("output_tokens", sa.Integer(), nullable=True),
            sa.Column("flagged", sa.Boolean(), nullable=False, server_default=sa.false()),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("now()"),
                nullable=False,
            ),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(
            op.f("ix_chat_messages_user_id"), "chat_messages", ["user_id"], unique=False
        )
        op.create_index(
            op.f("ix_chat_messages_conversation_id"),
            "chat_messages",
            ["conversation_id"],
            unique=False,
        )


def downgrade() -> None:
    op.drop_index(op.f("ix_chat_messages_conversation_id"), table_name="chat_messages")
    op.drop_index(op.f("ix_chat_messages_user_id"), table_name="chat_messages")
    op.drop_table("chat_messages")

    op.drop_index(op.f("ix_chat_usage_date"), table_name="chat_usage")
    op.drop_index(op.f("ix_chat_usage_user_id"), table_name="chat_usage")
    op.drop_table("chat_usage")
