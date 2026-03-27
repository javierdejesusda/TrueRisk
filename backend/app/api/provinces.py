from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.models.province import Province
from app.schemas.province import ProvinceListResponse, ProvinceResponse
from app.utils.cache import province_cache

router = APIRouter()


@router.get("", response_model=ProvinceListResponse)
async def list_provinces(db: AsyncSession = Depends(get_db)):
    cached = province_cache.get("all_provinces")
    if cached is not None:
        return cached

    result = await db.execute(select(Province).order_by(Province.ine_code))
    provinces = result.scalars().all()
    response = ProvinceListResponse(
        provinces=[ProvinceResponse.model_validate(p) for p in provinces],
        count=len(provinces),
    )
    province_cache.set("all_provinces", response)
    return response


@router.get("/{code}", response_model=ProvinceResponse)
async def get_province(code: str, db: AsyncSession = Depends(get_db)):
    cache_key = f"province:{code}"
    cached = province_cache.get(cache_key)
    if cached is not None:
        return cached

    province = await db.scalar(select(Province).where(Province.ine_code == code))
    if province is None:
        raise HTTPException(status_code=404, detail=f"Province {code} not found")
    response = ProvinceResponse.model_validate(province)
    province_cache.set(cache_key, response)
    return response
