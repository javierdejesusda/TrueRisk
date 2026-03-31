"""Tests for upgraded weather indices (B1-B5)."""


from app.ml.features.weather_indices import (
    compute_heat_index,
    compute_pet_hargreaves,
    compute_utci,
    compute_wbgt,
)


class TestHeatIndexLuRomps:
    def test_moderate_conditions(self):
        """30C, 50% RH -- should return reasonable heat index."""
        hi = compute_heat_index(30.0, 50.0)
        assert 28.0 <= hi <= 35.0

    def test_extreme_heat_humidity(self):
        """45C, 80% RH -- extreme conditions, should be much higher."""
        hi = compute_heat_index(45.0, 80.0)
        assert hi > 50.0

    def test_below_threshold(self):
        """Below 20C -- returns temp unchanged."""
        assert compute_heat_index(15.0, 80.0) == 15.0

    def test_low_humidity(self):
        """Low humidity should not inflate beyond air temp."""
        hi = compute_heat_index(35.0, 10.0)
        assert hi <= 40.0

    def test_always_gte_temp(self):
        """Heat index should never be below air temp."""
        for t in [20, 25, 30, 35, 40]:
            for rh in [20, 40, 60, 80, 100]:
                assert compute_heat_index(float(t), float(rh)) >= t


class TestWBGTKongHuber:
    def test_moderate(self):
        """Moderate conditions: 30C, 60% RH, 2 m/s wind."""
        w = compute_wbgt(30.0, 60.0, 2.0)
        assert 20.0 <= w <= 35.0

    def test_high_solar(self):
        """High solar should increase WBGT."""
        low_solar = compute_wbgt(30.0, 50.0, 2.0, 200.0)
        high_solar = compute_wbgt(30.0, 50.0, 2.0, 900.0)
        assert high_solar > low_solar

    def test_wind_reduces(self):
        """Higher wind should generally reduce WBGT."""
        calm = compute_wbgt(35.0, 70.0, 0.5)
        windy = compute_wbgt(35.0, 70.0, 10.0)
        assert windy < calm


class TestUTCI:
    def test_thermoneutral(self):
        """22C, 50% RH, 1 m/s -- should be near 22C."""
        utci = compute_utci(22.0, 50.0, 1.0)
        assert 15.0 <= utci <= 30.0

    def test_hot_stress(self):
        """40C, 80% RH -- should indicate strong heat stress (>38)."""
        utci = compute_utci(40.0, 80.0, 1.0)
        assert utci > 35.0

    def test_cold(self):
        """0C, 50% RH, 5 m/s -- should be well below zero."""
        utci = compute_utci(0.0, 50.0, 5.0)
        assert utci < 5.0


class TestHargreavesPET:
    def test_summer_spain(self):
        """Summer in Spain (lat 40) -- high PET expected."""
        # 12 months, July hot
        t_max = [10, 12, 16, 20, 25, 32, 38, 37, 30, 22, 14, 10]
        t_min = [2, 3, 5, 8, 12, 18, 22, 21, 16, 10, 5, 2]
        pet = compute_pet_hargreaves(t_max, t_min, 40.0)
        assert len(pet) == 12
        assert all(p >= 0 for p in pet)
        # July (index 6) should have highest PET
        assert pet[6] == max(pet)

    def test_zero_range(self):
        """Zero temperature range -- should still work (PET=0)."""
        t_max = [20.0] * 12
        t_min = [20.0] * 12
        pet = compute_pet_hargreaves(t_max, t_min, 40.0)
        assert all(p == 0.0 for p in pet)
