"""Explainability service -- deterministic feature importance from rule-based logic.

For each hazard, parses the features_snapshot and computes per-feature
contributions using the same thresholds defined in each model's rule-based
fallback.  This avoids any LLM dependency while providing real, data-driven
explanations.
"""

from __future__ import annotations

from typing import Any


def _contrib(feature: str, value: float, points: float, description: str) -> dict:
    return {
        "feature": feature,
        "value": round(value, 2),
        "contribution": round(points, 2),
        "description": description,
    }


# ---------------------------------------------------------------------------
# Per-hazard explainers
# ---------------------------------------------------------------------------

def explain_flood(f: dict[str, Any]) -> list[dict]:
    contributions: list[dict] = []

    precip_24h = f.get("precip_24h", 0) or 0
    if precip_24h > 100:
        contributions.append(_contrib("precip_24h", precip_24h, 40, "Extreme 24h rainfall >100mm"))
    elif precip_24h > 60:
        contributions.append(_contrib("precip_24h", precip_24h, 30, "Heavy 24h rainfall >60mm"))
    elif precip_24h > 30:
        contributions.append(_contrib("precip_24h", precip_24h, 20, "Moderate 24h rainfall >30mm"))
    elif precip_24h > 10:
        contributions.append(_contrib("precip_24h", precip_24h, 10, "Light 24h rainfall >10mm"))
    else:
        contributions.append(_contrib("precip_24h", precip_24h, 0, "Minimal 24h rainfall"))

    precip_6h = f.get("precip_6h", 0) or 0
    if precip_6h > 50:
        contributions.append(_contrib("precip_6h", precip_6h, 20, "Intense 6h rainfall >50mm"))
    elif precip_6h > 30:
        contributions.append(_contrib("precip_6h", precip_6h, 15, "Strong 6h rainfall >30mm"))
    elif precip_6h > 15:
        contributions.append(_contrib("precip_6h", precip_6h, 8, "Moderate 6h rainfall >15mm"))
    else:
        contributions.append(_contrib("precip_6h", precip_6h, 0, "Low 6h rainfall"))

    soil = f.get("soil_moisture", 0.3) or 0.3
    if soil > 0.8:
        contributions.append(_contrib("soil_moisture", soil, 15, "Saturated soil >80%"))
    elif soil > 0.6:
        contributions.append(_contrib("soil_moisture", soil, 10, "High soil moisture >60%"))
    elif soil > 0.4:
        contributions.append(_contrib("soil_moisture", soil, 5, "Moderate soil moisture >40%"))
    else:
        contributions.append(_contrib("soil_moisture", soil, 0, "Low soil moisture"))

    river = f.get("river_basin_risk", 0.3) or 0.3
    pts = round(river * 15, 2)
    contributions.append(_contrib("river_basin_risk", river, pts, f"River basin flood susceptibility ({river:.0%})"))

    if f.get("is_mediterranean", False):
        contributions.append(_contrib("is_mediterranean", 1.0, 5, "Mediterranean climate (flash flood prone)"))

    humidity = f.get("humidity", 50) or 50
    if humidity > 90:
        contributions.append(_contrib("humidity", humidity, 5, "Very high humidity >90%"))

    return contributions


def explain_wildfire(f: dict[str, Any]) -> list[dict]:
    contributions: list[dict] = []

    fwi = f.get("fwi", 0) or 0
    if fwi > 50:
        contributions.append(_contrib("fwi", fwi, 60, "Extreme FWI >50"))
    elif fwi > 30:
        contributions.append(_contrib("fwi", fwi, 40, "Very high FWI >30"))
    elif fwi > 15:
        contributions.append(_contrib("fwi", fwi, 25, "High FWI >15"))
    elif fwi > 5:
        contributions.append(_contrib("fwi", fwi, 10, "Moderate FWI >5"))
    else:
        contributions.append(_contrib("fwi", fwi, 0, "Low fire weather index"))

    dry_days = f.get("consecutive_dry_days", 0) or 0
    if dry_days > 30:
        contributions.append(_contrib("consecutive_dry_days", dry_days, 15, "Extended dry spell >30 days"))
    elif dry_days > 15:
        contributions.append(_contrib("consecutive_dry_days", dry_days, 10, "Long dry spell >15 days"))
    elif dry_days > 7:
        contributions.append(_contrib("consecutive_dry_days", dry_days, 5, "Dry spell >7 days"))
    else:
        contributions.append(_contrib("consecutive_dry_days", dry_days, 0, "Recent rainfall"))

    humidity = f.get("humidity", 50) or 50
    if humidity < 15:
        contributions.append(_contrib("humidity", humidity, 10, "Critically low humidity <15%"))
    elif humidity < 25:
        contributions.append(_contrib("humidity", humidity, 7, "Very low humidity <25%"))
    elif humidity < 35:
        contributions.append(_contrib("humidity", humidity, 4, "Low humidity <35%"))
    else:
        contributions.append(_contrib("humidity", humidity, 0, "Adequate humidity"))

    temperature = f.get("temperature", 20) or 20
    if temperature > 40:
        contributions.append(_contrib("temperature", temperature, 10, "Extreme temperature >40C"))
    elif temperature > 35:
        contributions.append(_contrib("temperature", temperature, 7, "Very high temperature >35C"))
    elif temperature > 30:
        contributions.append(_contrib("temperature", temperature, 4, "High temperature >30C"))
    else:
        contributions.append(_contrib("temperature", temperature, 0, "Moderate temperature"))

    wind = f.get("wind_speed", 0) or 0
    if wind > 40:
        contributions.append(_contrib("wind_speed", wind, 8, "Strong wind >40 km/h"))
    elif wind > 25:
        contributions.append(_contrib("wind_speed", wind, 5, "Moderate wind >25 km/h"))
    elif wind > 15:
        contributions.append(_contrib("wind_speed", wind, 2, "Light wind >15 km/h"))

    soil = f.get("soil_moisture", 0.3) or 0.3
    if soil < 0.1:
        contributions.append(_contrib("soil_moisture", soil, 5, "Very dry soil <10%"))
    elif soil < 0.2:
        contributions.append(_contrib("soil_moisture", soil, 3, "Dry soil <20%"))

    return contributions


def explain_drought(f: dict[str, Any]) -> list[dict]:
    contributions: list[dict] = []

    dry_days = f.get("consecutive_dry_days", 0) or 0
    if dry_days > 60:
        contributions.append(_contrib("consecutive_dry_days", dry_days, 50, "Severe dry spell >60 days"))
    elif dry_days > 40:
        contributions.append(_contrib("consecutive_dry_days", dry_days, 40, "Extended dry spell >40 days"))
    elif dry_days > 25:
        contributions.append(_contrib("consecutive_dry_days", dry_days, 30, "Long dry spell >25 days"))
    elif dry_days > 14:
        contributions.append(_contrib("consecutive_dry_days", dry_days, 20, "Dry spell >14 days"))
    elif dry_days > 7:
        contributions.append(_contrib("consecutive_dry_days", dry_days, 10, "Dry spell >7 days"))
    else:
        contributions.append(_contrib("consecutive_dry_days", dry_days, 0, "Recent rainfall"))

    soil = f.get("soil_moisture", 0.3) or 0.3
    if soil < 0.1:
        contributions.append(_contrib("soil_moisture", soil, 25, "Critically dry soil <10%"))
    elif soil < 0.2:
        contributions.append(_contrib("soil_moisture", soil, 18, "Very dry soil <20%"))
    elif soil < 0.3:
        contributions.append(_contrib("soil_moisture", soil, 10, "Dry soil <30%"))
    elif soil < 0.4:
        contributions.append(_contrib("soil_moisture", soil, 5, "Low soil moisture <40%"))
    else:
        contributions.append(_contrib("soil_moisture", soil, 0, "Adequate soil moisture"))

    temperature = f.get("temperature", 20) or 20
    if temperature > 38:
        contributions.append(_contrib("temperature", temperature, 10, "Extreme heat >38C amplifies drought"))
    elif temperature > 33:
        contributions.append(_contrib("temperature", temperature, 6, "High heat >33C amplifies drought"))
    elif temperature > 28:
        contributions.append(_contrib("temperature", temperature, 3, "Warm temperatures >28C"))
    else:
        contributions.append(_contrib("temperature", temperature, 0, "Moderate temperature"))

    humidity = f.get("humidity", 50) or 50
    if humidity < 20:
        contributions.append(_contrib("humidity", humidity, 8, "Critically low humidity <20%"))
    elif humidity < 30:
        contributions.append(_contrib("humidity", humidity, 5, "Low humidity <30%"))
    else:
        contributions.append(_contrib("humidity", humidity, 0, "Adequate humidity"))

    precip_30d = f.get("precipitation_30d", 30) or 30
    if precip_30d < 5:
        contributions.append(_contrib("precipitation_30d", precip_30d, 10, "Almost no rain in 30 days (<5mm)"))
    elif precip_30d < 15:
        contributions.append(_contrib("precipitation_30d", precip_30d, 6, "Very low 30-day rainfall (<15mm)"))
    elif precip_30d < 30:
        contributions.append(_contrib("precipitation_30d", precip_30d, 3, "Below-average 30-day rainfall (<30mm)"))
    else:
        contributions.append(_contrib("precipitation_30d", precip_30d, 0, "Normal precipitation"))

    return contributions


def explain_heatwave(f: dict[str, Any]) -> list[dict]:
    contributions: list[dict] = []

    heat_index = f.get("heat_index", 0) or 0
    if heat_index > 54:
        contributions.append(_contrib("heat_index", heat_index, 90, "Extreme danger: heat index >54C"))
    elif heat_index > 41:
        contributions.append(_contrib("heat_index", heat_index, 60, "Danger: heat index >41C"))
    elif heat_index > 32:
        contributions.append(_contrib("heat_index", heat_index, 30, "Extreme caution: heat index >32C"))
    elif heat_index > 27:
        contributions.append(_contrib("heat_index", heat_index, 15, "Caution: heat index >27C"))
    else:
        contributions.append(_contrib("heat_index", heat_index, 0, "Normal heat index"))

    hot_days = f.get("consecutive_hot_days", 0) or 0
    if hot_days > 7:
        contributions.append(_contrib("consecutive_hot_days", hot_days, 15, "Prolonged heatwave >7 days"))
    elif hot_days > 4:
        contributions.append(_contrib("consecutive_hot_days", hot_days, 10, "Heatwave >4 days"))
    elif hot_days > 2:
        contributions.append(_contrib("consecutive_hot_days", hot_days, 5, "Hot spell >2 days"))
    else:
        contributions.append(_contrib("consecutive_hot_days", hot_days, 0, "No consecutive hot days"))

    hot_nights = f.get("consecutive_hot_nights", 0) or 0
    if hot_nights > 5:
        contributions.append(_contrib("consecutive_hot_nights", hot_nights, 10, "No nighttime cooling >5 nights"))
    elif hot_nights > 3:
        contributions.append(_contrib("consecutive_hot_nights", hot_nights, 6, "Warm nights >3 consecutive"))
    elif hot_nights > 1:
        contributions.append(_contrib("consecutive_hot_nights", hot_nights, 3, "Some warm nights"))
    else:
        contributions.append(_contrib("consecutive_hot_nights", hot_nights, 0, "Cool nights"))

    elevation = f.get("elevation_m", 200) or 200
    if elevation < 50:
        contributions.append(_contrib("elevation_m", elevation, 5, "Very low elevation traps heat"))
    elif elevation < 200:
        contributions.append(_contrib("elevation_m", elevation, 3, "Low elevation"))

    if not f.get("is_coastal", False):
        contributions.append(_contrib("is_coastal", 0, 5, "Inland location (no sea-breeze cooling)"))

    uv = f.get("uv_index", 0) or 0
    if uv > 10:
        contributions.append(_contrib("uv_index", uv, 5, "Extreme UV index >10"))
    elif uv > 7:
        contributions.append(_contrib("uv_index", uv, 3, "High UV index >7"))

    return contributions


def explain_seismic(f: dict[str, Any]) -> list[dict]:
    contributions: list[dict] = []

    mag = f.get("max_magnitude_30d", 0.0) or 0.0
    if mag >= 5.0:
        contributions.append(_contrib("max_magnitude_30d", mag, 50, "Significant earthquake M5.0+"))
    elif mag >= 4.0:
        contributions.append(_contrib("max_magnitude_30d", mag, 30, "Moderate earthquake M4.0+"))
    elif mag >= 3.0:
        contributions.append(_contrib("max_magnitude_30d", mag, 15, "Light earthquake M3.0+"))
    elif mag >= 2.0:
        contributions.append(_contrib("max_magnitude_30d", mag, 5, "Minor earthquake M2.0+"))
    else:
        contributions.append(_contrib("max_magnitude_30d", mag, 0, "No significant seismic activity"))

    count = f.get("earthquake_count_30d", 0) or 0
    if count >= 20:
        contributions.append(_contrib("earthquake_count_30d", count, 15, "High seismic frequency (20+ events)"))
    elif count >= 10:
        contributions.append(_contrib("earthquake_count_30d", count, 10, "Moderate seismic frequency (10+ events)"))
    elif count >= 5:
        contributions.append(_contrib("earthquake_count_30d", count, 5, "Some seismic activity (5+ events)"))
    else:
        contributions.append(_contrib("earthquake_count_30d", count, 0, "Low seismic frequency"))

    dist = f.get("nearest_quake_distance_km", 999) or 999
    if dist < 50:
        contributions.append(_contrib("nearest_quake_distance_km", dist, 15, "Very close earthquake (<50km)"))
    elif dist < 100:
        contributions.append(_contrib("nearest_quake_distance_km", dist, 10, "Nearby earthquake (<100km)"))
    elif dist < 150:
        contributions.append(_contrib("nearest_quake_distance_km", dist, 5, "Regional earthquake (<150km)"))
    else:
        contributions.append(_contrib("nearest_quake_distance_km", dist, 0, "No nearby earthquakes"))

    depth = f.get("nearest_quake_depth_km", 50) or 50
    if depth < 10 and mag >= 3.0 and dist < 100:
        contributions.append(_contrib("nearest_quake_depth_km", depth, 10, "Shallow earthquake increases damage potential"))

    zone = f.get("seismic_zone_weight", 0.3) or 0.3
    contributions.append(_contrib("seismic_zone_weight", zone, round(zone * 10, 2), f"Seismic zone factor ({zone:.0%})"))

    return contributions


def explain_coldwave(f: dict[str, Any]) -> list[dict]:
    contributions: list[dict] = []

    wind_chill = f.get("wind_chill", 10.0) or 10.0
    if wind_chill < -15:
        contributions.append(_contrib("wind_chill", wind_chill, 40, "Extreme wind chill <-15C"))
    elif wind_chill < -10:
        contributions.append(_contrib("wind_chill", wind_chill, 30, "Severe wind chill <-10C"))
    elif wind_chill < -5:
        contributions.append(_contrib("wind_chill", wind_chill, 20, "Cold wind chill <-5C"))
    elif wind_chill < 0:
        contributions.append(_contrib("wind_chill", wind_chill, 10, "Below freezing wind chill"))
    else:
        contributions.append(_contrib("wind_chill", wind_chill, 0, "Mild wind chill"))

    temp_min = f.get("temperature_min", 5.0) or 5.0
    if temp_min < -10:
        contributions.append(_contrib("temperature_min", temp_min, 20, "Extreme cold: min temp <-10C"))
    elif temp_min < -5:
        contributions.append(_contrib("temperature_min", temp_min, 15, "Severe cold: min temp <-5C"))
    elif temp_min < 0:
        contributions.append(_contrib("temperature_min", temp_min, 8, "Freezing: min temp <0C"))
    elif temp_min < 5:
        contributions.append(_contrib("temperature_min", temp_min, 4, "Cold: min temp <5C"))
    else:
        contributions.append(_contrib("temperature_min", temp_min, 0, "Mild minimum temperature"))

    cold_days = f.get("consecutive_cold_days", 0) or 0
    if cold_days > 5:
        contributions.append(_contrib("consecutive_cold_days", cold_days, 15, "Persistent cold >5 days"))
    elif cold_days > 3:
        contributions.append(_contrib("consecutive_cold_days", cold_days, 10, "Cold spell >3 days"))
    elif cold_days > 1:
        contributions.append(_contrib("consecutive_cold_days", cold_days, 5, "Brief cold spell"))
    else:
        contributions.append(_contrib("consecutive_cold_days", cold_days, 0, "No cold spell"))

    cold_nights = f.get("consecutive_cold_nights", 0) or 0
    if cold_nights > 5:
        contributions.append(_contrib("consecutive_cold_nights", cold_nights, 10, "Freezing nights >5 consecutive"))
    elif cold_nights > 3:
        contributions.append(_contrib("consecutive_cold_nights", cold_nights, 5, "Freezing nights >3 consecutive"))
    else:
        contributions.append(_contrib("consecutive_cold_nights", cold_nights, 0, "No consecutive freezing nights"))

    elevation = f.get("elevation_m", 200.0) or 200.0
    if elevation > 1000:
        contributions.append(_contrib("elevation_m", elevation, 5, "High altitude >1000m"))

    is_coastal = f.get("is_coastal", 0.0) or 0.0
    if not is_coastal:
        contributions.append(_contrib("is_coastal", 0, 5, "Inland location (colder)"))

    return contributions


def explain_windstorm(f: dict[str, Any]) -> list[dict]:
    contributions: list[dict] = []

    gusts = f.get("wind_gusts", 0.0) or 0.0
    gust_max_24h = f.get("wind_gust_max_24h", 0.0) or 0.0
    effective_gusts = max(gusts, gust_max_24h)
    if effective_gusts > 120:
        contributions.append(_contrib("wind_gusts", effective_gusts, 50, "Hurricane-force gusts >120 km/h"))
    elif effective_gusts > 100:
        contributions.append(_contrib("wind_gusts", effective_gusts, 40, "Violent gusts >100 km/h"))
    elif effective_gusts > 80:
        contributions.append(_contrib("wind_gusts", effective_gusts, 30, "Storm-force gusts >80 km/h"))
    elif effective_gusts > 60:
        contributions.append(_contrib("wind_gusts", effective_gusts, 20, "Strong gusts >60 km/h"))
    elif effective_gusts > 40:
        contributions.append(_contrib("wind_gusts", effective_gusts, 10, "Moderate gusts >40 km/h"))
    else:
        contributions.append(_contrib("wind_gusts", effective_gusts, 0, "Light gusts"))

    wind = f.get("wind_speed", 0.0) or 0.0
    wind_max_24h = f.get("wind_speed_max_24h", wind) or wind
    effective_wind = max(wind, wind_max_24h)
    if effective_wind > 80:
        contributions.append(_contrib("wind_speed", effective_wind, 20, "Storm-force sustained wind >80 km/h"))
    elif effective_wind > 60:
        contributions.append(_contrib("wind_speed", effective_wind, 15, "Strong sustained wind >60 km/h"))
    elif effective_wind > 40:
        contributions.append(_contrib("wind_speed", effective_wind, 10, "Moderate sustained wind >40 km/h"))
    elif effective_wind > 25:
        contributions.append(_contrib("wind_speed", effective_wind, 5, "Fresh wind >25 km/h"))
    else:
        contributions.append(_contrib("wind_speed", effective_wind, 0, "Light wind"))

    pressure_change = f.get("pressure_change_6h", 0.0) or 0.0
    if pressure_change < -10:
        contributions.append(_contrib("pressure_change_6h", pressure_change, 15, "Rapid pressure drop >10 hPa/6h"))
    elif pressure_change < -6:
        contributions.append(_contrib("pressure_change_6h", pressure_change, 10, "Significant pressure drop >6 hPa/6h"))
    elif pressure_change < -3:
        contributions.append(_contrib("pressure_change_6h", pressure_change, 5, "Moderate pressure drop >3 hPa/6h"))
    else:
        contributions.append(_contrib("pressure_change_6h", pressure_change, 0, "Stable pressure"))

    pressure = f.get("pressure", 1013.0) or 1013.0
    if pressure < 985:
        contributions.append(_contrib("pressure", pressure, 10, "Deep low pressure <985 hPa"))
    elif pressure < 995:
        contributions.append(_contrib("pressure", pressure, 5, "Low pressure <995 hPa"))

    is_coastal = f.get("is_coastal", 0.0) or 0.0
    if is_coastal:
        contributions.append(_contrib("is_coastal", 1, 5, "Coastal exposure"))

    is_med = f.get("is_mediterranean", 0.0) or 0.0
    month = f.get("month", 6) or 6
    if is_med and month in (9, 10, 11):
        contributions.append(_contrib("is_mediterranean", 1, 5, "Mediterranean DANA season (Sep-Nov)"))

    return contributions


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

def explain_dana(f: dict[str, Any]) -> list[dict]:
    contributions: list[dict] = []

    precip_24h = f.get("precip_24h", 0) or 0
    if precip_24h > 200:
        contributions.append(_contrib("precip_24h", precip_24h, 20, "Torrential 24h rainfall >200mm (DANA signature)"))
    elif precip_24h > 100:
        contributions.append(_contrib("precip_24h", precip_24h, 15, "Extreme 24h rainfall >100mm"))
    elif precip_24h > 50:
        contributions.append(_contrib("precip_24h", precip_24h, 10, "Heavy 24h rainfall >50mm"))
    else:
        contributions.append(_contrib("precip_24h", precip_24h, 0, "Low 24h rainfall"))

    precip_6h = f.get("precip_6h", 0) or 0
    if precip_6h > 100:
        contributions.append(_contrib("precip_6h", precip_6h, 15, "Extreme 6h intensity >100mm"))
    elif precip_6h > 50:
        contributions.append(_contrib("precip_6h", precip_6h, 10, "Intense 6h rainfall >50mm"))
    else:
        contributions.append(_contrib("precip_6h", precip_6h, 0, "Low 6h rainfall"))

    pressure_change = f.get("pressure_change_6h", 0) or 0
    if pressure_change < -8:
        contributions.append(_contrib("pressure_change_6h", pressure_change, 12, "Rapid pressure collapse >8 hPa/6h"))
    elif pressure_change < -6:
        contributions.append(_contrib("pressure_change_6h", pressure_change, 8, "Significant pressure drop >6 hPa/6h"))
    elif pressure_change < -3:
        contributions.append(_contrib("pressure_change_6h", pressure_change, 4, "Moderate pressure drop"))
    else:
        contributions.append(_contrib("pressure_change_6h", pressure_change, 0, "Stable pressure"))

    wind_gusts = f.get("wind_gusts", 0) or 0
    if wind_gusts > 90:
        contributions.append(_contrib("wind_gusts", wind_gusts, 12, "Violent gusts >90 km/h"))
    elif wind_gusts > 70:
        contributions.append(_contrib("wind_gusts", wind_gusts, 8, "Strong gusts >70 km/h"))
    elif wind_gusts > 50:
        contributions.append(_contrib("wind_gusts", wind_gusts, 4, "Moderate gusts >50 km/h"))
    else:
        contributions.append(_contrib("wind_gusts", wind_gusts, 0, "Light gusts"))

    humidity = f.get("humidity", 50) or 50
    if humidity > 90:
        contributions.append(_contrib("humidity", humidity, 10, "Extreme humidity >90% fuels convection"))
    elif humidity > 80:
        contributions.append(_contrib("humidity", humidity, 7, "High humidity >80%"))
    elif humidity > 75:
        contributions.append(_contrib("humidity", humidity, 5, "Elevated humidity >75%"))
    else:
        contributions.append(_contrib("humidity", humidity, 0, "Normal humidity"))

    is_med = f.get("is_mediterranean", False)
    if is_med:
        contributions.append(_contrib("is_mediterranean", 1, 8, "Mediterranean coast (DANA primary target)"))

    is_coastal = f.get("is_coastal", False)
    if is_coastal:
        contributions.append(_contrib("is_coastal", 1, 4, "Coastal province (storm surge risk)"))

    month = f.get("month", 6) or 6
    if month in (9, 10, 11):
        contributions.append(_contrib("month", month, 5, "Peak DANA season (Sep-Nov)"))
    elif month in (5, 6, 12):
        contributions.append(_contrib("month", month, 2, "Extended DANA season"))
    else:
        contributions.append(_contrib("month", month, 0, "Off-season for DANA events"))

    return contributions


_EXPLAINERS = {
    "flood": explain_flood,
    "wildfire": explain_wildfire,
    "drought": explain_drought,
    "heatwave": explain_heatwave,
    "seismic": explain_seismic,
    "coldwave": explain_coldwave,
    "windstorm": explain_windstorm,
    "dana": explain_dana,
}


def explain_risk(features_snapshot: dict[str, Any]) -> dict[str, list[dict]]:
    """Compute feature importance for all hazards from a stored features_snapshot.

    Uses SHAP TreeExplainer for model-based hazards (flood, wildfire, heatwave)
    when trained models are available, falling back to rule-based for all others.
    """
    result: dict[str, list[dict]] = {}

    for hazard, explainer in _EXPLAINERS.items():
        hazard_features = features_snapshot.get(hazard, {})
        contributions = _try_shap(hazard, hazard_features)
        if not contributions:
            contributions = explainer(hazard_features)
        contributions.sort(key=lambda c: c["contribution"], reverse=True)
        result[hazard] = contributions

    return result


def _try_shap(hazard: str, features: dict[str, Any]) -> list[dict]:
    """Attempt SHAP explanation for model-based hazards."""
    from app.services.shap_explainer import explain_with_shap

    if hazard == "flood":
        from app.ml.models.flood_risk import get_trained_model, FEATURE_NAMES
        model = get_trained_model()
        if model is not None:
            return explain_with_shap(model, features, FEATURE_NAMES, hazard)
    elif hazard == "wildfire":
        from app.ml.models.wildfire_risk import get_trained_models, FEATURE_NAMES
        rf, lgbm, _ = get_trained_models()
        model = lgbm or rf
        if model is not None:
            return explain_with_shap(model, features, FEATURE_NAMES, hazard)
    elif hazard == "heatwave":
        from app.ml.models.heatwave_risk import get_trained_model, FEATURE_NAMES
        model = get_trained_model()
        if model is not None:
            return explain_with_shap(model, features, FEATURE_NAMES, hazard)

    return []
