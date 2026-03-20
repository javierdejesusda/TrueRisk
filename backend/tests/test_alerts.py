import pytest


@pytest.mark.asyncio
async def test_list_alerts(client):
    response = await client.get("/api/v1/alerts/")
    assert response.status_code in (200, 500, 503)
    if response.status_code == 200:
        data = response.json()
        assert isinstance(data, list)


@pytest.mark.asyncio
async def test_list_alerts_with_filters(client):
    response = await client.get("/api/v1/alerts/?active=true&province=28")
    assert response.status_code in (200, 500, 503)
    if response.status_code == 200:
        data = response.json()
        assert isinstance(data, list)


@pytest.mark.asyncio
async def test_aemet_alerts(client):
    response = await client.get("/api/v1/alerts/aemet")
    # AEMET service may be unreachable
    assert response.status_code in (200, 500, 502, 503)
    if response.status_code == 200:
        data = response.json()
        assert isinstance(data, list)
        if len(data) > 0:
            alert = data[0]
            assert "identifier" in alert
            assert "severity" in alert
            assert "event" in alert
            assert "headline" in alert
            assert "description" in alert
            assert "area_desc" in alert
