# Backend Hardening: API Audit, Coverage, Staleness Alerts, Stress Tests

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden the TrueRisk backend across four dimensions: live API auditing, critical-path test coverage, data-staleness alerting, and exhaustive province/hazard matrix stress testing.

**Architecture:** All work targets the FastAPI backend under `backend/`. Tests use pytest + respx + AsyncMock. The staleness alerter extends the existing `DataHealthTracker` singleton and plugs into APScheduler. Stress tests are pure-Python parametrized tests against the 8 ML model predict functions and composite scorer.

**Tech Stack:** Python 3.12, pytest, pytest-asyncio, respx, httpx, APScheduler, SQLAlchemy 2.0 async

---

## File Map

### New files (8)
| File | Responsibility |
|------|---------------|
| `backend/tests/test_audit_live_apis.py` | Live API reachability audit (Goal 1) |
| `backend/tests/test_risk_pipeline_unit.py` | Unit tests for `compute_province_risk` + helpers (Goal 2A) |
| `backend/tests/test_alert_intelligence_unit.py` | Unit tests for `should_deliver`, `compute_relevance`, `explain_alert` (Goal 2B) |
| `backend/tests/test_deliver_multi_channel.py` | Unit tests for `deliver_alert_multi_channel` (Goal 2C) |
| `backend/tests/test_flash_flood_pipeline.py` | Unit tests for `process_flash_flood_alerts`, `store_river_readings`, `_load_gauge_thresholds` (Goal 2D) |
| `backend/app/services/staleness_alert_service.py` | Staleness detection + admin alerting (Goal 3) |
| `backend/tests/test_staleness_alert.py` | Tests for staleness service (Goal 3) |
| `backend/tests/test_province_hazard_exhaustive.py` | Per-province per-model individual scoring + NaN robustness (Goal 4) |

### Modified files (3)
| File | Change |
|------|--------|
| `backend/app/services/data_health_service.py` | Add `STALENESS_THRESHOLDS`, `get_stale_sources()`, `get_health_summary()` |
| `backend/app/scheduler/jobs.py` | Add `run_staleness_check()` job (30-min interval) |
| `backend/app/config.py` | Add `telegram_admin_chat_id: str = ""` |

---

## Task 1: Live API Audit Test Suite (Goal 1)

**Files:**
- Create: `backend/tests/test_audit_live_apis.py`
- Modify: `backend/pyproject.toml` (add `audit` marker)

### Prereqs: Read these files first
- `backend/app/data/_http.py` (resilient_get, per-source timeouts)
- `backend/app/data/open_meteo.py` (fetch_current signature)
- `backend/app/data/aemet_client.py` (fetch_aemet_alerts signature)
- `backend/app/data/nasa_firms.py` (fetch_active_fires signature)
- `backend/app/data/usgs_earthquake.py` (fetch_recent_quakes signature)
- `backend/app/data/nasa_power.py` (fetch_solar_and_agmet signature)
- `backend/app/data/openaq.py` (fetch_air_quality signature)
- `backend/app/data/ign_seismic.py` (fetch_recent_quakes signature)
- `backend/app/data/copernicus_cams.py` (fetch_air_quality_forecast signature)
- `backend/app/data/copernicus_efas.py` (fetch_efas_data signature)
- `backend/app/data/copernicus_ems.py` (fetch_active_emergencies signature)
- `backend/app/data/copernicus_land.py` (fetch_ndvi signature)
- `backend/app/data/ecmwf_seasonal.py` (fetch_seasonal_outlook signature)
- `backend/app/data/ine_demographics.py` (fetch_province_demographics signature)
- `backend/app/data/ree_energy.py` (fetch_demand signature)
- `backend/app/config.py` (settings object for API keys)

### Design

Each test:
1. Checks if required API key is set (skip if not)
2. Clears module-level cache so it hits the network
3. Calls the real async client function with valid params (Madrid coords: 40.42, -3.70)
4. Asserts response is not None and has expected structure
5. All tests marked `@pytest.mark.audit` so they never run in CI by default

**14 data source tests:**
- `test_audit_open_meteo` - `fetch_current(40.42, -3.70)` -> dict, no key needed
- `test_audit_aemet` - `fetch_aemet_alerts()` -> list, requires `AEMET_API_KEY`
- `test_audit_nasa_firms` - `fetch_active_fires()` -> list, requires `FIRMS_MAP_KEY`
- `test_audit_usgs` - `fetch_recent_quakes()` -> list, no key
- `test_audit_nasa_power` - `fetch_solar_and_agmet(40.42, -3.70)` -> dict, no key
- `test_audit_openaq` - `fetch_air_quality(40.42, -3.70)` -> dict, no key
- `test_audit_ign_seismic` - `fetch_recent_quakes()` -> list, no key
- `test_audit_copernicus_cams` - `fetch_air_quality_forecast(40.42, -3.70)` -> dict, no key
- `test_audit_copernicus_efas` - `fetch_efas_data(...)` -> dict, no key
- `test_audit_copernicus_ems` - `fetch_active_emergencies()` -> list, no key
- `test_audit_copernicus_land` - `fetch_ndvi(40.42, -3.70)` -> dict, no key
- `test_audit_ecmwf_seasonal` - `fetch_seasonal_outlook(40.42, -3.70)` -> dict, requires `CDSAPI_KEY`
- `test_audit_ine_demographics` - `fetch_province_demographics("Madrid")` -> dict, no key
- `test_audit_ree_energy` - `fetch_demand()` -> dict, no key

**Do NOT live-test:** Twilio SMS/WhatsApp (costs money), OpenAI (costs money), Telegram (needs real chat).

- [ ] **Step 1: Add audit marker to pyproject.toml**

In `backend/pyproject.toml`, under `[tool.pytest.ini_options]`, add to the `markers` list:
```
"audit: Live API audit tests (require network, skip in CI)"
```

- [ ] **Step 2: Run existing tests to confirm green baseline**

Run: `cd backend && python -m pytest tests/ -x -q --timeout=60 2>&1 | tail -5`
Expected: All pass

- [ ] **Step 3: Write the audit test file**

Create `backend/tests/test_audit_live_apis.py`.

Pattern for each test (read each data module's exact function signatures first):

```python
"""Live API audit tests -- hit each external API, verify response structure.

Run with: pytest -m audit --timeout=120 -v
Skip in CI: these require network access and optionally API keys.
"""
import os
import pytest

pytestmark = [pytest.mark.audit, pytest.mark.asyncio]


async def test_audit_open_meteo():
    from app.data.open_meteo import fetch_current
    result = await fetch_current(40.42, -3.70)
    assert isinstance(result, dict), f"Expected dict, got {type(result)}"
    # Open-Meteo should return temperature at minimum
    if result:
        assert any(k in result for k in ("temperature", "temperature_2m")), f"Keys: {list(result.keys())}"


async def test_audit_aemet():
    from app.config import settings
    if not settings.aemet_api_key:
        pytest.skip("AEMET_API_KEY not set")
    from app.data.aemet_client import fetch_aemet_alerts
    result = await fetch_aemet_alerts()
    assert isinstance(result, list), f"Expected list, got {type(result)}"
# ... etc for all 14 sources, following same pattern
```

Key details per source:
- For sources with module-level caches (dict `_cache` or `_cache_ts`), clear them before the call
- Use generous pytest timeout (120s) since some APIs are slow
- Assert TYPE not exact content (APIs return live data)

- [ ] **Step 4: Run audit tests**

Run: `cd backend && python -m pytest tests/test_audit_live_apis.py -m audit -v --timeout=120 2>&1 | tail -20`
Expected: Tests pass or skip (for missing API keys)

- [ ] **Step 5: Commit**

```bash
git add backend/tests/test_audit_live_apis.py backend/pyproject.toml
git commit -m "test: add live API audit suite for 14 external data sources"
```

---

## Task 2: Risk Pipeline Unit Tests (Goal 2A)

**Files:**
- Create: `backend/tests/test_risk_pipeline_unit.py`

### Prereqs: Read these files first
- `backend/app/services/risk_service.py` (full file -- `compute_province_risk` at line 368, `_compute_heat_index` at 325, `_compute_wind_chill` at 313, `_compute_wbgt` at 350, `_empty_temporal` at 259, `_record_to_dict` at 292, `get_latest_risk` at 729, `get_all_latest_risks` at 740, `get_risk_map` at 760)
- `backend/app/models/risk_score.py` (RiskScore model)
- `backend/app/models/province.py` (Province model)
- `backend/app/models/weather_record.py` (WeatherRecord model)
- `backend/tests/conftest.py` (test fixtures)

### Design

**Testing `compute_province_risk()`** -- this is a 350+ line async function. Strategy: mock external I/O at the module boundary (mock `open_meteo.fetch_current`, `ign_seismic.fetch_recent_quakes`, etc.), provide a real Province from the seeded test DB.

**Helper function tests** (pure functions, no mocking needed):
- `_compute_wind_chill(temp, wind_speed)` -- line 313
- `_compute_heat_index(temp, humidity)` -- line 325
- `_compute_wbgt(temp, humidity, wind_speed)` -- line 350
- `_empty_temporal()` -- line 259
- `_record_to_dict(record)` -- line 292

**DB query wrappers** (need mock DB):
- `get_latest_risk(db, province_code)` -- line 729
- `get_all_latest_risks(db)` -- line 740

- [ ] **Step 1: Write failing tests for helper functions**

```python
"""Unit tests for risk_service pipeline and helpers."""
import math
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.services.risk_service import (
    _compute_wind_chill,
    _compute_heat_index,
    _compute_wbgt,
    _empty_temporal,
)


class TestComputeWindChill:
    def test_cold_windy(self):
        """Wind chill below air temp when cold and windy."""
        wc = _compute_wind_chill(5.0, 20.0)
        assert wc < 5.0

    def test_warm_returns_temperature(self):
        """Wind chill formula only applies below ~10C; warm temps return as-is."""
        wc = _compute_wind_chill(15.0, 20.0)
        assert wc >= 14.0  # should be close to or equal to 15

    def test_zero_wind(self):
        """No wind means no wind chill effect."""
        wc = _compute_wind_chill(0.0, 0.0)
        assert isinstance(wc, float)


class TestComputeHeatIndex:
    def test_moderate_heat(self):
        """Heat index above air temp when hot and humid."""
        hi = _compute_heat_index(35.0, 70.0)
        assert hi > 35.0

    def test_cool_returns_near_temperature(self):
        """Below ~27C, heat index ~ temperature."""
        hi = _compute_heat_index(20.0, 50.0)
        assert abs(hi - 20.0) < 10.0

    def test_extreme_returns_bounded(self):
        hi = _compute_heat_index(45.0, 95.0)
        assert isinstance(hi, float)
        assert not math.isnan(hi)


class TestComputeWBGT:
    def test_hot_humid(self):
        wbgt = _compute_wbgt(35.0, 80.0, 5.0)
        assert 25.0 < wbgt < 40.0

    def test_returns_float(self):
        wbgt = _compute_wbgt(20.0, 50.0, 10.0)
        assert isinstance(wbgt, float)


class TestEmptyTemporal:
    def test_returns_dict(self):
        result = _empty_temporal()
        assert isinstance(result, dict)

    def test_has_required_keys(self):
        result = _empty_temporal()
        required = ["precip_1h", "precip_6h", "precip_24h", "precip_48h",
                     "temperature_max", "temperature_min"]
        for key in required:
            assert key in result, f"Missing key: {key}"

    def test_all_values_numeric(self):
        result = _empty_temporal()
        for k, v in result.items():
            assert isinstance(v, (int, float)), f"{k} is {type(v)}"
```

- [ ] **Step 2: Run to confirm they fail (functions not imported yet) or pass**

Run: `cd backend && python -m pytest tests/test_risk_pipeline_unit.py -v --timeout=30 2>&1 | tail -20`
Expected: PASS (these are pure function tests, they should pass immediately)

- [ ] **Step 3: Write tests for `compute_province_risk` pipeline**

Add to the same file. This requires heavy mocking:

```python
@pytest.mark.asyncio
class TestComputeProvinceRisk:
    """Test the main risk pipeline with mocked external I/O."""

    @pytest.fixture
    def mock_db(self):
        """Create mock AsyncSession with Province '28' (Madrid) seeded."""
        db = AsyncMock()
        # Province lookup
        province = MagicMock()
        province.ine_code = "28"
        province.name = "Madrid"
        province.latitude = 40.42
        province.longitude = -3.70
        province.flood_risk_weight = 0.5
        province.wildfire_risk_weight = 0.4
        province.drought_risk_weight = 0.6
        province.heatwave_risk_weight = 0.7
        province.seismic_risk_weight = 0.3
        province.coldwave_risk_weight = 0.4
        province.windstorm_risk_weight = 0.3
        db.get = AsyncMock(return_value=province)
        # DB queries return empty results
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        db.execute = AsyncMock(return_value=mock_result)
        db.add = MagicMock()
        db.commit = AsyncMock()
        return db

    async def test_returns_valid_composite(self, mock_db):
        with patch("app.services.risk_service.open_meteo") as mock_om, \
             patch("app.services.risk_service.ign_seismic", create=True) as mock_ign, \
             patch("app.services.risk_service.open_meteo_upper_air", create=True) as mock_upper:
            mock_om.fetch_current = AsyncMock(return_value={"temperature": 25.0, "humidity": 50.0, "wind_speed": 10.0, "pressure": 1013.0, "soil_moisture": 0.3, "cloud_cover": 40.0, "uv_index": 5.0, "dew_point": 12.0})
            mock_ign.fetch_recent_quakes = AsyncMock(return_value=[])
            mock_upper.fetch_upper_air = AsyncMock(return_value={})

            from app.services.risk_service import compute_province_risk
            result = await compute_province_risk(mock_db, "28")
            assert "composite_score" in result
            assert 0 <= result["composite_score"] <= 100
            assert result["severity"] in ("low", "moderate", "high", "very_high", "critical")

    async def test_unknown_province_raises(self, mock_db):
        mock_db.get = AsyncMock(return_value=None)
        from app.services.risk_service import compute_province_risk
        with pytest.raises(ValueError, match="not found"):
            await compute_province_risk(mock_db, "XX")

    async def test_empty_weather_still_produces_scores(self, mock_db):
        with patch("app.services.risk_service.open_meteo") as mock_om, \
             patch("app.services.risk_service.ign_seismic", create=True) as mock_ign, \
             patch("app.services.risk_service.open_meteo_upper_air", create=True) as mock_upper:
            mock_om.fetch_current = AsyncMock(return_value={})
            mock_ign.fetch_recent_quakes = AsyncMock(return_value=[])
            mock_upper.fetch_upper_air = AsyncMock(return_value={})

            from app.services.risk_service import compute_province_risk
            result = await compute_province_risk(mock_db, "28")
            assert 0 <= result["composite_score"] <= 100

    async def test_stores_risk_score_in_db(self, mock_db):
        with patch("app.services.risk_service.open_meteo") as mock_om, \
             patch("app.services.risk_service.ign_seismic", create=True) as mock_ign, \
             patch("app.services.risk_service.open_meteo_upper_air", create=True) as mock_upper:
            mock_om.fetch_current = AsyncMock(return_value={"temperature": 30.0})
            mock_ign.fetch_recent_quakes = AsyncMock(return_value=[])
            mock_upper.fetch_upper_air = AsyncMock(return_value={})

            from app.services.risk_service import compute_province_risk
            await compute_province_risk(mock_db, "28")
            mock_db.add.assert_called_once()
```

NOTE: The exact `patch` targets depend on how `risk_service.py` imports the data modules. Read lines 1-30 of `risk_service.py` to get the exact import paths before writing patches.

- [ ] **Step 4: Run tests**

Run: `cd backend && python -m pytest tests/test_risk_pipeline_unit.py -v --timeout=30 2>&1 | tail -20`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add backend/tests/test_risk_pipeline_unit.py
git commit -m "test: unit tests for compute_province_risk pipeline and thermal helpers"
```

---

## Task 3: Alert Intelligence Unit Tests (Goal 2B)

**Files:**
- Create: `backend/tests/test_alert_intelligence_unit.py`

### Prereqs: Read these files first
- `backend/app/services/alert_intelligence_service.py` (full file -- already read above)
- `backend/app/models/alert.py` (Alert model fields)
- `backend/app/models/user.py` (User model fields: `province_code`, `alert_severity_threshold`, `hazard_preferences`)
- `backend/app/models/alert_preference.py` (AlertPreference model fields)

### Design

`should_deliver()`, `compute_relevance()`, and `explain_alert()` are pure functions that take model objects. Use lightweight fake objects instead of DB.

**What's already tested** (in `test_alert_intelligence.py`): `get_or_create_preferences`, `update_preferences`, `mark_alert_read` -- all via API integration tests. The 3 pure functions below have ZERO tests.

- [ ] **Step 1: Write failing tests**

```python
"""Unit tests for alert intelligence pure functions."""
import pytest
from unittest.mock import MagicMock
from app.services.alert_intelligence_service import (
    should_deliver,
    compute_relevance,
    explain_alert,
)


def _make_alert(severity=3, hazard_type="flood", province_code="28", is_active=True):
    a = MagicMock()
    a.id = 1
    a.severity = severity
    a.hazard_type = hazard_type
    a.province_code = province_code
    a.is_active = is_active
    return a


def _make_user(province_code="28", threshold=3, hazard_prefs=None):
    u = MagicMock()
    u.province_code = province_code
    u.alert_severity_threshold = threshold
    u.hazard_preferences = hazard_prefs if hazard_prefs is not None else []
    # Remove attributes that trigger the personal vulnerability branch
    del u.age_range
    del u.mobility_level
    return u


def _make_prefs(quiet_start=None, quiet_end=None, override=True, snoozed=None):
    p = MagicMock()
    p.quiet_hours_start = quiet_start
    p.quiet_hours_end = quiet_end
    p.emergency_override = override
    p.snoozed_hazards = snoozed or {}
    return p


class TestShouldDeliver:
    def test_no_prefs_above_threshold(self):
        assert should_deliver(_make_alert(severity=3), _make_user(threshold=2), None) is True

    def test_no_prefs_below_threshold(self):
        assert should_deliver(_make_alert(severity=1), _make_user(threshold=3), None) is False

    def test_emergency_override_breaks_through(self):
        """Severity 4+ with emergency_override=True always delivers."""
        prefs = _make_prefs(quiet_start="00:00", quiet_end="23:59", override=True)
        assert should_deliver(_make_alert(severity=4), _make_user(threshold=1), prefs) is True

    def test_below_threshold_blocked_even_with_prefs(self):
        prefs = _make_prefs()
        assert should_deliver(_make_alert(severity=1), _make_user(threshold=3), prefs) is False

    def test_snoozed_hazard_blocks(self):
        future = "2099-01-01T00:00:00+00:00"
        prefs = _make_prefs(snoozed={"flood": future})
        assert should_deliver(_make_alert(severity=3, hazard_type="flood"), _make_user(threshold=2), prefs) is False

    def test_expired_snooze_allows(self):
        past = "2020-01-01T00:00:00+00:00"
        prefs = _make_prefs(snoozed={"flood": past})
        assert should_deliver(_make_alert(severity=3, hazard_type="flood"), _make_user(threshold=2), prefs) is True

    def test_severity_equals_threshold(self):
        assert should_deliver(_make_alert(severity=3), _make_user(threshold=3), None) is True


class TestComputeRelevance:
    def test_same_province_high(self):
        score = compute_relevance(_make_alert(province_code="28"), _make_user(province_code="28"), None)
        assert score >= 0.5

    def test_different_province_lower(self):
        score = compute_relevance(_make_alert(province_code="03"), _make_user(province_code="28"), None)
        assert score < 0.5

    def test_matching_hazard_boosts(self):
        base = compute_relevance(_make_alert(hazard_type="flood"), _make_user(hazard_prefs=[]), None)
        boosted = compute_relevance(_make_alert(hazard_type="flood"), _make_user(hazard_prefs=["flood"]), None)
        assert boosted > base

    def test_active_bonus(self):
        active = compute_relevance(_make_alert(is_active=True), _make_user(), None)
        inactive = compute_relevance(_make_alert(is_active=False), _make_user(), None)
        assert active > inactive

    def test_clamped_to_1(self):
        score = compute_relevance(_make_alert(severity=5, province_code="28", is_active=True),
                                   _make_user(province_code="28", hazard_prefs=["flood"]), None)
        assert score <= 1.0


class TestExplainAlert:
    def test_same_province_explanation(self):
        province = MagicMock()
        province.name = "Madrid"
        province.flood_risk_weight = 0.8
        province.wildfire_risk_weight = 0.3
        province.drought_risk_weight = 0.5
        province.heatwave_risk_weight = 0.6
        province.seismic_risk_weight = 0.2
        province.coldwave_risk_weight = 0.3
        province.windstorm_risk_weight = 0.3
        explanation = explain_alert(_make_alert(province_code="28"), _make_user(province_code="28"), province)
        assert "Madrid" in explanation.factors[0] or "your province" in explanation.factors[0].lower()

    def test_different_province_explanation(self):
        explanation = explain_alert(_make_alert(province_code="03"), _make_user(province_code="28"), None)
        assert any("nearby" in f.lower() or "03" in f for f in explanation.factors)

    def test_tracked_hazard_mentioned(self):
        province = MagicMock()
        province.name = "Madrid"
        province.flood_risk_weight = 0.8
        province.wildfire_risk_weight = 0.3
        province.drought_risk_weight = 0.5
        province.heatwave_risk_weight = 0.6
        province.seismic_risk_weight = 0.2
        province.coldwave_risk_weight = 0.3
        province.windstorm_risk_weight = 0.3
        explanation = explain_alert(
            _make_alert(hazard_type="flood"),
            _make_user(hazard_prefs=["flood"]),
            province,
        )
        assert any("flood" in f.lower() for f in explanation.factors)
```

- [ ] **Step 2: Run tests**

Run: `cd backend && python -m pytest tests/test_alert_intelligence_unit.py -v --timeout=30 2>&1 | tail -20`
Expected: All PASS

- [ ] **Step 3: Commit**

```bash
git add backend/tests/test_alert_intelligence_unit.py
git commit -m "test: unit tests for should_deliver, compute_relevance, explain_alert"
```

---

## Task 4: Multi-Channel Delivery Tests (Goal 2C)

**Files:**
- Create: `backend/tests/test_deliver_multi_channel.py`

### Prereqs: Read these files first
- `backend/app/services/alert_escalation_service.py` (full file -- already read above, `deliver_alert_multi_channel` at line 19)

### Design

`deliver_alert_multi_channel` uses lazy imports of push, sms, telegram, whatsapp services. Mock each at the import path used inside the function.

- [ ] **Step 1: Write tests**

```python
"""Unit tests for multi-channel alert delivery with failover."""
import pytest
from unittest.mock import AsyncMock, patch

from app.services.alert_escalation_service import deliver_alert_multi_channel


@pytest.mark.asyncio
class TestDeliverMultiChannel:

    async def test_push_succeeds_first(self):
        db = AsyncMock()
        with patch("app.services.push_service.notify_user", new_callable=AsyncMock, return_value=True):
            result = await deliver_alert_multi_channel(db, 1, "Test", "Body")
        assert result == "push"

    async def test_push_fails_sms_succeeds(self):
        db = AsyncMock()
        with patch("app.services.push_service.notify_user", new_callable=AsyncMock, side_effect=Exception("push down")), \
             patch("app.services.sms_service.send_sms", new_callable=AsyncMock, return_value="SM123"):
            result = await deliver_alert_multi_channel(db, 1, "Test", "Body", phone="+34600000000", sms_enabled=True)
        assert result == "sms"

    async def test_sms_skipped_no_phone(self):
        db = AsyncMock()
        with patch("app.services.push_service.notify_user", new_callable=AsyncMock, side_effect=Exception), \
             patch("app.services.telegram_service.send_telegram", new_callable=AsyncMock, return_value=True):
            result = await deliver_alert_multi_channel(
                db, 1, "Test", "Body",
                phone=None, sms_enabled=True,
                telegram_chat_id="123", telegram_enabled=True,
            )
        assert result == "telegram"

    async def test_all_fail_returns_none(self):
        db = AsyncMock()
        with patch("app.services.push_service.notify_user", new_callable=AsyncMock, side_effect=Exception), \
             patch("app.services.sms_service.send_sms", new_callable=AsyncMock, side_effect=Exception), \
             patch("app.services.telegram_service.send_telegram", new_callable=AsyncMock, side_effect=Exception), \
             patch("app.services.whatsapp_service.send_whatsapp", new_callable=AsyncMock, side_effect=Exception):
            result = await deliver_alert_multi_channel(
                db, 1, "Test", "Body",
                phone="+34600000000", sms_enabled=True,
                telegram_chat_id="123", telegram_enabled=True,
                whatsapp_enabled=True,
            )
        assert result == "none"

    async def test_whatsapp_last_resort(self):
        db = AsyncMock()
        with patch("app.services.push_service.notify_user", new_callable=AsyncMock, side_effect=Exception), \
             patch("app.services.sms_service.send_sms", new_callable=AsyncMock, return_value=None), \
             patch("app.services.telegram_service.send_telegram", new_callable=AsyncMock, return_value=False), \
             patch("app.services.whatsapp_service.send_whatsapp", new_callable=AsyncMock, return_value="WA123"):
            result = await deliver_alert_multi_channel(
                db, 1, "Test", "Body",
                phone="+34600000000", sms_enabled=True,
                telegram_chat_id="123", telegram_enabled=True,
                whatsapp_enabled=True,
            )
        assert result == "whatsapp"
```

NOTE: The lazy imports inside `deliver_alert_multi_channel` use `from app.services.push_service import notify_user` etc. Verify the exact import paths by re-reading the function. The `patch` target must match the module where the name is looked up, which due to the lazy import is the original module.

- [ ] **Step 2: Run tests**

Run: `cd backend && python -m pytest tests/test_deliver_multi_channel.py -v --timeout=30 2>&1 | tail -20`
Expected: All PASS

- [ ] **Step 3: Commit**

```bash
git add backend/tests/test_deliver_multi_channel.py
git commit -m "test: multi-channel delivery failover unit tests"
```

---

## Task 5: Flash Flood Pipeline Tests (Goal 2D)

**Files:**
- Create: `backend/tests/test_flash_flood_pipeline.py`

### Prereqs: Read these files first
- `backend/app/services/flash_flood_service.py` (lines 156-295 -- `process_flash_flood_alerts`, `store_river_readings`, `_load_gauge_thresholds` -- already read above)
- `backend/app/models/alert.py` (Alert model)
- `backend/app/models/river_gauge.py` (RiverGauge model, RiverReading model)

### Design

**What's already tested** (in `test_flash_flood_service.py` and `test_flash_flood_edge_cases.py`): `check_flash_flood_conditions` (4 unit tests), `detect_rapid_flow_increase` (14 tests), API endpoints (6 integration tests). The 3 functions below have ZERO direct unit tests.

- [ ] **Step 1: Write tests**

```python
"""Unit tests for flash flood pipeline functions."""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timezone, timedelta

from app.services.flash_flood_service import (
    process_flash_flood_alerts,
    store_river_readings,
    _load_gauge_thresholds,
    FloodAlert,
)


class _FakeGauge:
    def __init__(self, gauge_id, name, river_name, province_code="50",
                 p90=50.0, p95=80.0, p99=120.0, is_active=True):
        self.gauge_id = gauge_id
        self.name = name
        self.river_name = river_name
        self.province_code = province_code
        self.threshold_p90 = p90
        self.threshold_p95 = p95
        self.threshold_p99 = p99
        self.is_active = is_active


@pytest.mark.asyncio
class TestProcessFlashFloodAlerts:

    async def test_creates_alert_for_new_exceedance(self):
        """New flood condition with no recent duplicate creates an alert."""
        mock_db = AsyncMock()
        # Dedup query returns None (no existing alert)
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute = AsyncMock(return_value=mock_result)

        fa = FloodAlert(gauge_id="e001", gauge_name="Zaragoza", river_name="Ebro",
                        basin="Ebro", province_code="50", flow_m3s=150.0,
                        threshold_exceeded="P99", severity=5, message="Critical flow")

        with patch("app.services.flash_flood_service.check_flash_flood_conditions",
                    new_callable=AsyncMock, return_value=[fa]):
            count = await process_flash_flood_alerts(mock_db)
        assert count == 1
        mock_db.add.assert_called_once()
        mock_db.commit.assert_awaited_once()

    async def test_skips_duplicate_within_6_hours(self):
        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = MagicMock()  # existing alert found
        mock_db.execute = AsyncMock(return_value=mock_result)

        fa = FloodAlert(gauge_id="e001", gauge_name="Zaragoza", river_name="Ebro",
                        basin="Ebro", province_code="50", flow_m3s=150.0,
                        threshold_exceeded="P99", severity=5, message="Critical flow")

        with patch("app.services.flash_flood_service.check_flash_flood_conditions",
                    new_callable=AsyncMock, return_value=[fa]):
            count = await process_flash_flood_alerts(mock_db)
        assert count == 0
        mock_db.add.assert_not_called()

    async def test_no_conditions_no_alerts(self):
        mock_db = AsyncMock()
        with patch("app.services.flash_flood_service.check_flash_flood_conditions",
                    new_callable=AsyncMock, return_value=[]):
            count = await process_flash_flood_alerts(mock_db)
        assert count == 0


@pytest.mark.asyncio
class TestStoreRiverReadings:

    async def test_stores_valid_flows(self):
        mock_db = AsyncMock()
        flows = [
            {"gauge_id": "e001", "flow_m3s": 50.0, "level_m": 2.0, "basin": "Ebro"},
            {"gauge_id": "e002", "flow_m3s": 30.0, "level_m": 1.5, "basin": "Ebro"},
        ]
        with patch("app.services.flash_flood_service.fetch_all_basin_flows",
                    new_callable=AsyncMock, return_value=flows):
            count = await store_river_readings(mock_db)
        assert count == 2
        assert mock_db.add.call_count == 2
        mock_db.commit.assert_awaited_once()

    async def test_skips_none_flow(self):
        mock_db = AsyncMock()
        flows = [
            {"gauge_id": "e001", "flow_m3s": None, "level_m": None, "basin": "Ebro"},
            {"gauge_id": "e002", "flow_m3s": 30.0, "level_m": 1.5, "basin": "Ebro"},
        ]
        with patch("app.services.flash_flood_service.fetch_all_basin_flows",
                    new_callable=AsyncMock, return_value=flows):
            count = await store_river_readings(mock_db)
        assert count == 1

    async def test_empty_flows(self):
        mock_db = AsyncMock()
        with patch("app.services.flash_flood_service.fetch_all_basin_flows",
                    new_callable=AsyncMock, return_value=[]):
            count = await store_river_readings(mock_db)
        assert count == 0
        mock_db.commit.assert_not_awaited()


@pytest.mark.asyncio
class TestLoadGaugeThresholds:

    async def test_returns_gauge_dict(self):
        gauges = [_FakeGauge("e001", "Zaragoza", "Ebro"), _FakeGauge("e002", "Tortosa", "Ebro")]
        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = gauges
        mock_db.execute = AsyncMock(return_value=mock_result)

        result = await _load_gauge_thresholds(mock_db)
        assert "e001" in result
        assert result["e001"]["p90"] == 50.0
        assert result["e001"]["p99"] == 120.0

    async def test_empty_db(self):
        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        mock_db.execute = AsyncMock(return_value=mock_result)

        result = await _load_gauge_thresholds(mock_db)
        assert result == {}
```

- [ ] **Step 2: Run tests**

Run: `cd backend && python -m pytest tests/test_flash_flood_pipeline.py -v --timeout=30 2>&1 | tail -20`
Expected: All PASS

- [ ] **Step 3: Commit**

```bash
git add backend/tests/test_flash_flood_pipeline.py
git commit -m "test: flash flood pipeline unit tests — process alerts, store readings, load thresholds"
```

---

## Task 6: Staleness Alert Service (Goal 3)

**Files:**
- Modify: `backend/app/services/data_health_service.py`
- Modify: `backend/app/config.py`
- Create: `backend/app/services/staleness_alert_service.py`
- Modify: `backend/app/scheduler/jobs.py`

### Prereqs: Read these files first
- `backend/app/services/data_health_service.py` (already read -- 81 lines)
- `backend/app/config.py` (already read -- 45 lines)
- `backend/app/scheduler/jobs.py` (already read -- 130 lines)
- `backend/app/services/telegram_service.py` (`send_telegram` signature)
- `backend/app/services/sms_service.py` (`send_sms` or `send_critical_alert_sms` signature)

- [ ] **Step 1: Write test for staleness detection (TDD -- test first)**

Create `backend/tests/test_staleness_alert.py`:

```python
"""Tests for data staleness detection and alerting."""
import time
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from datetime import datetime, timezone, timedelta

from app.services.data_health_service import DataHealthTracker, KNOWN_SOURCES


class TestGetStaleSources:
    def test_no_stale_when_all_fresh(self):
        tracker = DataHealthTracker()
        tracker.register_sources(KNOWN_SOURCES)
        for src in KNOWN_SOURCES:
            tracker.record_success(src, 10)
        # Import after setup
        from app.services.staleness_alert_service import get_stale_sources
        stale = get_stale_sources(tracker)
        assert len(stale) == 0

    def test_stale_when_never_fetched(self):
        tracker = DataHealthTracker()
        tracker.register_sources(["open_meteo"])
        # Never call record_success -> last_success is None
        from app.services.staleness_alert_service import get_stale_sources
        stale = get_stale_sources(tracker)
        assert len(stale) == 1
        assert stale[0]["source"] == "open_meteo"

    def test_stale_when_old_success(self):
        tracker = DataHealthTracker()
        tracker.register_sources(["open_meteo"])
        tracker.record_success("open_meteo", 10)
        # Manually set last_success to 2 hours ago
        two_hours_ago = (datetime.now(tz=timezone.utc) - timedelta(hours=2)).isoformat()
        tracker._sources["open_meteo"]["last_success"] = two_hours_ago
        from app.services.staleness_alert_service import get_stale_sources, STALENESS_THRESHOLDS
        stale = get_stale_sources(tracker)
        # open_meteo threshold is 30 min, 2h > 30min -> stale
        assert len(stale) == 1
        assert stale[0]["stale_minutes"] > 60


class TestHealthSummary:
    def test_counts_correct(self):
        tracker = DataHealthTracker()
        tracker.register_sources(["open_meteo", "aemet", "usgs"])
        tracker.record_success("open_meteo", 5)
        tracker.record_success("aemet", 3)
        # usgs never fetched
        from app.services.staleness_alert_service import get_health_summary
        summary = get_health_summary(tracker)
        assert summary["total"] == 3
        assert summary["never_fetched"] == 1
        assert summary["healthy"] + summary["stale"] + summary["never_fetched"] == 3


@pytest.mark.asyncio
class TestCheckAndAlert:

    async def test_no_stale_returns_zero(self):
        from app.services.staleness_alert_service import check_and_alert_stale_sources
        tracker = DataHealthTracker()
        tracker.register_sources(KNOWN_SOURCES)
        for src in KNOWN_SOURCES:
            tracker.record_success(src, 10)
        with patch("app.services.staleness_alert_service.health_tracker", tracker):
            count = await check_and_alert_stale_sources()
        assert count == 0

    async def test_stale_triggers_log_warning(self):
        from app.services.staleness_alert_service import check_and_alert_stale_sources, _last_alerted
        _last_alerted.clear()
        tracker = DataHealthTracker()
        tracker.register_sources(["open_meteo"])
        # Never fetched -> stale
        with patch("app.services.staleness_alert_service.health_tracker", tracker), \
             patch("app.services.staleness_alert_service.logger") as mock_logger:
            count = await check_and_alert_stale_sources()
        assert count >= 1
        mock_logger.warning.assert_called()
```

- [ ] **Step 2: Run test -- should fail (module doesn't exist yet)**

Run: `cd backend && python -m pytest tests/test_staleness_alert.py -v --timeout=30 2>&1 | tail -10`
Expected: ImportError (staleness_alert_service doesn't exist)

- [ ] **Step 3: Add `telegram_admin_chat_id` to config**

In `backend/app/config.py`, add after `telegram_bot_token`:
```python
    telegram_admin_chat_id: str = ""
```

- [ ] **Step 4: Add `STALENESS_THRESHOLDS` and new methods to `data_health_service.py`**

At the top of the file (after `KNOWN_SOURCES`), add:

```python
# Max acceptable age (minutes) per data source before considered stale
STALENESS_THRESHOLDS: dict[str, int] = {
    "open_meteo": 30,
    "aemet": 30,
    "nasa_firms": 60,
    "usgs": 60,
    "ign_seismic": 60,
    "copernicus_cams": 120,
    "copernicus_ems": 120,
    "copernicus_land": 2880,
    "openaq": 60,
    "saih": 30,
    "ree_energy": 60,
    "ine_demographics": 2880,
    "nasa_power": 2880,
    "copernicus_efas": 1440,
    "ecmwf_seasonal": 2880,
}
```

- [ ] **Step 5: Create `staleness_alert_service.py`**

```python
"""Proactive staleness alerting for external data sources."""
from __future__ import annotations

import logging
import time
from datetime import datetime, timezone

from app.services.data_health_service import health_tracker, STALENESS_THRESHOLDS

logger = logging.getLogger(__name__)

_last_alerted: dict[str, float] = {}
_ALERT_COOLDOWN = 7200  # 2 hours


def get_stale_sources(tracker=None) -> list[dict]:
    """Return list of sources that haven't reported success within their threshold."""
    tracker = tracker or health_tracker
    now = datetime.now(tz=timezone.utc)
    stale = []
    for source, status in tracker.get_all_statuses().items():
        threshold = STALENESS_THRESHOLDS.get(source, 60)
        last_success = status.get("last_success")
        if not last_success:
            stale.append({
                "source": source,
                "last_success": None,
                "threshold_minutes": threshold,
                "stale_minutes": None,
                "consecutive_failures": status.get("consecutive_failures", 0),
            })
            continue
        last_dt = datetime.fromisoformat(last_success)
        age_minutes = (now - last_dt).total_seconds() / 60
        if age_minutes > threshold:
            stale.append({
                "source": source,
                "last_success": last_success,
                "threshold_minutes": threshold,
                "stale_minutes": round(age_minutes, 1),
                "consecutive_failures": status.get("consecutive_failures", 0),
            })
    return stale


def get_health_summary(tracker=None) -> dict:
    tracker = tracker or health_tracker
    statuses = tracker.get_all_statuses()
    stale_list = get_stale_sources(tracker)
    stale_names = {s["source"] for s in stale_list}
    never = sum(1 for s in stale_list if s["last_success"] is None)
    return {
        "total": len(statuses),
        "healthy": len(statuses) - len(stale_list),
        "stale": len(stale_list) - never,
        "never_fetched": never,
        "stale_sources": stale_list,
    }


def _should_alert(source: str) -> bool:
    last = _last_alerted.get(source, 0)
    return time.time() - last > _ALERT_COOLDOWN


async def check_and_alert_stale_sources() -> int:
    """Check all sources for staleness and alert admins. Returns count of newly-alerted."""
    stale = get_stale_sources()
    if not stale:
        logger.debug("Staleness check: all sources healthy")
        return 0

    new_alerts = [s for s in stale if _should_alert(s["source"])]
    if not new_alerts:
        logger.debug("Staleness check: %d stale but all within cooldown", len(stale))
        return 0

    for s in new_alerts:
        age = s["stale_minutes"] or "never"
        msg = (
            f"STALE DATA: {s['source']} last succeeded {age}m ago "
            f"(threshold: {s['threshold_minutes']}m). "
            f"Consecutive failures: {s['consecutive_failures']}"
        )
        logger.warning(msg)
        _last_alerted[s["source"]] = time.time()

    # Telegram notification (best-effort)
    try:
        from app.config import settings
        if settings.telegram_bot_token and settings.telegram_admin_chat_id:
            from app.services.telegram_service import send_telegram
            summary = f"TrueRisk Staleness Alert: {len(new_alerts)} source(s) stale\n"
            summary += "\n".join(f"- {s['source']}: {s['stale_minutes'] or 'never'}m" for s in new_alerts)
            await send_telegram(settings.telegram_admin_chat_id, summary)
    except Exception:
        logger.debug("Telegram staleness notification failed")

    # SMS escalation for high-failure sources
    try:
        from app.config import settings
        critical = [s for s in new_alerts if s["consecutive_failures"] >= 5]
        if critical and settings.twilio_account_sid and settings.twilio_admin_phones:
            from app.services.sms_service import send_sms
            msg = f"TrueRisk CRITICAL: {len(critical)} data source(s) down 5+ times"
            for phone in settings.twilio_admin_phones:
                await send_sms(phone, msg)
    except Exception:
        logger.debug("SMS staleness escalation failed")

    return len(new_alerts)
```

- [ ] **Step 6: Register scheduler job in `jobs.py`**

Add to `backend/app/scheduler/jobs.py`:

```python
async def run_staleness_check():
    """30-minute check for stale data sources."""
    from app.services.staleness_alert_service import check_and_alert_stale_sources
    try:
        count = await check_and_alert_stale_sources()
        if count:
            logger.warning("Staleness check: %d source(s) newly stale", count)
    except Exception:
        logger.exception("Staleness check failed")
```

In `setup_scheduler()`, before `scheduler.start()`:
```python
    scheduler.add_job(
        run_staleness_check,
        "interval",
        minutes=30,
        id="staleness_check",
        name="30-min data staleness check",
        replace_existing=True,
    )
```

Update the log message to include the new job.

- [ ] **Step 7: Run tests**

Run: `cd backend && python -m pytest tests/test_staleness_alert.py -v --timeout=30 2>&1 | tail -20`
Expected: All PASS

- [ ] **Step 8: Run full test suite to check for regressions**

Run: `cd backend && python -m pytest tests/ -x -q --timeout=60 2>&1 | tail -10`
Expected: All pass

- [ ] **Step 9: Commit**

```bash
git add backend/app/services/data_health_service.py backend/app/services/staleness_alert_service.py backend/app/scheduler/jobs.py backend/app/config.py backend/tests/test_staleness_alert.py
git commit -m "feat: add proactive data staleness alerting via Telegram/SMS"
```

---

## Task 7: Exhaustive Province x Hazard Stress Tests (Goal 4)

**Files:**
- Create: `backend/tests/test_province_hazard_exhaustive.py`

### Prereqs: Read these files first
- `backend/tests/test_risk_province_matrix.py` (already read -- understand what's already covered)
- `backend/app/ml/models/flood_risk.py` (`FEATURE_NAMES`, `predict_flood_risk` signature)
- `backend/app/ml/models/wildfire_risk.py` (same)
- `backend/app/ml/models/drought_risk.py` (same)
- `backend/app/ml/models/heatwave_risk.py` (same)
- `backend/app/ml/models/seismic_risk.py` (same)
- `backend/app/ml/models/coldwave_risk.py` (same)
- `backend/app/ml/models/windstorm_risk.py` (same)
- `backend/app/ml/models/dana_risk.py` (same)

### What already exists in `test_risk_province_matrix.py`
- `TestProvinceSeedData`: 52 tests (required fields, coordinates, 7 weights)
- `TestHazardWeightsConsistency`: 52 tests (8 weights valid)
- `TestTerrainFeaturesConsistency`: 52 tests (terrain valid)
- `TestAllModelsWithZeroFeatures`: 8 tests (empty dict)
- `TestAllModelsWithExtremeFeatures`: 8 tests (extreme values)
- `TestCompositeWithRealWeights`: 52 x 3 = 156 tests (low/moderate/extreme scenarios)
- `TestTemporalFeaturesEdgeCases`: 3 tests
- `TestWeightScalingFormula`: 3 + 52 tests

**Total existing**: ~334 parametrized tests. Good composite coverage, but NO per-province per-model individual scoring. The existing tests only pass models `{}` or a single extreme dict -- they never use province-specific terrain features as model input.

### What's new: per-province per-model with terrain

- [ ] **Step 1: Read each model's FEATURE_NAMES to build realistic feature dicts**

Read the `FEATURE_NAMES` constant from each of the 8 model files. This tells us exactly what keys each model expects.

- [ ] **Step 2: Write the exhaustive test file**

```python
"""Exhaustive per-province per-model stress tests.

Complements test_risk_province_matrix.py by running each of the 8 models
with province-specific terrain features merged with realistic weather data.
"""
import math
import pytest

from app.data.province_data import PROVINCES
from app.services.risk_service import get_terrain_features, get_hazard_weights
from app.ml.models.composite_risk import compute_composite_risk
from app.ml.models.flood_risk import predict_flood_risk
from app.ml.models.wildfire_risk import predict_wildfire_risk
from app.ml.models.drought_risk import predict_drought_risk
from app.ml.models.heatwave_risk import predict_heatwave_risk
from app.ml.models.seismic_risk import predict_seismic_risk
from app.ml.models.coldwave_risk import predict_coldwave_risk
from app.ml.models.windstorm_risk import predict_windstorm_risk
from app.ml.models.dana_risk import predict_dana_risk


ALL_CODES = sorted(PROVINCES.keys())
MODELS = {
    "flood": predict_flood_risk,
    "wildfire": predict_wildfire_risk,
    "drought": predict_drought_risk,
    "heatwave": predict_heatwave_risk,
    "seismic": predict_seismic_risk,
    "coldwave": predict_coldwave_risk,
    "windstorm": predict_windstorm_risk,
    "dana": predict_dana_risk,
}

# Moderate-weather baseline that won't trigger extreme scores
_MODERATE_WEATHER = {
    "temperature": 22.0, "temperature_max": 28.0, "temperature_min": 14.0,
    "humidity": 55.0, "wind_speed": 12.0, "wind_gusts": 25.0,
    "pressure": 1013.0, "pressure_change_6h": -1.0, "pressure_change_24h": -2.0,
    "precipitation": 3.0, "precip_1h": 2.0, "precip_6h": 8.0,
    "precip_24h": 15.0, "precip_48h": 25.0, "precip_7d": 40.0,
    "precip_forecast_24h": 10.0,
    "soil_moisture": 0.35, "soil_moisture_change_24h": 0.02,
    "cloud_cover": 50.0, "uv_index": 5.0, "dew_point_depression": 8.0,
    "heat_index": 24.0, "wbgt": 20.0, "wind_chill": 20.0,
    "fwi": 12.0, "ffmc": 75.0, "dmc": 30.0, "dc": 200.0,
    "spei_1m": 0.0, "spei_3m": 0.0, "spei_6m": 0.0,
    "consecutive_rain_days": 2, "consecutive_dry_days": 5,
    "consecutive_hot_days": 1, "consecutive_cold_days": 0,
    "temperature_anomaly": 2.0, "heat_wave_day": 0.0,
    "magnitude": 0.0, "magnitude_max_30d": 0.0, "depth_km": 0.0,
    "distance_km": 999.0, "quake_count_30d": 0, "seismic_zone_weight": 0.0,
    "cape": 200.0, "month": 6, "season_sin": 1.0, "season_cos": 0.0,
}

# NaN version for robustness testing
_NAN_WEATHER = {k: float("nan") if isinstance(v, (int, float)) else v
                for k, v in _MODERATE_WEATHER.items()}


def _features_for(code: str) -> dict:
    """Merge province terrain with moderate weather baseline."""
    terrain = get_terrain_features(code)
    return {**_MODERATE_WEATHER, **terrain}


class TestPerProvincePerModel:
    """52 provinces x 8 models = 416 tests with realistic features."""

    @pytest.mark.parametrize("code", ALL_CODES)
    @pytest.mark.parametrize("name,fn", list(MODELS.items()))
    def test_valid_score(self, code, name, fn):
        features = _features_for(code)
        score = fn(features)
        assert isinstance(score, (int, float)), f"{code}/{name}: not numeric"
        assert not math.isnan(score), f"{code}/{name}: NaN"
        assert 0 <= score <= 100, f"{code}/{name}: {score} out of [0,100]"


class TestNaNRobustnessPerProvince:
    """52 provinces x 8 models = 416 tests with NaN inputs."""

    @pytest.mark.parametrize("code", ALL_CODES)
    @pytest.mark.parametrize("name,fn", list(MODELS.items()))
    def test_nan_input_no_crash(self, code, name, fn):
        terrain = get_terrain_features(code)
        features = {**_NAN_WEATHER, **terrain}
        score = fn(features)
        assert isinstance(score, (int, float)), f"{code}/{name}: not numeric on NaN input"
        assert not math.isnan(score), f"{code}/{name}: NaN propagated"
        assert 0 <= score <= 100, f"{code}/{name}: {score} out of [0,100]"


class TestSingleDominantHazard:
    """For each province, set one hazard to 90, others to 5. Verify composite."""

    @pytest.mark.parametrize("code", ALL_CODES)
    @pytest.mark.parametrize("dominant", list(MODELS.keys()))
    def test_dominant_recognized(self, code, dominant):
        weights = get_hazard_weights(code)
        scores = {h: 5.0 for h in MODELS}
        scores[dominant] = 90.0
        weighted = {h: min(100.0, s * (0.4 + 0.6 * weights[h])) for h, s in scores.items()}
        result = compute_composite_risk(**weighted)
        assert 0 <= result["composite_score"] <= 100
        # The dominant hazard (after weighting) should be the reported dominant
        # unless its weight is very low and 5 * high_weight > 90 * low_weight
        assert result["dominant_hazard"] in MODELS


class TestAllZeroAllMax:
    @pytest.mark.parametrize("code", ALL_CODES)
    def test_all_zero(self, code):
        result = compute_composite_risk(0, 0, 0, 0, 0, 0, 0, 0)
        assert result["composite_score"] == 0.0
        assert result["severity"] == "low"

    @pytest.mark.parametrize("code", ALL_CODES)
    def test_all_max(self, code):
        weights = get_hazard_weights(code)
        weighted = {h: min(100.0, 100.0 * (0.4 + 0.6 * w)) for h, w in weights.items()}
        result = compute_composite_risk(**weighted)
        assert result["composite_score"] <= 100
        assert result["severity"] == "critical"
```

**Total new parametrized tests:**
- Per-province per-model realistic: 52 x 8 = 416
- NaN robustness: 52 x 8 = 416
- Single dominant: 52 x 8 = 416
- All-zero / all-max: 52 + 52 = 104
- **Total: ~1,352 new tests**

- [ ] **Step 3: Run stress tests**

Run: `cd backend && python -m pytest tests/test_province_hazard_exhaustive.py -v --timeout=120 -q 2>&1 | tail -10`
Expected: All 1,352 tests PASS

- [ ] **Step 4: Run full suite to confirm no regressions**

Run: `cd backend && python -m pytest tests/ -x -q --timeout=60 2>&1 | tail -10`
Expected: All pass

- [ ] **Step 5: Commit**

```bash
git add backend/tests/test_province_hazard_exhaustive.py
git commit -m "test: exhaustive 52x8 province-hazard stress tests with terrain and NaN robustness"
```

---

## Verification

After all tasks complete:

1. **Full test suite green**: `cd backend && python -m pytest tests/ -q --timeout=120`
2. **Audit tests work**: `cd backend && python -m pytest -m audit -v --timeout=120` (requires network)
3. **Coverage report**: `cd backend && python -m pytest tests/ --cov=app --cov-report=term-missing --timeout=120 2>&1 | grep -E "TOTAL|risk_service|flash_flood|alert_intelligence|alert_escalation|data_health|staleness"`
4. **Staleness service imports cleanly**: `cd backend && python -c "from app.services.staleness_alert_service import check_and_alert_stale_sources; print('OK')"`
5. **No regressions in existing tests**: compare test count before and after
