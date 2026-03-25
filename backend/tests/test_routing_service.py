"""Tests for OSRM routing service."""
import pytest
from unittest.mock import AsyncMock, patch
import httpx

from app.services.routing_service import (
    get_route,
    get_evacuation_route,
    _haversine_fallback,
)


def test_haversine_madrid_to_toledo():
    result = _haversine_fallback((40.4168, -3.7038), (39.8628, -4.0273))
    assert 60 < result["distance_km"] < 75  # ~66 km straight line
    assert result["source"] == "haversine"
    assert result["geometry"]["type"] == "LineString"


def test_haversine_zero_distance():
    result = _haversine_fallback((40.0, -3.0), (40.0, -3.0))
    assert result["distance_km"] == 0.0


@pytest.mark.asyncio
async def test_get_route_falls_back_on_error():
    with patch("app.services.routing_service.httpx.AsyncClient") as MockClient:
        mock_instance = AsyncMock()
        mock_instance.get.side_effect = httpx.ConnectError("Connection refused")
        mock_instance.__aenter__ = AsyncMock(return_value=mock_instance)
        mock_instance.__aexit__ = AsyncMock(return_value=False)
        MockClient.return_value = mock_instance

        result = await get_route((40.4, -3.7), (39.86, -4.03))
        assert result["source"] == "haversine"
        assert result["distance_km"] > 0


@pytest.mark.asyncio
async def test_evacuation_route_empty_safe_points():
    result = await get_evacuation_route(40.4, -3.7, [])
    assert result == []


@pytest.mark.asyncio
async def test_evacuation_route_sorts_by_distance():
    safe_points = [
        {"name": "Far", "latitude": 41.0, "longitude": -4.0, "type": "shelter"},
        {"name": "Near", "latitude": 40.45, "longitude": -3.75, "type": "shelter"},
    ]
    with patch("app.services.routing_service.get_route") as mock_route:
        mock_route.side_effect = lambda o, d, profile="driving": {
            "geometry": {"type": "LineString", "coordinates": []},
            "distance_km": _haversine_fallback(o, d)["distance_km"],
            "duration_min": 10,
            "source": "haversine",
        }
        routes = await get_evacuation_route(40.4, -3.7, safe_points, max_candidates=2)
        assert len(routes) == 2
        assert routes[0]["distance_km"] <= routes[1]["distance_km"]
