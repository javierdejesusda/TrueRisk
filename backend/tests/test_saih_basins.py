"""Tests for SAIH basin fetchers.

Includes both unit tests for helper functions and integration tests
for the basin fetchers (tolerant of network failures).
"""

from __future__ import annotations

from typing import Any
from unittest.mock import AsyncMock

import httpx
import pytest

from app.data.saih_realtime import (
    _enrich_with_known_coords,
    _fetch_guadalquivir_flows,
    _fetch_guadiana_flows,
    _fetch_jucar_flows,
    _fetch_duero_flows,
    _fetch_norte_flows,
    _fetch_segura_flows,
    _fetch_sur_flows,
    _fetch_tajo_flows,
    _parse_embedded_js_flows,
    _parse_generic_flow_items,
    _parse_html_table_flows,
    _utm30n_to_wgs84,
    fetch_river_flows,
    SAIH_BASINS,
)

_REQUIRED_KEYS = {"gauge_id", "name", "river", "flow_m3s", "level_m", "lat", "lon", "basin"}


def _assert_reading_schema(reading: dict[str, Any], basin: str) -> None:
    """Assert that a single reading dict has the expected schema."""
    assert isinstance(reading, dict)
    missing = _REQUIRED_KEYS - set(reading.keys())
    assert not missing, f"Missing keys: {missing}"
    assert reading["gauge_id"].startswith(f"{basin}_")
    assert isinstance(reading["name"], str)
    assert isinstance(reading["river"], str)
    assert reading["basin"] != ""


# ─── Helper function unit tests ─────────────────────────────────────


def test_enrich_with_known_coords():
    readings = [{"name": "Toledo Station", "lat": None, "lon": None}]
    coords = {"toledo": (39.858, -4.024)}
    result = _enrich_with_known_coords(readings, coords)
    assert result[0]["lat"] == 39.858
    assert result[0]["lon"] == -4.024


def test_enrich_skips_already_geocoded():
    readings = [{"name": "Test", "lat": 40.0, "lon": -3.0}]
    result = _enrich_with_known_coords(readings, {"test": (41.0, -4.0)})
    assert result[0]["lat"] == 40.0  # unchanged


def test_parse_html_table_flows():
    html = '<td>Aranjuez</td><td>15.23</td>'
    result = _parse_html_table_flows(html, "tajo", "Tajo")
    assert len(result) == 1
    assert result[0]["flow_m3s"] == 15.23
    assert result[0]["basin"] == "Tajo"


def test_parse_html_table_skips_headers():
    html = '<td>Nombre</td><td>0</td>'
    result = _parse_html_table_flows(html, "tajo", "Tajo")
    assert len(result) == 0


def test_parse_embedded_js():
    html = 'let aforos = [{"codigo": "001", "nombre": "Test", "caudal": 25.5}];'
    result = _parse_embedded_js_flows(html, "test", "Test")
    assert len(result) == 1
    assert result[0]["flow_m3s"] == 25.5


def test_parse_generic_items():
    items = [{"codigo": "001", "nombre": "Station A", "caudal": 10.0, "rio": "Tajo"}]
    result = _parse_generic_flow_items(items, "tajo", "Tajo")
    assert len(result) == 1
    assert result[0]["gauge_id"] == "tajo_001"
    assert result[0]["flow_m3s"] == 10.0


def test_all_basins_configured():
    assert len(SAIH_BASINS) == 9
    for key in ["ebro", "jucar", "guadalquivir", "segura", "tajo", "duero", "norte", "guadiana", "sur"]:
        assert key in SAIH_BASINS


# ─── Network error handling tests ───────────────────────────────────


@pytest.mark.asyncio
async def test_tajo_handles_network_error():
    mock_client = AsyncMock(spec=httpx.AsyncClient)
    mock_client.get.side_effect = httpx.ConnectError("Connection refused")
    result = await _fetch_tajo_flows(mock_client)
    assert result == []


@pytest.mark.asyncio
async def test_duero_handles_network_error():
    mock_client = AsyncMock(spec=httpx.AsyncClient)
    mock_client.get.side_effect = httpx.ConnectError("Connection refused")
    result = await _fetch_duero_flows(mock_client)
    assert result == []


@pytest.mark.asyncio
async def test_norte_handles_network_error():
    mock_client = AsyncMock(spec=httpx.AsyncClient)
    mock_client.get.side_effect = httpx.ConnectError("Connection refused")
    result = await _fetch_norte_flows(mock_client)
    assert result == []


@pytest.mark.asyncio
async def test_guadiana_handles_network_error():
    mock_client = AsyncMock(spec=httpx.AsyncClient)
    mock_client.get.side_effect = httpx.ConnectError("Connection refused")
    result = await _fetch_guadiana_flows(mock_client)
    assert result == []


@pytest.mark.asyncio
async def test_sur_handles_network_error():
    mock_client = AsyncMock(spec=httpx.AsyncClient)
    mock_client.get.side_effect = httpx.ConnectError("Connection refused")
    result = await _fetch_sur_flows(mock_client)
    assert result == []


# ─── UTM conversion tests ───────────────────────────────────────────


def test_utm30n_to_wgs84_valencia():
    """Verify UTM conversion for a known point near Valencia city."""
    lat, lon = _utm30n_to_wgs84(725800.0, 4372400.0)
    assert 39.0 < lat < 40.0, f"lat {lat} out of range"
    assert -1.0 < lon < 0.0, f"lon {lon} out of range"


def test_utm30n_to_wgs84_seville():
    """Verify UTM conversion for a known point near Seville."""
    lat, lon = _utm30n_to_wgs84(235000.0, 4142000.0)
    assert 37.0 < lat < 38.0, f"lat {lat} out of range"
    assert -6.5 < lon < -5.0, f"lon {lon} out of range"


# ─── Basin fetcher integration tests ────────────────────────────────


@pytest.fixture
async def http_client():
    async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
        yield client


@pytest.mark.asyncio
async def test_fetch_jucar_flows(http_client: httpx.AsyncClient):
    """Test Jucar fetcher returns valid data or empty list on failure."""
    try:
        readings = await _fetch_jucar_flows(http_client)
    except Exception:
        pytest.skip("Jucar SAIH unreachable")
        return

    assert isinstance(readings, list)
    if readings:
        for r in readings[:5]:
            _assert_reading_schema(r, "jucar")
        assert len(readings) > 10, f"Expected many stations, got {len(readings)}"
        with_coords = [r for r in readings if r["lat"] is not None]
        assert len(with_coords) > 0, "Expected some stations to have coordinates"
        for r in with_coords[:5]:
            assert 36.0 < r["lat"] < 42.0, f"lat {r['lat']} out of range"
            assert -4.0 < r["lon"] < 2.0, f"lon {r['lon']} out of range"


@pytest.mark.asyncio
async def test_fetch_guadalquivir_flows(http_client: httpx.AsyncClient):
    """Test Guadalquivir fetcher returns valid data or empty list on failure."""
    try:
        readings = await _fetch_guadalquivir_flows(http_client)
    except Exception:
        pytest.skip("Guadalquivir SAIH unreachable")
        return

    assert isinstance(readings, list)
    if readings:
        for r in readings:
            _assert_reading_schema(r, "guadalquivir")
            assert r["basin"] == "Guadalquivir"


@pytest.mark.asyncio
async def test_fetch_segura_flows(http_client: httpx.AsyncClient):
    """Test Segura fetcher returns a list (likely empty due to gated API)."""
    try:
        readings = await _fetch_segura_flows(http_client)
    except Exception:
        pytest.skip("Segura SAIH unreachable")
        return

    assert isinstance(readings, list)
    if readings:
        for r in readings[:5]:
            _assert_reading_schema(r, "segura")


@pytest.mark.asyncio
async def test_fetch_river_flows_unknown_basin():
    """Test that an unknown basin returns empty list."""
    result = await fetch_river_flows("nonexistent")
    assert result == []
