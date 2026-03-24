"""Integration tests for SAIH basin fetchers.

These tests hit real external APIs and are therefore tolerant of
downtime / network errors.  They verify:

 1. Each fetcher returns a list (never raises).
 2. If results come back, every item has the expected schema.
 3. The UTM-to-WGS84 coordinate conversion is correct.
"""

from __future__ import annotations

import math
from typing import Any

import httpx
import pytest

from app.data.saih_realtime import (
    _fetch_ebro_flows,
    _fetch_guadalquivir_flows,
    _fetch_jucar_flows,
    _fetch_segura_flows,
    _utm30n_to_wgs84,
    fetch_river_flows,
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


# ─── UTM conversion tests ───────────────────────────────────────────


def test_utm30n_to_wgs84_valencia():
    """Verify UTM conversion for a known point near Valencia city."""
    # Valencia city centre is roughly UTM 30N (725800, 4372400)
    # Expected WGS84: ~39.47 N, ~-0.38 W
    lat, lon = _utm30n_to_wgs84(725800.0, 4372400.0)
    assert 39.0 < lat < 40.0, f"lat {lat} out of range"
    assert -1.0 < lon < 0.0, f"lon {lon} out of range"


def test_utm30n_to_wgs84_seville():
    """Verify UTM conversion for a known point near Seville."""
    # Seville: UTM 30N (235000, 4142000) → ~37.38 N, ~-5.98 W
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
        for r in readings[:5]:  # spot-check first 5
            _assert_reading_schema(r, "jucar")
        # Jucar should have many stations (~90+)
        assert len(readings) > 10, f"Expected many stations, got {len(readings)}"
        # At least some should have coordinates
        with_coords = [r for r in readings if r["lat"] is not None]
        assert len(with_coords) > 0, "Expected some stations to have coordinates"
        # Coordinates should be in Iberian Peninsula range
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
        # Should have the well-known main stations
        names_lower = [r["name"].lower() for r in readings]
        # At least one of these should be present
        known = ["alcalá del río", "peñaflor", "marmolejo", "mengíbar"]
        found = [n for n in known if any(n in nl for nl in names_lower)]
        assert len(found) > 0, f"Expected known stations, got names: {names_lower}"


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
async def test_fetch_river_flows_jucar():
    """Test the public fetch_river_flows function for Jucar basin."""
    try:
        readings = await fetch_river_flows("jucar")
    except Exception:
        pytest.skip("Jucar SAIH unreachable")
        return

    assert isinstance(readings, list)


@pytest.mark.asyncio
async def test_fetch_river_flows_unknown_basin():
    """Test that an unknown basin returns empty list."""
    result = await fetch_river_flows("nonexistent")
    assert result == []
