from datetime import datetime

from pydantic import BaseModel, ConfigDict


class CurrentWeather(BaseModel):
    province_code: str
    temperature: float
    humidity: float
    precipitation: float
    wind_speed: float | None = None
    wind_direction: float | None = None
    wind_gusts: float | None = None
    pressure: float | None = None
    soil_moisture: float | None = None
    uv_index: float | None = None
    dew_point: float | None = None
    cloud_cover: float | None = None
    recorded_at: datetime


class HourlyForecast(BaseModel):
    time: str
    temperature: float
    humidity: float
    precipitation: float
    wind_speed: float
    wind_direction: float | None = None
    pressure: float | None = None
    cloud_cover: float | None = None


class DailyForecast(BaseModel):
    date: str
    temperature_max: float
    temperature_min: float
    precipitation_sum: float
    wind_speed_max: float
    uv_index_max: float | None = None
    et0_evapotranspiration: float | None = None


class ForecastResponse(BaseModel):
    province_code: str
    hourly: list[HourlyForecast]
    daily: list[DailyForecast]


class WeatherRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    province_code: str
    source: str
    temperature: float
    humidity: float
    precipitation: float
    wind_speed: float | None
    wind_direction: float | None
    wind_gusts: float | None
    pressure: float | None
    soil_moisture: float | None
    uv_index: float | None
    dew_point: float | None
    cloud_cover: float | None
    raw_data: dict
    recorded_at: datetime
    created_at: datetime
