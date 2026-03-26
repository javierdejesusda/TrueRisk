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
from app.services.push_service import notify_province
from app.config import settings
from app.services.data_health_service import health_tracker

logger = logging.getLogger(__name__)

ALERT_THRESHOLD_HIGH = 60
ALERT_THRESHOLD_CRITICAL = 80

HAZARD_LABELS = {
    "flood": "Riesgo de inundaciones",
    "flash_flood": "Riesgo de inundación súbita",
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
            try:
                weather_map = await open_meteo.fetch_all_provinces(province_list)
                health_tracker.record_success("open_meteo", records_count=len(weather_map))
            except Exception as e:
                health_tracker.record_failure("open_meteo", str(e))
                logger.error(f"Open-Meteo fetch failed: {e}")
                weather_map = {}
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

            # 1c. Fetch supplementary data sources (best-effort, non-blocking)
            if settings.firms_map_key:
                try:
                    from app.data.nasa_firms import fetch_active_fires
                    fires = await fetch_active_fires()
                    health_tracker.record_success("nasa_firms", records_count=len(fires))
                    logger.info(f"Fetched {len(fires)} active fire hotspots")
                except Exception as e:
                    health_tracker.record_failure("nasa_firms", str(e))
                    logger.error(f"NASA FIRMS fetch failed: {e}")

            try:
                from app.data.usgs_earthquake import fetch_recent_quakes as usgs_quakes
                quakes = await usgs_quakes()
                health_tracker.record_success("usgs", records_count=len(quakes))
                logger.info(f"Fetched {len(quakes)} USGS earthquakes")
            except Exception as e:
                health_tracker.record_failure("usgs", str(e))
                logger.error(f"USGS fetch failed: {e}")

            try:
                from app.data.ree_energy import fetch_demand
                energy = await fetch_demand()
                health_tracker.record_success("ree_energy", records_count=1)
                logger.info(f"Fetched REE demand: {energy.get('current_demand_mw')} MW")
            except Exception as e:
                health_tracker.record_failure("ree_energy", str(e))
                logger.error(f"REE fetch failed: {e}")

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
                    health_tracker.record_success("aemet", records_count=len(aemet_alerts))
                    logger.info(f"Fetched {len(aemet_alerts)} AEMET alerts")
                except Exception as e:
                    health_tracker.record_failure("aemet", str(e))
                    logger.error(f"AEMET alert sync failed: {e}")

            # 5. Compute TFT + GNN forecasts
            from app.ml.training.config import ENABLE_TFT_FORECASTS
            if ENABLE_TFT_FORECASTS:
                try:
                    from app.services.forecast_service import compute_all_forecasts
                    await compute_all_forecasts(db)
                    logger.info("Forecast computation complete")
                except Exception:
                    logger.exception("Forecast computation failed")

            # 6. Flash flood monitoring
            try:
                from app.services.flash_flood_service import (
                    process_flash_flood_alerts,
                    store_river_readings,
                )
                readings_count = await store_river_readings(db)
                flood_alert_count = await process_flash_flood_alerts(db)
                health_tracker.record_success("saih", records_count=readings_count)
                logger.info(
                    "Flash flood check: %d readings stored, %d alerts created",
                    readings_count, flood_alert_count,
                )
            except Exception as e:
                health_tracker.record_failure("saih", str(e))
                logger.exception("Flash flood monitoring failed (non-critical)")

            # 7. Generate morning narratives (best-effort, non-blocking)
            if settings.openai_api_key:
                try:
                    from app.services.narrative_service import generate_morning_narrative
                    for province in provinces:
                        try:
                            await generate_morning_narrative(
                                db, province.ine_code, province.name
                            )
                        except Exception as e:
                            logger.error(
                                f"Narrative generation failed for {province.name}: {e}"
                            )
                    logger.info("Morning narratives generated")
                except Exception:
                    logger.exception("Narrative generation failed (non-critical)")

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
        await db.flush()
        # Generate emergency narrative for critical alerts
        if severity == 5 and settings.openai_api_key:
            try:
                from app.services.narrative_service import generate_emergency_narrative
                await generate_emergency_narrative(
                    db, province.ine_code, province.name,
                    hazard, severity, score,
                )
            except Exception as narr_err:
                logger.error(
                    f"  Emergency narrative failed for {province.name}: {narr_err}"
                )
        try:
            await notify_province(
                db,
                province.ine_code,
                {
                    "title": f"ALERTA: {label} en {province.name}",
                    "body": f"Nivel de riesgo {'CRITICO' if severity == 5 else 'ALTO'}. Puntuacion: {score:.0f}/100.",
                    "tag": f"{hazard}-{province.ine_code}",
                    "url": f"/map?province={province.ine_code}",
                    "provinceCode": province.ine_code,
                },
            )
        except Exception as push_err:
            logger.error(f"  Push notification failed for {province.name}: {push_err}")
        if severity >= 4 and settings.twilio_account_sid:
            try:
                from app.services.sms_service import send_critical_alert_sms
                sids = await send_critical_alert_sms(
                    province.name, hazard, severity, score
                )
                if sids:
                    logger.info(f"  SMS sent for {province.name}: {len(sids)} messages")
            except Exception as sms_err:
                logger.error(f"  SMS failed for {province.name}: {sms_err}")
        # WhatsApp alerts
        try:
            from app.services.whatsapp_service import send_whatsapp
            from app.models.user import User as UserModel
            wa_result = await db.execute(
                select(UserModel).where(
                    UserModel.province_code == province.ine_code,
                    UserModel.whatsapp_enabled == True,  # noqa: E712
                    UserModel.phone_number.isnot(None),
                )
            )
            wa_users = wa_result.scalars().all()
            for wu in wa_users:
                if wu.alert_severity_threshold <= severity and wu.phone_number:
                    await send_whatsapp(
                        wu.phone_number,
                        f"ALERTA: {label} en {province.name}. Puntuacion: {score:.0f}/100.",
                    )
        except Exception as wa_err:
            logger.error(f"  WhatsApp dispatch failed for {province.name}: {wa_err}")
        # Telegram alerts
        try:
            from app.services.telegram_service import send_telegram
            from app.models.user import User as UserModel
            tg_result = await db.execute(
                select(UserModel).where(
                    UserModel.province_code == province.ine_code,
                    UserModel.telegram_chat_id.isnot(None),
                )
            )
            tg_users = tg_result.scalars().all()
            for tu in tg_users:
                if tu.alert_severity_threshold <= severity and tu.telegram_chat_id:
                    await send_telegram(
                        tu.telegram_chat_id,
                        f"<b>ALERTA: {label} en {province.name}</b>\nPuntuacion: {score:.0f}/100.",
                    )
        except Exception as tg_err:
            logger.error(f"  Telegram dispatch failed for {province.name}: {tg_err}")
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
