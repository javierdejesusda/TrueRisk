"""Personalized safety suggestions -- streaming OpenAI completions."""

from __future__ import annotations

import logging
from typing import AsyncIterator

from openai import AsyncOpenAI

from app.config import settings
from app.models.user import User

logger = logging.getLogger(__name__)

_client: AsyncOpenAI | None = None


def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(api_key=settings.openai_api_key)
    return _client


SUGGESTIONS_PROMPT = """\
You are a personal safety advisor for TrueRisk, a natural disaster risk \
assessment platform for Spain. Given the user's profile and current risk \
conditions for their province, generate 3-5 personalized safety \
recommendations.

Rules:
- Write in the requested language (Spanish or English).
- Use ## for each recommendation title.
- Each recommendation must explain WHY it applies to this specific user.
- Be specific to the user's residence type, needs, mobility, and situation.
- Keep total response under 300 words.
- Only reference data provided in the context.
"""


async def stream_personalized_suggestions(
    user: User,
    context: dict,
    locale: str = "es",
) -> AsyncIterator[str]:
    """Yield markdown chunks of personalized safety suggestions."""
    client = _get_client()
    lang = "Spanish" if locale == "es" else "English"

    user_context = (
        f"User Profile:\n"
        f"- Province: {context.get('province_name', 'Unknown')}\n"
        f"- Residence: {user.residence_type}\n"
        f"- Special needs: {', '.join(user.special_needs) if isinstance(user.special_needs, list) else 'none'}\n"
        f"- Mobility: {user.mobility_level}\n"
        f"- Has vehicle: {user.has_vehicle}\n"
        f"- Medical conditions: {user.medical_conditions or 'none'}\n"
    )

    risk_context = (
        f"\nCurrent Conditions:\n"
        f"Language: {lang}\n\n"
        f"Weather: {context.get('weather')}\n\n"
        f"Risk Scores: {context.get('risk_scores')}\n\n"
        f"Active Alerts: {context.get('alerts')}\n"
    )

    messages = [
        {"role": "system", "content": SUGGESTIONS_PROMPT},
        {"role": "user", "content": user_context + risk_context},
    ]

    try:
        async with client.chat.completions.stream(
            model=settings.openai_model,
            messages=messages,
            max_tokens=600,
            temperature=0.4,
        ) as stream:
            async for event in stream:
                if event.type == "content.delta":
                    yield event.delta
    except (AttributeError, TypeError):
        response = await client.chat.completions.create(
            model=settings.openai_model,
            messages=messages,
            max_tokens=600,
            temperature=0.4,
            stream=True,
        )
        async for chunk in response:
            if chunk.choices and chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content
