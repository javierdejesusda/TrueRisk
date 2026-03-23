"""River gauge and reading models for SAIH multi-basin monitoring."""

from datetime import datetime

from sqlalchemy import Boolean, Float, String, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class RiverGauge(Base):
    __tablename__ = "river_gauges"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    gauge_id: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(200))
    basin: Mapped[str] = mapped_column(String(50), index=True)
    river_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    province_code: Mapped[str] = mapped_column(String(2), index=True)
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    threshold_p90: Mapped[float | None] = mapped_column(Float, nullable=True)
    threshold_p95: Mapped[float | None] = mapped_column(Float, nullable=True)
    threshold_p99: Mapped[float | None] = mapped_column(Float, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class RiverReading(Base):
    __tablename__ = "river_readings"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    gauge_id: Mapped[str] = mapped_column(String(50), index=True)
    flow_m3s: Mapped[float] = mapped_column(Float)
    level_m: Mapped[float | None] = mapped_column(Float, nullable=True)
    recorded_at: Mapped[datetime] = mapped_column(DateTime, index=True)
    source: Mapped[str] = mapped_column(String(20))
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
