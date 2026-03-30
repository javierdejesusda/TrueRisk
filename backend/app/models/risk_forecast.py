from datetime import datetime

from sqlalchemy import String, Float, Integer, JSON, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class RiskForecast(Base):
    __tablename__ = "risk_forecasts"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    province_code: Mapped[str] = mapped_column(String(2), index=True)
    hazard: Mapped[str] = mapped_column(String(20))
    horizon_hours: Mapped[int] = mapped_column(Integer)
    q10: Mapped[float] = mapped_column(Float)
    q50: Mapped[float] = mapped_column(Float)
    q90: Mapped[float] = mapped_column(Float)
    attention_weights: Mapped[dict] = mapped_column(JSON, default=dict)
    computed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
