"""Tests for IberFire grid service."""

import pytest
from app.services.fire_grid_service import (
    compute_fire_proximity,
    build_fire_grid,
    _haversine_km,
)


def test_haversine_madrid_barcelona():
    """Madrid to Barcelona is ~500km."""
    dist = _haversine_km(40.4168, -3.7038, 41.3874, 2.1686)
    assert 490 < dist < 530


def test_haversine_same_point():
    assert _haversine_km(40.0, -3.0, 40.0, -3.0) == 0.0


def test_fire_proximity_no_fires():
    result = compute_fire_proximity(40.4, -3.7, [])
    assert result.nearest_fire_km is None
    assert result.fire_count_50km == 0
    assert result.fire_count_100km == 0
    assert result.proximity_modifier == 1.0


def test_fire_proximity_nearby_fire():
    fires = [{"lat": 40.45, "lon": -3.65, "frp": 50.0}]
    result = compute_fire_proximity(40.4, -3.7, fires)
    assert result.nearest_fire_km is not None
    assert result.nearest_fire_km < 10
    assert result.fire_count_50km == 1
    assert result.proximity_modifier >= 1.3


def test_fire_proximity_distant_fire():
    fires = [{"lat": 42.0, "lon": -1.0, "frp": 30.0}]
    result = compute_fire_proximity(40.4, -3.7, fires)
    assert result.nearest_fire_km is not None
    assert result.nearest_fire_km > 100
    assert result.fire_count_50km == 0
    assert result.proximity_modifier == 1.0


def test_fire_proximity_many_fires():
    fires = [
        {"lat": 40.4 + i * 0.05, "lon": -3.7 + i * 0.02, "frp": 20.0}
        for i in range(10)
    ]
    result = compute_fire_proximity(40.4, -3.7, fires)
    assert result.fire_count_50km > 0
    assert result.fire_density_score > 0


def test_build_fire_grid_empty():
    cells = build_fire_grid([])
    assert cells == []


def test_build_fire_grid_single():
    fires = [{"lat": 40.4, "lon": -3.7, "frp": 50.0, "confidence": "high"}]
    cells = build_fire_grid(fires)
    assert len(cells) == 1
    assert cells[0].fire_count == 1
    assert cells[0].risk_level == "low"


def test_build_fire_grid_cluster():
    fires = [
        {"lat": 40.4 + i * 0.01, "lon": -3.7 + i * 0.01, "frp": 30.0, "confidence": "nominal"}
        for i in range(6)
    ]
    cells = build_fire_grid(fires)
    assert len(cells) >= 1
    assert any(c.risk_level in ("high", "extreme") for c in cells) or any(c.fire_count >= 2 for c in cells)


def test_build_fire_grid_outside_spain():
    fires = [{"lat": 60.0, "lon": 20.0, "frp": 50.0}]
    cells = build_fire_grid(fires)
    assert cells == []


@pytest.mark.asyncio
async def test_fire_grid_endpoint(client, mock_external_apis):
    response = await client.get("/api/v1/data/fire-grid")
    assert response.status_code == 200
    if response.status_code == 200:
        data = response.json()
        assert "grid_resolution_deg" in data
        assert "cells" in data


@pytest.mark.asyncio
async def test_fire_proximity_endpoint(client, mock_external_apis):
    response = await client.get("/api/v1/data/fire-proximity?lat=40.4&lon=-3.7")
    assert response.status_code == 200
    if response.status_code == 200:
        data = response.json()
        assert "nearest_fire_km" in data
        assert "proximity_modifier" in data
