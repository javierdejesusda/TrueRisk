from datetime import datetime

from sqlalchemy import String, Float, JSON, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class WeatherRecord(Base):
    __tablename__ = "weather_records"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    province_code: Mapped[str] = mapped_column(String(2), index=True)
    source: Mapped[str] = mapped_column(String(20))  # open_meteo | aemet
    temperature: Mapped[float] = mapped_column(Float)
    humidity: Mapped[float] = mapped_column(Float)
    precipitation: Mapped[float] = mapped_column(Float)
    wind_speed: Mapped[float] = mapped_column(Float, nullable=True)
    wind_direction: Mapped[float] = mapped_column(Float, nullable=True)
    wind_gusts: Mapped[float] = mapped_column(Float, nullable=True)
    pressure: Mapped[float] = mapped_column(Float, nullable=True)
    soil_moisture: Mapped[float] = mapped_column(Float, nullable=True)
    uv_index: Mapped[float] = mapped_column(Float, nullable=True)
    dew_point: Mapped[float] = mapped_column(Float, nullable=True)
    cloud_cover: Mapped[float] = mapped_column(Float, nullable=True)
    raw_data: Mapped[dict] = mapped_column(JSON, default=dict)
    recorded_at: Mapped[datetime] = mapped_column(DateTime, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
