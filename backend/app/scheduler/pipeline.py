"""6-hour data pipeline: fetch weather -> compute risk -> generate alerts."""

import logging
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session
from app.models import Province, Alert
from app.services.risk_service import compute_province_risk
from app.data.aemet_client import fetch_alerts
from app.config import settings

logger = logging.getLogger(__name__)

ALERT_THRESHOLD_HIGH = 60
ALERT_THRESHOLD_CRITICAL = 80

HAZARD_LABELS = {
    "flood": "Riesgo de inundaciones",
    "wildfire": "Riesgo de incendios forestales",
    "drought": "Riesgo de sequía",
    "heatwave": "Riesgo de ola de calor",
}


async def run_pipeline():
    """Main pipeline: runs every 6 hours."""
    logger.info("Starting data pipeline...")
    async with async_session() as db:
        try:
            # 1. Get all provinces
            result = await db.execute(select(Province))
            provinces = result.scalars().all()
            logger.info(f"Processing {len(provinces)} provinces")

            # 2. Compute risk for each province
            for province in provinces:
                try:
                    risk = await compute_province_risk(db, province.ine_code)
                    logger.info(
                        f"  {province.name}: composite={risk['composite_score']:.1f} "
                        f"dominant={risk['dominant_hazard']}"
                    )

                    # 3. Auto-generate alerts for high/critical scores
                    await _check_and_create_alerts(db, province, risk)
                except Exception as e:
                    logger.error(f"  Error processing {province.name}: {e}")

            # 4. Sync AEMET alerts
            if settings.aemet_api_key:
                try:
                    aemet_alerts = await fetch_alerts(settings.aemet_api_key)
                    logger.info(f"Fetched {len(aemet_alerts)} AEMET alerts")
                except Exception as e:
                    logger.error(f"AEMET alert sync failed: {e}")

            await db.commit()
            logger.info("Pipeline complete.")
        except Exception as e:
            logger.error(f"Pipeline failed: {e}")
            await db.rollback()


async def _check_and_create_alerts(
    db: AsyncSession, province: Province, risk: dict
):
    """Create alerts when hazard scores cross thresholds."""
    for hazard in ["flood", "wildfire", "drought", "heatwave"]:
        score = risk.get(f"{hazard}_score", 0)
        if score < ALERT_THRESHOLD_HIGH:
            continue

        # Check for existing active alert of same type for this province
        existing = await db.scalar(
            select(Alert).where(
                Alert.province_code == province.ine_code,
                Alert.hazard_type == hazard,
                Alert.is_active == True,  # noqa: E712
                Alert.source == "auto_detected",
            )
        )
        if existing:
            continue

        severity = 5 if score >= ALERT_THRESHOLD_CRITICAL else 4
        label = HAZARD_LABELS.get(hazard, hazard)
        alert = Alert(
            severity=severity,
            hazard_type=hazard,
            province_code=province.ine_code,
            title=f"{label} en {province.name}",
            description=(
                f"Nivel de riesgo {risk['severity']} detectado automáticamente. "
                f"Puntuación: {score:.1f}/100."
            ),
            source="auto_detected",
            is_active=True,
            onset=datetime.now(timezone.utc),
        )
        db.add(alert)
        logger.warning(
            f"  ALERT: {hazard} severity={severity} for {province.name} (score={score:.1f})"
        )
