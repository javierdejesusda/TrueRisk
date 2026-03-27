"""Alert intelligence service -- smart filtering, relevance scoring, explainability."""

from __future__ import annotations

import logging
from datetime import datetime

from app.utils.time import utcnow

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.alert import Alert
from app.models.alert_preference import AlertDelivery, AlertPreference
from app.models.province import Province
from app.models.user import User
from app.schemas.alert_preference import (
    AlertExplanation,
    AlertPreferenceResponse,
    AlertPreferenceUpdate,
)

logger = logging.getLogger(__name__)

# Province adjacency map (simplified: same region = adjacent)
# A production version would use actual geographic adjacency
_REGION_PROVINCES: dict[str, list[str]] | None = None


def _is_in_quiet_hours(prefs: AlertPreference) -> bool:
    """Check if the current time falls within the user's quiet hours."""
    if not prefs.quiet_hours_start or not prefs.quiet_hours_end:
        return False

    now = utcnow()
    current_time = now.strftime("%H:%M")
    start = prefs.quiet_hours_start
    end = prefs.quiet_hours_end

    if start <= end:
        return start <= current_time <= end
    else:
        # Overnight range (e.g., 23:00 - 07:00)
        return current_time >= start or current_time <= end


def _is_hazard_snoozed(prefs: AlertPreference, hazard_type: str) -> bool:
    """Check if a hazard type is currently snoozed."""
    if not prefs.snoozed_hazards:
        return False
    snooze_until = prefs.snoozed_hazards.get(hazard_type)
    if not snooze_until:
        return False
    try:
        until = datetime.fromisoformat(snooze_until)
        return utcnow() < until
    except (ValueError, TypeError):
        return False


def should_deliver(alert: Alert, user: User, prefs: AlertPreference | None) -> bool:
    """Decide whether an alert should be delivered to this user."""
    if prefs is None:
        return alert.severity >= user.alert_severity_threshold

    # Emergency override: severity 4+ always breaks through
    is_emergency = alert.severity >= 4 and prefs.emergency_override
    if is_emergency:
        return True

    # Check severity threshold
    if alert.severity < user.alert_severity_threshold:
        return False

    # Check quiet hours
    if _is_in_quiet_hours(prefs):
        return False

    # Check snoozed hazards
    if _is_hazard_snoozed(prefs, alert.hazard_type):
        return False

    return True


def compute_relevance(
    alert: Alert, user: User, province: Province | None
) -> float:
    """Compute a 0-1 relevance score for an alert relative to a user."""
    score = 0.0

    # Same province: +0.5
    if alert.province_code == user.province_code:
        score += 0.5
    else:
        # Rough proximity: same region gives some relevance
        if province and hasattr(alert, "province_code"):
            score += 0.1

    # Hazard matches user preferences
    if isinstance(user.hazard_preferences, list):
        if alert.hazard_type in user.hazard_preferences:
            score += 0.15
        elif not user.hazard_preferences:
            score += 0.10

    # Severity contribution
    score += (alert.severity / 5.0) * 0.25

    # Personal vulnerability boost
    if hasattr(user, 'age_range') or hasattr(user, 'mobility_level'):
        from app.services.personal_vulnerability_service import compute_personal_vulnerability
        user_profile = {
            "age": getattr(user, 'age_range', '18-64'),
            "floor_level": getattr(user, 'floor_level', None),
            "mobility_level": getattr(user, 'mobility_level', 'full'),
            "has_ac": getattr(user, 'has_ac', True),
            "medical_conditions": getattr(user, 'medical_conditions', ''),
        }
        _, vuln_factors = compute_personal_vulnerability(
            user_profile, alert.hazard_type or "", alert.severity * 20
        )
        if vuln_factors:
            score += 0.1 * min(len(vuln_factors), 3)

    # Active alert bonus
    if alert.is_active:
        score += 0.1

    return min(score, 1.0)


def explain_alert(
    alert: Alert, user: User, province: Province | None
) -> AlertExplanation:
    """Generate a human-readable explanation of why an alert was delivered."""
    factors: list[str] = []
    relevance = compute_relevance(alert, user, province)

    if alert.province_code == user.province_code:
        province_name = province.name if province else alert.province_code
        factors.append(f"Affects your province ({province_name})")
    else:
        factors.append(f"Nearby province ({alert.province_code})")

    factors.append(f"Severity: {alert.severity}/5")

    if isinstance(user.hazard_preferences, list) and alert.hazard_type in user.hazard_preferences:
        factors.append(f"Matches your tracked hazard: {alert.hazard_type}")

    if province:
        weight_map = {
            "flood": province.flood_risk_weight,
            "wildfire": province.wildfire_risk_weight,
            "drought": province.drought_risk_weight,
            "heatwave": province.heatwave_risk_weight,
            "seismic": province.seismic_risk_weight,
            "coldwave": province.coldwave_risk_weight,
            "windstorm": province.windstorm_risk_weight,
        }
        w = weight_map.get(alert.hazard_type, 0.0)
        if w >= 0.5:
            factors.append(f"High {alert.hazard_type} risk weight in your province")

    reason = factors[0] if factors else "General alert for your region"

    return AlertExplanation(
        alert_id=alert.id,
        reason=reason,
        relevance_score=round(relevance, 2),
        factors=factors,
    )


async def get_or_create_preferences(
    db: AsyncSession, user_id: int
) -> AlertPreference:
    """Return user's alert preferences, creating defaults if needed."""
    result = await db.execute(
        select(AlertPreference).where(AlertPreference.user_id == user_id)
    )
    prefs = result.scalar_one_or_none()
    if prefs is None:
        prefs = AlertPreference(user_id=user_id)
        db.add(prefs)
        await db.commit()
        await db.refresh(prefs)
    return prefs


async def update_preferences(
    db: AsyncSession, user_id: int, data: AlertPreferenceUpdate
) -> AlertPreferenceResponse:
    """Update user's alert preferences."""
    prefs = await get_or_create_preferences(db, user_id)

    update_fields = data.model_dump(exclude_unset=True)
    for field, value in update_fields.items():
        setattr(prefs, field, value)

    await db.commit()
    await db.refresh(prefs)

    return AlertPreferenceResponse(
        quiet_hours_start=prefs.quiet_hours_start,
        quiet_hours_end=prefs.quiet_hours_end,
        emergency_override=prefs.emergency_override,
        batch_interval_minutes=prefs.batch_interval_minutes,
        escalation_enabled=prefs.escalation_enabled,
        snoozed_hazards=prefs.snoozed_hazards or {},
    )


async def mark_alert_read(
    db: AsyncSession, user_id: int, alert_id: int
) -> None:
    """Record that a user has read an alert."""
    result = await db.execute(
        select(AlertDelivery).where(
            AlertDelivery.user_id == user_id,
            AlertDelivery.alert_id == alert_id,
        )
    )
    delivery = result.scalar_one_or_none()

    now = utcnow()
    if delivery is None:
        delivery = AlertDelivery(
            user_id=user_id,
            alert_id=alert_id,
            channel="web",
            read_at=now,
        )
        db.add(delivery)
    else:
        delivery.read_at = now

    await db.commit()
