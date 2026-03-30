"""Property-level risk refinement service.

Takes province-level risk scores (already computed by the ML pipeline) and
refines them with address-specific modifiers -- elevation, slope, flood-zone
proximity, coastal/Mediterranean classification -- to produce address-level
risk scores for a single property.

Key principle:
    address_score = clamp(province_score * modifier, 0, 100)
"""

from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.data.province_data import PROVINCES
from app.models.risk_score import RiskScore
from app.services.arpsi_service import FloodZoneResult, check_flood_zone
from app.services.elevation_service import ElevationResult, get_elevation_and_slope

# Scale factor for deriving province baselines from geographic risk weights.
# Used both as a fallback when no ML-computed RiskScore exists and as a
# floor to ensure province scores always reflect geographic exposure.
_GEO_BASELINE_SCALE = 45.0

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Result types
# ---------------------------------------------------------------------------


@dataclass
class HazardDetail:
    """Refined risk detail for a single hazard."""

    score: float
    province_score: float
    modifier: float
    severity: str  # low / moderate / high / very_high / critical
    explanation: str  # natural-language explanation of the modifier


@dataclass
class PropertyRiskResult:
    """Complete address-level risk assessment."""

    composite_score: float
    dominant_hazard: str
    severity: str
    flood: HazardDetail
    wildfire: HazardDetail
    heatwave: HazardDetail
    drought: HazardDetail
    coldwave: HazardDetail
    windstorm: HazardDetail
    seismic: HazardDetail
    flood_zone: FloodZoneResult
    terrain: ElevationResult


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _clamp(value: float, lo: float = 0.0, hi: float = 100.0) -> float:
    """Clamp *value* between *lo* and *hi*."""
    return min(hi, max(lo, value))


def severity_from_score(score: float) -> str:
    """Map a 0--100 risk score to a human-readable severity label."""
    if score <= 20:
        return "low"
    if score <= 40:
        return "moderate"
    if score <= 60:
        return "high"
    if score <= 80:
        return "very_high"
    return "critical"


def compute_composite_score(hazard_scores: dict[str, float]) -> tuple[float, str]:
    """Compute the composite risk from refined hazard scores.

    The dominant hazard contributes 100 % of its score.  Secondary hazards
    add diminishing fractions: 2nd +15 %, 3rd +7.5 %, etc.

    Returns ``(composite_score, dominant_hazard_name)``.
    """
    sorted_hazards = sorted(hazard_scores.items(), key=lambda x: x[1], reverse=True)
    max_score = sorted_hazards[0][1]

    secondary_sum = sum(
        score * 0.15 / (rank + 1)
        for rank, (_, score) in enumerate(sorted_hazards[1:], 1)
    )

    composite = _clamp(max_score + secondary_sum)
    dominant = sorted_hazards[0][0]
    return round(composite, 2), dominant


# ---------------------------------------------------------------------------
# Hazard refinement functions
# ---------------------------------------------------------------------------


def refine_flood_risk(
    province_score: float,
    arpsi_result: FloodZoneResult,
) -> tuple[float, float, str]:
    """Refine the province-level flood score using ARPSI flood-zone data.

    Uses a hybrid approach: the province weather-based score is scaled by a
    modifier, but ARPSI flood-zone presence guarantees a minimum baseline
    representing structural, permanent flood risk independent of current
    weather conditions.

    Returns ``(refined_score, modifier, explanation)``.
    """
    min_baseline = 0.0

    if arpsi_result.in_flood_zone:
        if arpsi_result.return_period == "T10":
            modifier = 2.5
            min_baseline = 35.0
            explanation = (
                f"Address is inside a high-frequency flood zone "
                f"({arpsi_result.zone_name}, T10 return period)"
            )
        elif arpsi_result.return_period == "T100":
            modifier = 1.8
            min_baseline = 25.0
            explanation = (
                f"Address is inside a moderate flood zone "
                f"({arpsi_result.zone_name}, T100 return period)"
            )
        elif arpsi_result.return_period == "T500":
            modifier = 1.3
            min_baseline = 15.0
            explanation = (
                f"Address is inside a low-frequency flood zone "
                f"({arpsi_result.zone_name}, T500 return period)"
            )
        else:
            modifier = 1.5
            min_baseline = 20.0
            explanation = f"Address is inside flood zone {arpsi_result.zone_name}"
    elif (
        arpsi_result.distance_to_nearest_zone_m is not None
        and arpsi_result.distance_to_nearest_zone_m < 500
    ):
        modifier = 1.2
        min_baseline = 10.0
        explanation = (
            f"Address is {arpsi_result.distance_to_nearest_zone_m:.0f}m "
            f"from nearest flood zone"
        )
    else:
        modifier = 0.5
        explanation = "Address is not in or near any designated flood zone"

    score = _clamp(max(province_score * modifier, min_baseline))
    return round(score, 2), round(modifier, 2), explanation


def refine_wildfire_risk(
    province_score: float,
    elevation: float,
    slope: float,
    province_code: str,
) -> tuple[float, float, str]:
    """Refine the province-level wildfire score using terrain and geography.

    Returns ``(refined_score, modifier, explanation)``.
    """
    province_data = PROVINCES.get(province_code, {})
    is_coastal = province_data.get("coastal", False)
    is_mediterranean = province_data.get("mediterranean", False)

    modifier = 1.0
    reasons: list[str] = []

    # Elevation band
    if 200 <= elevation <= 800:
        modifier *= 1.4
        reasons.append(
            f"elevation {elevation:.0f}m in Mediterranean scrub/forest belt"
        )
    elif elevation > 800:
        modifier *= 0.8
        reasons.append(f"high elevation ({elevation:.0f}m) reduces fuel load")
    elif elevation < 100:
        modifier *= 0.6
        reasons.append(f"low elevation ({elevation:.0f}m) typically urban")

    # Slope
    if slope > 15:
        modifier *= 1.3
        reasons.append(f"steep terrain ({slope:.1f}%) accelerates fire spread")

    # Mediterranean + non-coastal
    if is_mediterranean and not is_coastal:
        modifier *= 1.5
        reasons.append("inland Mediterranean zone (classic WUI profile)")
    elif is_coastal:
        modifier *= 0.5
        reasons.append("coastal location reduces wildfire exposure")

    # Cap modifier
    modifier = min(modifier, 2.5)

    score = _clamp(province_score * modifier)
    explanation = (
        "; ".join(reasons) if reasons else "Standard wildfire risk for this location"
    )
    return round(score, 2), round(modifier, 2), explanation


def refine_heatwave_risk(
    province_score: float,
    elevation: float,
    is_coastal: bool,
    province_code: str,
) -> tuple[float, float, str]:
    """Refine the province-level heatwave score using terrain and geography.

    Returns ``(refined_score, modifier, explanation)``.
    """
    modifier = 1.0
    reasons: list[str] = []

    # Elevation
    if elevation > 800:
        modifier *= 0.7
        reasons.append(f"high elevation ({elevation:.0f}m) cools temperatures")
    elif elevation < 200 and not is_coastal:
        modifier *= 1.15
        reasons.append(f"low inland valley ({elevation:.0f}m) traps heat")

    # Coastal
    if is_coastal:
        modifier *= 0.85
        reasons.append("maritime cooling effect")

    score = _clamp(province_score * modifier)
    explanation = (
        "; ".join(reasons) if reasons else "Standard heatwave risk for this location"
    )
    return round(score, 2), round(modifier, 2), explanation


def refine_coldwave_risk(
    province_score: float,
    elevation: float,
) -> tuple[float, float, str]:
    """Refine the province-level cold-wave score using elevation.

    Returns ``(refined_score, modifier, explanation)``.
    """
    modifier = 1.0
    reasons: list[str] = []

    if elevation > 800:
        modifier = 1.2
        reasons.append(
            f"high elevation ({elevation:.0f}m) increases cold-wave exposure"
        )

    score = _clamp(province_score * modifier)
    explanation = (
        "; ".join(reasons) if reasons else "Standard cold-wave risk for this location"
    )
    return round(score, 2), round(modifier, 2), explanation


def refine_windstorm_risk(
    province_score: float,
    elevation: float,
) -> tuple[float, float, str]:
    """Refine the province-level windstorm score using elevation.

    Returns ``(refined_score, modifier, explanation)``.
    """
    modifier = 1.0
    reasons: list[str] = []

    if elevation > 800:
        modifier = 1.15
        reasons.append(
            f"high elevation ({elevation:.0f}m) increases wind exposure"
        )

    score = _clamp(province_score * modifier)
    explanation = (
        "; ".join(reasons) if reasons else "Standard windstorm risk for this location"
    )
    return round(score, 2), round(modifier, 2), explanation


def refine_drought_risk(
    province_score: float,
) -> tuple[float, float, str]:
    """Pass through province-level drought score (water infra is province-wide).

    Returns ``(refined_score, modifier, explanation)``.
    """
    modifier = 1.0
    explanation = "Drought risk is province-wide (water infrastructure dependent)"
    score = _clamp(province_score * modifier)
    return round(score, 2), round(modifier, 2), explanation


def refine_seismic_risk(
    province_score: float,
) -> tuple[float, float, str]:
    """Pass through province-level seismic score (geology-based, not terrain).

    Returns ``(refined_score, modifier, explanation)``.
    """
    modifier = 1.0
    explanation = "Seismic risk is geology-based and does not vary within the province"
    score = _clamp(province_score * modifier)
    return round(score, 2), round(modifier, 2), explanation


# ---------------------------------------------------------------------------
# Province score retrieval
# ---------------------------------------------------------------------------


async def _get_latest_province_scores(
    db: AsyncSession,
    province_code: str,
) -> RiskScore | None:
    """Return the most recently computed RiskScore for a province, or None."""
    result = await db.execute(
        select(RiskScore)
        .where(RiskScore.province_code == province_code)
        .order_by(RiskScore.computed_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


# ---------------------------------------------------------------------------
# Main orchestration
# ---------------------------------------------------------------------------


async def compute_property_risk(
    lat: float,
    lon: float,
    province_code: str,
    db: AsyncSession,
) -> PropertyRiskResult:
    """Compute address-level risk by refining province scores with local data.

    Steps:
        1. Fetch latest province-level risk scores from the DB.
        2. Fetch elevation/slope and ARPSI flood-zone data concurrently.
        3. Look up province metadata (coastal, Mediterranean, etc.).
        4. Refine each hazard with address-specific modifiers.
        5. Compute composite score and dominant hazard.
        6. Return a fully populated :class:`PropertyRiskResult`.
    """
    # 1. Get latest province-level risk scores
    try:
        risk_row = await _get_latest_province_scores(db, province_code)
    except Exception:
        logger.warning(
            "Failed to fetch province scores for %s; using zero baselines",
            province_code,
            exc_info=True,
        )
        risk_row = None

    if risk_row is None:
        logger.warning(
            "No risk scores found for province %s; using geographic baselines",
            province_code,
        )

    # Derive geographic baselines from province risk weights.  These serve
    # as a floor — even when the ML pipeline computes a low score because
    # there is no current weather activity, the geographic exposure risk
    # (historical/climatological) must still be reflected.
    weights = PROVINCES.get(province_code, {})
    geo_flood = _GEO_BASELINE_SCALE * weights.get("flood_risk_weight", 0.3)
    geo_wildfire = _GEO_BASELINE_SCALE * weights.get("wildfire_risk_weight", 0.3)
    geo_heatwave = _GEO_BASELINE_SCALE * weights.get("heatwave_risk_weight", 0.3)
    geo_drought = _GEO_BASELINE_SCALE * weights.get("drought_risk_weight", 0.3)
    geo_coldwave = _GEO_BASELINE_SCALE * weights.get("coldwave_risk_weight", 0.3)
    geo_windstorm = _GEO_BASELINE_SCALE * weights.get("windstorm_risk_weight", 0.3)
    geo_seismic = _GEO_BASELINE_SCALE * weights.get("seismic_risk_weight", 0.3)

    if risk_row:
        # Use ML-computed scores but enforce the geographic baseline as floor.
        province_flood = max(risk_row.flood_score, geo_flood)
        province_wildfire = max(risk_row.wildfire_score, geo_wildfire)
        province_heatwave = max(risk_row.heatwave_score, geo_heatwave)
        province_drought = max(risk_row.drought_score, geo_drought)
        province_coldwave = max(risk_row.coldwave_score, geo_coldwave)
        province_windstorm = max(risk_row.windstorm_score, geo_windstorm)
        province_seismic = max(risk_row.seismic_score, geo_seismic)
    else:
        province_flood = geo_flood
        province_wildfire = geo_wildfire
        province_heatwave = geo_heatwave
        province_drought = geo_drought
        province_coldwave = geo_coldwave
        province_windstorm = geo_windstorm
        province_seismic = geo_seismic

    # 2. Fetch terrain and flood-zone data concurrently.
    #    Flood zone check uses its own DB session to avoid poisoning the
    #    caller's transaction if the arpsi_flood_zones table is missing.
    async def _isolated_flood_check() -> FloodZoneResult:
        from app.database import async_session
        try:
            async with async_session() as flood_session:
                return await check_flood_zone(lat, lon, flood_session)
        except Exception as exc:
            logger.warning("Flood zone check failed (isolated): %s", exc)
            return FloodZoneResult(in_flood_zone=False)

    terrain_result, flood_zone_result = await asyncio.gather(
        get_elevation_and_slope(lat, lon),
        _isolated_flood_check(),
        return_exceptions=True,
    )

    # Handle exceptions gracefully so individual failures don't crash everything
    if isinstance(terrain_result, BaseException):
        logger.warning("Elevation service failed: %s", terrain_result)
        terrain_result = ElevationResult(elevation_m=0.0, slope_pct=0.0)

    if isinstance(flood_zone_result, BaseException):
        logger.warning("Flood zone check failed: %s", flood_zone_result)
        flood_zone_result = FloodZoneResult(in_flood_zone=False)

    elevation = terrain_result.elevation_m
    slope = terrain_result.slope_pct

    # 3. Province metadata
    province_data = PROVINCES.get(province_code, {})
    is_coastal = province_data.get("coastal", False)

    # 4. Refine each hazard
    flood_score, flood_mod, flood_expl = refine_flood_risk(
        province_flood, flood_zone_result
    )
    wildfire_score, wildfire_mod, wildfire_expl = refine_wildfire_risk(
        province_wildfire, elevation, slope, province_code
    )
    heatwave_score, heatwave_mod, heatwave_expl = refine_heatwave_risk(
        province_heatwave, elevation, is_coastal, province_code
    )
    drought_score, drought_mod, drought_expl = refine_drought_risk(province_drought)
    coldwave_score, coldwave_mod, coldwave_expl = refine_coldwave_risk(
        province_coldwave, elevation
    )
    windstorm_score, windstorm_mod, windstorm_expl = refine_windstorm_risk(
        province_windstorm, elevation
    )
    seismic_score, seismic_mod, seismic_expl = refine_seismic_risk(province_seismic)

    # 5. Composite
    hazard_scores = {
        "flood": flood_score,
        "wildfire": wildfire_score,
        "heatwave": heatwave_score,
        "drought": drought_score,
        "coldwave": coldwave_score,
        "windstorm": windstorm_score,
        "seismic": seismic_score,
    }
    composite, dominant = compute_composite_score(hazard_scores)
    severity = severity_from_score(composite)

    # 6. Build result
    return PropertyRiskResult(
        composite_score=composite,
        dominant_hazard=dominant,
        severity=severity,
        flood=HazardDetail(
            score=flood_score,
            province_score=province_flood,
            modifier=flood_mod,
            severity=severity_from_score(flood_score),
            explanation=flood_expl,
        ),
        wildfire=HazardDetail(
            score=wildfire_score,
            province_score=province_wildfire,
            modifier=wildfire_mod,
            severity=severity_from_score(wildfire_score),
            explanation=wildfire_expl,
        ),
        heatwave=HazardDetail(
            score=heatwave_score,
            province_score=province_heatwave,
            modifier=heatwave_mod,
            severity=severity_from_score(heatwave_score),
            explanation=heatwave_expl,
        ),
        drought=HazardDetail(
            score=drought_score,
            province_score=province_drought,
            modifier=drought_mod,
            severity=severity_from_score(drought_score),
            explanation=drought_expl,
        ),
        coldwave=HazardDetail(
            score=coldwave_score,
            province_score=province_coldwave,
            modifier=coldwave_mod,
            severity=severity_from_score(coldwave_score),
            explanation=coldwave_expl,
        ),
        windstorm=HazardDetail(
            score=windstorm_score,
            province_score=province_windstorm,
            modifier=windstorm_mod,
            severity=severity_from_score(windstorm_score),
            explanation=windstorm_expl,
        ),
        seismic=HazardDetail(
            score=seismic_score,
            province_score=province_seismic,
            modifier=seismic_mod,
            severity=severity_from_score(seismic_score),
            explanation=seismic_expl,
        ),
        flood_zone=flood_zone_result,
        terrain=terrain_result,
    )
