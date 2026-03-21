"""SMS subscription API router."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.models.sms_subscription import SmsSubscription
from app.schemas.sms import SmsSubscribeRequest, SmsSubscribeResponse

router = APIRouter()


@router.post("/subscribe", status_code=201, response_model=SmsSubscribeResponse)
async def subscribe_sms(body: SmsSubscribeRequest, db: AsyncSession = Depends(get_db)):
    """Register a phone number for critical SMS alerts."""
    sub = SmsSubscription(
        phone_number=body.phone_number,
        province_code=body.province_code,
    )
    db.add(sub)
    await db.commit()
    await db.refresh(sub)
    return SmsSubscribeResponse(id=sub.id)


@router.delete("/unsubscribe/{phone_number}")
async def unsubscribe_sms(phone_number: str, db: AsyncSession = Depends(get_db)):
    """Deactivate SMS subscription for a phone number."""
    await db.execute(
        update(SmsSubscription)
        .where(SmsSubscription.phone_number == phone_number)
        .values(is_active=False)
    )
    await db.commit()
    return {"status": "unsubscribed"}
