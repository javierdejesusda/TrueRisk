from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class SafetyCheckInCreate(BaseModel):
    status: Literal["safe", "need_help", "evacuating", "sheltering"]
    message: str | None = Field(default=None, max_length=500)
    latitude: float | None = None
    longitude: float | None = None


class SafetyCheckInResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    province_code: str
    latitude: float | None
    longitude: float | None
    status: str
    message: str | None
    checked_in_at: datetime
    expires_at: datetime


class FamilyLinkCreate(BaseModel):
    nickname: str
    relationship: Literal["family", "friend", "neighbor"] = "family"


class FamilyLinkResponse(BaseModel):
    id: int
    user_id: int
    linked_user_id: int
    relationship: str
    status: str
    created_at: datetime
    linked_user_nickname: str
    linked_user_display_name: str | None


class FamilyStatusResponse(BaseModel):
    user_id: int
    nickname: str
    display_name: str | None
    latest_check_in: SafetyCheckInResponse | None
    relationship: str
