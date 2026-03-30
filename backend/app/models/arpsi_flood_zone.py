from datetime import datetime

from sqlalchemy import String, Float, Text, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class ArpsiFloodZone(Base):
    __tablename__ = "arpsi_flood_zones"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    zone_id: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    zone_name: Mapped[str] = mapped_column(String(200))
    zone_type: Mapped[str] = mapped_column(String(50))
    return_period: Mapped[str] = mapped_column(String(20))
    province_code: Mapped[str] = mapped_column(String(2), index=True)
    municipality_code: Mapped[str | None] = mapped_column(String(5), nullable=True)

    # Bounding box
    min_lat: Mapped[float] = mapped_column(Float)
    max_lat: Mapped[float] = mapped_column(Float)
    min_lon: Mapped[float] = mapped_column(Float)
    max_lon: Mapped[float] = mapped_column(Float)

    geometry_geojson: Mapped[str] = mapped_column(Text)
    area_km2: Mapped[float | None] = mapped_column(Float, nullable=True)
    risk_level: Mapped[str] = mapped_column(String(20))
    source_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    loaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
