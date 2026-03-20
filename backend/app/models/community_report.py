from datetime import datetime

from sqlalchemy import String, Integer, Float, Text, DateTime, func
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
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    expires_at: Mapped[datetime] = mapped_column(DateTime)
