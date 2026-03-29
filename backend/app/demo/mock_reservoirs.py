"""Mock MITECO reservoir data for demo mode."""


def get_mock_reservoirs() -> list[dict]:
    """Return ~25 reservoirs across Spain with DANA-scenario fill levels."""
    return [
        # Jucar basin — filling rapidly from DANA
        {"name": "Alarcon", "basin": "Jucar", "capacity_pct": 52.0, "volume_hm3": 580.0, "capacity_hm3": 1118.0, "lat": 39.55, "lon": -2.10},
        {"name": "Contreras", "basin": "Jucar", "capacity_pct": 48.0, "volume_hm3": 425.0, "capacity_hm3": 884.0, "lat": 39.57, "lon": -1.52},
        {"name": "Tous", "basin": "Jucar", "capacity_pct": 78.0, "volume_hm3": 62.0, "capacity_hm3": 80.0, "lat": 39.13, "lon": -0.65},
        {"name": "Bellus", "basin": "Jucar", "capacity_pct": 85.0, "volume_hm3": 55.0, "capacity_hm3": 65.0, "lat": 38.95, "lon": -0.38},
        {"name": "Benageber", "basin": "Jucar", "capacity_pct": 45.0, "volume_hm3": 100.0, "capacity_hm3": 221.0, "lat": 39.72, "lon": -1.10},
        # Segura basin — drought-stressed
        {"name": "Cenajo", "basin": "Segura", "capacity_pct": 28.0, "volume_hm3": 114.0, "capacity_hm3": 407.0, "lat": 38.38, "lon": -2.10},
        {"name": "Camarillas", "basin": "Segura", "capacity_pct": 22.0, "volume_hm3": 8.5, "capacity_hm3": 39.0, "lat": 38.57, "lon": -1.65},
        {"name": "La Pedrera", "basin": "Segura", "capacity_pct": 18.0, "volume_hm3": 44.0, "capacity_hm3": 246.0, "lat": 38.05, "lon": -0.88},
        {"name": "Talave", "basin": "Segura", "capacity_pct": 32.0, "volume_hm3": 11.0, "capacity_hm3": 35.0, "lat": 38.55, "lon": -1.82},
        # Ebro basin — normal
        {"name": "Mequinenza", "basin": "Ebro", "capacity_pct": 68.0, "volume_hm3": 1072.0, "capacity_hm3": 1534.0, "lat": 41.37, "lon": 0.30},
        {"name": "Ribarroja", "basin": "Ebro", "capacity_pct": 72.0, "volume_hm3": 158.0, "capacity_hm3": 210.0, "lat": 41.28, "lon": 0.35},
        {"name": "Yesa", "basin": "Ebro", "capacity_pct": 65.0, "volume_hm3": 290.0, "capacity_hm3": 447.0, "lat": 42.63, "lon": -1.12},
        # Tajo basin — moderate
        {"name": "Entrepenias", "basin": "Tajo", "capacity_pct": 55.0, "volume_hm3": 432.0, "capacity_hm3": 802.0, "lat": 40.70, "lon": -2.68},
        {"name": "Buendia", "basin": "Tajo", "capacity_pct": 50.0, "volume_hm3": 780.0, "capacity_hm3": 1639.0, "lat": 40.38, "lon": -2.75},
        {"name": "Alcantara", "basin": "Tajo", "capacity_pct": 58.0, "volume_hm3": 1878.0, "capacity_hm3": 3162.0, "lat": 39.72, "lon": -6.88},
        # Guadalquivir basin — moderate
        {"name": "Tranco de Beas", "basin": "Guadalquivir", "capacity_pct": 42.0, "volume_hm3": 210.0, "capacity_hm3": 498.0, "lat": 38.10, "lon": -2.82},
        {"name": "Iznajar", "basin": "Guadalquivir", "capacity_pct": 38.0, "volume_hm3": 395.0, "capacity_hm3": 981.0, "lat": 37.27, "lon": -4.32},
        # Duero basin — good
        {"name": "Almendra", "basin": "Duero", "capacity_pct": 72.0, "volume_hm3": 1860.0, "capacity_hm3": 2586.0, "lat": 41.18, "lon": -6.30},
        {"name": "Ricobayo", "basin": "Duero", "capacity_pct": 70.0, "volume_hm3": 770.0, "capacity_hm3": 1150.0, "lat": 41.52, "lon": -5.98},
        # Norte basin — good
        {"name": "Belesar", "basin": "Norte", "capacity_pct": 75.0, "volume_hm3": 468.0, "capacity_hm3": 655.0, "lat": 42.60, "lon": -7.70},
        # Sur basin — drought
        {"name": "Rules", "basin": "Sur", "capacity_pct": 25.0, "volume_hm3": 28.0, "capacity_hm3": 110.0, "lat": 36.82, "lon": -3.48},
        {"name": "La Vinuela", "basin": "Sur", "capacity_pct": 20.0, "volume_hm3": 33.0, "capacity_hm3": 165.0, "lat": 36.88, "lon": -4.15},
        # Guadiana basin — moderate-low
        {"name": "La Serena", "basin": "Guadiana", "capacity_pct": 35.0, "volume_hm3": 1150.0, "capacity_hm3": 3219.0, "lat": 38.68, "lon": -5.18},
        {"name": "Cijara", "basin": "Guadiana", "capacity_pct": 40.0, "volume_hm3": 620.0, "capacity_hm3": 1505.0, "lat": 39.30, "lon": -4.88},
    ]
