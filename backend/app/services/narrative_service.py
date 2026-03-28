"""Risk narrative generation service -- pre-generated daily briefings."""

import logging

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.risk_narrative import RiskNarrative
from app.models.risk_score import RiskScore

logger = logging.getLogger(__name__)


async def generate_morning_narrative(
    db: AsyncSession, province_code: str, province_name: str
) -> RiskNarrative | None:
    """Generate a morning briefing narrative for a province.

    Synthesizes current risk scores, weather, and alerts into a
    human-readable summary. Generates in both ES and EN.
    """
    if not settings.openai_api_key:
        logger.warning("OpenAI key not set -- skipping narrative generation")
        return None

    # Get latest risk data
    latest_risk = await db.scalar(
        select(RiskScore)
        .where(RiskScore.province_code == province_code)
        .order_by(RiskScore.computed_at.desc())
        .limit(1)
    )

    if not latest_risk:
        return None

    context = _build_narrative_context(latest_risk, province_name)

    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=settings.openai_api_key)

        # Generate Spanish narrative
        es_response = await client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Eres un meteorologo experto espanol. Genera un informe matutino "
                        "conciso (3-5 frases) sobre el riesgo climatico para ciudadanos. "
                        "Se directo y practico. No uses encabezados ni vinetas, solo texto fluido."
                    ),
                },
                {"role": "user", "content": context},
            ],
            max_tokens=300,
            temperature=0.7,
        )
        content_es = es_response.choices[0].message.content or ""

        # Generate English narrative
        en_response = await client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an expert meteorologist. Generate a concise morning briefing "
                        "(3-5 sentences) about climate risk for citizens. Be direct and practical. "
                        "No headers or bullets, just flowing text."
                    ),
                },
                {"role": "user", "content": context},
            ],
            max_tokens=300,
            temperature=0.7,
        )
        content_en = en_response.choices[0].message.content or ""

    except Exception as e:
        logger.error("Narrative generation failed for %s: %s", province_code, e)
        return None

    # Delete old morning narrative for this province
    await db.execute(
        delete(RiskNarrative).where(
            RiskNarrative.province_code == province_code,
            RiskNarrative.narrative_type == "morning",
        )
    )

    narrative = RiskNarrative(
        province_code=province_code,
        narrative_type="morning",
        content_es=content_es,
        content_en=content_en,
    )
    db.add(narrative)
    await db.flush()
    return narrative


async def generate_emergency_narrative(
    db: AsyncSession, province_code: str, province_name: str,
    hazard_type: str, severity: int, score: float,
) -> RiskNarrative | None:
    """Generate an emergency narrative when a hazard crosses critical threshold."""
    if not settings.openai_api_key:
        return None

    prompt = (
        f"ALERTA DE EMERGENCIA: {hazard_type} en {province_name}. "
        f"Severidad: {severity}/5. Puntuacion de riesgo: {score:.0f}/100. "
        f"Genera un mensaje de emergencia conciso (2-3 frases) con instrucciones "
        f"inmediatas para ciudadanos."
    )

    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=settings.openai_api_key)

        es_response = await client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Eres un sistema de alerta de emergencias. Genera mensajes breves, "
                        "urgentes y practicos para proteccion ciudadana."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            max_tokens=200,
            temperature=0.3,
        )
        content_es = es_response.choices[0].message.content or ""

        en_response = await client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an emergency alert system. Generate brief, urgent, "
                        "practical messages for citizen safety."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            max_tokens=200,
            temperature=0.3,
        )
        content_en = en_response.choices[0].message.content or ""

    except Exception as e:
        logger.error("Emergency narrative failed: %s", e)
        return None

    narrative = RiskNarrative(
        province_code=province_code,
        narrative_type="emergency",
        content_es=content_es,
        content_en=content_en,
    )
    db.add(narrative)
    await db.flush()
    return narrative


async def get_latest_narrative(
    db: AsyncSession, province_code: str, narrative_type: str = "morning"
) -> RiskNarrative | None:
    """Get the latest narrative for a province."""
    return await db.scalar(
        select(RiskNarrative)
        .where(
            RiskNarrative.province_code == province_code,
            RiskNarrative.narrative_type == narrative_type,
        )
        .order_by(RiskNarrative.generated_at.desc())
        .limit(1)
    )


def _build_narrative_context(risk: RiskScore, province_name: str) -> str:
    """Build context string for the AI from risk score data."""
    return (
        f"Province: {province_name}. "
        f"Composite risk: {risk.composite_score:.0f}/100 ({risk.severity}). "
        f"Dominant hazard: {risk.dominant_hazard}. "
        f"Flood: {risk.flood_score:.0f}, Wildfire: {risk.wildfire_score:.0f}, "
        f"Drought: {risk.drought_score:.0f}, Heatwave: {risk.heatwave_score:.0f}, "
        f"Seismic: {risk.seismic_score:.0f}, Coldwave: {risk.coldwave_score:.0f}, "
        f"Windstorm: {risk.windstorm_score:.0f}, DANA: {risk.dana_score:.0f}. "
        f"Computed at: {risk.computed_at.isoformat() if risk.computed_at else 'unknown'}."
    )


async def get_template_narrative(
    db: AsyncSession, province_code: str,
) -> dict | None:
    """Generate a simple template-based narrative from RiskScore data.

    Used as fallback when AI-generated narratives are unavailable.
    """
    from app.models.province import Province

    latest_risk = await db.scalar(
        select(RiskScore)
        .where(RiskScore.province_code == province_code)
        .order_by(RiskScore.computed_at.desc())
        .limit(1)
    )
    if not latest_risk:
        return None

    province = await db.get(Province, province_code)
    name = province.name if province else province_code

    severity_es = {
        "low": "bajo", "moderate": "moderado",
        "high": "alto", "critical": "critico",
    }
    sev_es = severity_es.get(latest_risk.severity, latest_risk.severity)
    hazard_es = {
        "flood": "inundacion", "wildfire": "incendio forestal",
        "drought": "sequia", "heatwave": "ola de calor",
        "seismic": "actividad sismica", "coldwave": "ola de frio",
        "windstorm": "temporal de viento", "dana": "DANA",
    }
    dom_es = hazard_es.get(latest_risk.dominant_hazard, latest_risk.dominant_hazard)

    content_es = (
        f"Resumen de riesgo para {name}: nivel general {sev_es} "
        f"con una puntuacion de {latest_risk.composite_score:.0f}/100. "
        f"El riesgo dominante es {dom_es}. "
        f"Mantengase informado y siga las recomendaciones de proteccion civil."
    )
    content_en = (
        f"Risk summary for {name}: overall level {latest_risk.severity} "
        f"with a score of {latest_risk.composite_score:.0f}/100. "
        f"The dominant hazard is {latest_risk.dominant_hazard}. "
        f"Stay informed and follow civil protection recommendations."
    )

    return {
        "available": True,
        "province_code": province_code,
        "type": "morning",
        "content_es": content_es,
        "content_en": content_en,
        "generated_at": latest_risk.computed_at.isoformat() if latest_risk.computed_at else None,
        "is_template": True,
    }
