"""Insurance risk report service -- structured risk assessment for B2B partners."""

import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.api.location import find_nearest_province
from app.data.province_data import PROVINCES
from app.services.property_risk_service import compute_property_risk, severity_from_score

logger = logging.getLogger(__name__)


async def generate_insurance_report(
    db: AsyncSession, lat: float, lon: float, address: str = ""
) -> dict:
    """Generate a structured insurance risk report for a location."""
    # Determine province from coordinates
    province_code = find_nearest_province(lat, lon)
    province_data = PROVINCES.get(province_code, {})
    province_name = province_data.get("name", "")

    # Use existing property risk service
    property_result = await compute_property_risk(lat, lon, province_code, db)

    now = datetime.now(timezone.utc)

    report = {
        "report_type": "insurance_risk_assessment",
        "version": "1.0",
        "address": address,
        "coordinates": {"latitude": lat, "longitude": lon},
        "province_code": province_code,
        "province_name": province_name,
        "risk_scores": {
            "composite": property_result.composite_score,
            "flood": property_result.flood.score,
            "wildfire": property_result.wildfire.score,
            "drought": property_result.drought.score,
            "heatwave": property_result.heatwave.score,
            "seismic": property_result.seismic.score,
            "coldwave": property_result.coldwave.score,
            "windstorm": property_result.windstorm.score,
        },
        "dominant_hazard": property_result.dominant_hazard,
        "severity": property_result.severity,
        "property_analysis": {
            "elevation_m": property_result.terrain.elevation_m,
            "flood_zone": property_result.flood_zone.zone_name,
            "in_flood_zone": property_result.flood_zone.in_flood_zone,
            "wildfire_proximity_km": None,
            "modifiers": {
                "flood": property_result.flood.modifier,
                "wildfire": property_result.wildfire.modifier,
                "heatwave": property_result.heatwave.modifier,
                "drought": property_result.drought.modifier,
                "coldwave": property_result.coldwave.modifier,
                "windstorm": property_result.windstorm.modifier,
                "seismic": property_result.seismic.modifier,
            },
        },
        "data_sources": ["AEMET", "Open-Meteo", "IGN", "NASA FIRMS", "ARPSI"],
        "report_date": now.isoformat(),
        "valid_until": (now + timedelta(days=30)).isoformat(),
        "disclaimer": (
            "This report is generated algorithmically and should not replace "
            "professional risk assessment. Scores are indicative and based on "
            "available data at the time of generation."
        ),
    }

    return report
