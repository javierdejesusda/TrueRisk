from datetime import datetime
from typing import Optional

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
    dana_score: float = 0.0
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
    dana_score: float = 0.0


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
    dana_score: float = 0.0
    composite_score: float
    dominant_hazard: str
    severity: str
    computed_at: datetime
    province_name: str
    user_vulnerability_score: float


class FeatureContribution(BaseModel):
    feature: str
    value: float
    contribution: float
    description: str


class HazardExplanation(BaseModel):
    hazard: str
    score: float
    contributions: list[FeatureContribution]


class RiskExplainResponse(BaseModel):
    province_code: str
    computed_at: datetime
    hazards: list[HazardExplanation]


class ModelMetrics(BaseModel):
    accuracy: float
    f1_score: float
    auc_roc: Optional[float] = None


class ModelInfo(BaseModel):
    id: str
    name: str
    method: str
    description: str
    feature_count: int
    features: list[str]
    architecture: str
    metrics: ModelMetrics


class ModelRegistryResponse(BaseModel):
    models: list[ModelInfo]
    total: int
