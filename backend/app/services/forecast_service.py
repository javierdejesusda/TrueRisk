"""Forecast service -- orchestrates TFT multi-horizon inference + GNN spatial
refinement and stores results in the risk_forecasts table."""

from __future__ import annotations

import logging
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.data.province_data import PROVINCES
from app.models.risk_forecast import RiskForecast
from app.models.weather_record import WeatherRecord
from app.services.risk_service import get_terrain_features, _record_to_dict

logger = logging.getLogger(__name__)

HAZARDS = ["flood", "wildfire", "heatwave", "drought", "coldwave", "windstorm"]
FORECAST_HORIZONS = [6, 12, 24, 48, 72, 168]


async def compute_all_forecasts(db: AsyncSession) -> None:
    """Full pipeline: for each province run 6 TFT models, GNN refinement, store."""
    from app.ml.training.config import ENABLE_TFT_FORECASTS

    if not ENABLE_TFT_FORECASTS:
        logger.info("TFT forecasts disabled, skipping")
        return

    # Lazy-import TFT predictors
    from app.ml.models.tft_flood import predict_flood_risk_tft
    from app.ml.models.tft_wildfire import predict_wildfire_risk_tft
    from app.ml.models.tft_heatwave import predict_heatwave_risk_tft
    from app.ml.models.tft_drought import predict_drought_risk_tft
    from app.ml.models.tft_coldwave import predict_coldwave_risk_tft
    from app.ml.models.tft_windstorm import predict_windstorm_risk_tft

    tft_predictors = {
        "flood": predict_flood_risk_tft,
        "wildfire": predict_wildfire_risk_tft,
        "heatwave": predict_heatwave_risk_tft,
        "drought": predict_drought_risk_tft,
        "coldwave": predict_coldwave_risk_tft,
        "windstorm": predict_windstorm_risk_tft,
    }

    province_codes = list(PROVINCES.keys())
    now = datetime.utcnow()

    # Collect per-province predictions for GNN refinement
    province_predictions: dict[str, dict[str, float]] = {}
    weather_context: dict[str, dict[str, float]] = {}
    all_forecasts: list[RiskForecast] = []

    for code in province_codes:
        # 1. Terrain features
        terrain = get_terrain_features(code)

        # 2. Fetch 168h weather history from DB
        stmt = (
            select(WeatherRecord)
            .where(WeatherRecord.province_code == code)
            .order_by(WeatherRecord.recorded_at.desc())
            .limit(168)
        )
        result = await db.execute(stmt)
        records = result.scalars().all()
        history = [_record_to_dict(r) for r in records]

        if not history:
            continue

        # Build weather context for GNN
        latest = history[0] if history else {}
        weather_context[code] = {
            "temperature": latest.get("temperature", 20.0) or 20.0,
            "humidity": latest.get("humidity", 50.0) or 50.0,
            "pressure": latest.get("pressure", 1013.0) or 1013.0,
            "wind_speed": latest.get("wind_speed", 0.0) or 0.0,
            "precipitation": latest.get("precipitation", 0.0) or 0.0,
            "elevation_m": terrain.get("elevation_m", 200.0),
        }

        # 3. Run 6 TFT models
        code_preds: dict[str, float] = {}
        for hazard, predictor in tft_predictors.items():
            try:
                tft_result = predictor(history, terrain)
            except Exception as e:
                logger.warning("TFT %s failed for %s: %s", hazard, code, e)
                tft_result = None

            if tft_result is None:
                continue

            code_preds[hazard] = tft_result.get("point_estimate", 0.0)
            attention = tft_result.get("attention_weights", {})

            for h, quantiles in tft_result.get("horizons", {}).items():
                forecast = RiskForecast(
                    province_code=code,
                    hazard=hazard,
                    horizon_hours=int(h),
                    q10=quantiles["q10"],
                    q50=quantiles["q50"],
                    q90=quantiles["q90"],
                    attention_weights=attention,
                    computed_at=now,
                )
                all_forecasts.append(forecast)

        if code_preds:
            province_predictions[code] = code_preds

    # 4. GNN spatial refinement (optional)
    if province_predictions:
        try:
            from app.ml.models.gnn_spatial import refine_predictions

            refined = refine_predictions(province_predictions, weather_context)

            # Update q50 values in forecasts with GNN-refined scores
            for forecast in all_forecasts:
                code = forecast.province_code
                hazard = forecast.hazard
                if code in refined and hazard in refined[code]:
                    original = province_predictions.get(code, {}).get(hazard)
                    if original and original > 0:
                        ratio = refined[code][hazard] / original
                        forecast.q50 = round(forecast.q50 * ratio, 2)
        except Exception as e:
            logger.warning("GNN refinement failed: %s", e)

    # 5. Store results
    for forecast in all_forecasts:
        db.add(forecast)

    await db.flush()
    logger.info(
        "Stored %d forecast rows for %d provinces",
        len(all_forecasts),
        len(province_predictions),
    )


async def get_province_forecast(
    db: AsyncSession, code: str
) -> list[RiskForecast]:
    """Query the latest forecasts for a province from the DB."""
    from sqlalchemy import func

    # Find the latest computed_at for this province
    latest_subq = (
        select(func.max(RiskForecast.computed_at))
        .where(RiskForecast.province_code == code)
        .scalar_subquery()
    )
    result = await db.execute(
        select(RiskForecast).where(
            RiskForecast.province_code == code,
            RiskForecast.computed_at == latest_subq,
        )
    )
    return list(result.scalars().all())
