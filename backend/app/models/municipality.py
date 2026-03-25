"""Municipality model for sub-province granularity."""

from sqlalchemy import String, Float, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Municipality(Base):
    __tablename__ = "municipalities"

    ine_code: Mapped[str] = mapped_column(String(5), primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    province_code: Mapped[str] = mapped_column(
        String(2), ForeignKey("provinces.ine_code"), index=True
    )
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    population: Mapped[int | None] = mapped_column(nullable=True)
    area_km2: Mapped[float | None] = mapped_column(Float, nullable=True)
    elevation_m: Mapped[float | None] = mapped_column(Float, nullable=True)
    is_coastal: Mapped[bool] = mapped_column(Boolean, default=False)
    land_use_type: Mapped[str | None] = mapped_column(String(20), nullable=True)
    elderly_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    distance_river_km: Mapped[float | None] = mapped_column(Float, nullable=True)
    is_mediterranean: Mapped[bool] = mapped_column(Boolean, default=False)
    flood_zone_area_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
