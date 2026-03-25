"""Water restriction model."""

from datetime import datetime

from sqlalchemy import String, Integer, Text, DateTime, Boolean, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class WaterRestriction(Base):
    __tablename__ = "water_restrictions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    province_code: Mapped[str] = mapped_column(String(2), index=True)
    restriction_level: Mapped[int] = mapped_column(Integer)  # 0-4: none, alert, warning, emergency, exceptional
    description: Mapped[str] = mapped_column(Text)
    source: Mapped[str] = mapped_column(String(100))
    effective_date: Mapped[datetime] = mapped_column(DateTime)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
