"""Tests for NASA FIRMS data source module."""

import httpx
import pytest
import respx
from httpx import Response

from app.data import nasa_firms

_FIRMS_URL = "https://firms.modaps.eosdis.nasa.gov/api/area/csv/TESTKEY/VIIRS_SNPP_NRT/world/1"

_CSV_HEADER = "latitude,longitude,brightness,confidence,frp,acq_date,acq_time,satellite"
_SPAIN_ROW = "40.42,-3.70,340.5,high,25.3,2024-07-15,1230,N"
_OUTSIDE_ROW = "55.00,10.00,300.0,nominal,10.0,2024-07-15,1200,N"

_VALID_CSV = f"{_CSV_HEADER}\n{_SPAIN_ROW}\n"
_MULTI_CSV = f"{_CSV_HEADER}\n{_SPAIN_ROW}\n{_OUTSIDE_ROW}\n"


@pytest.fixture(autouse=True)
def clear_cache():
    """Reset module-level caches before each test."""
    nasa_firms._cache = []
    nasa_firms._cache_ts = 0.0
    yield
    nasa_firms._cache = []
    nasa_firms._cache_ts = 0.0


@pytest.fixture(autouse=True)
def no_retry_wait(monkeypatch):
    """Make tenacity retries instant in tests."""
    monkeypatch.setattr("tenacity.nap.time.sleep", lambda x: None)


@respx.mock
async def test_happy_path():
    respx.get(url__startswith="https://firms.modaps.eosdis.nasa.gov/").mock(
        return_value=Response(200, text=_VALID_CSV)
    )
    result = await nasa_firms.fetch_active_fires(map_key="TESTKEY")

    assert len(result) == 1
    fire = result[0]
    assert fire["lat"] == 40.42
    assert fire["lon"] == -3.70
    assert fire["brightness"] == 340.5
    assert fire["confidence"] == "high"
    assert fire["frp"] == 25.3


@respx.mock
async def test_filters_non_spain():
    respx.get(url__startswith="https://firms.modaps.eosdis.nasa.gov/").mock(
        return_value=Response(200, text=_MULTI_CSV)
    )
    result = await nasa_firms.fetch_active_fires(map_key="TESTKEY")
    assert len(result) == 1
    assert result[0]["lat"] == 40.42


async def test_no_api_key(monkeypatch):
    monkeypatch.setattr("app.data.nasa_firms.settings.firms_map_key", "")
    result = await nasa_firms.fetch_active_fires(map_key=None)
    assert result == []


@respx.mock
async def test_http_error_returns_empty():
    respx.get(url__startswith="https://firms.modaps.eosdis.nasa.gov/").mock(
        return_value=Response(500, text="error")
    )
    result = await nasa_firms.fetch_active_fires(map_key="TESTKEY")
    assert result == []


@respx.mock
async def test_timeout_returns_empty():
    respx.get(url__startswith="https://firms.modaps.eosdis.nasa.gov/").mock(
        side_effect=httpx.ReadTimeout("read timed out")
    )
    result = await nasa_firms.fetch_active_fires(map_key="TESTKEY")
    assert result == []


@respx.mock
async def test_cache_hit():
    route = respx.get(url__startswith="https://firms.modaps.eosdis.nasa.gov/").mock(
        return_value=Response(200, text=_VALID_CSV)
    )
    await nasa_firms.fetch_active_fires(map_key="TESTKEY")
    assert route.call_count == 1

    result = await nasa_firms.fetch_active_fires(map_key="TESTKEY")
    assert route.call_count == 1
    assert len(result) == 1


@respx.mock
async def test_malformed_csv():
    bad_csv = "not_a_real_header\ngarbage_data\n"
    respx.get(url__startswith="https://firms.modaps.eosdis.nasa.gov/").mock(
        return_value=Response(200, text=bad_csv)
    )
    result = await nasa_firms.fetch_active_fires(map_key="TESTKEY")
    assert result == []
