from datetime import datetime

from pydantic import BaseModel, ConfigDict


class RiskScoreResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    province_code: str
    flood_score: float
    wildfire_score: float
    drought_score: float
    heatwave_score: float
    seismic_score: float = 0.0
    coldwave_score: float = 0.0
    windstorm_score: float = 0.0
    composite_score: float
    dominant_hazard: str
    severity: str
    computed_at: datetime


class RiskMapEntry(BaseModel):
    province_code: str
    province_name: str
    latitude: float
    longitude: float
    composite_score: float
    dominant_hazard: str
    severity: str
    flood_score: float
    wildfire_score: float
    drought_score: float
    heatwave_score: float
    seismic_score: float = 0.0
    coldwave_score: float = 0.0
    windstorm_score: float = 0.0


class RiskMapResponse(BaseModel):
    provinces: list[RiskMapEntry]
    computed_at: datetime


class UserRiskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    province_code: str
    flood_score: float
    wildfire_score: float
    drought_score: float
    heatwave_score: float
    seismic_score: float = 0.0
    coldwave_score: float = 0.0
    windstorm_score: float = 0.0
    composite_score: float
    dominant_hazard: str
    severity: str
    computed_at: datetime
    province_name: str
    user_vulnerability_score: float
