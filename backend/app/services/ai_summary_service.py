"""AI weather summary service -- streaming OpenAI completions."""

from __future__ import annotations

import logging
from typing import AsyncIterator

from openai import AsyncOpenAI

from app.config import settings

logger = logging.getLogger(__name__)

_client: AsyncOpenAI | None = None


def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(api_key=settings.openai_api_key)
    return _client


SYSTEM_PROMPT = """\
You are a meteorological risk analyst for TrueRisk, a natural disaster risk \
assessment platform for Spain. Given current weather data, risk scores, \
and active alerts for a Spanish province, produce a concise weather summary \
and actionable risk suggestions in Markdown.

Rules:
- Write in the requested language (Spanish or English).
- Use ## headings, bullet points, and **bold** for key figures.
- Include "Current Conditions" and "Risk Assessment" sections.
- End with 2-3 specific, actionable recommendations.
- Keep total response under 400 words.
- Only reference data provided in the context.
"""


async def stream_weather_summary(
    context: dict,
    locale: str = "es",
    user_profile: dict | None = None,
) -> AsyncIterator[str]:
    """Yield markdown chunks from OpenAI streaming completion."""
    client = _get_client()
    lang = "Spanish" if locale == "es" else "English"

    system_prompt = SYSTEM_PROMPT
    if user_profile:
        system_prompt += (
            "\n\nThe user has the following profile. "
            "Tailor your recommendations to their specific situation:\n"
            f"- Residence type: {user_profile.get('residence_type', 'unknown')}\n"
            f"- Special needs: {', '.join(user_profile.get('special_needs', [])) or 'none'}\n"
            f"- Mobility level: {user_profile.get('mobility_level', 'full')}\n"
            f"- Has vehicle: {user_profile.get('has_vehicle', False)}\n"
            f"- Medical conditions: {user_profile.get('medical_conditions') or 'none'}\n"
        )

    user_message = (
        f"Language: {lang}\n\n"
        f"Province: {context.get('province_name', 'Unknown')} "
        f"({context.get('province_code', '')})\n\n"
        f"Weather: {context.get('weather')}\n\n"
        f"Risk Scores: {context.get('risk_scores')}\n\n"
        f"Active Alerts: {context.get('alerts')}\n"
    )

    messages: list[dict[str, str]] = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_message},
    ]

    try:
        async with client.chat.completions.stream(
            model=settings.openai_model,
            messages=messages,  # type: ignore[arg-type]
            max_completion_tokens=800,
            temperature=0.3,
        ) as stream:
            async for event in stream:
                if event.type == "content.delta":
                    yield event.delta
    except (AttributeError, TypeError):
        logger.info("Falling back to standard streaming API")
        response = await client.chat.completions.create(
            model=settings.openai_model,
            messages=messages,  # type: ignore[arg-type]
            max_completion_tokens=800,
            temperature=0.3,
            stream=True,
        )
        async for chunk in response:  # type: ignore[union-attr]
            if chunk.choices and chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content
