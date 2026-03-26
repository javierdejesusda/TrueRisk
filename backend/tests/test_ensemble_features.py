"""Tests for ensemble weather model feature extraction."""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.data.open_meteo import fetch_ensemble_features


@pytest.mark.asyncio
async def test_ensemble_returns_defaults_on_error():
    with patch("app.data.open_meteo.httpx.AsyncClient") as MockClient:
        mock = AsyncMock()
        mock.get.side_effect = Exception("Connection failed")
        mock.__aenter__ = AsyncMock(return_value=mock)
        mock.__aexit__ = AsyncMock(return_value=False)
        MockClient.return_value = mock

        result = await fetch_ensemble_features(40.4, -3.7)
        assert result["precip_prob_50mm_72h"] == 0.0
        assert result["forecast_uncertainty"] == 0.0


@pytest.mark.asyncio
async def test_ensemble_parses_precipitation():
    mock_data = {
        "hourly": {
            "precipitation": [1.0] * 72,  # 1mm/h for 72h = 72mm total
            "temperature_2m": [20.0] * 72,
        }
    }
    with patch("app.data.open_meteo.httpx.AsyncClient") as MockClient:
        mock = AsyncMock()
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = mock_data
        mock_resp.raise_for_status = MagicMock()
        mock.get = AsyncMock(return_value=mock_resp)
        mock.__aenter__ = AsyncMock(return_value=mock)
        mock.__aexit__ = AsyncMock(return_value=False)
        MockClient.return_value = mock

        result = await fetch_ensemble_features(40.4, -3.7)
        assert result["precip_prob_50mm_72h"] > 0
        assert result["precip_est_72h_mm"] > 0
        assert result["forecast_uncertainty"] == 0.0  # all same temp
