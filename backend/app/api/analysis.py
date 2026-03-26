"""Analysis API router -- statistical prediction endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.services.prediction_service import compute_predictions

router = APIRouter()


@router.get("/predictions")
async def get_predictions(
    province: str = Query(default="28"),
    db: AsyncSession = Depends(get_db),
):
    """Return statistical predictions for a province based on weather history."""
    try:
        return await compute_predictions(db, province)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {exc}")
