"""Mock USGS/IGN earthquake data for demo mode."""
from datetime import datetime, timedelta, timezone


def get_mock_earthquakes() -> list[dict]:
    """Return ~10 minor earthquakes typical for SE Spain / Alboran Sea."""
    now = datetime.now(timezone.utc)
    return [
        {"magnitude": 3.4, "depth_km": 12.0, "lat": 36.72, "lon": -2.35, "timestamp": (now - timedelta(hours=8)).isoformat(), "place": "Alboran Sea, 40km S of Almeria", "felt": 15, "tsunami": 0},
        {"magnitude": 2.8, "depth_km": 8.0, "lat": 37.05, "lon": -1.88, "timestamp": (now - timedelta(hours=18)).isoformat(), "place": "Near Lorca, Murcia", "felt": 5, "tsunami": 0},
        {"magnitude": 3.1, "depth_km": 15.0, "lat": 36.45, "lon": -4.50, "timestamp": (now - timedelta(days=1)).isoformat(), "place": "Alboran Sea, SW of Malaga", "felt": 8, "tsunami": 0},
        {"magnitude": 2.3, "depth_km": 5.0, "lat": 37.60, "lon": -1.00, "timestamp": (now - timedelta(days=2)).isoformat(), "place": "Near Aguilas, Murcia", "felt": 2, "tsunami": 0},
        {"magnitude": 2.5, "depth_km": 10.0, "lat": 38.10, "lon": -0.55, "timestamp": (now - timedelta(days=3)).isoformat(), "place": "Near Torrevieja, Alicante", "felt": 3, "tsunami": 0},
        {"magnitude": 2.0, "depth_km": 18.0, "lat": 36.80, "lon": -3.20, "timestamp": (now - timedelta(days=5)).isoformat(), "place": "Alboran Sea", "felt": 0, "tsunami": 0},
        {"magnitude": 2.7, "depth_km": 7.0, "lat": 37.40, "lon": -3.78, "timestamp": (now - timedelta(days=7)).isoformat(), "place": "Near Granada", "felt": 4, "tsunami": 0},
        {"magnitude": 2.1, "depth_km": 22.0, "lat": 42.35, "lon": -0.50, "timestamp": (now - timedelta(days=10)).isoformat(), "place": "Pyrenees, Huesca", "felt": 1, "tsunami": 0},
        {"magnitude": 3.0, "depth_km": 14.0, "lat": 36.90, "lon": -2.70, "timestamp": (now - timedelta(days=15)).isoformat(), "place": "Near Almeria coast", "felt": 6, "tsunami": 0},
        {"magnitude": 2.2, "depth_km": 9.0, "lat": 38.50, "lon": 0.10, "timestamp": (now - timedelta(days=20)).isoformat(), "place": "Near Benidorm, Alicante", "felt": 2, "tsunami": 0},
    ]
