"""Forecast service -- orchestrates TFT multi-horizon inference + GNN spatial
refinement and stores results in the risk_forecasts table."""

from __future__ import annotations

import logging
import math
from app.utils.time import utcnow

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.data.province_data import PROVINCES
from app.ml.features.inference_features import enrich_daily_history
from app.models.risk_forecast import RiskForecast
from app.models.weather_daily_summary import WeatherDailySummary
from app.models.weather_record import WeatherRecord
from app.services.risk_service import get_terrain_features, _record_to_dict

logger = logging.getLogger(__name__)

HAZARDS = ["flood", "wildfire", "heatwave", "drought", "coldwave", "windstorm"]
FORECAST_HORIZONS = [6, 12, 24, 48, 72, 168]

# Decay factors: longer horizons regress toward the mean (less certain)
_HORIZON_DECAY = {6: 1.0, 12: 0.95, 24: 0.88, 48: 0.78, 72: 0.70, 168: 0.55}


def _score_based_fallback(
    hazard: str, history: list[dict],
) -> dict | None:
    """Generate synthetic multi-horizon forecasts from the deterministic score
    function when TFT inference is unavailable or produces all zeros.

    Uses the latest weather state to compute a base score, then applies
    horizon-dependent decay and uncertainty bands.
    """
    import pandas as pd
    from app.ml.training.prepare_tft_dataset import SCORE_FUNCS

    score_fn = SCORE_FUNCS.get(hazard)
    if not score_fn or not history:
        return None

    base_score = score_fn(pd.Series(history[-1]))
    if base_score is None:
        return None
    base_score = float(base_score)
    if not math.isfinite(base_score):
        return None

    horizons: dict[int, dict[str, float]] = {}
    for h in FORECAST_HORIZONS:
        decay = _HORIZON_DECAY.get(h, 0.5)
        q50 = round(base_score * decay, 2)
        # Wider uncertainty bands at longer horizons
        spread = max(5.0, base_score * 0.25 * (1 + (1 - decay)))
        q10 = round(max(0.0, q50 - spread), 2)
        q90 = round(min(100.0, q50 + spread), 2)
        horizons[h] = {"q10": q10, "q50": q50, "q90": q90}

    return {
        "point_estimate": horizons[FORECAST_HORIZONS[0]]["q50"],
        "horizons": horizons,
    }


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
    now = utcnow()

    # Collect per-province predictions for GNN refinement
    province_predictions: dict[str, dict[str, float]] = {}
    weather_context: dict[str, dict[str, float]] = {}
    all_forecasts: list[RiskForecast] = []

    # Max encoder length across all hazards (for daily summary query)
    from app.ml.training.config import TFT_ENCODER_LENGTH_PER_HAZARD
    max_days = max(TFT_ENCODER_LENGTH_PER_HAZARD.values())

    for code in province_codes:
        # 1. Terrain features
        terrain = get_terrain_features(code)

        # 2. Fetch daily summaries for derived feature computation
        daily_stmt = (
            select(WeatherDailySummary)
            .where(WeatherDailySummary.province_code == code)
            .order_by(WeatherDailySummary.date.desc())
            .limit(max_days)
        )
        daily_result = await db.execute(daily_stmt)
        daily_rows = daily_result.scalars().all()

        if not daily_rows:
            # Fallback: use raw hourly records if no daily summaries
            stmt = (
                select(WeatherRecord)
                .where(WeatherRecord.province_code == code)
                .order_by(WeatherRecord.recorded_at.desc())
                .limit(168)
            )
            result = await db.execute(stmt)
            records = result.scalars().all()
            if not records:
                continue
            # Reverse to chronological order (query is newest-first)
            history = [_record_to_dict(r) for r in reversed(records)]
        else:
            # Convert daily summaries to training-compatible dicts (chronological)
            daily_rows = list(reversed(daily_rows))  # oldest first
            raw_days = []
            for row in daily_rows:
                raw_days.append({
                    "temp_max": row.temperature_max,
                    "temp_min": row.temperature_min,
                    "temp_mean": row.temperature_avg,
                    "precip": row.precipitation_sum,
                    "wind_speed": row.wind_speed_max,
                    "wind_gust_max": row.wind_gusts_max or row.wind_speed_max * 1.5,
                    "humidity": row.humidity_avg,
                    "humidity_min": row.humidity_min,
                    "pressure": row.pressure_avg or 1013.0,
                    "soil_moisture": row.soil_moisture_avg or 0.3,
                    "dew_point": row.temperature_avg - 5 if row.temperature_avg else 10.0,
                    "cloud_cover": row.cloud_cover_avg or 50.0,
                    "uv_index": row.uv_index_max or 5.0,
                    "month": row.date.month,
                })
            # Enrich with all derived features
            history = enrich_daily_history(raw_days, terrain)

        # Build weather context for GNN
        latest = history[-1] if history else {}
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

            # Check if TFT produced all-zero predictions
            all_zero = False
            if tft_result and tft_result.get("horizons"):
                all_zero = all(
                    q["q10"] == 0 and q["q50"] == 0 and q["q90"] == 0
                    for q in tft_result["horizons"].values()
                )
                if all_zero:
                    logger.warning(
                        "TFT %s all-zero for %s, using score-based fallback",
                        hazard, code,
                    )

            if tft_result is not None and not all_zero:
                code_preds[hazard] = tft_result.get("point_estimate", 0.0)
                attention = tft_result.get("attention_weights", {})
                for h, quantiles in tft_result["horizons"].items():
                    all_forecasts.append(RiskForecast(
                        province_code=code,
                        hazard=hazard,
                        horizon_hours=int(h),
                        q10=quantiles["q10"],
                        q50=quantiles["q50"],
                        q90=quantiles["q90"],
                        attention_weights=attention,
                        computed_at=now,
                    ))
            else:
                # Fallback: derive forecasts from the score function
                fallback = _score_based_fallback(hazard, history)
                if fallback is not None:
                    code_preds[hazard] = fallback["point_estimate"]
                    for h, quantiles in fallback["horizons"].items():
                        all_forecasts.append(RiskForecast(
                            province_code=code,
                            hazard=hazard,
                            horizon_hours=int(h),
                            q10=quantiles["q10"],
                            q50=quantiles["q50"],
                            q90=quantiles["q90"],
                            attention_weights={},
                            computed_at=now,
                        ))

            if hazard in code_preds:
                logger.info(
                    "Province %s %s: point_estimate=%.2f",
                    code, hazard, code_preds[hazard],
                )

        if code_preds:
            province_predictions[code] = code_preds

    # 4. GNN spatial refinement (optional)
    if province_predictions:
        try:
            from app.ml.models.gnn_spatial import refine_predictions

            refined = refine_predictions(province_predictions, weather_context)

            # Update quantiles with GNN-refined scores
            for forecast in all_forecasts:
                code = forecast.province_code
                hazard = forecast.hazard
                if code in refined and hazard in refined[code]:
                    original = province_predictions.get(code, {}).get(hazard)
                    if original is not None and original > 0:
                        ratio = refined[code][hazard] / original
                        forecast.q10 = round(forecast.q10 * ratio, 2)
                        forecast.q50 = round(forecast.q50 * ratio, 2)
                        forecast.q90 = round(forecast.q90 * ratio, 2)
                        # Ensure quantile ordering holds
                        if forecast.q10 > forecast.q50:
                            forecast.q10 = forecast.q50
                        if forecast.q90 < forecast.q50:
                            forecast.q90 = forecast.q50
        except Exception as e:
            logger.warning("GNN refinement failed: %s", e)

    # 5. Store results
    for forecast in all_forecasts:
        db.add(forecast)

    await db.flush()
    logger.info(
        "Prepared %d forecast rows for %d provinces (awaiting commit)",
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
