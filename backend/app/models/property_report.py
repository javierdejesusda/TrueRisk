from datetime import datetime

from sqlalchemy import String, Float, Integer, JSON, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class PropertyReport(Base):
    __tablename__ = "property_reports"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    report_id: Mapped[str] = mapped_column(String(36), unique=True, index=True)
    user_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    address_text: Mapped[str] = mapped_column(String(500))
    formatted_address: Mapped[str] = mapped_column(String(500))
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    province_code: Mapped[str] = mapped_column(String(2))
    municipality_code: Mapped[str | None] = mapped_column(String(5), nullable=True)

    # Hazard scores
    flood_score: Mapped[float] = mapped_column(Float, default=0.0)
    wildfire_score: Mapped[float] = mapped_column(Float, default=0.0)
    drought_score: Mapped[float] = mapped_column(Float, default=0.0)
    heatwave_score: Mapped[float] = mapped_column(Float, default=0.0)
    seismic_score: Mapped[float] = mapped_column(Float, default=0.0)
    coldwave_score: Mapped[float] = mapped_column(Float, default=0.0)
    windstorm_score: Mapped[float] = mapped_column(Float, default=0.0)

    composite_score: Mapped[float] = mapped_column(Float, default=0.0)
    dominant_hazard: Mapped[str] = mapped_column(String(20), default="none")
    severity: Mapped[str] = mapped_column(String(20), default="low")

    # Detail JSON blobs
    flood_details: Mapped[dict] = mapped_column(JSON, default=dict)
    wildfire_details: Mapped[dict] = mapped_column(JSON, default=dict)
    terrain_details: Mapped[dict] = mapped_column(JSON, default=dict)

    # Province-level scores for comparison
    province_flood_score: Mapped[float] = mapped_column(Float, default=0.0)
    province_wildfire_score: Mapped[float] = mapped_column(Float, default=0.0)
    province_composite_score: Mapped[float] = mapped_column(Float, default=0.0)
    province_severity: Mapped[str] = mapped_column(String(20), default="low")

    computed_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    expires_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    pdf_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    access_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
