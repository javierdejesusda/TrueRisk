from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel


class HorizonPrediction(BaseModel):
    horizon_hours: int
    q10: float
    q50: float
    q90: float


class HazardForecast(BaseModel):
    hazard: str
    horizons: list[HorizonPrediction]
    attention_weights: dict[str, float]


class ForecastResponse(BaseModel):
    province_code: str
    computed_at: datetime | None
    hazards: list[HazardForecast]
