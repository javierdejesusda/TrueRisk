"""Pre-generated risk narrative model."""

from datetime import datetime

from sqlalchemy import String, Text, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class RiskNarrative(Base):
    __tablename__ = "risk_narratives"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    province_code: Mapped[str] = mapped_column(String(2), index=True)
    narrative_type: Mapped[str] = mapped_column(String(20))  # morning, emergency, weekly
    content_es: Mapped[str] = mapped_column(Text)
    content_en: Mapped[str] = mapped_column(Text)
    generated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
