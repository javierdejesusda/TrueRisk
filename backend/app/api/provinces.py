from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.models.province import Province
from app.schemas.province import ProvinceListResponse, ProvinceResponse

router = APIRouter()


@router.get("", response_model=ProvinceListResponse)
async def list_provinces(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Province).order_by(Province.ine_code))
    provinces = result.scalars().all()
    return ProvinceListResponse(
        provinces=[ProvinceResponse.model_validate(p) for p in provinces],
        count=len(provinces),
    )


@router.get("/{code}", response_model=ProvinceResponse)
async def get_province(code: str, db: AsyncSession = Depends(get_db)):
    province = await db.scalar(select(Province).where(Province.ine_code == code))
    if province is None:
        raise HTTPException(status_code=404, detail=f"Province {code} not found")
    return ProvinceResponse.model_validate(province)
