"""Mock Open-Meteo weather forecast data for demo mode."""
from datetime import datetime, timedelta, timezone


def get_mock_current(lat: float, lon: float) -> dict:
    """Return current weather based on location proximity to Valencia."""
    dist_to_valencia = ((lat - 39.47)**2 + (lon + 0.38)**2)**0.5
    is_dana_zone = dist_to_valencia < 3.0

    if is_dana_zone:
        return {
            "temperature": 15.8, "humidity": 97.0, "precipitation": 42.5,
            "wind_speed": 78.0, "wind_direction": 95.0, "wind_gusts": 118.0,
            "pressure": 999.2, "cloud_cover": 100.0, "uv_index": 0.5,
            "dew_point": 15.2, "soil_moisture": 0.96,
            "time": datetime.now(timezone.utc).isoformat(),
        }
    return {
        "temperature": 19.5, "humidity": 62.0, "precipitation": 0.2,
        "wind_speed": 12.0, "wind_direction": 220.0, "wind_gusts": 22.0,
        "pressure": 1014.0, "cloud_cover": 45.0, "uv_index": 3.2,
        "dew_point": 11.8, "soil_moisture": 0.35,
        "time": datetime.now(timezone.utc).isoformat(),
    }


def get_mock_forecast(lat: float, lon: float) -> dict:
    """Return 7-day forecast. DANA provinces show gradual improvement."""
    now = datetime.now(timezone.utc)
    dist_to_valencia = ((lat - 39.47)**2 + (lon + 0.38)**2)**0.5
    is_dana_zone = dist_to_valencia < 3.0

    hourly = []
    for h in range(168):
        t = now + timedelta(hours=h)
        day = h / 24
        if is_dana_zone:
            # Heavy rain tapering off over 18h, then clearing
            rain_factor = max(0, 1.0 - h / 18) if h < 18 else 0
            temp = 15.5 + day * 0.8 + (h % 24 - 12) * 0.3
            precip = 35.0 * rain_factor + (0.5 if h < 48 else 0)
            wind = 80.0 * max(0, 1.0 - h / 36) + 10
            humidity = 97 - day * 5
        else:
            temp = 19.0 + (h % 24 - 12) * 0.5
            precip = 0.1 if h % 24 in (14, 15) else 0
            wind = 12.0
            humidity = 60.0

        hourly.append({
            "time": t.isoformat(),
            "temperature": round(temp, 1),
            "humidity": round(min(100, max(20, humidity)), 0),
            "precipitation": round(max(0, precip), 1),
            "wind_speed": round(max(0, wind), 1),
            "wind_direction": 95 if is_dana_zone and h < 36 else 220,
            "pressure": round(999 + day * 2 if is_dana_zone else 1014, 1),
            "cloud_cover": round(min(100, 100 - day * 10 if is_dana_zone else 45), 0),
        })

    daily = []
    for d in range(7):
        dt = now + timedelta(days=d)
        if is_dana_zone:
            precip_sum = max(0, 280 * max(0, 1.0 - d / 1.5)) if d == 0 else max(0, 30 - d * 8)
            t_max = 17 + d * 1.2
            t_min = 13 + d * 0.5
        else:
            precip_sum = 0.5
            t_max = 22
            t_min = 14

        daily.append({
            "date": dt.strftime("%Y-%m-%d"),
            "temperature_max": round(t_max, 1),
            "temperature_min": round(t_min, 1),
            "precipitation_sum": round(precip_sum, 1),
            "wind_speed_max": round(80 * max(0, 1.0 - d / 3) + 10 if is_dana_zone else 15, 1),
            "uv_index_max": round(1 + d * 0.5 if is_dana_zone else 4.5, 1),
            "et0_evapotranspiration": round(1.5 + d * 0.3, 1),
        })

    return {"hourly": hourly, "daily": daily}
