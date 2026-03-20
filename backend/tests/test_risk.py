import pytest


@pytest.mark.asyncio
async def test_risk_province(client):
    response = await client.get("/api/v1/risk/28")
    assert response.status_code in (200, 500, 503)
    if response.status_code == 200:
        data = response.json()
        assert data["province_code"] == "28"
        assert "flood_score" in data
        assert "wildfire_score" in data
        assert "drought_score" in data
        assert "heatwave_score" in data
        assert "seismic_score" in data
        assert "coldwave_score" in data
        assert "windstorm_score" in data
        assert "composite_score" in data
        assert "dominant_hazard" in data
        assert "severity" in data
        assert "computed_at" in data


@pytest.mark.asyncio
async def test_risk_all(client):
    response = await client.get("/api/v1/risk/all")
    assert response.status_code in (200, 500, 503)
    if response.status_code == 200:
        data = response.json()
        assert isinstance(data, list)


@pytest.mark.asyncio
async def test_risk_map(client):
    response = await client.get("/api/v1/risk/map")
    assert response.status_code in (200, 500, 503)
    if response.status_code == 200:
        data = response.json()
        assert "provinces" in data
        assert "computed_at" in data
        assert isinstance(data["provinces"], list)
        if len(data["provinces"]) > 0:
            entry = data["provinces"][0]
            assert "province_code" in entry
            assert "province_name" in entry
            assert "latitude" in entry
            assert "longitude" in entry
            assert "composite_score" in entry
            assert "dominant_hazard" in entry
            assert "severity" in entry
