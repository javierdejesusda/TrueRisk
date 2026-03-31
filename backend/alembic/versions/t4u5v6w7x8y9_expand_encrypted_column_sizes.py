"""expand encrypted column sizes for Fernet overhead

Revision ID: t4u5v6w7x8y9
Revises: s3t4u5v6w7x8
Create Date: 2026-03-31 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "t4u5v6w7x8y9"
down_revision: Union[str, None] = "s3t4u5v6w7x8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Fernet encryption produces tokens of ~100+ chars even for short plaintext.
    # These columns were originally sized for plaintext but now use EncryptedString,
    # so they must be expanded to hold encrypted ciphertext.
    op.alter_column(
        "users",
        "emergency_contact_name",
        existing_type=sa.String(100),
        type_=sa.String(500),
        existing_nullable=True,
    )
    op.alter_column(
        "users",
        "emergency_contact_phone",
        existing_type=sa.String(20),
        type_=sa.String(500),
        existing_nullable=True,
    )
    op.alter_column(
        "users",
        "phone_number",
        existing_type=sa.String(20),
        type_=sa.String(500),
        existing_nullable=True,
    )
    op.alter_column(
        "users",
        "medical_conditions",
        existing_type=sa.String(500),
        type_=sa.String(2000),
        existing_nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        "users",
        "medical_conditions",
        existing_type=sa.String(2000),
        type_=sa.String(500),
        existing_nullable=True,
    )
    op.alter_column(
        "users",
        "phone_number",
        existing_type=sa.String(500),
        type_=sa.String(20),
        existing_nullable=True,
    )
    op.alter_column(
        "users",
        "emergency_contact_phone",
        existing_type=sa.String(500),
        type_=sa.String(20),
        existing_nullable=True,
    )
    op.alter_column(
        "users",
        "emergency_contact_name",
        existing_type=sa.String(500),
        type_=sa.String(100),
        existing_nullable=True,
    )
