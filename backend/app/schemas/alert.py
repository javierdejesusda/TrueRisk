from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class AlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    severity: int
    hazard_type: str
    province_code: str | None
    title: str
    description: str
    source: str
    is_active: bool
    onset: datetime | None
    expires: datetime | None
    created_at: datetime
    updated_at: datetime


class AlertCreate(BaseModel):
    severity: int = Field(ge=1, le=5)
    hazard_type: str
    province_code: str | None = None
    title: str
    description: str
    onset: datetime | None = None
    expires: datetime | None = None


class AlertUpdate(BaseModel):
    severity: int | None = None
    hazard_type: str | None = None
    title: str | None = None
    description: str | None = None
    is_active: bool | None = None


class AemetAlertResponse(BaseModel):
    identifier: str
    sender: str
    sent: str
    severity: str
    event: str
    headline: str
    description: str
    area_desc: str
    geocode: str
    onset: str
    expires: str
