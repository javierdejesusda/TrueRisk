from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class PropertyReportRequest(BaseModel):
    address: str = Field(max_length=500)
    include_pdf: bool = False


class GeocodingResponse(BaseModel):
    formatted_address: str
    latitude: float
    longitude: float
    province_code: str
    municipality_code: str | None = None
    confidence: float


class FloodZoneDetail(BaseModel):
    in_arpsi_zone: bool
    zone_id: str | None = None
    zone_name: str | None = None
    zone_type: str | None = None  # fluvial, pluvial, coastal
    return_period: str | None = None  # T10, T100, T500
    risk_level: str | None = None
    distance_to_nearest_zone_m: float | None = None


class WildfireProximityDetail(BaseModel):
    elevation_m: float
    slope_pct: float
    modifier: float
    explanation: str


class TerrainDetail(BaseModel):
    elevation_m: float
    slope_pct: float


class HazardScoreDetail(BaseModel):
    score: float
    severity: str  # low, moderate, high, very_high, critical
    province_score: float
    modifier: float
    explanation: str


class PropertyReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    report_id: str
    address_text: str
    formatted_address: str
    latitude: float
    longitude: float
    province_code: str
    province_name: str
    municipality_code: str | None = None

    composite_score: float
    dominant_hazard: str
    severity: str

    flood: HazardScoreDetail
    wildfire: HazardScoreDetail
    heatwave: HazardScoreDetail
    drought: HazardScoreDetail
    coldwave: HazardScoreDetail
    windstorm: HazardScoreDetail
    seismic: HazardScoreDetail

    flood_zone: FloodZoneDetail
    wildfire_proximity: WildfireProximityDetail
    terrain: TerrainDetail

    computed_at: str  # ISO datetime string
    expires_at: str | None = None
    pdf_available: bool = False
    share_url: str


class PropertyReportListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    report_id: str
    address_text: str
    formatted_address: str
    composite_score: float
    severity: str
    dominant_hazard: str
    computed_at: str
