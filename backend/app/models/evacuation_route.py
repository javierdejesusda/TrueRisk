"""Evacuation routes and safe points for emergency routing."""

from sqlalchemy import String, Float, Integer, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class SafePoint(Base):
    __tablename__ = "safe_points"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    province_code: Mapped[str] = mapped_column(String(2), index=True)
    name: Mapped[str] = mapped_column(String(200))
    point_type: Mapped[str] = mapped_column(String(30))  # hospital, shelter, fire_station, high_ground, police
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    capacity: Mapped[int | None] = mapped_column(Integer, nullable=True)
    address: Mapped[str | None] = mapped_column(String(300), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
