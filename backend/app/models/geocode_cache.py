from datetime import datetime

from sqlalchemy import String, Float, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class GeocodeCache(Base):
    __tablename__ = "geocode_cache"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    address_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    address_text: Mapped[str] = mapped_column(String(500))
    formatted_address: Mapped[str] = mapped_column(String(500))
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    province_code: Mapped[str] = mapped_column(String(2))
    municipality_code: Mapped[str | None] = mapped_column(String(5), nullable=True)
    confidence: Mapped[float] = mapped_column(Float)
    source: Mapped[str] = mapped_column(String(20))
    cached_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
