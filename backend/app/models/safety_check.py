from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    DateTime,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class SafetyCheckIn(Base):
    __tablename__ = "safety_check_ins"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), index=True)
    province_code: Mapped[str] = mapped_column(String(2), index=True)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(String(20))  # safe/need_help/evacuating/sheltering
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    checked_in_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    expires_at: Mapped[datetime] = mapped_column(DateTime)


class FamilyLink(Base):
    __tablename__ = "family_links"

    __table_args__ = (
        UniqueConstraint("user_id", "linked_user_id", name="uq_family_link"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), index=True)
    linked_user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), index=True)
    relationship: Mapped[str] = mapped_column(String(20))  # family/friend/neighbor
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending/accepted/blocked
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
