from __future__ import annotations

import re

from pydantic import BaseModel, ConfigDict, field_validator


class RegisterRequest(BaseModel):
    nickname: str
    password: str
    email: str | None = None
    province_code: str = "28"

    @field_validator("password")
    @classmethod
    def validate_password_complexity(cls, v: str) -> str:
        if len(v) < 10:
            raise ValueError("Password must be at least 10 characters long")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one digit")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>\-_=+\[\]\\;'/`~]", v):
            raise ValueError("Password must contain at least one special character")
        return v


class LoginRequest(BaseModel):
    nickname: str
    password: str


class OAuthLinkRequest(BaseModel):
    provider: str
    provider_account_id: str
    email: str
    display_name: str | None = None
    avatar_url: str | None = None


class ProfileUpdateRequest(BaseModel):
    display_name: str | None = None
    province_code: str | None = None
    residence_type: str | None = None
    special_needs: list[str] | None = None
    emergency_contact_name: str | None = None
    emergency_contact_phone: str | None = None
    phone_number: str | None = None
    medical_conditions: str | None = None
    mobility_level: str | None = None
    has_vehicle: bool | None = None
    has_ac: bool | None = None
    floor_level: int | None = None
    age_range: str | None = None
    alert_severity_threshold: int | None = None
    alert_delivery: str | None = None
    hazard_preferences: list[str] | None = None
    whatsapp_enabled: bool | None = None
    email_notifications_enabled: bool | None = None
    # Household
    household_members: list[dict] | None = None
    pet_details: list[dict] | None = None
    # Building
    construction_year: int | None = None
    building_materials: str | None = None
    building_stories: int | None = None
    has_basement: bool | None = None
    has_elevator: bool | None = None
    building_condition: int | None = None
    # Economic
    income_bracket: str | None = None
    has_property_insurance: bool | None = None
    has_life_insurance: bool | None = None
    property_value_range: str | None = None
    has_emergency_savings: bool | None = None
    # Infrastructure
    has_power_dependent_medical: bool | None = None
    has_water_storage: bool | None = None
    has_generator_or_solar: bool | None = None
    depends_public_water: bool | None = None
    # Location
    home_latitude: float | None = None
    home_longitude: float | None = None
    home_address: str | None = None
    work_latitude: float | None = None
    work_longitude: float | None = None
    work_address: str | None = None
    work_province_code: str | None = None
    # Preferences
    language_preference: str | None = None
    disaster_experience: list[dict] | None = None

    @field_validator("construction_year")
    @classmethod
    def validate_construction_year(cls, v):
        if v is not None and (v < 1800 or v > 2030):
            raise ValueError("Construction year must be between 1800 and 2030")
        return v

    @field_validator("building_condition")
    @classmethod
    def validate_building_condition(cls, v):
        if v is not None and (v < 1 or v > 5):
            raise ValueError("Building condition must be between 1 and 5")
        return v

    @field_validator("language_preference")
    @classmethod
    def validate_language(cls, v):
        if v is not None and v not in ("es", "ca", "eu", "gl", "en"):
            raise ValueError("Language must be one of: es, ca, eu, gl, en")
        return v


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str | None = None
    nickname: str | None = None
    display_name: str | None = None
    avatar_url: str | None = None
    auth_provider: str
    role: str
    province_code: str
    residence_type: str
    special_needs: list | dict
    emergency_contact_name: str | None = None
    emergency_contact_phone: str | None = None
    phone_number: str | None = None
    medical_conditions: str | None = None
    mobility_level: str
    has_vehicle: bool
    has_ac: bool
    floor_level: int | None = None
    age_range: str | None = None
    alert_severity_threshold: int
    alert_delivery: str
    hazard_preferences: list | dict
    whatsapp_enabled: bool = False
    email_notifications_enabled: bool = False
    telegram_chat_id: str | None = None
    # Enhanced settings
    household_members: list | dict | None = None
    pet_details: list | dict | None = None
    construction_year: int | None = None
    building_materials: str | None = None
    building_stories: int | None = None
    has_basement: bool | None = None
    has_elevator: bool | None = None
    building_condition: int | None = None
    income_bracket: str | None = None
    has_property_insurance: bool | None = None
    has_life_insurance: bool | None = None
    property_value_range: str | None = None
    has_emergency_savings: bool | None = None
    has_power_dependent_medical: bool | None = None
    has_water_storage: bool | None = None
    has_generator_or_solar: bool | None = None
    depends_public_water: bool | None = None
    home_latitude: float | None = None
    home_longitude: float | None = None
    home_address: str | None = None
    work_latitude: float | None = None
    work_longitude: float | None = None
    work_address: str | None = None
    work_province_code: str | None = None
    language_preference: str | None = None
    disaster_experience: list | dict | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_password_complexity(cls, v: str) -> str:
        if len(v) < 10:
            raise ValueError("Password must be at least 10 characters long")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one digit")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>\-_=+\[\]\\;'/`~]", v):
            raise ValueError("Password must contain at least one special character")
        return v
