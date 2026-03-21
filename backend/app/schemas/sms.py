"""SMS subscription schemas."""

from pydantic import BaseModel, Field


class SmsSubscribeRequest(BaseModel):
    phone_number: str = Field(pattern=r"^\+[1-9]\d{6,14}$")
    province_code: str = Field(max_length=2)


class SmsSubscribeResponse(BaseModel):
    id: int
    status: str = "subscribed"
