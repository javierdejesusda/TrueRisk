"""Tests for the Open-Meteo upper air data source module."""

import pytest
import respx
from httpx import Response

from app.data import open_meteo_upper_air

_OM_URL = "https://api.open-meteo.com/v1/forecast"


@pytest.fixture(autouse=True)
def no_retry_wait(monkeypatch):
    """Make tenacity retries instant in tests."""
    monkeypatch.setattr("tenacity.nap.time.sleep", lambda x: None)


def _make_upper_air_response():
    """Build a realistic Open-Meteo upper-air JSON response."""
    return {
        "current": {
            "cape": 450.0,
            "precipitation": 0.5,
            "surface_pressure": 1013.0,
        },
        "hourly": {
            "precipitation": [0.1 * i for i in range(48)],
            "cape": [100.0 + 10 * i for i in range(48)],
            "surface_pressure": [1013.0 - 0.2 * i for i in range(48)],
        },
    }


@respx.mock
async def test_happy_path():
    respx.get(_OM_URL).mock(
        return_value=Response(200, json=_make_upper_air_response())
    )
    result = await open_meteo_upper_air.fetch_upper_air(39.5, -0.4)
    assert result["cape_current"] == 450.0
    expected_precip_6h = sum(0.1 * i for i in range(6))
    assert result["precip_forecast_6h"] == pytest.approx(expected_precip_6h)
    expected_precip_24h = sum(0.1 * i for i in range(24))
    assert result["precip_forecast_24h"] == pytest.approx(expected_precip_24h)
    assert result["cape_max_6h"] == pytest.approx(150.0)
    assert len(result["precip_hourly"]) == 48
    assert len(result["cape_hourly"]) == 48
    assert len(result["pressure_hourly"]) == 48


@respx.mock
async def test_short_arrays():
    payload = {
        "current": {"cape": 100.0, "precipitation": 0.0, "surface_pressure": 1010.0},
        "hourly": {
            "precipitation": [0.5, 1.0],
            "cape": [200.0, 300.0],
            "surface_pressure": [1010.0, 1009.0],
        },
    }
    respx.get(_OM_URL).mock(return_value=Response(200, json=payload))
    result = await open_meteo_upper_air.fetch_upper_air(39.5, -0.4)
    assert result["precip_forecast_6h"] == 0.0
    assert result["precip_forecast_24h"] == 0.0
    assert result["cape_max_6h"] == 0.0
    assert result["pressure_change_forecast_6h"] == 0.0
    assert result["cape_current"] == 100.0


@respx.mock
async def test_error_returns_defaults():
    respx.get(_OM_URL).mock(
        return_value=Response(503, text="Service Unavailable")
    )
    result = await open_meteo_upper_air.fetch_upper_air(39.5, -0.4)
    assert result["cape_current"] == 0.0
    assert result["cape_max_6h"] == 0.0
    assert result["precip_forecast_6h"] == 0.0
    assert result["precip_forecast_24h"] == 0.0
    assert result["pressure_change_forecast_6h"] == 0.0
    assert result["precip_hourly"] == []
    assert result["cape_hourly"] == []
    assert result["pressure_hourly"] == []
