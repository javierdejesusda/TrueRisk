from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class HouseholdMember(BaseModel):
    name: str
    age: int | None = None
    needs: str | None = None
    medications: str | None = None


class MeetingPoint(BaseModel):
    name: str
    address: str | None = None
    lat: float | None = None
    lon: float | None = None
    notes: str | None = None


class EmergencyContact(BaseModel):
    name: str
    phone: str
    role: str | None = None
    priority: int = 1


class EmergencyPlanResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    household_members: list[HouseholdMember]
    meeting_points: list[MeetingPoint]
    communication_plan: list[EmergencyContact]
    evacuation_notes: str | None
    insurance_info: dict | None
    pet_info: list[dict] | None
    important_documents: list[dict] | None
    last_reviewed_at: datetime | None
    created_at: datetime
    updated_at: datetime


class EmergencyPlanUpdate(BaseModel):
    household_members: list[HouseholdMember] | None = None
    meeting_points: list[MeetingPoint] | None = None
    communication_plan: list[EmergencyContact] | None = None
    evacuation_notes: str | None = None
    insurance_info: dict | None = None
    pet_info: list[dict] | None = None
    important_documents: list[dict] | None = None
