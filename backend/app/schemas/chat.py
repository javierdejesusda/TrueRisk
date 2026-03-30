from __future__ import annotations

from pydantic import BaseModel, field_validator


class ChatSendRequest(BaseModel):
    message: str
    conversation_id: str | None = None
    locale: str = "es"

    @field_validator("message")
    @classmethod
    def validate_message(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Message must not be empty")
        if len(v) > 500:
            raise ValueError("Message must not exceed 500 characters")
        return v

    @field_validator("locale")
    @classmethod
    def validate_locale(cls, v: str) -> str:
        if v not in ("es", "en"):
            raise ValueError("Locale must be 'es' or 'en'")
        return v


class ChatUsageResponse(BaseModel):
    messages_today: int
    messages_limit_hourly: int
    messages_limit_daily: int
    tokens_today: int
    tokens_limit_daily: int
    tokens_month: int
    tokens_limit_monthly: int
    can_send: bool
    next_available_at: str | None = None


class ChatHistoryResponse(BaseModel):
    conversation_id: str
    messages: list[dict]
    message_count: int
