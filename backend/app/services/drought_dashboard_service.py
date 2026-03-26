"""Drought dashboard service -- SPEI classification, reservoirs, restrictions."""

import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

# SPEI-based drought severity classification (US Drought Monitor scale)
DROUGHT_CLASSES = [
    (-0.5, {"class": "D0", "label": "Normal", "severity": 0, "color": "#22c55e"}),
    (-0.8, {"class": "D0", "label": "Abnormally Dry", "severity": 1, "color": "#fbbf24"}),
    (-1.3, {"class": "D1", "label": "Moderate Drought", "severity": 2, "color": "#f97316"}),
    (-1.6, {"class": "D2", "label": "Severe Drought", "severity": 3, "color": "#ef4444"}),
    (-2.0, {"class": "D3", "label": "Extreme Drought", "severity": 4, "color": "#dc2626"}),
]

# Map province river_basin names → MITECO ambito_nombre values
_BASIN_MAP: dict[str, list[str]] = {
    "Ebro": ["Ebro"],
    "Júcar": ["Júcar"],
    "Júcar/Segura": ["Júcar", "Segura"],
    "Júcar/Tajo": ["Júcar", "Tajo"],
    "Júcar/Turia": ["Júcar"],
    "Ebro/Júcar": ["Ebro", "Júcar"],
    "Duero": ["Duero"],
    "Duero/Ebro": ["Duero", "Ebro"],
    "Guadiana": ["Guadiana"],
    "Guadalquivir": ["Guadalquivir"],
    "Tajo": ["Tajo"],
    "Segura": ["Segura"],
    "Miño": ["Miño - Sil"],
    "Cantabric": ["Cantábrico Occidental", "Cantábrico Oriental"],
    "Atlantic NW": ["Galicia Costa", "Miño - Sil"],
    "Atlantic": ["Guadalete-Barbate", "Tinto, Odiel y Piedras"],
    "Mediterranean": ["Cuenca Mediterránea Andaluza", "Cuencas Internas de Cataluña"],
    "Mediterranean/Guadalquivir": ["Cuenca Mediterránea Andaluza", "Guadalquivir"],
    "Island": [],
}

# Restriction descriptions by level
_RESTRICTION_DESCRIPTIONS: dict[int, str] = {
    1: "Pre-alert: increased monitoring of water resources. Voluntary conservation measures recommended.",
    2: "Alert: water conservation measures in effect. Non-essential outdoor water use discouraged.",
    3: "Emergency: mandatory water use restrictions. Agricultural and industrial allocations reduced.",
    4: "Exceptional emergency: severe mandatory restrictions on all water use. Critical supply measures active.",
}


def classify_drought(spei_value: float) -> dict:
    """Classify drought severity from SPEI index value."""
    for threshold, classification in DROUGHT_CLASSES:
        if spei_value > threshold:
            return classification
    return {"class": "D4", "label": "Exceptional Drought", "severity": 5, "color": "#991b1b"}


async def _get_basin_reservoir_pct(province_code: str) -> float | None:
    """Get average reservoir fill % for a province's river basin(s)."""
    from app.data.province_data import PROVINCES
    from app.data.saih import fetch_reservoir_levels

    province_data = PROVINCES.get(province_code)
    if not province_data:
        return None

    basin_key = province_data.get("river_basin", "")
    miteco_basins = _BASIN_MAP.get(basin_key, [])
    if not miteco_basins:
        return None

    try:
        reservoirs = await fetch_reservoir_levels()
    except Exception:
        logger.warning("Could not fetch reservoirs for restriction calc")
        return None

    total_vol = 0.0
    total_cap = 0.0
    for r in reservoirs:
        if r.get("basin") in miteco_basins:
            total_vol += r.get("volume_hm3", 0)
            total_cap += r.get("capacity_hm3", 0)

    if total_cap == 0:
        return None

    return (total_vol / total_cap) * 100


def _compute_restrictions(
    spei_3m: float, basin_pct: float | None
) -> list[dict]:
    """Derive water restriction status from SPEI + reservoir levels.

    Spanish drought management uses combined indicators:
    - SPEI drought severity (meteorological)
    - Reservoir fill percentage (hydrological)

    Restrictions trigger when BOTH conditions indicate stress.
    """
    restrictions: list[dict] = []

    # Determine drought severity tier
    if spei_3m > -0.8:
        drought_tier = 0
    elif spei_3m > -1.3:
        drought_tier = 1  # moderate
    elif spei_3m > -1.6:
        drought_tier = 2  # severe
    elif spei_3m > -2.0:
        drought_tier = 3  # extreme
    else:
        drought_tier = 4  # exceptional

    # Determine reservoir stress tier
    reservoir_tier = 0
    if basin_pct is not None:
        if basin_pct < 25:
            reservoir_tier = 3
        elif basin_pct < 40:
            reservoir_tier = 2
        elif basin_pct < 55:
            reservoir_tier = 1

    # Combined restriction level: worst of (drought, reservoir) but only
    # if at least one indicator shows stress
    level = max(drought_tier, reservoir_tier)

    if level == 0:
        return []

    # If only one indicator is stressed, cap at level 2 (Alert)
    # Both must be stressed for Emergency/Exceptional
    if drought_tier == 0 or (basin_pct is not None and reservoir_tier == 0):
        level = min(level, 2)

    source_parts = []
    if drought_tier > 0:
        source_parts.append(f"SPEI-3m: {spei_3m:.2f}")
    if basin_pct is not None and reservoir_tier > 0:
        source_parts.append(f"Basin reservoirs: {basin_pct:.0f}%")
    elif basin_pct is not None:
        source_parts.append(f"Basin reservoirs: {basin_pct:.0f}%")

    restrictions.append({
        "level": level,
        "description": _RESTRICTION_DESCRIPTIONS.get(level, ""),
        "source": " · ".join(source_parts) if source_parts else "SPEI + Reservoir analysis",
        "effective_date": None,
    })

    return restrictions


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
    data_available = False
    if latest and latest.features_snapshot:
        features = latest.features_snapshot
        drought_features = features.get("drought", {})
        if isinstance(drought_features, dict) and ("spei_1m" in drought_features or "spei_3m" in drought_features):
            spei_1m = drought_features.get("spei_1m", 0.0) or 0.0
            spei_3m = drought_features.get("spei_3m", 0.0) or 0.0
        else:
            spei_1m = features.get("spei_1m", 0.0) or 0.0
            spei_3m = features.get("spei_3m", 0.0) or 0.0
        drought_score = latest.drought_score
        data_available = True

    classification = classify_drought(spei_3m)

    # Compute restrictions from live data (SPEI + reservoir levels)
    basin_pct = await _get_basin_reservoir_pct(province_code)
    restrictions = _compute_restrictions(spei_3m, basin_pct)

    return {
        "province_code": province_code,
        "spei_1m": round(spei_1m, 2),
        "spei_3m": round(spei_3m, 2),
        "drought_score": round(drought_score, 1),
        "classification": classification,
        "restrictions": restrictions,
        "data_available": data_available,
    }
