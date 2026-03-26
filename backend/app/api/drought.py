"""Drought monitoring API."""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.models.province import Province
from app.models.risk_score import RiskScore
from app.services.drought_dashboard_service import classify_drought, get_drought_overview

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/map/all")
async def get_all_drought(db: AsyncSession = Depends(get_db)):
    """Get drought classification for all provinces (for map layer)."""
    try:
        provinces = await db.execute(select(Province))
        result = []
        for p in provinces.scalars().all():
            latest = await db.scalar(
                select(RiskScore)
                .where(RiskScore.province_code == p.ine_code)
                .order_by(RiskScore.computed_at.desc())
                .limit(1)
            )
            spei_3m = 0.0
            if latest and latest.features_snapshot:
                spei_3m = latest.features_snapshot.get("spei_3m", 0.0)
            classification = classify_drought(spei_3m)
            result.append({
                "province_code": p.ine_code,
                "province_name": p.name,
                "latitude": p.latitude,
                "longitude": p.longitude,
                "spei_3m": round(spei_3m, 2),
                **classification,
            })
        return result
    except Exception:
        logger.exception("Error fetching drought map data")
        return JSONResponse(
            status_code=500,
            content={"detail": "Failed to fetch drought map data"},
        )


@router.get("/{province_code}")
async def get_drought_data(province_code: str, db: AsyncSession = Depends(get_db)):
    """Get drought overview for a province."""
    try:
        return await get_drought_overview(db, province_code)
    except Exception:
        logger.exception("Error fetching drought data for %s", province_code)
        return JSONResponse(
            status_code=500,
            content={"detail": "Failed to fetch drought data"},
        )
