from datetime import datetime

from sqlalchemy import String, Text, Integer, Boolean, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    severity: Mapped[int] = mapped_column(Integer)  # 1-5
    hazard_type: Mapped[str] = mapped_column(String(20))  # flood, wildfire, drought, heatwave
    province_code: Mapped[str] = mapped_column(String(2), index=True, nullable=True)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text)
    source: Mapped[str] = mapped_column(String(20), default="auto_detected")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    onset: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    expires: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )
