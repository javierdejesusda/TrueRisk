"""Tests for the B2B insurance risk report API.

Covers: API key validation (valid/invalid), report structure, usage stats.
"""

import hashlib
from unittest.mock import AsyncMock, patch

import pytest

from app.models.api_key import ApiKey
from app.services.arpsi_service import FloodZoneResult
from app.services.elevation_service import ElevationResult
from app.services.property_risk_service import HazardDetail, PropertyRiskResult


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

TEST_API_KEY = "test-secret-key-12345"
TEST_KEY_HASH = hashlib.sha256(TEST_API_KEY.encode()).hexdigest()


async def _seed_api_key(client, *, is_active: bool = True) -> None:
    """Insert a test API key into the test database."""
    from tests.conftest import test_session_factory

    async with test_session_factory() as session:
        key = ApiKey(
            key_hash=TEST_KEY_HASH,
            name="Test Insurance Partner",
            partner_email="partner@example.com",
            is_active=is_active,
            rate_limit_per_hour=100,
            request_count=0,
        )
        session.add(key)
        await session.commit()


def _mock_property_risk_result():
    """Return a fake PropertyRiskResult for testing."""
    flood_zone = FloodZoneResult(
        in_flood_zone=False,
        zone_id=None,
        zone_name=None,
        zone_type=None,
        return_period=None,
        risk_level=None,
        distance_to_nearest_zone_m=1200.0,
    )
    terrain = ElevationResult(elevation_m=650.0, slope_pct=3.2)
    return PropertyRiskResult(
        composite_score=42.5,
        dominant_hazard="wildfire",
        severity="high",
        flood=HazardDetail(score=15.0, province_score=30.0, modifier=0.5, severity="low", explanation="Not in flood zone"),
        wildfire=HazardDetail(score=42.5, province_score=35.0, modifier=1.21, severity="high", explanation="Elevated terrain"),
        heatwave=HazardDetail(score=28.0, province_score=28.0, modifier=1.0, severity="moderate", explanation="Standard"),
        drought=HazardDetail(score=20.0, province_score=20.0, modifier=1.0, severity="low", explanation="Province-wide"),
        coldwave=HazardDetail(score=10.0, province_score=10.0, modifier=1.0, severity="low", explanation="Standard"),
        windstorm=HazardDetail(score=12.0, province_score=12.0, modifier=1.0, severity="low", explanation="Standard"),
        seismic=HazardDetail(score=5.0, province_score=5.0, modifier=1.0, severity="low", explanation="Geology-based"),
        flood_zone=flood_zone,
        terrain=terrain,
    )


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_report_without_api_key_returns_401(client):
    """Request without X-API-Key header should be rejected (missing credentials)."""
    response = await client.get("/api/v1/insurance/report?lat=40.4&lon=-3.7")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_report_with_invalid_api_key_returns_403(client):
    """Request with a wrong API key should be rejected."""
    response = await client.get(
        "/api/v1/insurance/report?lat=40.4&lon=-3.7",
        headers={"X-API-Key": "wrong-key"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_report_with_inactive_key_returns_403(client):
    """Request with a deactivated API key should be rejected."""
    await _seed_api_key(client, is_active=False)
    response = await client.get(
        "/api/v1/insurance/report?lat=40.4&lon=-3.7",
        headers={"X-API-Key": TEST_API_KEY},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
@patch("app.services.insurance_report_service.compute_property_risk", new_callable=AsyncMock)
async def test_report_with_valid_key_returns_report(mock_compute, client):
    """Valid API key should return a structured insurance report."""
    mock_compute.return_value = _mock_property_risk_result()
    await _seed_api_key(client)

    response = await client.get(
        "/api/v1/insurance/report?lat=40.4&lon=-3.7&address=Calle+Mayor+1",
        headers={"X-API-Key": TEST_API_KEY},
    )
    assert response.status_code == 200
    data = response.json()

    # Report structure checks
    assert data["report_type"] == "insurance_risk_assessment"
    assert data["version"] == "1.0"
    assert data["address"] == "Calle Mayor 1"
    assert "coordinates" in data
    assert data["coordinates"]["latitude"] == 40.4
    assert data["coordinates"]["longitude"] == -3.7
    assert "province_code" in data
    assert "province_name" in data

    # Risk scores
    scores = data["risk_scores"]
    assert "composite" in scores
    assert "flood" in scores
    assert "wildfire" in scores
    assert "drought" in scores
    assert "heatwave" in scores
    assert "seismic" in scores
    assert "coldwave" in scores
    assert "windstorm" in scores

    # Hazard info
    assert "dominant_hazard" in data
    assert "severity" in data

    # Property analysis
    analysis = data["property_analysis"]
    assert "elevation_m" in analysis
    assert "flood_zone" in analysis
    assert "in_flood_zone" in analysis
    assert "modifiers" in analysis

    # Metadata
    assert "data_sources" in data
    assert "report_date" in data
    assert "valid_until" in data
    assert "disclaimer" in data
    assert data["partner"] == "Test Insurance Partner"


@pytest.mark.asyncio
@patch("app.services.insurance_report_service.compute_property_risk", new_callable=AsyncMock)
async def test_usage_stats_increment(mock_compute, client):
    """Each request should increment the API key's request_count."""
    mock_compute.return_value = _mock_property_risk_result()
    await _seed_api_key(client)

    # Make two requests
    await client.get(
        "/api/v1/insurance/report?lat=40.4&lon=-3.7",
        headers={"X-API-Key": TEST_API_KEY},
    )
    await client.get(
        "/api/v1/insurance/report?lat=41.3&lon=2.1",
        headers={"X-API-Key": TEST_API_KEY},
    )

    # Check usage via health endpoint (which also increments by 1)
    response = await client.get(
        "/api/v1/insurance/health",
        headers={"X-API-Key": TEST_API_KEY},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "active"
    assert data["partner"] == "Test Insurance Partner"
    # 2 report requests + 1 health request = 3 total
    assert data["requests_made"] == 3
    assert data["rate_limit_per_hour"] == 100


@pytest.mark.asyncio
async def test_health_with_valid_key(client):
    """Health endpoint should return partner info with valid key."""
    await _seed_api_key(client)
    response = await client.get(
        "/api/v1/insurance/health",
        headers={"X-API-Key": TEST_API_KEY},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "active"
    assert data["partner"] == "Test Insurance Partner"


@pytest.mark.asyncio
async def test_health_without_api_key_returns_401(client):
    """Health endpoint without API key should be rejected (missing credentials)."""
    response = await client.get("/api/v1/insurance/health")
    assert response.status_code == 401
