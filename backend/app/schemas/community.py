from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class CommunityReportCreate(BaseModel):
    province_code: str = Field(min_length=1, max_length=2, pattern=r"^\d{1,2}$")
    hazard_type: Literal["flood", "road_blocked", "power_outage", "structural_damage", "other"]
    severity: int = Field(ge=1, le=5)
    latitude: float = Field(ge=27.0, le=44.0)
    longitude: float = Field(ge=-19.0, le=5.0)
    description: str | None = Field(default=None, max_length=1000)


class CommunityReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    province_code: str
    hazard_type: str
    severity: int
    latitude: float
    longitude: float
    description: str | None
    status: str
    upvotes: int
    created_at: str
    expires_at: str
