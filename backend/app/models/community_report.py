from __future__ import annotations

from datetime import datetime

from sqlalchemy import String, Integer, Float, Text, DateTime, Boolean, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class CommunityReport(Base):
    __tablename__ = "community_reports"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    province_code: Mapped[str] = mapped_column(String(2), index=True)
    hazard_type: Mapped[str] = mapped_column(String(30))
    severity: Mapped[int] = mapped_column(Integer)  # 1-5
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    upvotes: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    # Enhanced fields
    photo_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    urgency: Mapped[int] = mapped_column(Integer, default=3)  # 1-5
    reporter_user_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=True
    )
    verified_count: Mapped[int] = mapped_column(Integer, default=0)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, default=None)


class ReportVerification(Base):
    __tablename__ = "report_verifications"
    __table_args__ = (
        UniqueConstraint("report_id", "user_id", name="uq_report_user_verification"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    report_id: Mapped[int] = mapped_column(ForeignKey("community_reports.id"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
