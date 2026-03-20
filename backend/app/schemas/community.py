from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class CommunityReportCreate(BaseModel):
    province_code: str
    hazard_type: Literal["flood", "road_blocked", "power_outage", "structural_damage", "other"]
    severity: int = Field(ge=1, le=5)
    latitude: float
    longitude: float
    description: str | None = None


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
