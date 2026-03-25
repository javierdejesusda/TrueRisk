"""Risk service -- orchestrates weather ingestion, feature engineering, and
ML model inference to produce composite risk scores for Spanish provinces.
"""

from __future__ import annotations

import logging
import math
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.data import open_meteo
from app.services.data_health_service import health_tracker
from app.data.ign_seismic import compute_province_seismic_exposure, fetch_recent_quakes
from app.data.province_data import PROVINCES
from app.ml.models.coldwave_risk import predict_coldwave_risk
from app.ml.models.composite_risk import compute_composite_risk
from app.ml.models.drought_risk import predict_drought_risk
from app.ml.models.flood_risk import predict_flood_risk
from app.ml.models.heatwave_risk import predict_heatwave_risk
from app.ml.models.seismic_risk import predict_seismic_risk
from app.ml.models.wildfire_risk import predict_wildfire_risk
from app.ml.models.windstorm_risk import predict_windstorm_risk
from app.ml.models.dana_risk import predict_dana_risk
from app.ml.features.fwi import compute_fwi_components
from app.ml.features.spei import compute_spei
from app.models.province import Province
from app.models.risk_score import RiskScore
from app.models.weather_daily_summary import WeatherDailySummary
from app.models.weather_record import WeatherRecord

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Terrain / geographic helpers
# ---------------------------------------------------------------------------

def get_terrain_features(province_code: str) -> dict[str, Any]:
    """Return static geographic features for a province from the seed data."""
    data = PROVINCES.get(province_code, {})
    return {
        "elevation_m": data.get("elevation_m", 200.0),
        "is_coastal": float(data.get("coastal", False)),
        "is_mediterranean": float(data.get("mediterranean", False)),
        "river_basin_risk": data.get("flood_risk_weight", 0.3),
        "latitude": data.get("latitude", 40.0),
    }


def get_hazard_weights(province_code: str) -> dict[str, float]:
    """Return province-specific hazard weights (0..1) that scale raw model scores."""
    data = PROVINCES.get(province_code, {})
    return {
        "flood": data.get("flood_risk_weight", 0.5),
        "wildfire": data.get("wildfire_risk_weight", 0.5),
        "drought": data.get("drought_risk_weight", 0.5),
        "heatwave": data.get("heatwave_risk_weight", 0.5),
        "seismic": data.get("seismic_risk_weight", 0.3),
        "coldwave": data.get("coldwave_risk_weight", 0.3),
        "windstorm": data.get("windstorm_risk_weight", 0.3),
        "dana": data.get("dana_risk_weight", 0.4),
    }


def _season_components(month: int) -> tuple[float, float]:
    """Return (sin, cos) encoding for the month so seasonal patterns are smooth."""
    angle = 2 * math.pi * (month - 1) / 12
    return round(math.sin(angle), 6), round(math.cos(angle), 6)


def _compute_confidence(weather_record_age_hours: float, sources_used: int) -> float:
    """Compute a 0-1 confidence score based on data freshness and source count."""
    freshness = max(0.0, 1.0 - (weather_record_age_hours / 12.0))
    source_coverage = min(1.0, sources_used / 3.0)
    return round(freshness * 0.6 + source_coverage * 0.4, 2)


# ---------------------------------------------------------------------------
# Temporal feature engineering from weather history
# ---------------------------------------------------------------------------

def _safe(value: Any, default: float = 0.0) -> float:
    """Coerce *value* to float, falling back to *default* on None / error."""
    if value is None:
        return default
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def compute_temporal_features(history: list[dict[str, Any]]) -> dict[str, Any]:
    """Derive rolling / cumulative features from a list of recent weather records.

    *history* should be ordered newest-first (as returned by a descending
    ``ORDER BY recorded_at`` query).
    """
    if not history:
        return _empty_temporal()

    precips = [_safe(r.get("precipitation")) for r in history]
    temps = [_safe(r.get("temperature")) for r in history]
    humidities = [_safe(r.get("humidity")) for r in history]
    soils = [_safe(r.get("soil_moisture"), 0.3) for r in history]
    pressures = [_safe(r.get("pressure")) for r in history]

    # Precipitation accumulators (most-recent first)
    precip_1h = precips[0] if precips else 0.0
    precip_6h = sum(precips[:6])
    precip_24h = sum(precips[:24])
    precip_48h = sum(precips[:48])
    precip_7d = sum(precips[:168])
    precip_30d = sum(precips[:720])

    # 7-day anomaly vs 30-day average
    avg_precip_30d = (precip_30d / min(len(precips), 720)) if precips else 0
    avg_precip_7d = (precip_7d / min(len(precips[:168]), 168)) if precips else 0
    precip_7day_anomaly = avg_precip_7d - avg_precip_30d

    # Consecutive rain days (any hour with precip > 0.1 counts)
    consecutive_rain_days = 0
    daily_rain_count = 0
    for i in range(0, min(len(precips), 720), 24):
        day_precip = sum(precips[i : i + 24])
        if day_precip > 0.1:
            daily_rain_count += 1
        else:
            break
    consecutive_rain_days = daily_rain_count

    # Consecutive dry days (precip < 0.1 mm total per day)
    consecutive_dry_days = 0
    for i in range(0, min(len(precips), 720), 24):
        day_precip = sum(precips[i : i + 24])
        if day_precip < 0.1:
            consecutive_dry_days += 1
        else:
            break

    # Max hourly precip intensity ratio (last 24h)
    max_precip_1h = max(precips[:24]) if precips[:24] else 0
    max_precip_intensity_ratio = (
        (max_precip_1h / precip_24h) if precip_24h > 0 else 0
    )

    # Pressure change over 6h
    pressure_now = pressures[0] if pressures else 1013.0
    pressure_6h_ago = pressures[5] if len(pressures) > 5 else pressure_now
    pressure_change_6h = pressure_now - pressure_6h_ago

    # Soil moisture change over 24h
    soil_now = soils[0] if soils else 0.3
    soil_24h_ago = soils[23] if len(soils) > 23 else soil_now
    soil_moisture_change_24h = soil_now - soil_24h_ago

    # Dew-point depression (requires current temp and dew point)
    dew_point = _safe(history[0].get("dew_point")) if history else None
    dew_point_depression = (
        (temps[0] - dew_point) if (temps and dew_point is not None) else 5.0
    )

    # Temperature statistics
    temp_max = max(temps[:24]) if temps[:24] else 20.0
    temp_min = min(temps[:24]) if temps[:24] else 10.0
    temp_max_7d = max(temps[:168]) if temps[:168] else 20.0

    # Humidity min over 7 days
    humidity_min_7d = min(humidities[:168]) if humidities[:168] else 30.0

    # Consecutive hot days / nights
    consecutive_hot_days = 0
    consecutive_hot_nights = 0
    for i in range(0, min(len(temps), 168), 24):
        day_temps = temps[i : i + 24]
        if day_temps and max(day_temps) > 35:
            consecutive_hot_days += 1
        else:
            break
    for i in range(0, min(len(temps), 168), 24):
        # "Night" hours: approximate with the minimum of the day block
        day_temps = temps[i : i + 24]
        if day_temps and min(day_temps) > 20:
            consecutive_hot_nights += 1
        else:
            break

    # Wind gust max
    gusts = [_safe(r.get("wind_gusts")) for r in history[:24]]
    wind_gust_max = max(gusts) if gusts else 0.0

    # Wind speed max 24h
    winds_24h = [_safe(r.get("wind_speed")) for r in history[:24]]
    wind_speed_max_24h = max(winds_24h) if winds_24h else 0.0

    # Pressure change over 24h
    pressure_24h_ago = pressures[23] if len(pressures) > 23 else pressure_now
    pressure_change_24h = pressure_now - pressure_24h_ago

    # Pressure min over 24h
    pressure_min_24h = min(pressures[:24]) if pressures[:24] else 1013.0

    # Cold wave features
    # Temperature min over 7 days
    temp_min_7d = min(temps[:168]) if temps[:168] else 10.0

    # Consecutive cold days (max temp < 5C in any 24h block)
    consecutive_cold_days = 0
    for i in range(0, min(len(temps), 168), 24):
        day_temps = temps[i : i + 24]
        if day_temps and max(day_temps) < 5:
            consecutive_cold_days += 1
        else:
            break

    # Consecutive cold nights (min temp < 0C)
    consecutive_cold_nights = 0
    for i in range(0, min(len(temps), 168), 24):
        day_temps = temps[i : i + 24]
        if day_temps and min(day_temps) < 0:
            consecutive_cold_nights += 1
        else:
            break

    return {
        "precip_1h": precip_1h,
        "precip_6h": precip_6h,
        "precip_24h": precip_24h,
        "precip_48h": precip_48h,
        "precip_forecast_24h": 0.0,  # populated separately from forecast API
        "precip_7day_anomaly": precip_7day_anomaly,
        "consecutive_rain_days": consecutive_rain_days,
        "consecutive_dry_days": consecutive_dry_days,
        "max_precip_intensity_ratio": max_precip_intensity_ratio,
        "pressure_change_6h": pressure_change_6h,
        "soil_moisture_change_24h": soil_moisture_change_24h,
        "dew_point_depression": dew_point_depression,
        "precipitation_7d": precip_7d,
        "precipitation_30d": precip_30d,
        "temperature_max": temp_max,
        "temperature_min": temp_min,
        "temperature_max_7d": temp_max_7d,
        "humidity_min_7d": humidity_min_7d,
        "consecutive_hot_days": consecutive_hot_days,
        "consecutive_hot_nights": consecutive_hot_nights,
        "wind_gust_max": wind_gust_max,
        "wind_speed_max_24h": wind_speed_max_24h,
        "pressure_change_24h": pressure_change_24h,
        "pressure_min_24h": pressure_min_24h,
        "temperature_min_7d": temp_min_7d,
        "consecutive_cold_days": consecutive_cold_days,
        "consecutive_cold_nights": consecutive_cold_nights,
    }


def _empty_temporal() -> dict[str, Any]:
    """Return zeroed-out temporal features when no history is available."""
    return {
        "precip_1h": 0.0,
        "precip_6h": 0.0,
        "precip_24h": 0.0,
        "precip_48h": 0.0,
        "precip_forecast_24h": 0.0,
        "precip_7day_anomaly": 0.0,
        "consecutive_rain_days": 0,
        "consecutive_dry_days": 0,
        "max_precip_intensity_ratio": 0.0,
        "pressure_change_6h": 0.0,
        "soil_moisture_change_24h": 0.0,
        "dew_point_depression": 5.0,
        "precipitation_7d": 0.0,
        "precipitation_30d": 0.0,
        "temperature_max": 20.0,
        "temperature_min": 10.0,
        "temperature_max_7d": 20.0,
        "humidity_min_7d": 30.0,
        "consecutive_hot_days": 0,
        "consecutive_hot_nights": 0,
        "wind_gust_max": 0.0,
        "wind_speed_max_24h": 0.0,
        "pressure_change_24h": 0.0,
        "pressure_min_24h": 1013.0,
        "temperature_min_7d": 10.0,
        "consecutive_cold_days": 0,
        "consecutive_cold_nights": 0,
    }


def _record_to_dict(record: WeatherRecord) -> dict[str, Any]:
    """Convert a WeatherRecord ORM object to a plain dict."""
    return {
        "temperature": record.temperature,
        "humidity": record.humidity,
        "precipitation": record.precipitation,
        "wind_speed": record.wind_speed,
        "wind_direction": record.wind_direction,
        "wind_gusts": record.wind_gusts,
        "pressure": record.pressure,
        "soil_moisture": record.soil_moisture,
        "uv_index": record.uv_index,
        "dew_point": record.dew_point,
        "cloud_cover": record.cloud_cover,
    }


# ---------------------------------------------------------------------------
# Heat-index helpers
# ---------------------------------------------------------------------------

def _compute_wind_chill(temperature: float, wind_speed_kmh: float) -> float:
    """Wind chill temperature (Celsius). Valid for temp<=10C, wind>=4.8km/h."""
    if temperature > 10 or wind_speed_kmh < 4.8:
        return temperature
    return (
        13.12
        + 0.6215 * temperature
        - 11.37 * wind_speed_kmh**0.16
        + 0.3965 * temperature * wind_speed_kmh**0.16
    )


def _compute_heat_index(temperature: float, humidity: float) -> float:
    """Rothfusz regression heat-index approximation (Celsius)."""
    # Convert to Fahrenheit for the standard formula
    tf = temperature * 9.0 / 5.0 + 32.0
    rh = humidity

    if tf < 80:
        # Simple formula below 80F
        hi_f = 0.5 * (tf + 61.0 + (tf - 68.0) * 1.2 + rh * 0.094)
    else:
        hi_f = (
            -42.379
            + 2.04901523 * tf
            + 10.14333127 * rh
            - 0.22475541 * tf * rh
            - 6.83783e-3 * tf * tf
            - 5.481717e-2 * rh * rh
            + 1.22874e-3 * tf * tf * rh
            + 8.5282e-4 * tf * rh * rh
            - 1.99e-6 * tf * tf * rh * rh
        )
    # Back to Celsius
    return round((hi_f - 32.0) * 5.0 / 9.0, 2)


def _compute_wbgt(temperature: float, humidity: float, wind_speed: float) -> float:
    """Simplified wet-bulb globe temperature estimate (outdoor, Celsius)."""
    # Stull (2011) wet-bulb approximation
    tw = temperature * math.atan(0.151977 * math.sqrt(humidity + 8.313659)) + (
        math.atan(temperature + humidity)
        - math.atan(humidity - 1.676331)
        + 0.00391838 * humidity**1.5 * math.atan(0.023101 * humidity)
        - 4.686035
    )
    # WBGT (outdoor) ~ 0.7*Tw + 0.2*Tg + 0.1*Td, simplified without globe temp
    wbgt = 0.7 * tw + 0.3 * temperature
    return round(wbgt, 2)


# ---------------------------------------------------------------------------
# Core pipeline
# ---------------------------------------------------------------------------

async def compute_province_risk(db: AsyncSession, province_code: str) -> dict:
    """Full pipeline: fetch weather -> compute features -> run 4 models -> composite -> store."""

    # 1. Get province data
    province = await db.get(Province, province_code)
    if not province:
        raise ValueError(f"Province {province_code} not found")

    # 2. Fetch current weather from Open-Meteo
    weather = await open_meteo.fetch_current(province.latitude, province.longitude)
    if not weather:
        weather = {}

    # 3. Get recent weather history from DB for temporal features
    stmt = (
        select(WeatherRecord)
        .where(WeatherRecord.province_code == province_code)
        .order_by(WeatherRecord.recorded_at.desc())
        .limit(720)  # ~30 days of hourly records
    )
    result = await db.execute(stmt)
    history = [_record_to_dict(r) for r in result.scalars().all()]

    # 3b. Get daily summaries for SPEI computation (last 360 days)
    #     Sub-select the most recent 360 rows, then re-order ascending
    #     so compute_spei receives chronological input.
    daily_sub = (
        select(WeatherDailySummary)
        .where(WeatherDailySummary.province_code == province_code)
        .order_by(WeatherDailySummary.date.desc())
        .limit(360)
    ).subquery()
    daily_stmt = select(WeatherDailySummary).join(
        daily_sub, WeatherDailySummary.id == daily_sub.c.id
    ).order_by(WeatherDailySummary.date.asc())
    daily_result = await db.execute(daily_stmt)
    daily_summaries = list(daily_result.scalars().all())

    # Compute SPEI from daily summaries
    if daily_summaries:
        spei_precip = [s.precipitation_sum for s in daily_summaries]
        spei_temp = [s.temperature_avg for s in daily_summaries]
        spei_values = compute_spei(spei_precip, spei_temp, latitude=province.latitude)
    else:
        spei_values = {"spei_1m": None, "spei_3m": None, "spei_6m": None}

    # 4. Compute features
    terrain = get_terrain_features(province_code)
    temporal = compute_temporal_features(history) if history else _empty_temporal()
    weights_data = PROVINCES.get(province_code, {})
    now = datetime.utcnow()
    month = now.month
    season_sin, season_cos = _season_components(month)

    # Current weather values (with safe defaults)
    temperature = _safe(weather.get("temperature"), 20.0)
    humidity = _safe(weather.get("humidity"), 50.0)
    wind_speed = _safe(weather.get("wind_speed"), 0.0)
    pressure = _safe(weather.get("pressure"), 1013.0)
    soil_moisture = _safe(weather.get("soil_moisture"), 0.3)
    cloud_cover = _safe(weather.get("cloud_cover"), 50.0)
    uv_index = _safe(weather.get("uv_index"), 0.0)
    _safe(weather.get("dew_point"), 10.0)  # available but not directly used here

    heat_index = _compute_heat_index(temperature, humidity)
    wbgt = _compute_wbgt(temperature, humidity, wind_speed)
    temperature_anomaly = temperature - 20.0  # crude baseline
    heat_wave_day = float(
        temporal.get("temperature_max", 20) > 35
        and temporal.get("temperature_min", 10) > 20
    )

    # --- Build per-model feature dicts --------------------------------------

    flood_features = {
        "precip_1h": temporal["precip_1h"],
        "precip_6h": temporal["precip_6h"],
        "precip_24h": temporal["precip_24h"],
        "precip_48h": temporal["precip_48h"],
        "precip_forecast_24h": temporal["precip_forecast_24h"],
        "humidity": humidity,
        "soil_moisture": soil_moisture,
        "soil_moisture_change_24h": temporal["soil_moisture_change_24h"],
        "wind_speed": wind_speed,
        "pressure": pressure,
        "pressure_change_6h": temporal["pressure_change_6h"],
        "dew_point_depression": temporal["dew_point_depression"],
        "cloud_cover": cloud_cover,
        "elevation_m": terrain["elevation_m"],
        "is_coastal": terrain["is_coastal"],
        "is_mediterranean": terrain["is_mediterranean"],
        "river_basin_risk": terrain["river_basin_risk"],
        "month": month,
        "season_sin": season_sin,
        "season_cos": season_cos,
        "precip_7day_anomaly": temporal["precip_7day_anomaly"],
        "consecutive_rain_days": temporal["consecutive_rain_days"],
        "max_precip_intensity_ratio": temporal["max_precip_intensity_ratio"],
    }

    # Compute FWI components from current weather data
    fwi_components = compute_fwi_components(
        temp_c=temperature,
        humidity_pct=humidity,
        wind_kmh=wind_speed,  # Open-Meteo returns km/h by default
        rain_mm=temporal["precip_24h"],
        month=month,
    )

    wildfire_features = {
        "ffmc": fwi_components["ffmc"],
        "dmc": fwi_components["dmc"],
        "dc": fwi_components["dc"],
        "isi": fwi_components["isi"],
        "bui": fwi_components["bui"],
        "fwi": fwi_components["fwi"],
        "temperature": temperature,
        "temperature_max_7d": temporal["temperature_max_7d"],
        "humidity": humidity,
        "humidity_min_7d": temporal["humidity_min_7d"],
        "wind_speed": wind_speed,
        "wind_gust_max": temporal["wind_gust_max"],
        "precipitation_7d": temporal["precipitation_7d"],
        "precipitation_30d": temporal["precipitation_30d"],
        "consecutive_dry_days": temporal["consecutive_dry_days"],
        "soil_moisture": soil_moisture,
        "uv_index": uv_index,
        "elevation_m": terrain["elevation_m"],
        "month": month,
        "is_coastal": terrain["is_coastal"],
    }

    drought_features = {
        "spei_1m": spei_values["spei_1m"],
        "spei_3m": spei_values["spei_3m"],
        "spei_6m": spei_values["spei_6m"],
        "soil_moisture": soil_moisture,
        "consecutive_dry_days": temporal["consecutive_dry_days"],
        "temperature": temperature,
        "humidity": humidity,
        "precipitation_30d": temporal["precipitation_30d"],
    }

    heatwave_features = {
        "temperature": temperature,
        "temperature_max": temporal["temperature_max"],
        "temperature_min": temporal["temperature_min"],
        "heat_index": heat_index,
        "wbgt": wbgt,
        "consecutive_hot_days": temporal["consecutive_hot_days"],
        "consecutive_hot_nights": temporal["consecutive_hot_nights"],
        "heat_wave_day": heat_wave_day,
        "humidity": humidity,
        "wind_speed": wind_speed,
        "uv_index": uv_index,
        "temperature_anomaly": temperature_anomaly,
        "temperature_forecast_48h_max": temporal["temperature_max"],  # best available proxy
        "month": month,
        "latitude": terrain["latitude"],
        "elevation_m": terrain["elevation_m"],
        "is_coastal": terrain["is_coastal"],
        "cloud_cover": cloud_cover,
    }

    # 4b. Seismic features (IGN earthquake data)
    quakes = await fetch_recent_quakes(days=90)
    seismic_exposure = compute_province_seismic_exposure(
        province.latitude, province.longitude, quakes
    )
    seismic_features = {
        **seismic_exposure,
        "seismic_zone_weight": weights_data.get("seismic_risk_weight", 0.3),
    }

    # 4c. Cold wave features
    wind_chill = _compute_wind_chill(temperature, wind_speed)  # Open-Meteo returns km/h
    coldwave_features = {
        "temperature": temperature,
        "temperature_min": temporal["temperature_min"],
        "temperature_min_7d": temporal["temperature_min_7d"],
        "wind_chill": wind_chill,
        "consecutive_cold_days": temporal["consecutive_cold_days"],
        "consecutive_cold_nights": temporal["consecutive_cold_nights"],
        "humidity": humidity,
        "wind_speed": wind_speed,
        "precipitation_24h": temporal["precip_24h"],
        "month": month,
        "latitude": terrain["latitude"],
        "elevation_m": terrain["elevation_m"],
        "is_coastal": terrain["is_coastal"],
        "cloud_cover": cloud_cover,
    }

    # 4d. Windstorm features
    windstorm_features = {
        "wind_speed": wind_speed,
        "wind_gusts": _safe(weather.get("wind_gusts"), 0.0),
        "wind_gust_max_24h": temporal["wind_gust_max"],
        "wind_speed_max_24h": temporal["wind_speed_max_24h"],
        "pressure": pressure,
        "pressure_change_6h": temporal["pressure_change_6h"],
        "pressure_change_24h": temporal["pressure_change_24h"],
        "pressure_min_24h": temporal["pressure_min_24h"],
        "humidity": humidity,
        "precipitation_6h": temporal["precip_6h"],
        "is_coastal": terrain["is_coastal"],
        "is_mediterranean": terrain["is_mediterranean"],
        "elevation_m": terrain["elevation_m"],
        "month": month,
    }

    # 4e-pre. Fetch upper-air data for DANA detection (CAPE, forecast precip)
    upper_air: dict[str, Any] = {}
    try:
        from app.data.open_meteo_upper_air import fetch_upper_air
        upper_air = await fetch_upper_air(
            province.latitude, province.longitude
        )
        temporal["precip_forecast_24h"] = upper_air.get(
            "precip_forecast_24h", 0.0
        )
    except Exception:
        logger.warning(
            "Failed to fetch upper-air data for %s, using defaults",
            province_code,
        )

    # 4e. DANA compound event features (reuses existing weather data + upper-air)
    dana_features = {
        "is_mediterranean": terrain["is_mediterranean"],
        "is_coastal": terrain["is_coastal"],
        "month": month,
        "latitude": terrain["latitude"],
        "precip_24h": temporal["precip_24h"],
        "precip_6h": temporal["precip_6h"],
        "temperature": temperature,
        "pressure_change_6h": temporal["pressure_change_6h"],
        "wind_gusts": _safe(weather.get("wind_gusts"), 0.0),
        "humidity": humidity,
        "cape_current": upper_air.get("cape_current", 0.0),
        "precip_forecast_6h": upper_air.get("precip_forecast_6h", 0.0),
    }

    # 5. Run models
    flood_raw = predict_flood_risk(flood_features)
    wildfire_raw = predict_wildfire_risk(wildfire_features)
    drought_raw = predict_drought_risk(drought_features)
    heatwave_raw = predict_heatwave_risk(heatwave_features)
    seismic_raw = predict_seismic_risk(seismic_features)
    coldwave_raw = predict_coldwave_risk(coldwave_features)
    windstorm_raw = predict_windstorm_risk(windstorm_features)
    dana_raw = predict_dana_risk(dana_features)

    # 5b. Apply province-specific hazard weights to differentiate risk by geography
    weights = get_hazard_weights(province_code)
    flood = min(100.0, flood_raw * (0.4 + 0.6 * weights["flood"]))
    wildfire = min(100.0, wildfire_raw * (0.4 + 0.6 * weights["wildfire"]))
    drought = min(100.0, drought_raw * (0.4 + 0.6 * weights["drought"]))
    heatwave = min(100.0, heatwave_raw * (0.4 + 0.6 * weights["heatwave"]))
    seismic = min(100.0, seismic_raw * (0.4 + 0.6 * weights["seismic"]))
    coldwave = min(100.0, coldwave_raw * (0.4 + 0.6 * weights["coldwave"]))
    windstorm = min(100.0, windstorm_raw * (0.4 + 0.6 * weights["windstorm"]))
    dana = min(100.0, dana_raw * (0.4 + 0.6 * weights["dana"]))

    # 6. Composite
    composite = compute_composite_risk(
        flood, wildfire, drought, heatwave, seismic, coldwave, windstorm, dana
    )

    # 7. Store in DB
    risk_score = RiskScore(
        province_code=province_code,
        composite_score=composite["composite_score"],
        dominant_hazard=composite["dominant_hazard"],
        severity=composite["severity"],
        flood_score=composite["flood_score"],
        wildfire_score=composite["wildfire_score"],
        drought_score=composite["drought_score"],
        heatwave_score=composite["heatwave_score"],
        seismic_score=composite["seismic_score"],
        coldwave_score=composite["coldwave_score"],
        windstorm_score=composite["windstorm_score"],
        dana_score=composite["dana_score"],
        features_snapshot={
            "flood": flood_features,
            "wildfire": wildfire_features,
            "drought": drought_features,
            "heatwave": heatwave_features,
            "seismic": seismic_features,
            "coldwave": coldwave_features,
            "windstorm": windstorm_features,
            "dana": dana_features,
        },
        computed_at=now,
    )
    db.add(risk_score)
    await db.commit()

    composite["province_code"] = province_code
    composite["computed_at"] = now.isoformat()

    # Compute confidence based on data freshness and source availability
    all_statuses = health_tracker.get_all_statuses()
    sources_used = sum(
        1 for s in all_statuses.values()
        if s.get("last_success") is not None and s.get("consecutive_failures", 0) == 0
    )

    # Determine weather data age from the most recent WeatherRecord
    weather_age_hours = 12.0  # pessimistic default
    if history:
        latest_stmt = (
            select(WeatherRecord.recorded_at)
            .where(WeatherRecord.province_code == province_code)
            .order_by(WeatherRecord.recorded_at.desc())
            .limit(1)
        )
        latest_result = await db.execute(latest_stmt)
        latest_ts = latest_result.scalar_one_or_none()
        if latest_ts:
            age_delta = datetime.now(timezone.utc) - (
                latest_ts.replace(tzinfo=timezone.utc) if latest_ts.tzinfo is None else latest_ts
            )
            weather_age_hours = age_delta.total_seconds() / 3600.0

    composite["confidence"] = _compute_confidence(weather_age_hours, sources_used)
    composite["data_sources_used"] = sources_used

    return composite


# ---------------------------------------------------------------------------
# Query helpers
# ---------------------------------------------------------------------------

async def get_latest_risk(db: AsyncSession, province_code: str) -> RiskScore | None:
    """Return the most recently computed RiskScore for a province, or None."""
    result = await db.execute(
        select(RiskScore)
        .where(RiskScore.province_code == province_code)
        .order_by(RiskScore.computed_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


async def get_all_latest_risks(db: AsyncSession) -> list[RiskScore]:
    """Return the latest RiskScore for every province that has one."""
    subq = (
        select(
            RiskScore.province_code,
            func.max(RiskScore.computed_at).label("latest"),
        )
        .group_by(RiskScore.province_code)
        .subquery()
    )
    result = await db.execute(
        select(RiskScore).join(
            subq,
            (RiskScore.province_code == subq.c.province_code)
            & (RiskScore.computed_at == subq.c.latest),
        )
    )
    return list(result.scalars().all())


async def get_risk_map(db: AsyncSession) -> list[dict]:
    """Return risk map data: province coordinates joined with latest scores."""
    provinces_result = await db.execute(select(Province))
    provinces = {p.ine_code: p for p in provinces_result.scalars().all()}

    scores = await get_all_latest_risks(db)
    scores_map = {s.province_code: s for s in scores}

    entries: list[dict] = []
    for code, prov in provinces.items():
        score = scores_map.get(code)
        entries.append(
            {
                "province_code": code,
                "province_name": prov.name,
                "latitude": prov.latitude,
                "longitude": prov.longitude,
                "composite_score": score.composite_score if score else 0.0,
                "dominant_hazard": score.dominant_hazard if score else "none",
                "severity": score.severity if score else "low",
                "flood_score": score.flood_score if score else 0.0,
                "wildfire_score": score.wildfire_score if score else 0.0,
                "drought_score": score.drought_score if score else 0.0,
                "heatwave_score": score.heatwave_score if score else 0.0,
                "seismic_score": score.seismic_score if score else 0.0,
                "coldwave_score": score.coldwave_score if score else 0.0,
                "windstorm_score": score.windstorm_score if score else 0.0,
                "dana_score": score.dana_score if score else 0.0,
            }
        )

    return entries
