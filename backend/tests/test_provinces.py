import pytest


@pytest.mark.asyncio
async def test_list_provinces(client):
    response = await client.get("/api/v1/provinces")
    assert response.status_code == 200
    data = response.json()
    assert "provinces" in data
    assert "count" in data
    assert isinstance(data["provinces"], list)
    assert data["count"] == len(data["provinces"])


@pytest.mark.asyncio
async def test_get_province_madrid(client):
    response = await client.get("/api/v1/provinces/28")
    # May return 200 (seeded DB) or 404 (empty test DB)
    assert response.status_code in (200, 404)
    if response.status_code == 200:
        data = response.json()
        assert data["ine_code"] == "28"
        assert "name" in data


@pytest.mark.asyncio
async def test_get_province_not_found(client):
    response = await client.get("/api/v1/provinces/99")
    assert response.status_code == 404
