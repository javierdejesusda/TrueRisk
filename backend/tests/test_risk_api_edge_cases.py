"""Edge case tests for risk API endpoints."""
import pytest


@pytest.mark.asyncio
async def test_risk_unknown_province_returns_zeros(client, mock_external_apis):
    r = await client.get("/api/v1/risk/XX")
    assert r.status_code == 200
    data = r.json()
    assert data["province_code"] == "XX"
    assert data["composite_score"] == 0.0
    assert data["severity"] == "low"


@pytest.mark.asyncio
async def test_risk_all_returns_list(client, mock_external_apis):
    r = await client.get("/api/v1/risk/all")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


@pytest.mark.asyncio
async def test_risk_map_structure(client, mock_external_apis):
    r = await client.get("/api/v1/risk/map")
    assert r.status_code == 200
    data = r.json()
    assert "provinces" in data
    assert isinstance(data["provinces"], list)


@pytest.mark.asyncio
async def test_risk_province_28_has_all_fields(client, mock_external_apis):
    r = await client.get("/api/v1/risk/28")
    assert r.status_code == 200
    data = r.json()
    required_fields = [
        "province_code", "flood_score", "wildfire_score", "drought_score",
        "heatwave_score", "seismic_score", "coldwave_score", "windstorm_score",
        "composite_score", "dominant_hazard", "severity", "computed_at",
    ]
    for field in required_fields:
        assert field in data, f"Missing field: {field}"


@pytest.mark.asyncio
async def test_risk_province_scores_bounded(client, mock_external_apis):
    r = await client.get("/api/v1/risk/28")
    assert r.status_code == 200
    data = r.json()
    score_fields = [
        "flood_score", "wildfire_score", "drought_score", "heatwave_score",
        "seismic_score", "coldwave_score", "windstorm_score", "composite_score",
    ]
    for field in score_fields:
        val = data[field]
        assert 0 <= val <= 100, f"{field}={val} out of bounds"


@pytest.mark.asyncio
async def test_risk_province_severity_valid(client, mock_external_apis):
    r = await client.get("/api/v1/risk/28")
    assert r.status_code == 200
    valid = {"low", "moderate", "high", "very_high", "critical"}
    assert r.json()["severity"] in valid
