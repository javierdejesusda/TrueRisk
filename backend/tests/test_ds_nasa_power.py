"""Tests for the NASA POWER data source module."""

import pytest
import respx
from httpx import Response

from app.data import nasa_power


@pytest.fixture(autouse=True)
def clear_cache():
    """Reset module-level caches before each test."""
    nasa_power._cache.clear()
    nasa_power._cache_ts.clear()
    yield
    nasa_power._cache.clear()
    nasa_power._cache_ts.clear()


@pytest.fixture(autouse=True)
def no_retry_wait(monkeypatch):
    """Make tenacity retries instant in tests."""
    monkeypatch.setattr("tenacity.nap.time.sleep", lambda x: None)


def _make_power_response(solar_values: dict | None = None):
    """Build a realistic NASA POWER JSON response."""
    if solar_values is None:
        solar_values = {"20260301": 5.5, "20260302": 6.1, "20260303": 4.8}
    return {
        "properties": {
            "parameter": {
                "ALLSKY_SFC_SW_DWN": solar_values,
                "T2M": {"20260301": 12.0},
            }
        }
    }


@respx.mock
async def test_happy_path():
    payload = _make_power_response()
    respx.get("https://power.larc.nasa.gov/api/temporal/daily/point").mock(
        return_value=Response(200, json=payload)
    )
    result = await nasa_power.fetch_solar_and_agmet(40.0, -3.0)
    assert result["data_points"] == 3
    assert result["solar_irradiance_avg"] == pytest.approx((5.5 + 6.1 + 4.8) / 3)
    assert result["solar_irradiance_max"] == pytest.approx(6.1)


@respx.mock
async def test_sentinel_values_filtered():
    solar_with_sentinels = {"20260301": 5.0, "20260302": -999, "20260303": 7.0}
    payload = _make_power_response(solar_with_sentinels)
    respx.get("https://power.larc.nasa.gov/api/temporal/daily/point").mock(
        return_value=Response(200, json=payload)
    )
    result = await nasa_power.fetch_solar_and_agmet(40.0, -3.0)
    assert result["data_points"] == 2
    assert result["solar_irradiance_avg"] == pytest.approx(6.0)
    assert result["solar_irradiance_max"] == pytest.approx(7.0)


@respx.mock
async def test_http_error():
    respx.get("https://power.larc.nasa.gov/api/temporal/daily/point").mock(
        return_value=Response(503, text="Service Unavailable")
    )
    result = await nasa_power.fetch_solar_and_agmet(40.0, -3.0)
    assert result == {}


@respx.mock
async def test_cache_hit():
    route = respx.get("https://power.larc.nasa.gov/api/temporal/daily/point")
    route.mock(return_value=Response(200, json=_make_power_response()))

    first = await nasa_power.fetch_solar_and_agmet(40.0, -3.0)
    second = await nasa_power.fetch_solar_and_agmet(40.0, -3.0)
    assert first == second
    assert route.call_count == 1


@respx.mock
async def test_missing_parameter_path():
    payload = {"properties": {}}
    respx.get("https://power.larc.nasa.gov/api/temporal/daily/point").mock(
        return_value=Response(200, json=payload)
    )
    result = await nasa_power.fetch_solar_and_agmet(40.0, -3.0)
    assert result == {}
