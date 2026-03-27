"""Unit tests for risk pipeline: pure helpers and compute_province_risk."""

import math
import pytest
from unittest.mock import AsyncMock, MagicMock, patch, PropertyMock

from app.services.risk_service import (
    _compute_wind_chill,
    _compute_heat_index,
    _compute_wbgt,
    _empty_temporal,
    _record_to_dict,
)


# ---------------------------------------------------------------------------
# _compute_wind_chill
# ---------------------------------------------------------------------------

class TestComputeWindChill:
    def test_cold_and_windy(self):
        result = _compute_wind_chill(-10.0, 20.0)
        assert result < -10.0

    def test_warm_temperature_returns_temp(self):
        result = _compute_wind_chill(15.0, 30.0)
        assert result == 15.0

    def test_zero_wind_returns_temp(self):
        result = _compute_wind_chill(-5.0, 0.0)
        assert result == -5.0

    def test_boundary_temp_10_wind_above(self):
        result = _compute_wind_chill(10.0, 10.0)
        assert result <= 10.0

    def test_boundary_wind_below_4_8(self):
        result = _compute_wind_chill(-5.0, 4.0)
        assert result == -5.0


# ---------------------------------------------------------------------------
# _compute_heat_index
# ---------------------------------------------------------------------------

class TestComputeHeatIndex:
    def test_hot_and_humid(self):
        result = _compute_heat_index(35.0, 80.0)
        assert result > 35.0

    def test_cool_temperature(self):
        result = _compute_heat_index(20.0, 50.0)
        assert isinstance(result, float)
        assert result == pytest.approx(result, abs=0.01)

    def test_extreme_values(self):
        result = _compute_heat_index(45.0, 95.0)
        assert result > 45.0
        assert not math.isnan(result)

    def test_returns_float(self):
        result = _compute_heat_index(30.0, 60.0)
        assert isinstance(result, float)

    def test_low_humidity(self):
        result = _compute_heat_index(35.0, 10.0)
        assert isinstance(result, float)
        assert not math.isnan(result)


# ---------------------------------------------------------------------------
# _compute_wbgt
# ---------------------------------------------------------------------------

class TestComputeWBGT:
    def test_hot_and_humid(self):
        result = _compute_wbgt(35.0, 80.0, 5.0)
        assert 25 <= result <= 45

    def test_returns_float(self):
        result = _compute_wbgt(25.0, 50.0, 10.0)
        assert isinstance(result, float)

    def test_not_nan(self):
        result = _compute_wbgt(20.0, 60.0, 15.0)
        assert not math.isnan(result)

    def test_moderate_conditions(self):
        result = _compute_wbgt(28.0, 70.0, 8.0)
        assert isinstance(result, float)
        assert result > 0


# ---------------------------------------------------------------------------
# _empty_temporal
# ---------------------------------------------------------------------------

class TestEmptyTemporal:
    def test_returns_dict(self):
        result = _empty_temporal()
        assert isinstance(result, dict)

    def test_has_27_keys(self):
        result = _empty_temporal()
        assert len(result) == 27

    def test_required_keys_present(self):
        result = _empty_temporal()
        required = [
            "precip_1h", "precip_6h", "precip_24h", "precip_48h",
            "precip_forecast_24h", "precip_7day_anomaly",
            "consecutive_rain_days", "consecutive_dry_days",
            "max_precip_intensity_ratio", "pressure_change_6h",
            "soil_moisture_change_24h", "dew_point_depression",
            "precipitation_7d", "precipitation_30d",
            "temperature_max", "temperature_min",
            "temperature_max_7d", "humidity_min_7d",
            "consecutive_hot_days", "consecutive_hot_nights",
            "wind_gust_max", "wind_speed_max_24h",
            "pressure_change_24h", "pressure_min_24h",
            "temperature_min_7d", "consecutive_cold_days",
            "consecutive_cold_nights",
        ]
        for key in required:
            assert key in result, f"Missing key: {key}"

    def test_all_values_numeric(self):
        result = _empty_temporal()
        for key, value in result.items():
            assert isinstance(value, (int, float)), f"{key} is {type(value)}"

    def test_specific_defaults(self):
        result = _empty_temporal()
        assert result["temperature_max"] == 20.0
        assert result["temperature_min"] == 10.0
        assert result["pressure_min_24h"] == 1013.0


# ---------------------------------------------------------------------------
# _record_to_dict
# ---------------------------------------------------------------------------

class TestRecordToDict:
    def test_converts_mock_record(self):
        record = MagicMock()
        record.temperature = 25.0
        record.humidity = 60.0
        record.precipitation = 1.5
        record.wind_speed = 10.0
        record.wind_direction = 180
        record.wind_gusts = 15.0
        record.pressure = 1013.0
        record.soil_moisture = 0.3
        record.uv_index = 5.0
        record.dew_point = 12.0
        record.cloud_cover = 40.0

        result = _record_to_dict(record)
        assert isinstance(result, dict)
        assert result["temperature"] == 25.0
        assert result["humidity"] == 60.0
        assert result["precipitation"] == 1.5
        assert result["wind_speed"] == 10.0
        assert result["wind_direction"] == 180
        assert result["wind_gusts"] == 15.0
        assert result["pressure"] == 1013.0
        assert result["soil_moisture"] == 0.3
        assert result["uv_index"] == 5.0
        assert result["dew_point"] == 12.0
        assert result["cloud_cover"] == 40.0

    def test_has_all_expected_keys(self):
        record = MagicMock()
        result = _record_to_dict(record)
        expected_keys = {
            "temperature", "humidity", "precipitation", "wind_speed",
            "wind_direction", "wind_gusts", "pressure", "soil_moisture",
            "uv_index", "dew_point", "cloud_cover",
        }
        assert set(result.keys()) == expected_keys


# ---------------------------------------------------------------------------
# compute_province_risk (integration with heavy mocking)
# ---------------------------------------------------------------------------

def _make_fake_province(code="28"):
    province = MagicMock()
    province.ine_code = code
    province.name = "Madrid"
    province.latitude = 40.4168
    province.longitude = -3.7038
    province.flood_risk_weight = 0.3
    province.wildfire_risk_weight = 0.4
    province.drought_risk_weight = 0.6
    province.heatwave_risk_weight = 0.7
    province.seismic_risk_weight = 0.2
    province.coldwave_risk_weight = 0.3
    province.windstorm_risk_weight = 0.3
    return province


def _make_mock_db(province=None):
    """Build a mock AsyncSession for compute_province_risk."""
    db = AsyncMock()
    db.get = AsyncMock(return_value=province)

    # db.execute returns results with empty scalars
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = []
    mock_result.scalar_one_or_none.return_value = None
    db.execute = AsyncMock(return_value=mock_result)

    db.add = MagicMock()
    db.commit = AsyncMock()
    return db


class TestComputeProvinceRisk:
    @pytest.mark.asyncio
    @patch("app.services.risk_service.health_tracker")
    @patch("app.services.compound_risk_service.apply_compound_amplifiers")
    @patch("app.data.open_meteo.fetch_ensemble_features", new_callable=AsyncMock)
    @patch("app.data.open_meteo_upper_air.fetch_upper_air", new_callable=AsyncMock)
    @patch("app.data.ign_seismic.compute_province_seismic_exposure")
    @patch("app.data.ign_seismic.fetch_recent_quakes", new_callable=AsyncMock)
    @patch("app.services.risk_service.open_meteo")
    async def test_returns_valid_composite(
        self, mock_om, mock_quakes, mock_seismic_exp,
        mock_upper, mock_ensemble, mock_compound, mock_health,
    ):
        from app.services.risk_service import compute_province_risk

        province = _make_fake_province()
        db = _make_mock_db(province)

        mock_om.fetch_current = AsyncMock(return_value={
            "temperature": 25.0, "humidity": 55.0, "wind_speed": 10.0,
            "pressure": 1013.0, "soil_moisture": 0.3, "cloud_cover": 50.0,
            "uv_index": 5.0, "dew_point": 12.0, "wind_gusts": 15.0,
        })
        mock_quakes.return_value = []
        mock_seismic_exp.return_value = {
            "max_magnitude": 0, "event_count": 0,
            "nearest_distance_km": 999, "energy_sum": 0,
            "max_pga_estimate": 0, "cluster_intensity": 0,
        }
        mock_upper.return_value = {}
        mock_ensemble.return_value = {"precip_est_72h_mm": 0.0}
        mock_compound.return_value = (
            {"flood": 10, "wildfire": 10, "drought": 10, "heatwave": 10,
             "seismic": 5, "coldwave": 5, "windstorm": 5, "dana": 5},
            [],
        )
        mock_health.get_all_statuses.return_value = {}

        result = await compute_province_risk(db, "28")

        assert isinstance(result, dict)
        assert "composite_score" in result
        assert "dominant_hazard" in result
        assert "province_code" in result
        assert "confidence" in result
        assert 0 <= result["composite_score"] <= 100

    @pytest.mark.asyncio
    async def test_unknown_province_raises(self):
        from app.services.risk_service import compute_province_risk

        db = _make_mock_db(province=None)
        with pytest.raises(ValueError, match="not found"):
            await compute_province_risk(db, "99")

    @pytest.mark.asyncio
    @patch("app.services.risk_service.health_tracker")
    @patch("app.services.compound_risk_service.apply_compound_amplifiers")
    @patch("app.data.open_meteo.fetch_ensemble_features", new_callable=AsyncMock)
    @patch("app.data.open_meteo_upper_air.fetch_upper_air", new_callable=AsyncMock)
    @patch("app.data.ign_seismic.compute_province_seismic_exposure")
    @patch("app.data.ign_seismic.fetch_recent_quakes", new_callable=AsyncMock)
    @patch("app.services.risk_service.open_meteo")
    async def test_empty_weather_produces_scores(
        self, mock_om, mock_quakes, mock_seismic_exp,
        mock_upper, mock_ensemble, mock_compound, mock_health,
    ):
        from app.services.risk_service import compute_province_risk

        province = _make_fake_province()
        db = _make_mock_db(province)

        mock_om.fetch_current = AsyncMock(return_value={})
        mock_quakes.return_value = []
        mock_seismic_exp.return_value = {
            "max_magnitude": 0, "event_count": 0,
            "nearest_distance_km": 999, "energy_sum": 0,
            "max_pga_estimate": 0, "cluster_intensity": 0,
        }
        mock_upper.return_value = {}
        mock_ensemble.return_value = {"precip_est_72h_mm": 0.0}
        mock_compound.return_value = (
            {"flood": 5, "wildfire": 5, "drought": 5, "heatwave": 5,
             "seismic": 5, "coldwave": 5, "windstorm": 5, "dana": 5},
            [],
        )
        mock_health.get_all_statuses.return_value = {}

        result = await compute_province_risk(db, "28")

        assert isinstance(result, dict)
        assert "composite_score" in result
        assert 0 <= result["composite_score"] <= 100

    @pytest.mark.asyncio
    @patch("app.services.risk_service.health_tracker")
    @patch("app.services.compound_risk_service.apply_compound_amplifiers")
    @patch("app.data.open_meteo.fetch_ensemble_features", new_callable=AsyncMock)
    @patch("app.data.open_meteo_upper_air.fetch_upper_air", new_callable=AsyncMock)
    @patch("app.data.ign_seismic.compute_province_seismic_exposure")
    @patch("app.data.ign_seismic.fetch_recent_quakes", new_callable=AsyncMock)
    @patch("app.services.risk_service.open_meteo")
    async def test_stores_risk_score_in_db(
        self, mock_om, mock_quakes, mock_seismic_exp,
        mock_upper, mock_ensemble, mock_compound, mock_health,
    ):
        from app.services.risk_service import compute_province_risk

        province = _make_fake_province()
        db = _make_mock_db(province)

        mock_om.fetch_current = AsyncMock(return_value={
            "temperature": 30.0, "humidity": 70.0, "wind_speed": 5.0,
            "pressure": 1010.0, "soil_moisture": 0.4, "cloud_cover": 60.0,
            "uv_index": 7.0, "dew_point": 15.0, "wind_gusts": 10.0,
        })
        mock_quakes.return_value = []
        mock_seismic_exp.return_value = {
            "max_magnitude": 0, "event_count": 0,
            "nearest_distance_km": 999, "energy_sum": 0,
            "max_pga_estimate": 0, "cluster_intensity": 0,
        }
        mock_upper.return_value = {}
        mock_ensemble.return_value = {"precip_est_72h_mm": 0.0}
        mock_compound.return_value = (
            {"flood": 15, "wildfire": 15, "drought": 15, "heatwave": 15,
             "seismic": 5, "coldwave": 5, "windstorm": 5, "dana": 5},
            [],
        )
        mock_health.get_all_statuses.return_value = {}

        await compute_province_risk(db, "28")

        db.add.assert_called_once()
        db.commit.assert_awaited()
