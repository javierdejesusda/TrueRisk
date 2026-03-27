"""Tests for Copernicus CAMS data source module."""

import pytest
import respx
from httpx import Response

from app.data import copernicus_cams

_CAMS_URL = "https://regional.atmosphere.copernicus.eu/api/v1/forecast"

_SAMPLE_RESPONSE = {
    "pm25": 12.5,
    "pm10": 25.0,
    "o3": 60.0,
    "no2": 15.0,
    "co": 0.3,
}


@pytest.fixture(autouse=True)
def clear_cache():
    """Reset module-level caches before each test."""
    copernicus_cams._cache.clear()
    copernicus_cams._cache_ts.clear()
    yield
    copernicus_cams._cache.clear()
    copernicus_cams._cache_ts.clear()


@pytest.fixture(autouse=True)
def no_retry_wait(monkeypatch):
    """Make tenacity retries instant in tests."""
    monkeypatch.setattr("tenacity.nap.time.sleep", lambda x: None)


@respx.mock
async def test_happy_path():
    respx.get(_CAMS_URL).mock(return_value=Response(200, json=_SAMPLE_RESPONSE))
    result = await copernicus_cams.fetch_air_quality_forecast(40.4, -3.7)

    assert result["pm25_forecast"] == 12.5
    assert result["pm10_forecast"] == 25.0
    assert result["o3_forecast"] == 60.0
    assert result["no2_forecast"] == 15.0
    assert result["co_forecast"] == 0.3


@respx.mock
async def test_http_error_returns_empty():
    respx.get(_CAMS_URL).mock(return_value=Response(500, text="error"))
    result = await copernicus_cams.fetch_air_quality_forecast(40.4, -3.7)
    assert result == {}


@respx.mock
async def test_cache_hit():
    route = respx.get(_CAMS_URL).mock(return_value=Response(200, json=_SAMPLE_RESPONSE))
    await copernicus_cams.fetch_air_quality_forecast(40.4, -3.7)
    assert route.call_count == 1

    result = await copernicus_cams.fetch_air_quality_forecast(40.4, -3.7)
    assert route.call_count == 1
    assert result["pm25_forecast"] == 12.5


@respx.mock
async def test_stale_on_error():
    respx.get(_CAMS_URL).mock(return_value=Response(200, json=_SAMPLE_RESPONSE))
    first = await copernicus_cams.fetch_air_quality_forecast(40.4, -3.7)
    assert first["pm25_forecast"] == 12.5

    copernicus_cams._cache_ts.clear()
    respx.reset()
    respx.get(_CAMS_URL).mock(return_value=Response(500, text="error"))
    result = await copernicus_cams.fetch_air_quality_forecast(40.4, -3.7)
    assert result["pm25_forecast"] == 12.5
