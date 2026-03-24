"""Risk API router -- risk scores, explainability, and model registry."""

from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.ml.model_registry import get_model_registry
from app.models.province import Province
from app.models.risk_score import RiskScore
from app.schemas.forecast import ForecastResponse, HazardForecast, HorizonPrediction
from app.schemas.risk import (
    FeatureContribution,
    HazardExplanation,
    ModelRegistryResponse,
    RiskExplainResponse,
    RiskMapEntry,
    RiskMapResponse,
    RiskScoreResponse,
)
from app.services.explainability_service import explain_risk

router = APIRouter()


def _zero_score(province_code: str) -> dict:
    """Return a default zero-risk response."""
    return {
        "province_code": province_code,
        "flood_score": 0.0,
        "wildfire_score": 0.0,
        "drought_score": 0.0,
        "heatwave_score": 0.0,
        "seismic_score": 0.0,
        "coldwave_score": 0.0,
        "windstorm_score": 0.0,
        "composite_score": 0.0,
        "dominant_hazard": "none",
        "severity": "low",
        "computed_at": datetime.utcnow(),
    }


@router.get("/all", response_model=list[RiskScoreResponse])
async def get_all_risks(db: AsyncSession = Depends(get_db)):
    """Return the latest risk scores for all provinces."""
    from sqlalchemy import func

    subq = (
        select(
            RiskScore.province_code,
            func.max(RiskScore.computed_at).label("latest"),
        )
        .group_by(RiskScore.province_code)
        .subquery()
    )
    result = await db.execute(
        select(RiskScore).join(
            subq,
            (RiskScore.province_code == subq.c.province_code)
            & (RiskScore.computed_at == subq.c.latest),
        )
    )
    scores = result.scalars().all()
    return list(scores) if scores else []


@router.get(
    "/models",
    response_model=ModelRegistryResponse,
    summary="Model registry",
    description="Return metadata for all 7 ML models in the risk pipeline.",
)
async def get_models():
    """Return the ML model inventory with metadata and accuracy metrics."""
    registry = get_model_registry()
    return ModelRegistryResponse(models=registry, total=len(registry))


@router.get("/map", response_model=RiskMapResponse)
async def get_risk_map(db: AsyncSession = Depends(get_db)):
    """Return risk map data (province coordinates + risk scores)."""
    provinces_result = await db.execute(select(Province))
    provinces = {p.ine_code: p for p in provinces_result.scalars().all()}

    from sqlalchemy import func

    subq = (
        select(
            RiskScore.province_code,
            func.max(RiskScore.computed_at).label("latest"),
        )
        .group_by(RiskScore.province_code)
        .subquery()
    )
    scores_result = await db.execute(
        select(RiskScore).join(
            subq,
            (RiskScore.province_code == subq.c.province_code)
            & (RiskScore.computed_at == subq.c.latest),
        )
    )
    scores = {s.province_code: s for s in scores_result.scalars().all()}

    entries: list[RiskMapEntry] = []
    for code, prov in provinces.items():
        score = scores.get(code)
        entries.append(
            RiskMapEntry(
                province_code=code,
                province_name=prov.name,
                latitude=prov.latitude,
                longitude=prov.longitude,
                composite_score=score.composite_score if score else 0.0,
                dominant_hazard=score.dominant_hazard if score else "none",
                severity=score.severity if score else "low",
                flood_score=score.flood_score if score else 0.0,
                wildfire_score=score.wildfire_score if score else 0.0,
                drought_score=score.drought_score if score else 0.0,
                heatwave_score=score.heatwave_score if score else 0.0,
                seismic_score=score.seismic_score if score else 0.0,
                coldwave_score=score.coldwave_score if score else 0.0,
                windstorm_score=score.windstorm_score if score else 0.0,
            )
        )

    return RiskMapResponse(
        provinces=entries,
        computed_at=datetime.utcnow(),
    )


@router.get("/heat-vulnerability/map")
async def heat_vulnerability_map(db: AsyncSession = Depends(get_db)):
    """Get heat vulnerability index for all provinces (for map overlay)."""
    from app.services.heat_vulnerability_service import (
        compute_vulnerability_index,
        _PROVINCE_VULNERABILITY,
    )

    result = await db.execute(select(Province))
    provinces = result.scalars().all()

    data = []
    for p in provinces:
        vuln_index, factors = compute_vulnerability_index(
            p.ine_code,
            is_coastal=p.coastal,
            elevation_m=p.elevation_m or 0,
        )
        demo = _PROVINCE_VULNERABILITY.get(p.ine_code, {})
        data.append({
            "province_code": p.ine_code,
            "province_name": p.name,
            "elderly_pct": demo.get("elderly_pct", 0),
            "urban_pct": demo.get("urban_pct", 0),
            "pop_density_km2": demo.get("pop_density_km2", 0),
            "vulnerability_index": vuln_index,
            "factors": factors,
        })

    return data


@router.get(
    "/{province_code}/explain",
    response_model=RiskExplainResponse,
    summary="Explain risk score",
    description="Return per-feature importance for each hazard model, derived from the stored features snapshot.",
)
async def explain_province_risk(
    province_code: str,
    db: AsyncSession = Depends(get_db),
):
    """Compute feature importance for the latest risk score of a province."""
    result = await db.execute(
        select(RiskScore)
        .where(RiskScore.province_code == province_code)
        .order_by(RiskScore.computed_at.desc())
        .limit(1)
    )
    score = result.scalar_one_or_none()
    if score is None:
        raise HTTPException(status_code=404, detail=f"No risk score found for province {province_code}")

    snapshot = score.features_snapshot or {}
    explanations = explain_risk(snapshot)

    hazard_scores = {
        "flood": score.flood_score,
        "wildfire": score.wildfire_score,
        "drought": score.drought_score,
        "heatwave": score.heatwave_score,
        "seismic": score.seismic_score,
        "coldwave": score.coldwave_score,
        "windstorm": score.windstorm_score,
    }

    hazards = [
        HazardExplanation(
            hazard=hazard,
            score=hazard_scores.get(hazard, 0.0),
            contributions=[FeatureContribution(**c) for c in contributions],
        )
        for hazard, contributions in explanations.items()
    ]

    return RiskExplainResponse(
        province_code=province_code,
        computed_at=score.computed_at,
        hazards=hazards,
    )


@router.get("/{province_code}/forecast", response_model=ForecastResponse)
async def get_forecast(province_code: str, db: AsyncSession = Depends(get_db)):
    """Multi-horizon risk forecast with uncertainty bounds (TFT + GNN)."""
    from collections import defaultdict

    from app.services.forecast_service import get_province_forecast

    rows = await get_province_forecast(db, province_code)

    if not rows:
        return ForecastResponse(province_code=province_code, computed_at=None, hazards=[])

    # Group by hazard
    by_hazard: dict[str, list] = defaultdict(list)
    attention_by_hazard: dict[str, dict] = {}
    computed_at = None

    for row in rows:
        by_hazard[row.hazard].append(HorizonPrediction(
            horizon_hours=row.horizon_hours,
            q10=row.q10,
            q50=row.q50,
            q90=row.q90,
        ))
        if row.attention_weights:
            attention_by_hazard[row.hazard] = row.attention_weights
        if computed_at is None:
            computed_at = row.computed_at

    hazards = [
        HazardForecast(
            hazard=h,
            horizons=sorted(preds, key=lambda p: p.horizon_hours),
            attention_weights=attention_by_hazard.get(h, {}),
        )
        for h, preds in by_hazard.items()
    ]

    return ForecastResponse(
        province_code=province_code,
        computed_at=computed_at,
        hazards=hazards,
    )


@router.get("/{province_code}/heat-vulnerability")
async def get_heat_vulnerability(
    province_code: str,
    db: AsyncSession = Depends(get_db),
):
    """Get heat vulnerability assessment for a province."""
    from app.services.heat_vulnerability_service import adjust_heatwave_score
    from app.services.risk_service import compute_province_risk

    province = await db.get(Province, province_code)
    if not province:
        raise HTTPException(status_code=404, detail="Province not found")

    risk = await compute_province_risk(db, province_code)
    base_score = risk.get("heatwave_score", 0)

    result = adjust_heatwave_score(
        base_score,
        province_code,
        is_coastal=province.coastal,
        elevation_m=province.elevation_m or 0,
    )

    return {
        "province_code": result.province_code,
        "base_heatwave_score": result.base_heatwave_score,
        "vulnerability_index": result.vulnerability_index,
        "adjusted_score": result.adjusted_score,
        "factors": result.factors,
    }


@router.get("/municipality/{municipality_code}")
async def get_municipality_risk(
    municipality_code: str,
    db: AsyncSession = Depends(get_db),
):
    """Get risk assessment for a specific municipality."""
    from app.models.municipality import Municipality
    from app.services.municipality_risk_service import disaggregate_province_risk
    from app.services.risk_service import compute_province_risk

    muni = await db.get(Municipality, municipality_code)
    if not muni:
        raise HTTPException(status_code=404, detail="Municipality not found")

    province_risk = await compute_province_risk(db, muni.province_code)
    results = await disaggregate_province_risk(db, muni.province_code, province_risk)

    for r in results:
        if r.ine_code == municipality_code:
            return {
                "ine_code": r.ine_code,
                "name": r.name,
                "province_code": r.province_code,
                "latitude": r.latitude,
                "longitude": r.longitude,
                "composite_score": r.composite_score,
                "dominant_hazard": r.dominant_hazard,
                "severity": r.severity,
                "modifiers": r.modifiers,
            }

    raise HTTPException(status_code=404, detail="Municipality risk not computed")


@router.get("/province/{province_code}/municipalities")
async def get_province_municipalities_risk(
    province_code: str,
    db: AsyncSession = Depends(get_db),
):
    """Get risk for all municipalities in a province."""
    from app.services.municipality_risk_service import disaggregate_province_risk
    from app.services.risk_service import compute_province_risk

    province = await db.get(Province, province_code)
    if not province:
        raise HTTPException(status_code=404, detail="Province not found")

    province_risk = await compute_province_risk(db, province_code)
    results = await disaggregate_province_risk(db, province_code, province_risk)

    return [
        {
            "ine_code": r.ine_code,
            "name": r.name,
            "latitude": r.latitude,
            "longitude": r.longitude,
            "composite_score": r.composite_score,
            "dominant_hazard": r.dominant_hazard,
            "severity": r.severity,
            "modifiers": r.modifiers,
        }
        for r in results
    ]


@router.get("/{province_code}/explain/attention")
async def get_attention_explanations(
    province_code: str,
    hazard: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """Get TFT attention-based explanations for risk forecasts."""
    from app.services.tft_explainability_service import get_forecast_explanations

    province = await db.get(Province, province_code)
    if not province:
        raise HTTPException(status_code=404, detail="Province not found")

    return await get_forecast_explanations(db, province_code, hazard)


@router.get("/{province_code}/explain/comparison")
async def get_explanation_comparison(
    province_code: str,
    hazard: str = "flood",
    db: AsyncSession = Depends(get_db),
):
    """Compare rule-based vs TFT attention-based explanations."""
    from app.services.tft_explainability_service import (
        get_forecast_explanations,
        explain_rule_vs_attention,
    )
    from app.services.risk_service import compute_province_risk

    province = await db.get(Province, province_code)
    if not province:
        raise HTTPException(status_code=404, detail="Province not found")

    # Get rule-based explanation
    risk = await compute_province_risk(db, province_code)
    features_snapshot = risk.get("features_snapshot", {})
    rule_result = explain_risk(features_snapshot)
    rule_contributions = rule_result.get(hazard, [])

    # Get attention-based explanation
    attn_explanations = await get_forecast_explanations(db, province_code, hazard)
    attn_weights = None
    if attn_explanations:
        # Reconstruct weights from top features
        attn_weights = {
            f["feature"]: f["attention_weight"]
            for f in attn_explanations[0].get("top_features", [])
        }

    return explain_rule_vs_attention(rule_contributions, attn_weights)


@router.get("/{province_code}", response_model=RiskScoreResponse)
async def get_risk(
    province_code: str,
    db: AsyncSession = Depends(get_db),
):
    """Return the latest risk score for a province."""
    result = await db.execute(
        select(RiskScore)
        .where(RiskScore.province_code == province_code)
        .order_by(RiskScore.computed_at.desc())
        .limit(1)
    )
    score = result.scalar_one_or_none()
    if score is None:
        return _zero_score(province_code)
    return score


@router.post("/pipeline/trigger")
async def trigger_pipeline():
    """Manually trigger the data pipeline (fetch weather, compute risk, TFT forecasts)."""
    import asyncio

    from app.scheduler.pipeline import run_pipeline

    asyncio.create_task(run_pipeline())
    return {"status": "pipeline triggered"}


@router.post("/pipeline/trigger-forecasts")
async def trigger_forecasts_only(db: AsyncSession = Depends(get_db)):
    """Run only the TFT forecast step and return result count or error."""
    import traceback

    try:
        from app.services.forecast_service import compute_all_forecasts
        await compute_all_forecasts(db)
        await db.commit()

        from sqlalchemy import func

        from app.models.risk_forecast import RiskForecast
        count = await db.scalar(select(func.count()).select_from(RiskForecast)) or 0
        return {"status": "ok", "forecasts_in_db": count}
    except Exception:
        return {"status": "error", "traceback": traceback.format_exc()[-1000:]}


@router.post("/pipeline/test-forecast/{province_code}")
async def test_forecast(province_code: str, db: AsyncSession = Depends(get_db)):
    """Run TFT inference for one province and return results or error details."""
    import traceback

    from app.data.province_data import PROVINCES
    from app.ml.features.inference_features import enrich_daily_history
    from app.ml.training.config import TFT_ENCODER_LENGTH_PER_HAZARD
    from app.models.weather_daily_summary import WeatherDailySummary
    from app.services.risk_service import get_terrain_features

    if province_code not in PROVINCES:
        raise HTTPException(status_code=404, detail="Province not found")

    terrain = get_terrain_features(province_code)
    max_days = max(TFT_ENCODER_LENGTH_PER_HAZARD.values())

    daily_stmt = (
        select(WeatherDailySummary)
        .where(WeatherDailySummary.province_code == province_code)
        .order_by(WeatherDailySummary.date.desc())
        .limit(max_days)
    )
    daily_result = await db.execute(daily_stmt)
    daily_rows = daily_result.scalars().all()

    if not daily_rows:
        return {"error": "no daily summaries", "count": 0}

    daily_rows = list(reversed(daily_rows))
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

    try:
        history = enrich_daily_history(raw_days, terrain)
    except Exception:
        return {"error": "enrich_daily_history failed", "traceback": traceback.format_exc()}

    results = {}
    from app.ml.models.tft_flood import predict_flood_risk_tft
    from app.ml.models.tft_windstorm import predict_windstorm_risk_tft

    # Test model loading directly to capture the real error
    from app.ml.models.tft_flood import predict_flood_risk_tft
    from app.ml.models.tft_windstorm import predict_windstorm_risk_tft

    for name, fn in [("flood", predict_flood_risk_tft), ("windstorm", predict_windstorm_risk_tft)]:
        try:
            r = fn(history, terrain)
            if r is None:
                results[name] = "returned None"
            else:
                results[name] = {
                    "point_estimate": r["point_estimate"],
                    "horizons_count": len(r.get("horizons", {})),
                }
        except Exception:
            results[name] = {"inference_error": traceback.format_exc()[-500:]}

    return {
        "province": province_code,
        "daily_rows": len(raw_days),
        "enriched_rows": len(history),
        "enriched_features": len(history[-1]) if history else 0,
        "results": results,
    }


@router.get("/pipeline/diagnostics")
async def pipeline_diagnostics(db: AsyncSession = Depends(get_db)):
    """Check TFT model availability, daily summary counts, and forecast status."""
    from sqlalchemy import func

    from app.ml.training.config import SAVED_MODELS_DIR
    from app.models.risk_forecast import RiskForecast
    from app.models.weather_daily_summary import WeatherDailySummary
    from app.models.weather_record import WeatherRecord

    hazards = ["flood", "wildfire", "heatwave", "drought", "coldwave", "windstorm"]
    models = {}
    for h in hazards:
        ckpt = SAVED_MODELS_DIR / f"{h}_tft.ckpt"
        size = ckpt.stat().st_size if ckpt.exists() else 0
        models[h] = {"exists": ckpt.exists(), "size_bytes": size}

    daily_count = await db.scalar(
        select(func.count()).select_from(WeatherDailySummary)
    ) or 0
    daily_provinces = await db.scalar(
        select(func.count(func.distinct(WeatherDailySummary.province_code)))
    ) or 0
    record_count = await db.scalar(
        select(func.count()).select_from(WeatherRecord)
    ) or 0
    forecast_count = await db.scalar(
        select(func.count()).select_from(RiskForecast)
    ) or 0

    return {
        "models": models,
        "daily_summaries": {"total_rows": daily_count, "provinces": daily_provinces},
        "weather_records": record_count,
        "forecasts": forecast_count,
    }
