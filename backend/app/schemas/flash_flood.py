"""Pydantic schemas for flash flood monitoring endpoints."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class FloodAlertResponse(BaseModel):
    gauge_id: str
    gauge_name: str
    river_name: str
    basin: str
    province_code: str
    flow_m3s: float
    threshold_exceeded: str
    severity: int
    message: str


class GaugeStatusResponse(BaseModel):
    gauge_id: str
    name: str
    basin: str
    river: str | None = None
    province_code: str | None = None
    lat: float | None = None
    lon: float | None = None
    flow_m3s: float | None = None
    level_m: float | None = None
    threshold_p90: float | None = None
    threshold_p95: float | None = None
    threshold_p99: float | None = None
    status: str = "ok"


class MonitoringStatusResponse(BaseModel):
    basins_configured: int
    basins_active: list[str]
    total_gauges_in_db: int
    active_flood_alerts: int
    last_reading_at: datetime | None = None


class ReadingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    gauge_id: str
    flow_m3s: float
    level_m: float | None = None
    recorded_at: datetime
    source: str


class FloodCheckResult(BaseModel):
    readings_stored: int
    alerts_created: int
    flood_conditions: list[FloodAlertResponse]
