"""Compute profile completion percentage by weighted sections."""
from __future__ import annotations

from typing import Any


SECTIONS = {
    "location": {
        "weight": 0.20,
        "fields": ["province_code", "home_latitude", "home_longitude"],
    },
    "residence": {
        "weight": 0.15,
        "fields": ["residence_type", "floor_level", "construction_year", "building_materials", "building_condition"],
    },
    "health": {
        "weight": 0.20,
        "fields": ["age_range", "mobility_level", "medical_conditions", "has_ac"],
    },
    "household": {
        "weight": 0.15,
        "fields": ["household_members", "pet_details"],
    },
    "emergency": {
        "weight": 0.15,
        "fields": ["emergency_contact_name", "emergency_contact_phone", "phone_number"],
    },
    "building": {
        "weight": 0.10,
        "fields": ["building_stories", "has_basement", "has_elevator"],
    },
    "economic": {
        "weight": 0.05,
        "fields": ["has_property_insurance", "has_emergency_savings"],
    },
}


def compute_profile_completion(user_dict: dict[str, Any]) -> dict:
    """Compute weighted profile completion percentage.

    Returns dict with 'total' (0-100) and 'sections' mapping section names to percentages.
    """
    sections = {}
    total = 0.0
    for section, cfg in SECTIONS.items():
        filled = sum(1 for f in cfg["fields"] if user_dict.get(f) is not None)
        pct = filled / len(cfg["fields"]) if cfg["fields"] else 0
        sections[section] = round(pct * 100)
        total += pct * cfg["weight"]
    return {"total": round(total * 100), "sections": sections}
