from datetime import datetime

from sqlalchemy import String, Float, JSON, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class RiskScore(Base):
    __tablename__ = "risk_scores"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    province_code: Mapped[str] = mapped_column(String(2), index=True)
    flood_score: Mapped[float] = mapped_column(Float, default=0.0)
    wildfire_score: Mapped[float] = mapped_column(Float, default=0.0)
    drought_score: Mapped[float] = mapped_column(Float, default=0.0)
    heatwave_score: Mapped[float] = mapped_column(Float, default=0.0)
    seismic_score: Mapped[float] = mapped_column(Float, default=0.0)
    coldwave_score: Mapped[float] = mapped_column(Float, default=0.0)
    windstorm_score: Mapped[float] = mapped_column(Float, default=0.0)
    composite_score: Mapped[float] = mapped_column(Float, default=0.0)
    dominant_hazard: Mapped[str] = mapped_column(String(20), default="flood")
    severity: Mapped[str] = mapped_column(String(20), default="low")
    features_snapshot: Mapped[dict] = mapped_column(JSON, default=dict)
    computed_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
