from datetime import datetime

from sqlalchemy import String, JSON, DateTime, Boolean, Integer, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # Auth fields
    email: Mapped[str | None] = mapped_column(String(255), unique=True, index=True, nullable=True)
    nickname: Mapped[str | None] = mapped_column(String(50), unique=True, index=True, nullable=True)
    password_hash: Mapped[str | None] = mapped_column(String(128), nullable=True)
    display_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    auth_provider: Mapped[str] = mapped_column(String(20), default="credentials")
    provider_account_id: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Role
    role: Mapped[str] = mapped_column(String(20), default="citizen")

    # Location & residence
    province_code: Mapped[str] = mapped_column(String(2), default="28")
    residence_type: Mapped[str] = mapped_column(String(30), default="piso_alto")
    special_needs: Mapped[dict] = mapped_column(JSON, default=list)

    # Emergency contact
    emergency_contact_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    emergency_contact_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    phone_number: Mapped[str | None] = mapped_column(String(20), nullable=True)

    # Health & mobility
    medical_conditions: Mapped[str | None] = mapped_column(String(500), nullable=True)
    mobility_level: Mapped[str] = mapped_column(String(20), default="full")
    has_vehicle: Mapped[bool] = mapped_column(Boolean, default=False)

    # Alert preferences
    alert_severity_threshold: Mapped[int] = mapped_column(Integer, default=3)
    alert_delivery: Mapped[str] = mapped_column(String(10), default="push")
    hazard_preferences: Mapped[dict] = mapped_column(JSON, default=list)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )
