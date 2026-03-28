"""Integration tests for the data pipeline (weather -> risk -> alerts).

Mocks external API calls (Open-Meteo, IGN seismic) so the pipeline can
run end-to-end against the test database.
"""

import pytest
from unittest.mock import AsyncMock, patch

from app.models.province import Province
from app.models.alert import Alert
from app.ml.models.composite_risk import compute_composite_risk
from app.services.risk_service import compute_province_risk, compute_temporal_features
from app.scheduler.pipeline import _check_and_create_alerts

from tests.conftest import test_session_factory


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

PROVINCE_CODE = "28"

FAKE_WEATHER = {
    "temperature": 38.0,
    "humidity": 25.0,
    "precipitation": 0.0,
    "wind_speed": 45.0,
    "wind_direction": 270,
    "wind_gusts": 80.0,
    "pressure": 1005.0,
    "soil_moisture": 0.1,
    "uv_index": 9.0,
    "dew_point": 12.0,
    "cloud_cover": 10.0,
}


async def _ensure_province(db):
    """Insert the test province if it doesn't already exist."""
    province = await db.get(Province, PROVINCE_CODE)
    if not province:
        province = Province(
            ine_code=PROVINCE_CODE,
            name="Madrid",
            region="Comunidad de Madrid",
            capital_name="Madrid",
            capital_municipality_code="28079",
            latitude=40.4168,
            longitude=-3.7038,
            elevation_m=667.0,
            river_basin="Tajo",
            coastal=False,
            mediterranean=False,
        )
        db.add(province)
        await db.commit()
    return province


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_compute_province_risk_produces_all_hazard_scores():
    """compute_province_risk should return 8 hazard scores + composite."""
    async with test_session_factory() as db:
        await _ensure_province(db)

        with (
            patch("app.services.risk_service.open_meteo.fetch_current", new_callable=AsyncMock) as mock_weather,
            patch("app.services.risk_service.fetch_recent_quakes", new_callable=AsyncMock) as mock_quakes,
        ):
            mock_weather.return_value = FAKE_WEATHER
            mock_quakes.return_value = []

            result = await compute_province_risk(db, PROVINCE_CODE)

        # All 8 individual hazard scores must be present
        for key in [
            "flood_score",
            "wildfire_score",
            "drought_score",
            "heatwave_score",
            "seismic_score",
            "coldwave_score",
            "windstorm_score",
            "dana_score",
        ]:
            assert key in result, f"Missing key: {key}"
            assert 0 <= result[key] <= 100, f"{key} out of range: {result[key]}"

        # Composite and metadata
        assert "composite_score" in result
        assert 0 <= result["composite_score"] <= 100
        assert "dominant_hazard" in result
        assert "severity" in result
        assert result["severity"] in ("low", "moderate", "high", "very_high", "critical")


@pytest.mark.asyncio
async def test_composite_score_follows_dominant_hazard_logic():
    """The composite engine should track the highest single hazard."""
    result = compute_composite_risk(
        flood=70.0,
        wildfire=20.0,
        drought=10.0,
        heatwave=5.0,
        seismic=3.0,
        coldwave=2.0,
        windstorm=1.0,
        dana=0.0,
    )
    assert result["dominant_hazard"] == "flood"
    # INFORM formula: composite blends max hazard (60%) with geo-mean of top-3 (40%).
    # With flood=70, wildfire=20, drought=10, geo_mean≈24.1 → composite≈51.6.
    assert result["composite_score"] >= 45.0
    assert result["composite_score"] <= 75.0


@pytest.mark.asyncio
async def test_high_score_generates_alert():
    """Scores above the threshold should produce an alert via _check_and_create_alerts."""
    async with test_session_factory() as db:
        province = await _ensure_province(db)

        risk = {
            "flood_score": 75.0,
            "wildfire_score": 10.0,
            "drought_score": 5.0,
            "heatwave_score": 3.0,
            "seismic_score": 0.0,
            "coldwave_score": 0.0,
            "windstorm_score": 0.0,
            "dana_score": 0.0,
            "composite_score": 76.0,
            "dominant_hazard": "flood",
            "severity": "very_high",
        }

        with patch("app.scheduler.pipeline.notify_province", new_callable=AsyncMock):
            await _check_and_create_alerts(db, province, risk)
            await db.commit()

        # Should have created an alert for flood (score 75 > threshold 60)
        from sqlalchemy import select

        stmt = select(Alert).where(
            Alert.province_code == PROVINCE_CODE,
            Alert.hazard_type == "flood",
            Alert.source == "auto_detected",
            Alert.is_active == True,  # noqa: E712
        )
        result = await db.execute(stmt)
        alerts = result.scalars().all()
        assert len(alerts) >= 1

        alert = alerts[0]
        assert alert.severity in (4, 5)
        assert "Madrid" in alert.title


@pytest.mark.asyncio
async def test_below_threshold_does_not_generate_alert():
    """Scores below the alert threshold should NOT create an alert."""
    async with test_session_factory() as db:
        province = await _ensure_province(db)

        risk = {
            "flood_score": 30.0,
            "wildfire_score": 20.0,
            "drought_score": 10.0,
            "heatwave_score": 5.0,
            "seismic_score": 0.0,
            "coldwave_score": 0.0,
            "windstorm_score": 0.0,
            "dana_score": 0.0,
            "composite_score": 31.0,
            "dominant_hazard": "flood",
            "severity": "moderate",
        }

        with patch("app.scheduler.pipeline.notify_province", new_callable=AsyncMock):
            await _check_and_create_alerts(db, province, risk)
            await db.commit()

        from sqlalchemy import select

        stmt = select(Alert).where(
            Alert.province_code == PROVINCE_CODE,
            Alert.hazard_type == "wildfire",
            Alert.source == "auto_detected",
            Alert.is_active == True,  # noqa: E712
        )
        result = await db.execute(stmt)
        alerts = result.scalars().all()
        # No alert should exist for wildfire at score 20
        assert len(alerts) == 0


def test_temporal_features_from_empty_history():
    """Empty history should return zeroed-out features."""
    features = compute_temporal_features([])
    assert features["precip_1h"] == 0.0
    assert features["precip_24h"] == 0.0
    assert features["consecutive_dry_days"] == 0
    assert features["consecutive_rain_days"] == 0


def test_temporal_features_with_history():
    """Non-empty history should compute cumulative precipitation."""
    records = [
        {"temperature": 20, "humidity": 60, "precipitation": 5.0, "soil_moisture": 0.4, "pressure": 1013, "wind_speed": 10, "wind_gusts": 20, "dew_point": 12}
    ] * 48  # 48 hours of identical data

    features = compute_temporal_features(records)
    assert features["precip_1h"] == 5.0
    assert features["precip_6h"] == 30.0
    assert features["precip_24h"] == 120.0
    assert features["precip_48h"] == 240.0
