"""Mock AEMET weather station observation data for demo mode."""
from datetime import datetime, timezone


def get_mock_weather_stations() -> list[dict]:
    """Return observations from AEMET weather stations across Spain."""
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S")
    return [
        {"idema": "8416", "ubi": "Valencia", "lat": 39.48, "lon": -0.37, "alt": 11.0, "ta": 15.8, "hr": 97.0, "prec": 42.5, "vv": 21.7, "dv": 95.0, "vmax": 32.8, "pres": 999.2, "fint": now},
        {"idema": "8025", "ubi": "Alicante", "lat": 38.37, "lon": -0.49, "alt": 81.0, "ta": 17.2, "hr": 92.0, "prec": 28.0, "vv": 18.5, "dv": 100.0, "vmax": 28.0, "pres": 1001.5, "fint": now},
        {"idema": "8500A", "ubi": "Castellon", "lat": 39.99, "lon": -0.03, "alt": 43.0, "ta": 16.5, "hr": 88.0, "prec": 18.0, "vv": 15.8, "dv": 90.0, "vmax": 24.5, "pres": 1003.0, "fint": now},
        {"idema": "8175", "ubi": "Albacete", "lat": 38.95, "lon": -1.86, "alt": 702.0, "ta": 12.5, "hr": 82.0, "prec": 12.0, "vv": 10.2, "dv": 110.0, "vmax": 18.0, "pres": 1005.0, "fint": now},
        {"idema": "7228", "ubi": "Murcia", "lat": 37.79, "lon": -0.80, "alt": 61.0, "ta": 18.0, "hr": 78.0, "prec": 8.5, "vv": 12.0, "dv": 120.0, "vmax": 20.0, "pres": 1008.0, "fint": now},
        {"idema": "3129", "ubi": "Madrid - Retiro", "lat": 40.41, "lon": -3.68, "alt": 667.0, "ta": 19.5, "hr": 55.0, "prec": 0.0, "vv": 5.2, "dv": 220.0, "vmax": 10.0, "pres": 1015.0, "fint": now},
        {"idema": "0076", "ubi": "Barcelona", "lat": 41.39, "lon": 2.17, "alt": 6.0, "ta": 20.0, "hr": 60.0, "prec": 0.0, "vv": 8.0, "dv": 180.0, "vmax": 14.0, "pres": 1013.5, "fint": now},
        {"idema": "5783", "ubi": "Sevilla", "lat": 37.42, "lon": -5.88, "alt": 34.0, "ta": 22.5, "hr": 50.0, "prec": 0.0, "vv": 6.5, "dv": 250.0, "vmax": 12.0, "pres": 1016.0, "fint": now},
        {"idema": "6155A", "ubi": "Malaga", "lat": 36.67, "lon": -4.49, "alt": 7.0, "ta": 21.0, "hr": 58.0, "prec": 0.0, "vv": 7.0, "dv": 200.0, "vmax": 13.0, "pres": 1015.5, "fint": now},
        {"idema": "9434", "ubi": "Zaragoza", "lat": 41.66, "lon": -1.01, "alt": 247.0, "ta": 18.0, "hr": 52.0, "prec": 0.0, "vv": 4.5, "dv": 310.0, "vmax": 9.0, "pres": 1014.0, "fint": now},
        {"idema": "1024E", "ubi": "San Sebastian", "lat": 43.30, "lon": -1.97, "alt": 259.0, "ta": 15.5, "hr": 72.0, "prec": 2.0, "vv": 9.0, "dv": 280.0, "vmax": 16.0, "pres": 1012.0, "fint": now},
        {"idema": "1505", "ubi": "Bilbao", "lat": 43.30, "lon": -2.91, "alt": 39.0, "ta": 16.0, "hr": 70.0, "prec": 1.5, "vv": 8.0, "dv": 270.0, "vmax": 15.0, "pres": 1012.5, "fint": now},
    ]
