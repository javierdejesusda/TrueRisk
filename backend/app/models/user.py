from datetime import datetime

from sqlalchemy import String, JSON, DateTime, Boolean, Integer, Float, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.security.field_encryption import EncryptedString


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
    emergency_contact_name: Mapped[str | None] = mapped_column(EncryptedString(200), nullable=True)
    emergency_contact_phone: Mapped[str | None] = mapped_column(EncryptedString(100), nullable=True)
    phone_number: Mapped[str | None] = mapped_column(EncryptedString(100), nullable=True)
    whatsapp_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    telegram_chat_id: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Health & mobility
    medical_conditions: Mapped[str | None] = mapped_column(EncryptedString(1000), nullable=True)
    mobility_level: Mapped[str] = mapped_column(String(20), default="full")
    has_vehicle: Mapped[bool] = mapped_column(Boolean, default=False)
    has_ac: Mapped[bool] = mapped_column(Boolean, default=True)
    floor_level: Mapped[int | None] = mapped_column(Integer, nullable=True)
    age_range: Mapped[str | None] = mapped_column(String(10), nullable=True)  # "0-5", "6-17", "18-64", "65+"

    # Household composition
    household_members: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    pet_details: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Building details
    construction_year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    building_materials: Mapped[str | None] = mapped_column(String(30), nullable=True)
    building_stories: Mapped[int | None] = mapped_column(Integer, nullable=True)
    has_basement: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    has_elevator: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    building_condition: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Economic vulnerability
    income_bracket: Mapped[str | None] = mapped_column(String(20), nullable=True)
    has_property_insurance: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    has_life_insurance: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    property_value_range: Mapped[str | None] = mapped_column(String(20), nullable=True)
    has_emergency_savings: Mapped[bool | None] = mapped_column(Boolean, nullable=True)

    # Infrastructure dependencies
    has_power_dependent_medical: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    has_water_storage: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    has_generator_or_solar: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    depends_public_water: Mapped[bool | None] = mapped_column(Boolean, nullable=True)

    # Precise home location
    home_latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    home_longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    home_address: Mapped[str | None] = mapped_column(EncryptedString(500), nullable=True)

    # Work/school location
    work_latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    work_longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    work_address: Mapped[str | None] = mapped_column(EncryptedString(500), nullable=True)
    work_province_code: Mapped[str | None] = mapped_column(String(2), nullable=True)

    # Language preference
    language_preference: Mapped[str | None] = mapped_column(String(5), nullable=True)

    # Disaster experience
    disaster_experience: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Alert preferences
    alert_severity_threshold: Mapped[int] = mapped_column(Integer, default=3)
    alert_delivery: Mapped[str] = mapped_column(String(10), default="push")
    hazard_preferences: Mapped[dict] = mapped_column(JSON, default=list)

    # Preparedness
    preparedness_score: Mapped[float] = mapped_column(Float, default=0.0)

    # GPS location (updated by client when user grants location permission)
    last_latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    last_longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    last_location_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )
