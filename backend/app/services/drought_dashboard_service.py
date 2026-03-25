"""Drought dashboard service -- SPEI classification, reservoirs, restrictions."""

import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.water_restriction import WaterRestriction

logger = logging.getLogger(__name__)

# SPEI-based drought severity classification (US Drought Monitor scale)
DROUGHT_CLASSES = [
    (-0.5, {"class": "D0", "label": "Normal", "severity": 0, "color": "#22c55e"}),
    (-0.8, {"class": "D0", "label": "Abnormally Dry", "severity": 1, "color": "#fbbf24"}),
    (-1.3, {"class": "D1", "label": "Moderate Drought", "severity": 2, "color": "#f97316"}),
    (-1.6, {"class": "D2", "label": "Severe Drought", "severity": 3, "color": "#ef4444"}),
    (-2.0, {"class": "D3", "label": "Extreme Drought", "severity": 4, "color": "#dc2626"}),
]


def classify_drought(spei_value: float) -> dict:
    """Classify drought severity from SPEI index value."""
    for threshold, classification in DROUGHT_CLASSES:
        if spei_value > threshold:
            return classification
    return {"class": "D4", "label": "Exceptional Drought", "severity": 5, "color": "#991b1b"}


async def get_drought_overview(db: AsyncSession, province_code: str) -> dict:
    """Get complete drought overview for a province."""
    from app.models.risk_score import RiskScore

    latest = await db.scalar(
        select(RiskScore)
        .where(RiskScore.province_code == province_code)
        .order_by(RiskScore.computed_at.desc())
        .limit(1)
    )

    spei_1m = 0.0
    spei_3m = 0.0
    drought_score = 0.0
    if latest and latest.features_snapshot:
        features = latest.features_snapshot
        spei_1m = features.get("spei_1m", 0.0)
        spei_3m = features.get("spei_3m", 0.0)
        drought_score = latest.drought_score

    classification = classify_drought(spei_3m)

    # Get active water restrictions
    restrictions_result = await db.execute(
        select(WaterRestriction).where(
            WaterRestriction.province_code == province_code,
            WaterRestriction.is_active == True,  # noqa: E712
        )
    )
    restrictions = [
        {
            "level": r.restriction_level,
            "description": r.description,
            "source": r.source,
            "effective_date": r.effective_date.isoformat() if r.effective_date else None,
        }
        for r in restrictions_result.scalars().all()
    ]

    return {
        "province_code": province_code,
        "spei_1m": round(spei_1m, 2),
        "spei_3m": round(spei_3m, 2),
        "drought_score": round(drought_score, 1),
        "classification": classification,
        "restrictions": restrictions,
    }
