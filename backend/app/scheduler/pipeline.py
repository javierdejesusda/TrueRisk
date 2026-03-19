"""6-hour data pipeline: fetch weather -> compute risk -> generate alerts."""

import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session
from app.models import Province, Alert
from app.models.weather_record import WeatherRecord
from app.models.weather_daily_summary import WeatherDailySummary
from app.data import open_meteo
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
    "seismic": "Riesgo sismico",
    "coldwave": "Riesgo de ola de frio",
    "windstorm": "Riesgo de temporal de viento",
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

            # 1b. Bulk-fetch current weather for all provinces and persist
            province_list = [
                {"code": p.ine_code, "lat": p.latitude, "lon": p.longitude}
                for p in provinces
            ]
            weather_map = await open_meteo.fetch_all_provinces(province_list)
            now = datetime.now(timezone.utc)
            for p in provinces:
                w = weather_map.get(p.ine_code)
                if not w:
                    continue
                record = WeatherRecord(
                    province_code=p.ine_code,
                    source="open_meteo",
                    temperature=w.get("temperature", 0.0) or 0.0,
                    humidity=w.get("humidity", 0.0) or 0.0,
                    precipitation=w.get("precipitation", 0.0) or 0.0,
                    wind_speed=w.get("wind_speed"),
                    wind_direction=w.get("wind_direction"),
                    wind_gusts=w.get("wind_gusts"),
                    pressure=w.get("pressure"),
                    soil_moisture=w.get("soil_moisture"),
                    uv_index=w.get("uv_index"),
                    dew_point=w.get("dew_point"),
                    cloud_cover=w.get("cloud_cover"),
                    raw_data=w,
                    recorded_at=now,
                )
                db.add(record)
            await db.flush()
            logger.info(f"Stored weather records for {len(weather_map)} provinces")

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

            # Aggregate yesterday's hourly data into daily summaries
            await _aggregate_daily_summaries(db)

            # Purge weather records older than 90 days
            await _purge_old_records(db)

            logger.info("Pipeline complete.")
        except Exception as e:
            logger.error(f"Pipeline failed: {e}")
            await db.rollback()


async def _check_and_create_alerts(
    db: AsyncSession, province: Province, risk: dict
):
    """Create alerts when hazard scores cross thresholds."""
    for hazard in ["flood", "wildfire", "drought", "heatwave", "seismic", "coldwave", "windstorm"]:
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


async def _aggregate_daily_summaries(db: AsyncSession):
    """Aggregate yesterday's hourly WeatherRecords into daily summaries."""
    yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).date()

    # Check which provinces already have yesterday's summary
    existing = await db.execute(
        select(WeatherDailySummary.province_code).where(
            WeatherDailySummary.date == yesterday
        )
    )
    existing_codes = {row[0] for row in existing.all()}

    result = await db.execute(select(Province))
    provinces = result.scalars().all()

    count = 0
    for province in provinces:
        if province.ine_code in existing_codes:
            continue

        day_start = datetime.combine(yesterday, datetime.min.time()).replace(tzinfo=timezone.utc)
        day_end = day_start + timedelta(days=1)
        records = await db.execute(
            select(WeatherRecord).where(
                WeatherRecord.province_code == province.ine_code,
                WeatherRecord.recorded_at >= day_start,
                WeatherRecord.recorded_at < day_end,
            )
        )
        rows = records.scalars().all()
        if not rows:
            continue

        def _vals(attr: str) -> list[float]:
            return [getattr(r, attr) for r in rows if getattr(r, attr) is not None]

        temps = _vals("temperature")
        humids = _vals("humidity")
        precips = _vals("precipitation")
        winds = _vals("wind_speed")
        gusts = _vals("wind_gusts")
        pressures = _vals("pressure")
        soils = _vals("soil_moisture")
        uvs = _vals("uv_index")
        clouds = _vals("cloud_cover")

        summary = WeatherDailySummary(
            province_code=province.ine_code,
            date=yesterday,
            temperature_max=max(temps) if temps else 0.0,
            temperature_min=min(temps) if temps else 0.0,
            temperature_avg=sum(temps) / len(temps) if temps else 0.0,
            humidity_avg=sum(humids) / len(humids) if humids else 0.0,
            humidity_min=min(humids) if humids else 0.0,
            precipitation_sum=sum(precips) if precips else 0.0,
            wind_speed_max=max(winds) if winds else 0.0,
            wind_speed_avg=sum(winds) / len(winds) if winds else 0.0,
            wind_gusts_max=max(gusts) if gusts else None,
            pressure_avg=sum(pressures) / len(pressures) if pressures else None,
            soil_moisture_avg=sum(soils) / len(soils) if soils else None,
            uv_index_max=max(uvs) if uvs else None,
            cloud_cover_avg=sum(clouds) / len(clouds) if clouds else None,
            source="aggregated",
        )
        db.add(summary)
        count += 1

    if count:
        await db.commit()
        logger.info(f"Aggregated daily summaries for {count} provinces ({yesterday})")


async def _purge_old_records(db: AsyncSession):
    """Delete weather records older than 90 days to prevent unbounded growth."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=90)
    result = await db.execute(
        select(func.count()).select_from(WeatherRecord).where(WeatherRecord.recorded_at < cutoff)
    )
    count = result.scalar() or 0
    if count > 0:
        await db.execute(delete(WeatherRecord).where(WeatherRecord.recorded_at < cutoff))
        await db.commit()
        logger.info(f"Purged {count} weather records older than 90 days")
