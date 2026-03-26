"""Tests for municipality risk disaggregation."""

from __future__ import annotations

from dataclasses import dataclass
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.services.municipality_risk_service import (
    MunicipalityRisk,
    _classify_severity,
    _coastal_modifier,
    _elevation_modifier,
    _population_modifier,
    disaggregate_province_risk,
)


# ---------------------------------------------------------------------------
# Elevation modifier tests
# ---------------------------------------------------------------------------

def test_elevation_flood_low():
    assert _elevation_modifier(30, "flood") == 1.2


def test_elevation_flood_mid():
    assert _elevation_modifier(100, "flood") == 1.05


def test_elevation_flood_high():
    assert _elevation_modifier(1000, "flood") == 0.8


def test_elevation_heatwave_low():
    assert _elevation_modifier(100, "heatwave") == 1.1


def test_elevation_heatwave_mountain():
    assert _elevation_modifier(1200, "heatwave") == 0.85


def test_elevation_wildfire_mid():
    assert _elevation_modifier(500, "wildfire") == 1.1


def test_elevation_wildfire_low():
    """Low elevation wildfire gets no modifier."""
    assert _elevation_modifier(100, "wildfire") == 1.0


def test_elevation_coldwave_high():
    assert _elevation_modifier(1100, "coldwave") == 1.2


def test_elevation_coldwave_mid():
    assert _elevation_modifier(700, "coldwave") == 1.1


def test_elevation_windstorm_high():
    assert _elevation_modifier(900, "windstorm") == 1.1


def test_elevation_none():
    assert _elevation_modifier(None, "flood") == 1.0


def test_elevation_dana_low():
    """Very low elevation amplifies DANA risk."""
    assert _elevation_modifier(30, "dana") == 1.25


def test_elevation_dana_mid_low():
    assert _elevation_modifier(100, "dana") == 1.1


def test_elevation_dana_high():
    """High elevation dampens DANA risk."""
    assert _elevation_modifier(900, "dana") == 0.7


def test_elevation_dana_neutral():
    """Mid-elevation gets no DANA modifier."""
    assert _elevation_modifier(400, "dana") == 1.0


# ---------------------------------------------------------------------------
# Coastal modifier tests
# ---------------------------------------------------------------------------

def test_coastal_flood():
    assert _coastal_modifier(True, "flood") == 1.15


def test_coastal_heatwave():
    assert _coastal_modifier(True, "heatwave") == 0.9


def test_coastal_wildfire():
    assert _coastal_modifier(True, "wildfire") == 0.95


def test_coastal_windstorm():
    assert _coastal_modifier(True, "windstorm") == 1.1


def test_coastal_dana():
    """DANA is amplified for coastal municipalities."""
    assert _coastal_modifier(True, "dana") == 1.2


def test_inland_no_modifier():
    assert _coastal_modifier(False, "flood") == 1.0


def test_coastal_seismic_no_modifier():
    """Seismic hazard has no coastal modifier."""
    assert _coastal_modifier(True, "seismic") == 1.0


def test_coastal_drought_no_modifier():
    """Drought has no coastal modifier."""
    assert _coastal_modifier(True, "drought") == 1.0


# ---------------------------------------------------------------------------
# Population modifier tests
# ---------------------------------------------------------------------------

def test_population_drought_high_density():
    """High density amplifies drought risk."""
    assert _population_modifier(200000, 100, "drought") == 1.15


def test_population_drought_medium_density():
    assert _population_modifier(60000, 100, "drought") == 1.05


def test_population_drought_low_density():
    assert _population_modifier(10000, 100, "drought") == 1.0


def test_population_heatwave_high_density():
    """Urban heat island amplifies heatwave."""
    assert _population_modifier(200000, 100, "heatwave") == 1.1


def test_population_heatwave_medium_density():
    assert _population_modifier(60000, 100, "heatwave") == 1.05


def test_population_flood_no_modifier():
    """Flood risk is not population-density sensitive."""
    assert _population_modifier(200000, 100, "flood") == 1.0


def test_population_none_values():
    assert _population_modifier(None, 100, "drought") == 1.0
    assert _population_modifier(10000, None, "drought") == 1.0


def test_population_zero_area():
    assert _population_modifier(10000, 0, "drought") == 1.0


# ---------------------------------------------------------------------------
# Severity classification tests
# ---------------------------------------------------------------------------

def test_classify_critical():
    assert _classify_severity(80) == "critical"
    assert _classify_severity(95) == "critical"


def test_classify_high():
    assert _classify_severity(60) == "high"
    assert _classify_severity(79.9) == "high"


def test_classify_moderate():
    assert _classify_severity(40) == "moderate"
    assert _classify_severity(59.9) == "moderate"


def test_classify_low():
    assert _classify_severity(20) == "low"
    assert _classify_severity(39.9) == "low"


def test_classify_minimal():
    assert _classify_severity(0) == "minimal"
    assert _classify_severity(19.9) == "minimal"


# ---------------------------------------------------------------------------
# Per-hazard disaggregation integration tests
# ---------------------------------------------------------------------------

def _make_municipality(
    ine_code="28079",
    name="Madrid",
    province_code="28",
    latitude=40.4,
    longitude=-3.7,
    population=3300000,
    area_km2=604.0,
    elevation_m=650.0,
    is_coastal=False,
    land_use_type=None,
    distance_river_km=None,
    elderly_pct=None,
):
    """Create a mock Municipality object."""
    m = MagicMock()
    m.ine_code = ine_code
    m.name = name
    m.province_code = province_code
    m.latitude = latitude
    m.longitude = longitude
    m.population = population
    m.area_km2 = area_km2
    m.elevation_m = elevation_m
    m.is_coastal = is_coastal
    m.land_use_type = land_use_type
    m.distance_river_km = distance_river_km
    m.elderly_pct = elderly_pct
    return m


def _province_risk(**overrides):
    """Build a province-level risk dict with sensible defaults."""
    base = {
        "flood_score": 50.0,
        "wildfire_score": 40.0,
        "drought_score": 30.0,
        "heatwave_score": 45.0,
        "seismic_score": 20.0,
        "coldwave_score": 25.0,
        "windstorm_score": 35.0,
        "dana_score": 55.0,
        "composite_score": 55.0,
        "dominant_hazard": "dana",
    }
    base.update(overrides)
    return base


@pytest.mark.asyncio
async def test_per_hazard_scores_computed_independently():
    """Each hazard score is individually modified, not just the composite."""
    muni = _make_municipality(elevation_m=30, is_coastal=True, population=5000, area_km2=50)

    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [muni]
    db = AsyncMock()
    db.execute.return_value = mock_result

    province_risk = _province_risk(flood_score=50, wildfire_score=50, dana_score=50)
    results = await disaggregate_province_risk(db, "28", province_risk)

    assert len(results) == 1
    r = results[0]

    # Flood: low elevation (1.2) * coastal (1.15) * pop neutral (1.0) = 1.38 -> 69.0
    assert r.flood_score == round(min(100, 50 * 1.2 * 1.15 * 1.0), 1)

    # Wildfire: no elev mod at 30m (1.0) * coastal (0.95) * pop neutral (1.0) = 0.95 -> 47.5
    assert r.wildfire_score == round(min(100, 50 * 1.0 * 0.95 * 1.0), 1)

    # DANA: low elev (1.25) * coastal (1.2) * pop neutral (1.0) = 1.5 -> 75.0
    assert r.dana_score == round(min(100, 50 * 1.25 * 1.2 * 1.0), 1)

    # Scores differ because modifiers are per-hazard
    assert r.flood_score != r.wildfire_score
    assert r.dana_score != r.flood_score


@pytest.mark.asyncio
async def test_coastal_amplifies_flood_dampens_wildfire():
    """Coastal municipalities get amplified flood/dana and dampened wildfire."""
    coastal = _make_municipality(is_coastal=True, elevation_m=300, population=1000, area_km2=10)

    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [coastal]
    db = AsyncMock()
    db.execute.return_value = mock_result

    province_risk = _province_risk(flood_score=60, wildfire_score=60, dana_score=60)
    results = await disaggregate_province_risk(db, "28", province_risk)
    r = results[0]

    # Coastal: flood amplified, wildfire dampened
    assert r.flood_score > 60  # 60 * 1.0 * 1.15 = 69.0
    assert r.wildfire_score < 60  # 60 * 1.0 * 0.95 = 57.0
    assert r.dana_score > 60  # 60 * 1.0 * 1.2 = 72.0


@pytest.mark.asyncio
async def test_high_elevation_dampens_flood_amplifies_coldwave():
    """High elevation dampens flood but amplifies coldwave."""
    mountain = _make_municipality(elevation_m=1100, is_coastal=False, population=500, area_km2=100)

    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [mountain]
    db = AsyncMock()
    db.execute.return_value = mock_result

    province_risk = _province_risk(flood_score=50, coldwave_score=50)
    results = await disaggregate_province_risk(db, "28", province_risk)
    r = results[0]

    # High elevation: flood dampened (0.8), coldwave amplified (1.2)
    assert r.flood_score < 50  # 50 * 0.8 = 40.0
    assert r.coldwave_score > 50  # 50 * 1.2 = 60.0


@pytest.mark.asyncio
async def test_population_density_amplifies_drought_heatwave():
    """High pop density amplifies drought and heatwave via urban effects."""
    dense = _make_municipality(
        population=200000, area_km2=50, elevation_m=300, is_coastal=False,
    )
    # density = 200000/50 = 4000 > 1000

    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [dense]
    db = AsyncMock()
    db.execute.return_value = mock_result

    province_risk = _province_risk(drought_score=40, heatwave_score=40, flood_score=40)
    results = await disaggregate_province_risk(db, "28", province_risk)
    r = results[0]

    # Drought: pop mod 1.15 -> 46.0; Heatwave: pop mod 1.1 -> 44.0; Flood: pop mod 1.0 -> 40.0
    assert r.drought_score > 40
    assert r.heatwave_score > 40
    assert r.flood_score == 40.0  # No pop modifier for flood


@pytest.mark.asyncio
async def test_composite_is_max_of_hazard_scores():
    """Composite score should be the maximum of all per-hazard scores."""
    muni = _make_municipality(elevation_m=30, is_coastal=True, population=1000, area_km2=50)

    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [muni]
    db = AsyncMock()
    db.execute.return_value = mock_result

    province_risk = _province_risk(
        flood_score=10, wildfire_score=20, drought_score=15,
        heatwave_score=5, seismic_score=10, coldwave_score=5,
        windstorm_score=10, dana_score=80,
    )
    results = await disaggregate_province_risk(db, "28", province_risk)
    r = results[0]

    all_scores = [
        r.flood_score, r.wildfire_score, r.drought_score,
        r.heatwave_score, r.seismic_score, r.coldwave_score,
        r.windstorm_score, r.dana_score,
    ]
    assert r.composite_score == max(all_scores)


@pytest.mark.asyncio
async def test_dominant_hazard_is_highest_scorer():
    """Dominant hazard should be the hazard with the highest adjusted score."""
    muni = _make_municipality(elevation_m=30, is_coastal=True, population=1000, area_km2=50)

    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [muni]
    db = AsyncMock()
    db.execute.return_value = mock_result

    # DANA has highest base and strongest modifiers at low coastal
    province_risk = _province_risk(
        flood_score=10, wildfire_score=5, drought_score=5,
        heatwave_score=5, seismic_score=5, coldwave_score=5,
        windstorm_score=5, dana_score=70,
    )
    results = await disaggregate_province_risk(db, "28", province_risk)
    r = results[0]

    # DANA adjusted: 70 * 1.25 * 1.2 = 105 -> capped at 100
    assert r.dominant_hazard == "dana"
    assert r.dana_score == 100.0


@pytest.mark.asyncio
async def test_scores_clamped_to_0_100():
    """Scores should never exceed 100 or go below 0."""
    muni = _make_municipality(elevation_m=30, is_coastal=True, population=200000, area_km2=50)

    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [muni]
    db = AsyncMock()
    db.execute.return_value = mock_result

    province_risk = _province_risk(dana_score=95)
    results = await disaggregate_province_risk(db, "28", province_risk)
    r = results[0]

    # 95 * 1.25 * 1.2 = 142.5 -> capped at 100
    assert r.dana_score == 100.0

    # All scores within bounds
    all_scores = [
        r.flood_score, r.wildfire_score, r.drought_score,
        r.heatwave_score, r.seismic_score, r.coldwave_score,
        r.windstorm_score, r.dana_score,
    ]
    for s in all_scores:
        assert 0 <= s <= 100


@pytest.mark.asyncio
async def test_empty_municipalities_returns_empty():
    """Province with no municipalities returns empty list."""
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = []
    db = AsyncMock()
    db.execute.return_value = mock_result

    results = await disaggregate_province_risk(db, "99", _province_risk())
    assert results == []


@pytest.mark.asyncio
async def test_modifiers_detail_per_hazard():
    """Modifiers dict has per-hazard breakdown with elevation, coastal, population, combined."""
    muni = _make_municipality(elevation_m=30, is_coastal=True, population=200000, area_km2=50)

    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [muni]
    db = AsyncMock()
    db.execute.return_value = mock_result

    results = await disaggregate_province_risk(db, "28", _province_risk())
    r = results[0]

    # Modifiers should have a key for each hazard
    for hazard in ["flood", "wildfire", "drought", "heatwave", "seismic", "coldwave", "windstorm", "dana"]:
        assert hazard in r.modifiers
        detail = r.modifiers[hazard]
        assert "elevation" in detail
        assert "coastal" in detail
        assert "population" in detail
        assert "combined" in detail


@pytest.mark.asyncio
async def test_severity_matches_composite():
    """Severity label should match the composite score."""
    muni = _make_municipality(elevation_m=300, is_coastal=False, population=1000, area_km2=100)

    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [muni]
    db = AsyncMock()
    db.execute.return_value = mock_result

    # Province risk where all scores are moderate
    province_risk = _province_risk(
        flood_score=45, wildfire_score=10, drought_score=10,
        heatwave_score=10, seismic_score=10, coldwave_score=10,
        windstorm_score=10, dana_score=10,
    )
    results = await disaggregate_province_risk(db, "28", province_risk)
    r = results[0]

    assert r.severity == _classify_severity(r.composite_score)


@pytest.mark.asyncio
async def test_missing_province_hazard_score_defaults_to_zero():
    """If province risk dict is missing a hazard key, score defaults to 0."""
    muni = _make_municipality()

    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [muni]
    db = AsyncMock()
    db.execute.return_value = mock_result

    # Sparse province risk with only flood defined
    province_risk = {"flood_score": 50.0}
    results = await disaggregate_province_risk(db, "28", province_risk)
    r = results[0]

    assert r.wildfire_score == 0.0
    assert r.drought_score == 0.0
    assert r.seismic_score == 0.0
    assert r.dana_score == 0.0
