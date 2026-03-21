"""Tests for the forecast service."""

import pytest
from unittest.mock import patch

from tests.conftest import test_session_factory


@pytest.mark.asyncio
async def test_get_province_forecast_empty():
    """Returns empty list when no forecast data exists."""
    from app.services.forecast_service import get_province_forecast

    async with test_session_factory() as db:
        result = await get_province_forecast(db, "28")
        assert result == []


@pytest.mark.asyncio
async def test_compute_forecasts_skips_when_disabled():
    """compute_all_forecasts returns immediately when ENABLE_TFT_FORECASTS=False."""
    from app.services.forecast_service import compute_all_forecasts

    with patch("app.ml.training.config.ENABLE_TFT_FORECASTS", False):
        async with test_session_factory() as db:
            # Should return without error and without adding any rows
            await compute_all_forecasts(db)
            # Verify no forecasts were created
            from app.services.forecast_service import get_province_forecast
            result = await get_province_forecast(db, "28")
            assert result == []
