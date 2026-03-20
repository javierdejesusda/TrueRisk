import pytest


@pytest.mark.asyncio
async def test_list_provinces(client):
    response = await client.get("/api/v1/provinces/")
    assert response.status_code == 200
    data = response.json()
    assert "provinces" in data
    assert "count" in data
    assert isinstance(data["provinces"], list)
    assert data["count"] == len(data["provinces"])
    assert data["count"] > 0

    # Check structure of first province
    province = data["provinces"][0]
    assert "ine_code" in province
    assert "name" in province
    assert "region" in province
    assert "latitude" in province
    assert "longitude" in province


@pytest.mark.asyncio
async def test_get_province_madrid(client):
    response = await client.get("/api/v1/provinces/28")
    assert response.status_code == 200
    data = response.json()
    assert data["ine_code"] == "28"
    assert "name" in data
    assert "region" in data
    assert "capital_name" in data
    assert "latitude" in data
    assert "longitude" in data
    assert "elevation_m" in data
    assert isinstance(data["coastal"], bool)
    assert isinstance(data["mediterranean"], bool)


@pytest.mark.asyncio
async def test_get_province_not_found(client):
    response = await client.get("/api/v1/provinces/99")
    assert response.status_code == 404
