import pytest


@pytest.mark.asyncio
async def test_health(client):
    response = await client.get("/health")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_health_is_lightweight(client):
    """Health/liveness probe should return quickly with minimal fields."""
    resp = await client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert "version" in data
    assert "uptime_seconds" in data
    # Liveness probe should NOT have database or models_loaded
    assert "database" not in data


@pytest.mark.asyncio
async def test_readiness_endpoint(client):
    """Readiness probe returns database and model status."""
    resp = await client.get("/ready")
    assert resp.status_code == 200
    data = resp.json()
    assert "ready" in data
    assert "database" in data
    assert "models_loaded" in data
    assert isinstance(data["models_loaded"], int)
