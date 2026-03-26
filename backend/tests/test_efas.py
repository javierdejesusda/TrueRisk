"""Tests for Copernicus EFAS flood forecast integration."""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.data.copernicus_efas import fetch_efas_flood_indicators, _PROVINCE_CENTROIDS


def test_province_centroids_complete():
    assert len(_PROVINCE_CENTROIDS) == 52


@pytest.mark.asyncio
async def test_efas_returns_empty_on_error():
    with patch("app.data.copernicus_efas.httpx.AsyncClient") as MockClient:
        mock = AsyncMock()
        mock.get.side_effect = Exception("Network error")
        mock.__aenter__ = AsyncMock(return_value=mock)
        mock.__aexit__ = AsyncMock(return_value=False)
        MockClient.return_value = mock

        result = await fetch_efas_flood_indicators()
        assert result == {}


@pytest.mark.asyncio
async def test_efas_parses_discharge_data():
    mock_data = [
        {"daily": {"river_discharge": [100.0, 150.0, 120.0, 200.0, 130.0, 110.0, 140.0]}}
    ] * 52  # One per province

    with patch("app.data.copernicus_efas.httpx.AsyncClient") as MockClient:
        mock = AsyncMock()
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = mock_data[:50]  # First batch
        mock.get.return_value = mock_resp
        mock.__aenter__ = AsyncMock(return_value=mock)
        mock.__aexit__ = AsyncMock(return_value=False)
        MockClient.return_value = mock

        # Clear cache
        import app.data.copernicus_efas as efas_mod
        efas_mod._cache.clear()
        efas_mod._cache_ts = 0.0

        result = await fetch_efas_flood_indicators()
        assert len(result) > 0
        first = list(result.values())[0]
        assert "flood_recurrence" in first
        assert "discharge_anomaly" in first
        assert 0 <= first["flood_recurrence"] <= 1.0
