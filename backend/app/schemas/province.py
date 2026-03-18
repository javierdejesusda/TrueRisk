from pydantic import BaseModel, ConfigDict


class ProvinceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    ine_code: str
    name: str
    region: str
    capital_name: str
    capital_municipality_code: str
    latitude: float
    longitude: float
    elevation_m: float
    river_basin: str
    coastal: bool
    mediterranean: bool
    flood_risk_weight: float
    wildfire_risk_weight: float
    drought_risk_weight: float
    heatwave_risk_weight: float


class ProvinceListResponse(BaseModel):
    provinces: list[ProvinceResponse]
    count: int
