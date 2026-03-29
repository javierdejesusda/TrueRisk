"""Mock SAIH river gauge data for demo mode."""


def get_mock_river_flows() -> list[dict]:
    """Return river flow readings for all basins during DANA event."""
    return [
        # Jucar basin — DANA extreme
        {"gauge_id": "DEMO_POYO_01", "name": "Barranco del Poyo - Paiporta", "river": "Barranco del Poyo", "flow_m3s": 2150.0, "level_m": 8.5, "lat": 39.428, "lon": -0.418, "basin": "jucar"},
        {"gauge_id": "DEMO_TURIA_01", "name": "Turia - Valencia", "river": "Turia", "flow_m3s": 280.0, "level_m": 4.2, "lat": 39.480, "lon": -0.370, "basin": "jucar"},
        {"gauge_id": "DEMO_JUCAR_01", "name": "Jucar - Alzira", "river": "Jucar", "flow_m3s": 850.0, "level_m": 5.8, "lat": 39.150, "lon": -0.430, "basin": "jucar"},
        {"gauge_id": "DEMO_MAGRO_01", "name": "Magro - Algemesi", "river": "Magro", "flow_m3s": 120.0, "level_m": 3.5, "lat": 39.190, "lon": -0.430, "basin": "jucar"},
        {"gauge_id": "DEMO_SERPIS_01", "name": "Serpis - Gandia", "river": "Serpis", "flow_m3s": 95.0, "level_m": 3.1, "lat": 38.970, "lon": -0.180, "basin": "jucar"},
        {"gauge_id": "DEMO_VINALOPO_01", "name": "Vinalopo - Elche", "river": "Vinalopo", "flow_m3s": 42.0, "level_m": 2.3, "lat": 38.270, "lon": -0.700, "basin": "jucar"},
        # Segura basin — elevated
        {"gauge_id": "DEMO_SEGURA_01", "name": "Segura - Murcia", "river": "Segura", "flow_m3s": 110.0, "level_m": 3.0, "lat": 37.990, "lon": -1.130, "basin": "segura"},
        # Ebro — normal
        {"gauge_id": "DEMO_EBRO_01", "name": "Ebro - Zaragoza", "river": "Ebro", "flow_m3s": 85.0, "level_m": 2.1, "lat": 41.650, "lon": -0.880, "basin": "ebro"},
        # Castellon
        {"gauge_id": "DEMO_MIJARES_01", "name": "Mijares - Castellon", "river": "Mijares", "flow_m3s": 78.0, "level_m": 2.8, "lat": 39.960, "lon": -0.050, "basin": "jucar"},
        # Guadalquivir — normal
        {"gauge_id": "DEMO_GUADALQ_01", "name": "Guadalquivir - Cordoba", "river": "Guadalquivir", "flow_m3s": 55.0, "level_m": 1.8, "lat": 37.880, "lon": -4.770, "basin": "guadalquivir"},
    ]
