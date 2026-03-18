from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class RegisterRequest(BaseModel):
    nickname: str = Field(min_length=3)
    password: str = Field(min_length=6)
    province_code: str = "28"
    residence_type: str = "piso_alto"
    special_needs: list[str] = []


class LoginRequest(BaseModel):
    nickname: str
    password: str


class ProfileUpdate(BaseModel):
    province_code: str | None = None
    residence_type: str | None = None
    special_needs: list[str] | None = None


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nickname: str
    role: str
    province_code: str
    residence_type: str
    special_needs: list[str]
    created_at: datetime


class SessionResponse(BaseModel):
    user: UserResponse
