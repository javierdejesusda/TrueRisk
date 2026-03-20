from sqlalchemy import String, Float, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Province(Base):
    __tablename__ = "provinces"

    ine_code: Mapped[str] = mapped_column(String(2), primary_key=True)
    name: Mapped[str] = mapped_column(String(50))
    region: Mapped[str] = mapped_column(String(50))
    capital_name: Mapped[str] = mapped_column(String(50))
    capital_municipality_code: Mapped[str] = mapped_column(String(5))
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    elevation_m: Mapped[float] = mapped_column(Float, default=0.0)
    river_basin: Mapped[str] = mapped_column(String(50), default="")
    coastal: Mapped[bool] = mapped_column(Boolean, default=False)
    mediterranean: Mapped[bool] = mapped_column(Boolean, default=False)
    flood_risk_weight: Mapped[float] = mapped_column(Float, default=0.3)
    wildfire_risk_weight: Mapped[float] = mapped_column(Float, default=0.3)
    drought_risk_weight: Mapped[float] = mapped_column(Float, default=0.3)
    heatwave_risk_weight: Mapped[float] = mapped_column(Float, default=0.3)
    seismic_risk_weight: Mapped[float] = mapped_column(Float, default=0.3)
    coldwave_risk_weight: Mapped[float] = mapped_column(Float, default=0.3)
    windstorm_risk_weight: Mapped[float] = mapped_column(Float, default=0.3)
