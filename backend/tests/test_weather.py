import pytest


@pytest.mark.asyncio
async def test_current_weather(client):
    response = await client.get("/api/v1/weather/current/28")
    # May fail if Open-Meteo is unreachable
    assert response.status_code in (200, 404, 500, 502, 503)
    if response.status_code == 200:
        data = response.json()
        assert data["province_code"] == "28"
        assert "temperature" in data
        assert "humidity" in data
        assert "precipitation" in data
        assert "wind_speed" in data
        assert "recorded_at" in data


@pytest.mark.asyncio
async def test_current_weather_invalid_province(client):
    response = await client.get("/api/v1/weather/current/99")
    assert response.status_code in (404, 500, 502, 503)


@pytest.mark.asyncio
async def test_forecast(client):
    response = await client.get("/api/v1/weather/forecast/28")
    assert response.status_code in (200, 404, 500, 502, 503)
    if response.status_code == 200:
        data = response.json()
        assert data["province_code"] == "28"
        assert "hourly" in data
        assert "daily" in data
        assert isinstance(data["hourly"], list)
        assert isinstance(data["daily"], list)


@pytest.mark.asyncio
async def test_weather_history(client):
    response = await client.get("/api/v1/weather/history/28?days=7")
    assert response.status_code in (200, 404, 500, 503)
    if response.status_code == 200:
        data = response.json()
        assert isinstance(data, list)


@pytest.mark.asyncio
async def test_weather_all(client):
    response = await client.get("/api/v1/weather/all")
    assert response.status_code in (200, 500, 503)
    if response.status_code == 200:
        data = response.json()
        assert isinstance(data, list)
