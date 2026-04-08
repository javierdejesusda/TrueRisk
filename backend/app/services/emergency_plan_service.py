"""Emergency plan service -- CRUD and AI-powered kit recommendations."""

from __future__ import annotations

import logging
from app.utils.time import utcnow
from typing import AsyncIterator

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.emergency_plan import EmergencyPlan
from app.models.province import Province
from app.models.user import User
from app.schemas.emergency_plan import EmergencyPlanResponse, EmergencyPlanUpdate

logger = logging.getLogger(__name__)


async def get_or_create(db: AsyncSession, user_id: int) -> EmergencyPlan:
    """Return the user's plan, creating an empty one if it doesn't exist."""
    result = await db.execute(
        select(EmergencyPlan).where(EmergencyPlan.user_id == user_id)
    )
    plan = result.scalar_one_or_none()
    if plan is None:
        plan = EmergencyPlan(
            user_id=user_id,
            household_members=[],
            meeting_points=[],
            communication_plan=[],
        )
        db.add(plan)
        await db.commit()
        await db.refresh(plan)
    return plan


def _plan_to_response(plan: EmergencyPlan) -> EmergencyPlanResponse:
    return EmergencyPlanResponse(
        id=plan.id,
        household_members=plan.household_members or [],  # type: ignore[arg-type]
        meeting_points=plan.meeting_points or [],  # type: ignore[arg-type]
        communication_plan=plan.communication_plan or [],  # type: ignore[arg-type]
        evacuation_notes=plan.evacuation_notes,
        insurance_info=plan.insurance_info,
        pet_info=plan.pet_info,  # type: ignore[arg-type]
        important_documents=plan.important_documents,  # type: ignore[arg-type]
        last_reviewed_at=plan.last_reviewed_at,
        created_at=plan.created_at,
        updated_at=plan.updated_at,
    )


async def get_plan(db: AsyncSession, user_id: int) -> EmergencyPlanResponse:
    """Get or create the user's emergency plan."""
    plan = await get_or_create(db, user_id)
    return _plan_to_response(plan)


async def update_plan(
    db: AsyncSession, user_id: int, data: EmergencyPlanUpdate
) -> EmergencyPlanResponse:
    """Partially update the user's emergency plan."""
    plan = await get_or_create(db, user_id)

    update_fields = data.model_dump(exclude_unset=True)
    for field, value in update_fields.items():
        setattr(plan, field, value)

    plan.last_reviewed_at = utcnow()
    await db.commit()
    await db.refresh(plan)

    # Recompute preparedness score since plan completion affects it
    from app.services.preparedness_service import compute_score
    await compute_score(db, user_id)

    return _plan_to_response(plan)


KIT_PROMPT = """\
You are a disaster preparedness expert advising a citizen in Spain through \
TrueRisk, a climate risk management platform. Based on the user's profile \
and their province's hazard profile, generate a personalized emergency kit \
checklist.

Rules:
- Write in the requested language (Spanish or English).
- Use ## for each kit category (Water & Food, First Aid, Tools, Documents, etc.).
- List specific items with quantities.
- Prioritise items relevant to the province's top hazards.
- Consider the user's household composition and special needs.
- Keep total response under 400 words.
- Be practical and actionable.
"""


async def stream_kit_recommendations(
    user: User, province: Province | None, locale: str = "es"
) -> AsyncIterator[str]:
    """Stream AI-powered emergency kit recommendations via OpenAI."""
    from app.config import settings

    if not settings.openai_api_key:
        yield "AI service not configured."
        return

    from openai import AsyncOpenAI

    client = AsyncOpenAI(api_key=settings.openai_api_key)
    lang = "Spanish" if locale == "es" else "English"

    province_context = ""
    if province:
        hazards = []
        if province.flood_risk_weight >= 0.5:
            hazards.append("flood (high)")
        if province.wildfire_risk_weight >= 0.5:
            hazards.append("wildfire (high)")
        if province.heatwave_risk_weight >= 0.5:
            hazards.append("heatwave (high)")
        if province.seismic_risk_weight >= 0.5:
            hazards.append("seismic (high)")
        if province.drought_risk_weight >= 0.5:
            hazards.append("drought (high)")
        province_context = (
            f"Province: {province.name} ({province.region})\n"
            f"Coastal: {province.coastal}, Mediterranean: {province.mediterranean}\n"
            f"Top hazards: {', '.join(hazards) if hazards else 'moderate across all types'}\n"
        )

    user_context = (
        f"User Profile:\n"
        f"- Residence: {user.residence_type}\n"
        f"- Special needs: {', '.join(user.special_needs) if isinstance(user.special_needs, list) and user.special_needs else 'none'}\n"
        f"- Mobility: {user.mobility_level}\n"
        f"- Has vehicle: {user.has_vehicle}\n"
        f"- Medical conditions: {user.medical_conditions or 'none'}\n"
    )

    messages: list[dict[str, str]] = [
        {"role": "system", "content": KIT_PROMPT},
        {"role": "user", "content": f"Language: {lang}\n\n{province_context}\n{user_context}"},
    ]

    try:
        async with client.chat.completions.stream(
            model=settings.openai_model,
            messages=messages,  # type: ignore[arg-type]
            max_completion_tokens=800,
            temperature=0.4,
        ) as stream:
            async for event in stream:
                if event.type == "content.delta":
                    yield event.delta
    except (AttributeError, TypeError):
        response = await client.chat.completions.create(
            model=settings.openai_model,
            messages=messages,  # type: ignore[arg-type]
            max_completion_tokens=800,
            temperature=0.4,
            stream=True,
        )
        async for chunk in response:  # type: ignore[union-attr]
            if chunk.choices and chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content
