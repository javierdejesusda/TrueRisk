"""TFT model explainability service - attention-weight-based explanations."""

from __future__ import annotations

import logging
from datetime import timedelta

from app.utils.time import utcnow

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.risk_forecast import RiskForecast

logger = logging.getLogger(__name__)

# Human-readable feature descriptions
FEATURE_DESCRIPTIONS = {
    "temperature": "Current temperature",
    "temperature_max": "Maximum temperature (24h)",
    "temperature_min": "Minimum temperature (24h)",
    "humidity": "Relative humidity",
    "precipitation": "Precipitation amount",
    "wind_speed": "Wind speed",
    "wind_gusts": "Wind gust strength",
    "pressure": "Atmospheric pressure",
    "soil_moisture": "Soil moisture level",
    "cloud_cover": "Cloud coverage",
    "uv_index": "UV radiation index",
    "heat_index": "Heat stress index",
    "consecutive_hot_days": "Consecutive hot days",
    "consecutive_hot_nights": "Consecutive hot nights",
    "consecutive_dry_days": "Days without rain",
    "precip_24h": "24-hour precipitation",
    "precip_6h": "6-hour precipitation",
    "precip_48h": "48-hour precipitation",
    "ffmc": "Fine Fuel Moisture Code",
    "dmc": "Duff Moisture Code",
    "dc": "Drought Code",
    "isi": "Initial Spread Index",
    "bui": "Buildup Index",
    "fwi": "Fire Weather Index",
    "month": "Month of year",
    "season_sin": "Seasonal cycle (sin)",
    "season_cos": "Seasonal cycle (cos)",
    "elevation_m": "Elevation",
    "is_coastal": "Coastal location",
    "latitude": "Latitude",
    "gust_factor": "Gust factor (gusts/speed)",
    "wind_variability_3d": "Wind variability (3-day)",
    "pressure_tendency_1d": "Pressure change (24h)",
    "temperature_anomaly": "Temperature anomaly",
}


async def get_forecast_explanations(
    db: AsyncSession,
    province_code: str,
    hazard: str | None = None,
) -> list[dict]:
    """Get TFT attention-based explanations for province forecasts.

    Returns per-hazard feature importance from stored attention weights.
    """
    cutoff = utcnow() - timedelta(hours=24)
    stmt = (
        select(RiskForecast)
        .where(
            RiskForecast.province_code == province_code,
            RiskForecast.computed_at >= cutoff,
        )
        .order_by(RiskForecast.computed_at.desc())
    )
    if hazard:
        stmt = stmt.where(RiskForecast.hazard == hazard)

    result = await db.execute(stmt)
    forecasts = result.scalars().all()

    explanations = []
    seen_hazards: set[str] = set()

    for fc in forecasts:
        if fc.hazard in seen_hazards:
            continue
        seen_hazards.add(fc.hazard)

        weights = fc.attention_weights or {}
        if not weights:
            continue

        # Normalize weights to percentages
        total = sum(abs(v) for v in weights.values()) or 1
        contributions = []
        for feature, weight in sorted(weights.items(), key=lambda x: abs(x[1]), reverse=True):
            pct = abs(weight) / total * 100
            if pct < 1:
                continue
            contributions.append({
                "feature": feature,
                "attention_weight": round(weight, 4),
                "contribution_pct": round(pct, 1),
                "description": FEATURE_DESCRIPTIONS.get(feature, feature.replace("_", " ").title()),
            })

        explanations.append({
            "hazard_type": fc.hazard,
            "province_code": province_code,
            "forecast_horizon_hours": fc.horizon_hours,
            "predicted_score": fc.q50,
            "confidence_lower": fc.q10,
            "confidence_upper": fc.q90,
            "top_features": contributions[:10],
            "generated_at": fc.computed_at.isoformat() if fc.computed_at else None,
        })

    return explanations


def explain_rule_vs_attention(
    rule_contributions: list[dict],
    attention_weights: dict | None,
) -> dict:
    """Compare rule-based and TFT attention-based explanations.

    Returns a comparison showing where rules and ML model agree/disagree.
    """
    if not attention_weights:
        return {
            "comparison_available": False,
            "rule_only": rule_contributions,
            "attention_only": [],
            "agreements": [],
            "disagreements": [],
        }

    total_attn = sum(abs(v) for v in attention_weights.values()) or 1
    attn_ranked = {
        k: abs(v) / total_attn
        for k, v in attention_weights.items()
    }

    rule_features = {c["feature"]: c.get("contribution", 0) for c in rule_contributions}

    agreements = []
    disagreements = []

    for feature in set(list(rule_features.keys()) + list(attn_ranked.keys())):
        rule_imp = rule_features.get(feature, 0)
        attn_imp = attn_ranked.get(feature, 0)

        # Both consider it important
        if rule_imp > 5 and attn_imp > 0.05:
            agreements.append({
                "feature": feature,
                "rule_contribution": round(rule_imp, 1),
                "attention_pct": round(attn_imp * 100, 1),
                "description": FEATURE_DESCRIPTIONS.get(feature, feature),
            })
        # Disagreement: one high, other low
        elif (rule_imp > 10 and attn_imp < 0.02) or (attn_imp > 0.1 and rule_imp < 3):
            disagreements.append({
                "feature": feature,
                "rule_contribution": round(rule_imp, 1),
                "attention_pct": round(attn_imp * 100, 1),
                "description": FEATURE_DESCRIPTIONS.get(feature, feature),
                "note": "Rule emphasizes" if rule_imp > attn_imp * 100 else "ML model emphasizes",
            })

    return {
        "comparison_available": True,
        "agreements": sorted(agreements, key=lambda x: x["rule_contribution"], reverse=True),
        "disagreements": disagreements,
        "rule_feature_count": len(rule_features),
        "attention_feature_count": len(attn_ranked),
    }
