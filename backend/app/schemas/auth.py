from __future__ import annotations

from pydantic import BaseModel, ConfigDict


class RegisterRequest(BaseModel):
    nickname: str
    password: str
    email: str | None = None
    province_code: str = "28"


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


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
