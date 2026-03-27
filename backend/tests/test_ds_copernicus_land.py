"""Tests for Copernicus Land NDVI data source module."""

import pytest
import respx
from httpx import Response

from app.data import copernicus_land

_LAND_URL = "https://land.copernicus.vgt.vito.be/geoserver/wms"


def _ndvi_response(ndvi_value):
    """Build a GeoServer-style feature response with the given NDVI."""
    return {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {"GRAY_INDEX": ndvi_value},
                "geometry": {"type": "Point", "coordinates": [-3.70, 40.42]},
            }
        ],
    }


@pytest.fixture(autouse=True)
def clear_cache():
    """Reset module-level caches before each test."""
    copernicus_land._cache.clear()
    copernicus_land._cache_ts.clear()
    yield
    copernicus_land._cache.clear()
    copernicus_land._cache_ts.clear()


@pytest.fixture(autouse=True)
def no_retry_wait(monkeypatch):
    """Make tenacity retries instant in tests."""
    monkeypatch.setattr("tenacity.nap.time.sleep", lambda x: None)


@respx.mock
async def test_happy_path_healthy():
    respx.get(_LAND_URL).mock(return_value=Response(200, json=_ndvi_response(0.72)))
    result = await copernicus_land.fetch_ndvi(40.42, -3.70)

    assert result["ndvi"] == 0.72
    assert result["vegetation_status"] == "healthy"


@respx.mock
async def test_happy_path_stressed():
    respx.get(_LAND_URL).mock(return_value=Response(200, json=_ndvi_response(0.35)))
    result = await copernicus_land.fetch_ndvi(40.42, -3.70)

    assert result["ndvi"] == 0.35
    assert result["vegetation_status"] == "stressed"


@respx.mock
async def test_no_features():
    respx.get(_LAND_URL).mock(
        return_value=Response(200, json={"type": "FeatureCollection", "features": []})
    )
    result = await copernicus_land.fetch_ndvi(40.42, -3.70)
    assert result["ndvi"] is None
    assert result["vegetation_status"] == "unavailable"


@respx.mock
async def test_http_error_returns_empty():
    respx.get(_LAND_URL).mock(return_value=Response(500, text="error"))
    result = await copernicus_land.fetch_ndvi(40.42, -3.70)
    assert result == {}


@respx.mock
async def test_cache_hit():
    route = respx.get(_LAND_URL).mock(return_value=Response(200, json=_ndvi_response(0.65)))
    await copernicus_land.fetch_ndvi(40.42, -3.70)
    assert route.call_count == 1

    result = await copernicus_land.fetch_ndvi(40.42, -3.70)
    assert route.call_count == 1
    assert result["ndvi"] == 0.65
