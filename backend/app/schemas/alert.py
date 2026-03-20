from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


HAZARD_TYPES = Literal[
    "flood", "wildfire", "drought", "heatwave", "seismic", "coldwave", "windstorm"
]


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
    hazard_type: HAZARD_TYPES
    province_code: str | None = Field(default=None, max_length=2)
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1, max_length=2000)
    onset: datetime | None = None
    expires: datetime | None = None


class AlertUpdate(BaseModel):
    severity: int | None = Field(default=None, ge=1, le=5)
    hazard_type: HAZARD_TYPES | None = None
    title: str | None = Field(default=None, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
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
