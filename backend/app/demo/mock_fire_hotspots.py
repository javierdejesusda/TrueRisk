"""Mock NASA FIRMS fire hotspot data for demo mode."""


def get_mock_fire_hotspots() -> list[dict]:
    """Return ~12 fire hotspots: few near Valencia (electrical), several in Andalucia."""
    return [
        # Electrical fires from flooding (Valencia area)
        {"lat": 39.428, "lon": -0.418, "brightness": 310.5, "confidence": "nominal", "frp": 8.2, "acq_date": "2026-03-29", "acq_time": "1430", "satellite": "N"},
        {"lat": 39.435, "lon": -0.412, "brightness": 305.0, "confidence": "nominal", "frp": 5.1, "acq_date": "2026-03-29", "acq_time": "1430", "satellite": "N"},
        # Normal wildfire activity (Andalucia/southern Spain)
        {"lat": 37.18, "lon": -3.60, "brightness": 340.2, "confidence": "high", "frp": 22.5, "acq_date": "2026-03-29", "acq_time": "1200", "satellite": "N"},
        {"lat": 37.22, "lon": -3.58, "brightness": 335.0, "confidence": "high", "frp": 18.0, "acq_date": "2026-03-29", "acq_time": "1200", "satellite": "N"},
        {"lat": 36.75, "lon": -4.42, "brightness": 320.1, "confidence": "nominal", "frp": 12.3, "acq_date": "2026-03-29", "acq_time": "0900", "satellite": "N"},
        {"lat": 38.85, "lon": -6.95, "brightness": 328.8, "confidence": "nominal", "frp": 14.7, "acq_date": "2026-03-28", "acq_time": "2100", "satellite": "N"},
        {"lat": 37.88, "lon": -1.52, "brightness": 312.0, "confidence": "low", "frp": 6.0, "acq_date": "2026-03-28", "acq_time": "1800", "satellite": "N"},
        # Canary Islands (normal activity)
        {"lat": 28.10, "lon": -15.42, "brightness": 345.0, "confidence": "high", "frp": 25.0, "acq_date": "2026-03-29", "acq_time": "0600", "satellite": "N"},
        {"lat": 28.35, "lon": -16.55, "brightness": 318.5, "confidence": "nominal", "frp": 10.5, "acq_date": "2026-03-28", "acq_time": "1500", "satellite": "N"},
        # Catalonia (minor)
        {"lat": 41.65, "lon": 2.18, "brightness": 308.0, "confidence": "low", "frp": 4.2, "acq_date": "2026-03-28", "acq_time": "1200", "satellite": "N"},
        {"lat": 41.90, "lon": 2.85, "brightness": 305.5, "confidence": "low", "frp": 3.8, "acq_date": "2026-03-27", "acq_time": "0900", "satellite": "N"},
    ]
