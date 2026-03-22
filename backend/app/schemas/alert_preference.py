from __future__ import annotations

from pydantic import BaseModel


class AlertPreferenceResponse(BaseModel):
    quiet_hours_start: str | None
    quiet_hours_end: str | None
    emergency_override: bool
    batch_interval_minutes: int
    escalation_enabled: bool
    snoozed_hazards: dict


class AlertPreferenceUpdate(BaseModel):
    quiet_hours_start: str | None = None
    quiet_hours_end: str | None = None
    emergency_override: bool | None = None
    batch_interval_minutes: int | None = None
    escalation_enabled: bool | None = None
    snoozed_hazards: dict | None = None


class AlertExplanation(BaseModel):
    alert_id: int
    reason: str
    relevance_score: float
    factors: list[str]
