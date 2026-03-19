"""Daily aggregated weather summaries -- kept indefinitely for multi-year analysis."""
from __future__ import annotations

import datetime as dt

from sqlalchemy import Index, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class WeatherDailySummary(Base):
    __tablename__ = "weather_daily_summary"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    province_code: Mapped[str] = mapped_column(index=True)
    date: Mapped[dt.date] = mapped_column(index=True)

    temperature_max: Mapped[float] = mapped_column(default=0.0)
    temperature_min: Mapped[float] = mapped_column(default=0.0)
    temperature_avg: Mapped[float] = mapped_column(default=0.0)
    humidity_avg: Mapped[float] = mapped_column(default=0.0)
    humidity_min: Mapped[float] = mapped_column(default=0.0)
    precipitation_sum: Mapped[float] = mapped_column(default=0.0)
    wind_speed_max: Mapped[float] = mapped_column(default=0.0)
    wind_speed_avg: Mapped[float] = mapped_column(default=0.0)
    wind_gusts_max: Mapped[float | None] = mapped_column(nullable=True)
    pressure_avg: Mapped[float | None] = mapped_column(nullable=True)
    soil_moisture_avg: Mapped[float | None] = mapped_column(nullable=True)
    uv_index_max: Mapped[float | None] = mapped_column(nullable=True)
    cloud_cover_avg: Mapped[float | None] = mapped_column(nullable=True)

    source: Mapped[str] = mapped_column(default="aggregated")  # "aggregated" or "archive"
    created_at: Mapped[dt.datetime] = mapped_column(server_default=func.now())

    __table_args__ = (
        UniqueConstraint("province_code", "date", name="uq_province_date"),
        Index("ix_daily_summary_province_date", "province_code", "date"),
    )
