"""Gamification models — points, badges, streaks."""

from datetime import date, datetime

from sqlalchemy import String, Integer, Date, DateTime, ForeignKey, func, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class UserPoints(Base):
    __tablename__ = "user_points"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, index=True)
    total_points: Mapped[int] = mapped_column(Integer, default=0)
    current_streak_days: Mapped[int] = mapped_column(Integer, default=0)
    longest_streak_days: Mapped[int] = mapped_column(Integer, default=0)
    last_active_date: Mapped[date | None] = mapped_column(Date, nullable=True)


class Badge(Base):
    __tablename__ = "badges"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    key: Mapped[str] = mapped_column(String(50), unique=True)
    name_es: Mapped[str] = mapped_column(String(100))
    name_en: Mapped[str] = mapped_column(String(100))
    description_es: Mapped[str] = mapped_column(String(300))
    description_en: Mapped[str] = mapped_column(String(300))
    icon: Mapped[str] = mapped_column(String(50))
    condition: Mapped[str] = mapped_column(String(100))


class UserBadge(Base):
    __tablename__ = "user_badges"
    __table_args__ = (UniqueConstraint("user_id", "badge_id", name="uq_user_badge"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    badge_id: Mapped[int] = mapped_column(ForeignKey("badges.id"))
    earned_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
