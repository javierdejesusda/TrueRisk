"""Tests for GPS-based location alert delivery (Task 9)."""

from __future__ import annotations

import pytest

from app.api.location import find_nearest_province, _haversine


# ---------------------------------------------------------------------------
# Unit tests – province lookup
# ---------------------------------------------------------------------------

def test_nearest_province_madrid():
    """Madrid coordinates should return province code '28'."""
    code = find_nearest_province(40.4168, -3.7038)
    assert code == "28"


def test_nearest_province_valencia():
    """Valencia coordinates should return province code '46'."""
    code = find_nearest_province(39.4699, -0.3763)
    assert code == "46"


def test_nearest_province_barcelona():
    """Barcelona coordinates should return province code '08'."""
    code = find_nearest_province(41.3851, 2.1734)
    assert code == "08"


def test_nearest_province_seville():
    """Seville coordinates should return province code '41'."""
    code = find_nearest_province(37.3891, -5.9845)
    assert code == "41"


def test_nearest_province_malaga():
    """Malaga coordinates should return province code '29'."""
    code = find_nearest_province(36.7213, -4.4214)
    assert code == "29"


def test_nearest_province_returns_string():
    """find_nearest_province always returns a string."""
    result = find_nearest_province(40.0, -3.0)
    assert isinstance(result, str)
    assert len(result) == 2


def test_nearest_province_canary_islands_tenerife():
    """Tenerife coordinates should return province code '38'."""
    code = find_nearest_province(28.2916, -16.6291)
    assert code == "38"


def test_nearest_province_canary_islands_las_palmas():
    """Las Palmas (Gran Canaria) coordinates should return province code '35'."""
    code = find_nearest_province(28.1248, -15.4300)
    assert code == "35"


# ---------------------------------------------------------------------------
# Unit tests – Haversine distance
# ---------------------------------------------------------------------------

def test_haversine_same_point():
    """Distance from a point to itself is zero."""
    assert _haversine(40.0, -3.0, 40.0, -3.0) == pytest.approx(0.0)


def test_haversine_madrid_to_barcelona():
    """Madrid–Barcelona is approximately 505 km."""
    dist = _haversine(40.4168, -3.7038, 41.3851, 2.1734)
    assert 490 < dist < 520


def test_haversine_is_symmetric():
    """Haversine distance is symmetric."""
    d1 = _haversine(40.0, -3.0, 39.5, -0.4)
    d2 = _haversine(39.5, -0.4, 40.0, -3.0)
    assert d1 == pytest.approx(d2)


# ---------------------------------------------------------------------------
# Integration tests – HTTP endpoint
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_update_location_requires_auth(client):
    """POST /location/update without token should return 401."""
    response = await client.post("/api/v1/location/update", json={"lat": 40.4168, "lon": -3.7038})
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_current_province_requires_auth(client):
    """GET /location/current-province without token should return 401."""
    response = await client.get("/api/v1/location/current-province")
    assert response.status_code == 401
