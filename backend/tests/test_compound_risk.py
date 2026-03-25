"""Tests for compound hazard cascading."""
from app.services.compound_risk_service import apply_compound_amplifiers


def test_drought_amplifies_wildfire():
    scores = {"drought": 60, "wildfire": 40, "flood": 20}
    features = {"consecutive_dry_days": 25}
    modified, chains = apply_compound_amplifiers(scores, features)
    assert modified["wildfire"] == 52.0  # 40 * 1.3
    assert "drought_amplifies_wildfire" in chains


def test_post_fire_amplifies_flood():
    scores = {"drought": 70, "wildfire": 65, "flood": 30}
    features = {"consecutive_dry_days": 30, "active_fires_nearby": True}
    modified, chains = apply_compound_amplifiers(scores, features)
    assert modified["flood"] > 30
    assert "post_fire_amplifies_flood" in chains


def test_drought_amplifies_flash_flood():
    scores = {"drought": 70, "wildfire": 20, "flood": 40}
    features = {"consecutive_dry_days": 5}
    modified, chains = apply_compound_amplifiers(scores, features)
    assert modified["flood"] == 56.0  # 40 * 1.4
    assert "drought_amplifies_flash_flood" in chains


def test_no_amplification_when_below_thresholds():
    scores = {"drought": 30, "wildfire": 40, "flood": 20}
    features = {"consecutive_dry_days": 5}
    modified, chains = apply_compound_amplifiers(scores, features)
    assert modified == scores
    assert chains == []


def test_multiple_chains_stack():
    scores = {"drought": 70, "wildfire": 65, "flood": 30}
    features = {"consecutive_dry_days": 25, "active_fires_nearby": True}
    modified, chains = apply_compound_amplifiers(scores, features)
    assert len(chains) >= 2
    assert modified["wildfire"] > 65  # drought amplifies
    assert modified["flood"] > 30  # both post-fire and drought amplify


def test_scores_capped_at_100():
    scores = {"drought": 90, "wildfire": 85, "flood": 80}
    features = {"consecutive_dry_days": 30, "active_fires_nearby": True}
    modified, _ = apply_compound_amplifiers(scores, features)
    assert all(v <= 100.0 for v in modified.values())
