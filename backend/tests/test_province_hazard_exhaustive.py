"""Exhaustive per-province per-model stress tests.

Covers every (province, hazard) pair with province-specific terrain features
merged into weather inputs, NaN robustness, single-dominant-hazard composite
scoring, and all-zero / all-max boundary conditions.
"""

import math

import pytest

from app.data.province_data import PROVINCES
from app.services.risk_service import get_terrain_features, get_hazard_weights
from app.ml.models.composite_risk import compute_composite_risk
from app.ml.models.flood_risk import predict_flood_risk
from app.ml.models.wildfire_risk import predict_wildfire_risk
from app.ml.models.drought_risk import predict_drought_risk
from app.ml.models.heatwave_risk import predict_heatwave_risk
from app.ml.models.seismic_risk import predict_seismic_risk
from app.ml.models.coldwave_risk import predict_coldwave_risk
from app.ml.models.windstorm_risk import predict_windstorm_risk
from app.ml.models.dana_risk import predict_dana_risk

ALL_PROVINCE_CODES = sorted(PROVINCES.keys())

HAZARD_MODELS = {
    "flood": predict_flood_risk,
    "wildfire": predict_wildfire_risk,
    "drought": predict_drought_risk,
    "heatwave": predict_heatwave_risk,
    "seismic": predict_seismic_risk,
    "coldwave": predict_coldwave_risk,
    "windstorm": predict_windstorm_risk,
    "dana": predict_dana_risk,
}

HAZARD_NAMES = sorted(HAZARD_MODELS.keys())

_MODERATE_WEATHER = {
    "temperature": 22.0, "temperature_max": 28.0, "temperature_min": 14.0,
    "humidity": 55.0, "wind_speed": 12.0, "wind_gusts": 25.0,
    "pressure": 1013.0, "pressure_change_6h": -1.0, "pressure_change_24h": -2.0,
    "precipitation": 3.0, "precip_1h": 2.0, "precip_6h": 8.0,
    "precip_24h": 15.0, "precip_48h": 25.0, "precip_7d": 40.0,
    "precip_forecast_24h": 10.0,
    "soil_moisture": 0.35, "soil_moisture_change_24h": 0.02,
    "cloud_cover": 50.0, "uv_index": 5.0, "dew_point_depression": 8.0,
    "heat_index": 24.0, "wbgt": 20.0, "wind_chill": 20.0,
    "fwi": 12.0, "ffmc": 75.0, "dmc": 30.0, "dc": 200.0, "isi": 5.0, "bui": 40.0,
    "spei_1m": 0.0, "spei_3m": 0.0, "spei_6m": 0.0,
    "consecutive_rain_days": 2, "consecutive_dry_days": 5,
    "consecutive_hot_days": 1, "consecutive_hot_nights": 0,
    "consecutive_cold_days": 0, "consecutive_cold_nights": 0,
    "temperature_anomaly": 2.0, "heat_wave_day": 0.0,
    "magnitude": 0.0, "magnitude_max_30d": 0.0, "depth_km": 0.0,
    "distance_km": 999.0, "quake_count_30d": 0, "seismic_zone_weight": 0.0,
    "cape": 200.0, "cape_current": 200.0,
    "precip_forecast_6h": 3.0, "precip_forecast_6h_ensemble": 2.0,
    "month": 6, "season_sin": 1.0, "season_cos": 0.0,
    "temperature_max_7d": 30.0, "temperature_min_7d": 12.0,
    "humidity_min_7d": 30.0,
    "precipitation_7d": 40.0, "precipitation_30d": 120.0,
    "precip_7day_anomaly": 0.0, "max_precip_intensity_ratio": 0.0,
    "wind_gust_max": 30.0, "wind_speed_max_24h": 20.0,
    "pressure_min_24h": 1010.0,
    "temperature_forecast_48h_max": 30.0,
    "precip_prob_50mm_72h": 0.0, "forecast_uncertainty": 0.0,
    "precipitation_6h": 8.0, "precipitation_24h": 15.0,
}


def _build_features(province_code: str, weather: dict) -> dict:
    """Merge province terrain features into a weather dict."""
    terrain = get_terrain_features(province_code)
    merged = {**weather, **terrain}
    return merged


class TestPerProvincePerModel:
    """52 provinces x 8 models = 416 tests with province-specific terrain."""

    @pytest.mark.parametrize("code", ALL_PROVINCE_CODES)
    @pytest.mark.parametrize("hazard", HAZARD_NAMES)
    def test_moderate_weather_with_terrain(self, code, hazard):
        features = _build_features(code, _MODERATE_WEATHER)
        predict_fn = HAZARD_MODELS[hazard]
        score = predict_fn(features)
        assert isinstance(score, (int, float)), (
            f"{code}/{hazard}: returned {type(score).__name__}, expected numeric"
        )
        assert not math.isnan(score), f"{code}/{hazard}: returned NaN"
        assert 0 <= score <= 100, f"{code}/{hazard}: score {score} out of [0, 100]"


class TestNaNRobustnessPerProvince:
    """52 provinces x 8 models = 416 tests with NaN weather inputs."""

    @pytest.mark.parametrize("code", ALL_PROVINCE_CODES)
    @pytest.mark.parametrize("hazard", HAZARD_NAMES)
    def test_nan_weather_with_real_terrain(self, code, hazard):
        nan_weather = {
            k: float("nan") if isinstance(v, (int, float)) else v
            for k, v in _MODERATE_WEATHER.items()
        }
        features = _build_features(code, nan_weather)
        predict_fn = HAZARD_MODELS[hazard]
        score = predict_fn(features)
        assert isinstance(score, (int, float)), (
            f"{code}/{hazard}: returned {type(score).__name__} on NaN input"
        )
        assert not math.isnan(score), f"{code}/{hazard}: returned NaN on NaN input"
        assert 0 <= score <= 100, f"{code}/{hazard}: score {score} out of [0, 100] on NaN input"


class TestSingleDominantHazard:
    """52 provinces x 8 hazards = 416 composite tests with one dominant hazard."""

    @pytest.mark.parametrize("code", ALL_PROVINCE_CODES)
    @pytest.mark.parametrize("dominant_hazard", HAZARD_NAMES)
    def test_single_dominant(self, code, dominant_hazard):
        weights = get_hazard_weights(code)
        weighted = {}
        for hazard in HAZARD_NAMES:
            raw_score = 90.0 if hazard == dominant_hazard else 5.0
            w = weights.get(hazard, 0.5)
            weighted[hazard] = min(100.0, raw_score * (0.4 + 0.6 * w))

        result = compute_composite_risk(**weighted)
        composite = result["composite_score"]
        assert 0 <= composite <= 100, (
            f"{code}/{dominant_hazard}: composite {composite} out of [0, 100]"
        )
        assert result["severity"] in ("low", "moderate", "high", "very_high", "critical")
        assert result["dominant_hazard"] in HAZARD_NAMES


class TestAllZeroAllMax:
    """52 all-zero + 52 all-max = 104 boundary tests."""

    @pytest.mark.parametrize("code", ALL_PROVINCE_CODES)
    def test_all_zero(self, code):
        result = compute_composite_risk(0, 0, 0, 0, 0, 0, 0, 0)
        assert result["composite_score"] == 0, (
            f"{code}: all-zero composite should be 0, got {result['composite_score']}"
        )
        assert result["severity"] == "low", (
            f"{code}: all-zero severity should be 'low', got {result['severity']}"
        )

    @pytest.mark.parametrize("code", ALL_PROVINCE_CODES)
    def test_all_max(self, code):
        weights = get_hazard_weights(code)
        weighted = {}
        for hazard in HAZARD_NAMES:
            w = weights.get(hazard, 0.5)
            weighted[hazard] = min(100.0, 100.0 * (0.4 + 0.6 * w))

        result = compute_composite_risk(**weighted)
        assert result["composite_score"] <= 100, (
            f"{code}: all-max composite {result['composite_score']} exceeds 100"
        )
        assert result["severity"] == "critical", (
            f"{code}: all-max severity should be 'critical', got {result['severity']}"
        )
