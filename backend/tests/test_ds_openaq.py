"""Tests for OpenAQ data source module."""

import pytest
import respx
from httpx import Response

from app.data import openaq

_LOCATIONS_RESPONSE = {
    "results": [
        {
            "id": 12345,
            "name": "Madrid Station",
            "sensors": [
                {"id": 1, "parameter": {"name": "pm25"}},
                {"id": 2, "parameter": {"name": "no2"}},
            ],
        }
    ]
}

_LATEST_RESPONSE = {
    "results": [
        {"sensorsId": 1, "value": 15.3},
        {"sensorsId": 2, "value": 28.7},
    ]
}

_NO_RESULTS_RESPONSE = {"results": []}


@pytest.fixture(autouse=True)
def clear_cache():
    openaq._cache.clear()
    openaq._cache_ts.clear()
    yield
    openaq._cache.clear()
    openaq._cache_ts.clear()


@pytest.fixture(autouse=True)
def no_retry_wait(monkeypatch):
    monkeypatch.setattr("tenacity.nap.time.sleep", lambda x: None)


@pytest.fixture(autouse=True)
def mock_settings(monkeypatch):
    monkeypatch.setattr("app.data.openaq.settings.openaq_api_key", "test-key")


@respx.mock
async def test_happy_path():
    """Location and latest measurements are fetched and combined."""
    respx.get("https://api.openaq.org/v3/locations").mock(
        return_value=Response(200, json=_LOCATIONS_RESPONSE)
    )
    respx.get("https://api.openaq.org/v3/locations/12345/latest").mock(
        return_value=Response(200, json=_LATEST_RESPONSE)
    )
    result = await openaq.fetch_air_quality(lat=40.42, lon=-3.70)
    assert result["station_name"] == "Madrid Station"
    assert result["location_id"] == 12345
    assert result["pm25"] == 15.3
    assert result["no2"] == 28.7
    assert "pm25" in result["available_params"]


@respx.mock
async def test_no_results():
    """Empty results from locations endpoint returns empty dict."""
    respx.get("https://api.openaq.org/v3/locations").mock(
        return_value=Response(200, json=_NO_RESULTS_RESPONSE)
    )
    result = await openaq.fetch_air_quality(lat=40.42, lon=-3.70)
    assert result == {}


@respx.mock
async def test_http_error():
    """HTTP error on locations endpoint returns empty dict."""
    respx.get("https://api.openaq.org/v3/locations").mock(
        return_value=Response(500, text="error")
    )
    result = await openaq.fetch_air_quality(lat=40.42, lon=-3.70)
    assert result == {}


@respx.mock
async def test_cache_hit():
    """Second call returns cached data without HTTP requests."""
    respx.get("https://api.openaq.org/v3/locations").mock(
        return_value=Response(200, json=_LOCATIONS_RESPONSE)
    )
    respx.get("https://api.openaq.org/v3/locations/12345/latest").mock(
        return_value=Response(200, json=_LATEST_RESPONSE)
    )
    first = await openaq.fetch_air_quality(lat=40.42, lon=-3.70)
    assert first["station_name"] == "Madrid Station"

    respx.reset()

    second = await openaq.fetch_air_quality(lat=40.42, lon=-3.70)
    assert second == first
