"""Tests for USGS earthquake data source module."""

import httpx
import pytest
import respx
from httpx import Response

from app.data import usgs_earthquake

_USGS_URL = "https://earthquake.usgs.gov/fdsnws/event/1/query"

_SAMPLE_FEATURE = {
    "type": "Feature",
    "properties": {
        "mag": 3.5,
        "place": "10km NW of Madrid, Spain",
        "time": 1700000000000,
        "felt": 12,
        "tsunami": 0,
    },
    "geometry": {
        "type": "Point",
        "coordinates": [-3.70, 40.42, 8.5],
    },
}

_SAMPLE_RESPONSE = {
    "type": "FeatureCollection",
    "features": [_SAMPLE_FEATURE],
}


@pytest.fixture(autouse=True)
def clear_cache():
    """Reset module-level caches before each test."""
    usgs_earthquake._cache = []
    usgs_earthquake._cache_ts = 0.0
    yield
    usgs_earthquake._cache = []
    usgs_earthquake._cache_ts = 0.0


@pytest.fixture(autouse=True)
def no_retry_wait(monkeypatch):
    """Make tenacity retries instant in tests."""
    monkeypatch.setattr("tenacity.nap.time.sleep", lambda x: None)


@respx.mock
async def test_happy_path():
    respx.get(_USGS_URL).mock(return_value=Response(200, json=_SAMPLE_RESPONSE))
    result = await usgs_earthquake.fetch_recent_quakes()

    assert len(result) == 1
    quake = result[0]
    assert quake["magnitude"] == 3.5
    assert quake["lat"] == 40.42
    assert quake["lon"] == -3.70
    assert quake["depth_km"] == 8.5
    assert quake["place"] == "10km NW of Madrid, Spain"
    assert quake["felt"] == 12
    assert quake["tsunami"] == 0


@respx.mock
async def test_empty_features():
    respx.get(_USGS_URL).mock(
        return_value=Response(200, json={"type": "FeatureCollection", "features": []})
    )
    result = await usgs_earthquake.fetch_recent_quakes()
    assert result == []


@respx.mock
async def test_http_error_returns_empty():
    respx.get(_USGS_URL).mock(return_value=Response(500, text="Internal Server Error"))
    result = await usgs_earthquake.fetch_recent_quakes()
    assert result == []


@respx.mock
async def test_stale_cache_on_error():
    respx.get(_USGS_URL).mock(return_value=Response(200, json=_SAMPLE_RESPONSE))
    first = await usgs_earthquake.fetch_recent_quakes()
    assert len(first) == 1

    usgs_earthquake._cache_ts = 0.0
    respx.reset()
    respx.get(_USGS_URL).mock(return_value=Response(500, text="error"))
    result = await usgs_earthquake.fetch_recent_quakes()
    assert len(result) == 1
    assert result[0]["magnitude"] == 3.5


@respx.mock
async def test_timeout_returns_empty():
    respx.get(_USGS_URL).mock(side_effect=httpx.ReadTimeout("read timed out"))
    result = await usgs_earthquake.fetch_recent_quakes()
    assert result == []


@respx.mock
async def test_cache_hit():
    route = respx.get(_USGS_URL).mock(return_value=Response(200, json=_SAMPLE_RESPONSE))
    await usgs_earthquake.fetch_recent_quakes()
    assert route.call_count == 1

    result = await usgs_earthquake.fetch_recent_quakes()
    assert route.call_count == 1
    assert len(result) == 1


@respx.mock
async def test_missing_features_key():
    respx.get(_USGS_URL).mock(return_value=Response(200, json={"type": "FeatureCollection"}))
    result = await usgs_earthquake.fetch_recent_quakes()
    assert result == []


@respx.mock
async def test_malformed_feature():
    bad_feature = {"type": "Feature", "properties": {}, "geometry": {}}
    respx.get(_USGS_URL).mock(
        return_value=Response(200, json={"type": "FeatureCollection", "features": [bad_feature]})
    )
    result = await usgs_earthquake.fetch_recent_quakes()
    assert len(result) == 1
    assert result[0]["magnitude"] == 0
    assert result[0]["lat"] == 0
    assert result[0]["lon"] == 0
