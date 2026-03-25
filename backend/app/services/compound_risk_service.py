"""Compound hazard cascading — models how hazards amplify each other.

Spain's Mediterranean climate creates cascading hazards:
- Drought dries soil → wildfire risk increases
- Wildfire burns vegetation → hydrophobic soil amplifies flash floods
- Prolonged drought → soil becomes hydrophobic → flash flood risk increases
"""
from __future__ import annotations

from typing import Any


COMPOUND_CHAINS = [
    {
        "name": "drought_amplifies_wildfire",
        "condition": lambda s, f: s.get("drought", 0) > 50 and f.get("consecutive_dry_days", 0) > 20,
        "target": "wildfire",
        "amplifier": 1.3,
    },
    {
        "name": "post_fire_amplifies_flood",
        "condition": lambda s, f: s.get("wildfire", 0) > 60 and f.get("active_fires_nearby", False),
        "target": "flood",
        "amplifier": 1.5,
    },
    {
        "name": "drought_amplifies_flash_flood",
        "condition": lambda s, f: s.get("drought", 0) > 60,
        "target": "flood",
        "amplifier": 1.4,
    },
]


def apply_compound_amplifiers(
    scores: dict[str, float], features: dict[str, Any]
) -> tuple[dict[str, float], list[str]]:
    """Apply compound hazard cascading amplifiers to individual risk scores.

    Returns (modified_scores, list_of_active_chain_names).
    Scores are capped at 100.
    """
    modified = dict(scores)
    active_chains: list[str] = []
    for chain in COMPOUND_CHAINS:
        if chain["condition"](scores, features):
            target = chain["target"]
            modified[target] = min(100.0, modified.get(target, 0) * chain["amplifier"])
            active_chains.append(chain["name"])
    return modified, active_chains
