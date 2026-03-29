"""
Seed the dev database with realistic DANA demo scenario data.

Usage:
    cd backend
    python -m scripts.seed_demo          # seed demo data
    python -m scripts.seed_demo --reset  # remove all demo data
"""

import argparse
import random
import sys
import uuid
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

# Ensure backend/ is on sys.path so "app" package resolves
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

from app.models import (
    Alert,
    Badge,
    CommunityReport,
    EmergencyPlan,
    PreparednessItem,
    PreparednessSnapshot,
    PropertyReport,
    RiskForecast,
    RiskNarrative,
    RiskScore,
    RiverGauge,
    RiverReading,
    User,
    UserBadge,
    UserPoints,
    WaterRestriction,
    WeatherDailySummary,
    WeatherRecord,
)

# -- Constants ----------------------------------------------------------------
DB_PATH = Path(__file__).resolve().parent.parent / "dev.db"
DEMO_EMAIL_DOMAIN = "@demo.truerisk.local"
DEMO_SOURCE = "demo"
NOW = datetime.now(timezone.utc)
TODAY = date.today()

# Province coordinates (code -> (lat, lon))
PROVINCE_COORDS: dict[str, tuple[float, float]] = {
    "46": (39.47, -0.38),   # Valencia
    "03": (38.35, -0.49),   # Alicante
    "12": (39.99, -0.03),   # Castellon
    "02": (38.99, -1.86),   # Albacete
    "30": (37.99, -1.13),   # Murcia
    "28": (40.42, -3.70),   # Madrid
}

# All 52 province codes
ALL_PROVINCES = [
    "01", "02", "03", "04", "05", "06", "07", "08", "09", "10",
    "11", "12", "13", "14", "15", "16", "17", "18", "19", "20",
    "21", "22", "23", "24", "25", "26", "27", "28", "29", "30",
    "31", "32", "33", "34", "35", "36", "37", "38", "39", "40",
    "41", "42", "43", "44", "45", "46", "47", "48", "49", "50",
    "51", "52",
]

DANA_PROVINCES = {"46", "03", "12", "02", "30"}
MEDITERRANEAN = {"46", "03", "12", "07", "08", "17", "43", "04", "29", "18", "11", "30"}


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def get_engine():
    return create_engine(f"sqlite:///{DB_PATH}", echo=False)


def clean_demo_data(session: Session) -> None:
    """Remove all previously seeded demo data."""
    print("  Cleaning previous demo data...")

    # Find demo user IDs
    demo_users = session.execute(
        text("SELECT id FROM users WHERE email LIKE :pat"),
        {"pat": f"%{DEMO_EMAIL_DOMAIN}"},
    ).fetchall()
    demo_user_ids = [r[0] for r in demo_users]

    if demo_user_ids:
        placeholders = ",".join(str(uid) for uid in demo_user_ids)
        for table in [
            "user_badges", "user_points", "preparedness_items",
            "preparedness_snapshots", "emergency_plans", "property_reports",
        ]:
            session.execute(text(f"DELETE FROM {table} WHERE user_id IN ({placeholders})"))
        session.execute(
            text(f"DELETE FROM community_reports WHERE reporter_user_id IN ({placeholders})")
        )
        session.execute(text(f"DELETE FROM users WHERE id IN ({placeholders})"))

    # Clean alerts with demo source
    session.execute(text("DELETE FROM alerts WHERE source = :s"), {"s": DEMO_SOURCE})

    # Clean risk scores computed in demo window (last 2 hours)
    cutoff = (NOW - timedelta(hours=2)).isoformat()
    session.execute(
        text("DELETE FROM risk_scores WHERE computed_at >= :c"), {"c": cutoff}
    )

    # Clean risk forecasts in demo window
    session.execute(
        text("DELETE FROM risk_forecasts WHERE computed_at >= :c"), {"c": cutoff}
    )

    # Clean risk narratives in demo window
    session.execute(
        text("DELETE FROM risk_narratives WHERE generated_at >= :c"), {"c": cutoff}
    )

    # Clean weather records from demo window (last 61 days, demo source marker)
    weather_cutoff = (NOW - timedelta(days=61)).isoformat()
    session.execute(
        text("DELETE FROM weather_records WHERE recorded_at >= :c AND source = 'demo'"),
        {"c": weather_cutoff},
    )

    # Clean weather daily summaries from demo window
    date_cutoff = (TODAY - timedelta(days=61)).isoformat()
    session.execute(
        text("DELETE FROM weather_daily_summary WHERE date >= :c AND source = 'demo'"),
        {"c": date_cutoff},
    )

    # Clean river gauges and readings with demo source
    session.execute(text("DELETE FROM river_readings WHERE source = 'demo'"))
    session.execute(text("DELETE FROM river_gauges WHERE gauge_id LIKE 'DEMO_%'"))

    # Clean water restrictions with demo source
    session.execute(text("DELETE FROM water_restrictions WHERE source = 'demo'"))

    # Clean community reports without a user (demo orphans)
    session.execute(
        text("DELETE FROM community_reports WHERE description LIKE '%[DEMO]%'")
    )

    # Clean badges (only demo-specific ones)
    session.execute(text("DELETE FROM badges WHERE key LIKE 'demo_%'"))

    session.commit()
    print("  Done cleaning.")


# -- Seed functions -----------------------------------------------------------


def _hash_password(plain: str) -> str:
    """Simple bcrypt hash for demo passwords."""
    try:
        from passlib.context import CryptContext
        ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
        return ctx.hash(plain)
    except ImportError:
        # Fallback: store plaintext (demo only, never production)
        return f"PLAIN:{plain}"


def seed_users(session: Session) -> None:
    print("  Seeding demo users...")
    maria = User(
        email="maria@demo.truerisk.local",
        nickname="maria_demo",
        password_hash=_hash_password("demo2024!"),
        display_name="Maria Garcia",
        auth_provider="credentials",
        role="citizen",
        province_code="46",
        residence_type="piso_bajo",
        special_needs=[],
        mobility_level="full",
        has_vehicle=True,
        has_ac=True,
        floor_level=0,
        age_range="18-64",
        household_members=[
            {"name": "Carlos", "age_range": "18-64", "relationship": "spouse"},
            {"name": "Lucia", "age_range": "6-17", "relationship": "daughter"},
        ],
        pet_details=[{"type": "dog", "name": "Luna", "size": "medium"}],
        construction_year=1985,
        building_materials="concrete",
        has_basement=True,
        has_elevator=False,
        building_stories=4,
        building_condition=3,
        income_bracket="medium",
        has_property_insurance=True,
        has_life_insurance=False,
        property_value_range="150k-250k",
        has_emergency_savings=True,
        has_power_dependent_medical=False,
        has_water_storage=True,
        has_generator_or_solar=False,
        home_latitude=39.4699,
        home_longitude=-0.3763,
        work_latitude=39.4561,
        work_longitude=-0.3522,
        language_preference="es",
        alert_severity_threshold=2,
        alert_delivery="push",
        email_notifications_enabled=True,
        hazard_preferences=["flood", "windstorm", "heatwave", "dana"],
        preparedness_score=72.0,
        created_at=NOW - timedelta(days=45),
    )

    james = User(
        email="james@demo.truerisk.local",
        nickname="james_demo",
        password_hash=_hash_password("demo2024!"),
        display_name="James Wilson",
        auth_provider="credentials",
        role="citizen",
        province_code="28",
        residence_type="piso_alto",
        special_needs=[],
        mobility_level="full",
        has_vehicle=False,
        has_ac=True,
        floor_level=6,
        age_range="18-64",
        household_members=[],
        pet_details=[],
        income_bracket="medium",
        has_property_insurance=True,
        home_latitude=40.4168,
        home_longitude=-3.7038,
        language_preference="en",
        alert_severity_threshold=3,
        alert_delivery="push",
        hazard_preferences=["flood", "heatwave"],
        preparedness_score=35.0,
        created_at=NOW - timedelta(days=20),
    )

    session.add_all([maria, james])
    session.flush()  # Get IDs assigned
    print(f"    Maria (id={maria.id}), James (id={james.id})")


def _severity(score: float) -> str:
    if score >= 80:
        return "critical"
    if score >= 60:
        return "high"
    if score >= 40:
        return "moderate"
    return "low"


def _dominant(scores: dict[str, float]) -> str:
    return max(scores, key=scores.get)


def _province_risk(code: str) -> dict[str, float]:
    """Return hazard scores for a province based on DANA scenario."""
    if code == "46":  # Valencia - ground zero
        return {"flood": 95, "wildfire": 15, "drought": 35, "heatwave": 10,
                "seismic": 20, "coldwave": 5, "windstorm": 82, "dana": 97}
    if code == "03":  # Alicante
        return {"flood": 82, "wildfire": 12, "drought": 40, "heatwave": 8,
                "seismic": 25, "coldwave": 4, "windstorm": 75, "dana": 88}
    if code == "12":  # Castellon
        return {"flood": 70, "wildfire": 18, "drought": 30, "heatwave": 7,
                "seismic": 15, "coldwave": 6, "windstorm": 68, "dana": 72}
    if code == "02":  # Albacete
        return {"flood": 65, "wildfire": 10, "drought": 45, "heatwave": 12,
                "seismic": 8, "coldwave": 15, "windstorm": 55, "dana": 60}
    if code == "30":  # Murcia
        return {"flood": 58, "wildfire": 14, "drought": 50, "heatwave": 15,
                "seismic": 30, "coldwave": 5, "windstorm": 52, "dana": 55}
    if code == "28":  # Madrid - calm
        return {"flood": 12, "wildfire": 8, "drought": 20, "heatwave": 5,
                "seismic": 5, "coldwave": 10, "windstorm": 15, "dana": 8}

    # Background provinces
    base = random.uniform(5, 25)
    is_med = code in MEDITERRANEAN
    return {
        "flood": base + (10 if is_med else 0) + random.uniform(-3, 3),
        "wildfire": base * 0.6 + random.uniform(-2, 5),
        "drought": base * 0.8 + (8 if code in {"04", "18", "29", "41"} else 0),
        "heatwave": base * 0.3 + random.uniform(-2, 2),
        "seismic": 8 + random.uniform(0, 12) if is_med else 3 + random.uniform(0, 5),
        "coldwave": base * 0.4 + (5 if code in {"05", "40", "42", "44", "09"} else 0),
        "windstorm": base * 0.7 + (12 if is_med else 0),
        "dana": base * 0.5 + (15 if is_med else 0),
    }


def _features_snapshot(code: str, scores: dict[str, float]) -> dict:
    """Build a realistic features_snapshot JSON for the risk score."""
    is_dana = code in DANA_PROVINCES
    return {
        "flood": {
            "precip_24h": 380.0 if code == "46" else 120.0 if is_dana else 5.0,
            "precip_6h": 210.0 if code == "46" else 80.0 if is_dana else 2.0,
            "soil_saturation": 0.95 if is_dana else 0.4,
            "river_basin_risk": 0.9 if code == "46" else 0.5 if is_dana else 0.1,
            "rolling_7d_precip": 450.0 if code == "46" else 180.0 if is_dana else 15.0,
        },
        "wildfire": {
            "temperature": 16.0 if is_dana else 22.0,
            "humidity": 95.0 if is_dana else 55.0,
            "wind_speed": 75.0 if code == "46" else 40.0 if is_dana else 12.0,
            "fwi": 2.0 if is_dana else 15.0,
            "dry_days": 0 if is_dana else 12,
        },
        "drought": {
            "spei_1m": -0.3 if is_dana else -1.2 if code == "30" else -0.1,
            "spei_3m": -0.5 if is_dana else -1.5 if code == "30" else -0.2,
            "spei_6m": -0.8 if is_dana else -1.8 if code == "30" else -0.3,
            "soil_moisture_deficit": 0.05 if is_dana else 0.35 if code == "30" else 0.1,
            "precip_anomaly_pct": 250.0 if code == "46" else -30.0 if code == "30" else 0.0,
        },
        "heatwave": {
            "heat_index": 18.0 if is_dana else 28.0,
            "consecutive_hot_days": 0,
            "wbgt": 14.0 if is_dana else 22.0,
        },
        "seismic": {
            "max_magnitude_30d": 3.2 if code in MEDITERRANEAN else 1.5,
            "earthquake_count_30d": 8 if code in MEDITERRANEAN else 2,
            "nearest_quake_km": 45.0,
        },
        "coldwave": {
            "wind_chill": 8.0 if is_dana else 12.0,
            "consecutive_cold_days": 0,
        },
        "windstorm": {
            "max_gust_kmh": 120.0 if code == "46" else 90.0 if is_dana else 25.0,
            "pressure_change_6h": -12.0 if code == "46" else -8.0 if is_dana else -1.0,
            "gust_factor": 2.5 if is_dana else 1.2,
        },
    }


def seed_risk_scores(session: Session) -> None:
    print("  Seeding risk scores for all 52 provinces...")
    random.seed(42)  # Reproducible

    for code in ALL_PROVINCES:
        scores = _province_risk(code)
        # Clamp all scores to 0-100
        scores = {k: max(0.0, min(100.0, v)) for k, v in scores.items()}
        composite = sum(scores.values()) / len(scores)
        # Weight DANA and flood higher for composite in affected zones
        if code in DANA_PROVINCES:
            composite = scores["dana"] * 0.35 + scores["flood"] * 0.3 + scores["windstorm"] * 0.2 + sum(
                scores[h] for h in ["wildfire", "drought", "heatwave", "seismic", "coldwave"]
            ) * 0.15 / 5

        dominant_scores = {k: v for k, v in scores.items() if k != "dana"}
        dom = _dominant(dominant_scores) if composite < 80 else "dana" if scores["dana"] > scores["flood"] else "flood"

        rs = RiskScore(
            province_code=code,
            flood_score=round(scores["flood"], 1),
            wildfire_score=round(scores["wildfire"], 1),
            drought_score=round(scores["drought"], 1),
            heatwave_score=round(scores["heatwave"], 1),
            seismic_score=round(scores["seismic"], 1),
            coldwave_score=round(scores["coldwave"], 1),
            windstorm_score=round(scores["windstorm"], 1),
            dana_score=round(scores["dana"], 1),
            composite_score=round(composite, 1),
            dominant_hazard=dom,
            severity=_severity(composite),
            features_snapshot=_features_snapshot(code, scores),
            computed_at=NOW,
            created_at=NOW,
        )
        session.add(rs)

    session.flush()
    print(f"    {len(ALL_PROVINCES)} province risk scores seeded.")


def _weather_params(code: str, day_offset: int, hour: int) -> dict:
    """Generate weather parameters based on province and timeline position.
    day_offset: 0=today, -60=60 days ago.
    """
    is_dana = code in DANA_PROVINCES
    is_valencia = code == "46"
    progress = (day_offset + 60) / 60  # 0.0 at day -60, 1.0 at day 0

    # Base autumn values
    temp_base = 22.0 - progress * 4  # Cooling as autumn progresses
    humidity_base = 55 + progress * 20  # Rising humidity
    precip_base = 0.0
    wind_base = 10.0
    pressure_base = 1015 - progress * 8  # Dropping pressure

    if day_offset >= -7 and is_dana:  # DANA setup week
        local_prog = (day_offset + 7) / 7
        humidity_base += 15 * local_prog
        pressure_base -= 7 * local_prog
        wind_base += 20 * local_prog
        precip_base = 2.0 * local_prog

    if day_offset >= -1 and is_dana:  # DANA impact
        intensity = 1.0 if day_offset == 0 else 0.6
        valencia_mult = 1.0 if is_valencia else 0.65
        temp_base = 16.0
        humidity_base = 95 + random.uniform(0, 5)
        pressure_base = 998 + random.uniform(-2, 2)

        # Precipitation peaks mid-event
        hour_peak = abs(hour - 14) / 12  # Peak at 14:00
        precip_base = 40.0 * intensity * valencia_mult * (1 - hour_peak * 0.7)
        wind_base = 80.0 * intensity * valencia_mult

    # Add noise
    temp = temp_base + random.gauss(0, 1.5)
    humidity = min(100, max(20, humidity_base + random.gauss(0, 4)))
    precip = max(0, precip_base + random.gauss(0, precip_base * 0.2) if precip_base > 0.5 else random.uniform(0, 0.3))
    wind = max(0, wind_base + random.gauss(0, 3))
    pressure = pressure_base + random.gauss(0, 1)
    cloud_cover = min(100, max(0, humidity * 0.9 + random.gauss(0, 5)))

    return {
        "temperature": round(temp, 1),
        "humidity": round(humidity, 1),
        "precipitation": round(precip, 1),
        "wind_speed": round(wind, 1),
        "wind_direction": round(random.uniform(70, 120) if is_dana and day_offset >= -1 else random.uniform(0, 360), 0),
        "wind_gusts": round(wind * random.uniform(1.3, 1.8), 1) if wind > 20 else None,
        "pressure": round(pressure, 1),
        "soil_moisture": round(min(1.0, max(0.1, 0.3 + progress * 0.3 + (0.3 if is_dana and day_offset >= -3 else 0))), 2),
        "uv_index": round(max(0, 4 - progress * 2 + random.uniform(-1, 1)), 1),
        "dew_point": round(temp - (100 - humidity) / 5, 1),
        "cloud_cover": round(cloud_cover, 0),
    }


def seed_weather_records(session: Session) -> None:
    print("  Seeding 60 days of weather records (6 provinces, every 3 hours)...")
    random.seed(123)
    records = []

    for code in PROVINCE_COORDS:
        lat, lon = PROVINCE_COORDS[code]
        for day_offset in range(-60, 1):
            record_date = NOW + timedelta(days=day_offset)
            for hour in range(0, 24, 3):
                ts = record_date.replace(hour=hour, minute=0, second=0, microsecond=0)
                params = _weather_params(code, day_offset, hour)
                records.append(WeatherRecord(
                    province_code=code,
                    source="demo",
                    recorded_at=ts,
                    raw_data={"lat": lat, "lon": lon},
                    created_at=ts,
                    **params,
                ))

    session.bulk_save_objects(records)
    session.flush()
    print(f"    {len(records)} weather records seeded.")


def seed_weather_daily_summaries(session: Session) -> None:
    print("  Seeding 60 days of daily weather summaries...")
    random.seed(456)
    summaries = []

    for code in PROVINCE_COORDS:
        for day_offset in range(-60, 1):
            d = TODAY + timedelta(days=day_offset)
            params_morning = _weather_params(code, day_offset, 8)
            params_afternoon = _weather_params(code, day_offset, 14)
            params_night = _weather_params(code, day_offset, 22)

            summaries.append(WeatherDailySummary(
                province_code=code,
                date=d,
                temperature_max=max(params_morning["temperature"], params_afternoon["temperature"], params_night["temperature"]) + random.uniform(0, 2),
                temperature_min=min(params_morning["temperature"], params_afternoon["temperature"], params_night["temperature"]) - random.uniform(0, 2),
                temperature_avg=round((params_morning["temperature"] + params_afternoon["temperature"] + params_night["temperature"]) / 3, 1),
                humidity_avg=round((params_morning["humidity"] + params_afternoon["humidity"]) / 2, 1),
                humidity_min=min(params_morning["humidity"], params_afternoon["humidity"]) - random.uniform(0, 5),
                precipitation_sum=round(sum(
                    max(0, _weather_params(code, day_offset, h)["precipitation"])
                    for h in range(0, 24, 3)
                ), 1),
                wind_speed_max=max(params_morning["wind_speed"], params_afternoon["wind_speed"]),
                wind_speed_avg=round((params_morning["wind_speed"] + params_afternoon["wind_speed"]) / 2, 1),
                wind_gusts_max=params_afternoon.get("wind_gusts"),
                pressure_avg=round((params_morning["pressure"] + params_afternoon["pressure"]) / 2, 1),
                soil_moisture_avg=params_afternoon["soil_moisture"],
                uv_index_max=params_afternoon["uv_index"],
                cloud_cover_avg=round((params_morning["cloud_cover"] + params_afternoon["cloud_cover"]) / 2, 0),
                source="demo",
            ))

    session.bulk_save_objects(summaries)
    session.flush()
    print(f"    {len(summaries)} daily summaries seeded.")


def seed_alerts(session: Session) -> None:
    print("  Seeding alerts...")
    alerts = [
        Alert(
            severity=5, hazard_type="flood", province_code="46",
            title="EXTREMO: Emergencia por Inundaciones DANA - Provincia de Valencia",
            description="Precipitaciones extremas superando 300mm en pocas horas. Inundaciones subitas generalizadas en areas metropolitanas. Barrancos y ramblas desbordados. No cruce zonas inundadas. Permanezca en pisos altos. Siga instrucciones de Proteccion Civil.",
            source=DEMO_SOURCE, is_active=True,
            onset=NOW - timedelta(hours=6), expires=NOW + timedelta(hours=18),
        ),
        Alert(
            severity=5, hazard_type="windstorm", province_code="46",
            title="EXTREMO: Vientos Destructivos - Rachas superiores a 120 km/h",
            description="La DANA genera vientos extremos del este con rachas que superan los 120 km/h en zonas costeras. Peligro de caida de arboles, tendido electrico y estructuras. Permanezca en interiores alejado de ventanas.",
            source=DEMO_SOURCE, is_active=True,
            onset=NOW - timedelta(hours=8), expires=NOW + timedelta(hours=12),
        ),
        Alert(
            severity=4, hazard_type="flood", province_code="03",
            title="GRAVE: Aviso de Inundaciones Subitas - Provincia de Alicante",
            description="Lluvias torrenciales con acumulaciones de 150-200mm previstas. Riesgo elevado de desbordamiento de ramblas y barrancos. Evite desplazamientos innecesarios.",
            source=DEMO_SOURCE, is_active=True,
            onset=NOW - timedelta(hours=4), expires=NOW + timedelta(hours=20),
        ),
        Alert(
            severity=3, hazard_type="flood", province_code="12",
            title="AVISO: Riesgo de Desbordamiento Fluvial - Provincia de Castellon",
            description="Lluvias persistentes con acumulaciones de 80-120mm en 24h. Vigilancia de cauces y barrancos. Precaucion en zonas bajas.",
            source=DEMO_SOURCE, is_active=True,
            onset=NOW - timedelta(hours=3), expires=NOW + timedelta(hours=24),
        ),
        Alert(
            severity=3, hazard_type="flood", province_code="02",
            title="AVISO: Vigilancia por Inundaciones - Provincia de Albacete",
            description="Lluvias moderadas a fuertes con acumulaciones de 60-100mm. Posibles desbordamientos puntuales en zonas bajas del rio Jucar.",
            source=DEMO_SOURCE, is_active=True,
            onset=NOW - timedelta(hours=2), expires=NOW + timedelta(hours=24),
        ),
        Alert(
            severity=3, hazard_type="windstorm", province_code="30",
            title="AVISO: Vientos Fuertes - Region de Murcia",
            description="Rachas de viento de 70-90 km/h previstas. Asegure objetos en exteriores. Precaucion al conducir.",
            source=DEMO_SOURCE, is_active=True,
            onset=NOW - timedelta(hours=1), expires=NOW + timedelta(hours=18),
        ),
        Alert(
            severity=2, hazard_type="drought", province_code="30",
            title="AVISO: Sequia Prolongada - Cuenca del Segura",
            description="Condiciones de sequia persistentes. Embalses por debajo del 35% de capacidad. Medidas de ahorro de agua en vigor.",
            source=DEMO_SOURCE, is_active=True,
            onset=NOW - timedelta(days=30), expires=NOW + timedelta(days=60),
        ),
        Alert(
            severity=3, hazard_type="heatwave", province_code="46",
            title="EXPIRADO: Anomalia Termica Octubre - Valencia",
            description="Temperaturas anormalmente altas para la epoca. Maximo registrado 32C. Alerta finalizada.",
            source=DEMO_SOURCE, is_active=False,
            onset=NOW - timedelta(days=12), expires=NOW - timedelta(days=5),
        ),
    ]
    session.add_all(alerts)
    session.flush()
    print(f"    {len(alerts)} alerts seeded.")


def seed_community_reports(session: Session) -> None:
    print("  Seeding community reports...")

    # Get Maria's user ID
    maria = session.execute(
        text("SELECT id FROM users WHERE email = :e"),
        {"e": "maria@demo.truerisk.local"},
    ).fetchone()
    maria_id = maria[0] if maria else None

    reports_data = [
        # Valencia flooding cluster
        ("46", "flood", 5, 39.428, -0.418, "Inundacion severa en Calle Mayor, Paiporta. Agua a 1.5m de altura. Vehiculos arrastrados. [DEMO]", 5, 42, 12, True),
        ("46", "flood", 5, 39.432, -0.411, "Barranco del Poyo desbordado. Agua entrando en planta baja de edificios en Sedavi. [DEMO]", 5, 38, 10, True),
        ("46", "flood", 4, 39.445, -0.395, "Inundacion en avenida principal de Alfafar. Nivel del agua subiendo rapidamente. [DEMO]", 4, 28, 8, True),
        ("46", "flood", 4, 39.460, -0.380, "Calle inundada cerca del mercado de Russafa, Valencia. Trafico cortado. [DEMO]", 4, 22, 7, True),
        ("46", "flood", 4, 39.474, -0.365, "Jardin del Turia desbordado en zona este. Pasarelas sumergidas. [DEMO]", 3, 15, 5, True),
        ("46", "flood", 3, 39.485, -0.350, "Acumulacion de agua en plaza del Ayuntamiento. Bomberos evacuando locales. [DEMO]", 3, 18, 6, True),
        ("46", "flood", 3, 39.440, -0.425, "Sotano inundado en residencial de Catarroja. Vecinos pidiendo ayuda. [DEMO]", 4, 12, 4, True),
        ("46", "flood", 4, 39.410, -0.430, "Carretera CV-33 completamente inundada. Imposible circular. [DEMO]", 4, 25, 8, True),

        # Power outages (Paiporta area)
        ("46", "power_outage", 4, 39.426, -0.420, "Corte total de electricidad en zona sur de Paiporta desde hace 3 horas. [DEMO]", 4, 20, 6, True),
        ("46", "power_outage", 3, 39.435, -0.412, "Sin luz ni agua en urbanizacion El Pilar, Sedavi. [DEMO]", 3, 14, 4, True),
        ("46", "power_outage", 3, 39.448, -0.400, "Semaforos apagados en cruce principal de Alfafar. [DEMO]", 2, 8, 3, False),

        # People trapped
        ("46", "flood", 5, 39.425, -0.419, "Personas atrapadas en segundo piso, Calle San Jorge 12, Paiporta. Agua sube. URGENTE. [DEMO]", 5, 45, 15, True),
        ("46", "flood", 5, 39.430, -0.415, "Familia con anciano atrapada en coche sobre puente en Barranco del Poyo. [DEMO]", 5, 40, 13, True),

        # Structural damage
        ("46", "structural_damage", 4, 39.420, -0.422, "Muro de contencion colapsado en calle lateral de Paiporta. Escombros bloqueando calle. [DEMO]", 4, 16, 5, True),
        ("46", "structural_damage", 3, 39.438, -0.408, "Tejado parcialmente hundido en nave industrial, poligono de Sedavi. [DEMO]", 3, 10, 3, False),
        ("46", "structural_damage", 3, 39.470, -0.375, "Arbol caido sobre vehiculos en Avenida Blasco Ibanez, Valencia. [DEMO]", 2, 12, 4, True),

        # Landslides
        ("46", "landslide", 3, 39.500, -0.420, "Desprendimiento de tierras en ladera junto a A-3, salida Chiva. Carril cortado. [DEMO]", 3, 8, 2, False),
        ("12", "landslide", 3, 40.050, -0.070, "Deslizamiento menor en CV-10 cerca de Villarreal. Precaucion. [DEMO]", 2, 5, 1, False),

        # Alicante reports
        ("03", "flood", 4, 38.345, -0.490, "Inundacion en centro de Alicante, zona Rambla Mendez Nunez. [DEMO]", 4, 18, 6, True),
        ("03", "flood", 3, 38.380, -0.510, "Acumulacion de agua en poligono industrial San Vicente. [DEMO]", 3, 10, 3, False),
        ("03", "windstorm", 3, 38.360, -0.485, "Rachas de viento muy fuertes en paseo maritimo. Mobiliario urbano danado. [DEMO]", 3, 8, 2, False),

        # Medical / fire
        ("46", "medical_emergency", 4, 39.433, -0.416, "Ambulancia no puede acceder a Sedavi por inundacion. Paciente con infarto. [DEMO]", 5, 32, 11, True),
        ("46", "medical_emergency", 3, 39.442, -0.398, "Centro de salud de Alfafar inundado. Necesitan evacuar pacientes. [DEMO]", 4, 20, 7, True),
        ("46", "fire", 3, 39.428, -0.421, "Incendio electrico en garaje inundado, Calle Real Paiporta. Humo visible. [DEMO]", 3, 15, 5, True),

        # Albacete
        ("02", "flood", 3, 38.995, -1.860, "Nivel del rio Jucar subiendo rapidamente a su paso por Albacete. [DEMO]", 3, 6, 2, False),
    ]

    reports = []
    for i, (prov, hazard, sev, lat, lon, desc, urg, upv, verif, is_verif) in enumerate(reports_data):
        reports.append(CommunityReport(
            province_code=prov,
            hazard_type=hazard,
            severity=sev,
            latitude=lat,
            longitude=lon,
            description=desc,
            urgency=urg,
            upvotes=upv,
            verified_count=verif,
            is_verified=is_verif,
            status="verified" if is_verif else "pending",
            reporter_user_id=maria_id if i < 10 else None,
            created_at=NOW - timedelta(hours=random.uniform(0.5, 12)),
            expires_at=NOW + timedelta(hours=random.uniform(24, 48)),
        ))

    session.add_all(reports)
    session.flush()
    print(f"    {len(reports)} community reports seeded.")


def seed_risk_forecasts(session: Session) -> None:
    print("  Seeding TFT risk forecasts...")
    horizons = [6, 12, 24, 48, 72, 168]
    hazards = ["flood", "wildfire", "drought", "heatwave", "coldwave", "windstorm"]

    forecasts = []
    for code in PROVINCE_COORDS:
        scores = _province_risk(code)
        for hazard in hazards:
            base = scores.get(hazard, 10)
            for h in horizons:
                # Risk decays over time (event is happening now)
                decay = 1.0 - (h / 168) * 0.7
                q50 = max(2, base * decay + random.gauss(0, 3))
                q10 = max(1, q50 - random.uniform(8, 20))
                q90 = min(100, q50 + random.uniform(8, 20))

                forecasts.append(RiskForecast(
                    province_code=code,
                    hazard=hazard,
                    horizon_hours=h,
                    q10=round(q10, 1),
                    q50=round(q50, 1),
                    q90=round(q90, 1),
                    attention_weights={
                        "precipitation_24h": round(0.25 + random.uniform(-0.05, 0.05), 3),
                        "soil_moisture": round(0.18 + random.uniform(-0.03, 0.03), 3),
                        "pressure_change_6h": round(0.14 + random.uniform(-0.03, 0.03), 3),
                        "humidity": round(0.12 + random.uniform(-0.02, 0.02), 3),
                        "wind_gusts": round(0.10 + random.uniform(-0.02, 0.02), 3),
                        "temperature": round(0.08 + random.uniform(-0.02, 0.02), 3),
                        "is_mediterranean": round(0.07 + random.uniform(-0.01, 0.01), 3),
                        "elevation_m": round(0.04 + random.uniform(-0.01, 0.01), 3),
                        "month_sin": round(0.02 + random.uniform(-0.01, 0.01), 3),
                    },
                    computed_at=NOW,
                ))

    session.bulk_save_objects(forecasts)
    session.flush()
    print(f"    {len(forecasts)} risk forecasts seeded.")


def seed_risk_narratives(session: Session) -> None:
    print("  Seeding risk narratives...")
    narratives = [
        RiskNarrative(
            province_code="46", narrative_type="morning",
            content_es="**Situacion critica en Valencia.** La DANA esta descargando precipitaciones extremas que superan los 300 mm en pocas horas, provocando inundaciones subitas en zonas bajas del area metropolitana. Los barrancos del Poyo y de Chiva estan completamente desbordados. Las localidades de Paiporta, Sedavi, Alfafar y Catarroja estan gravemente afectadas. **No cruce zonas inundadas bajo ninguna circunstancia.** Mantengase en pisos altos y siga las instrucciones de Proteccion Civil. Se esperan condiciones extremas durante las proximas 12-18 horas. Los servicios de emergencia estan al limite de su capacidad.",
            content_en="**Critical situation in Valencia.** The DANA weather system is producing extreme rainfall exceeding 300mm in just hours, triggering catastrophic flash floods across low-lying metropolitan areas. The Poyo and Chiva ravines have completely overflowed. The towns of Paiporta, Sedavi, Alfafar, and Catarroja are severely affected. **Do not attempt to cross flooded areas under any circumstances.** Stay on upper floors and follow Civil Protection instructions. Extreme conditions are expected for the next 12-18 hours. Emergency services are operating at maximum capacity.",
            generated_at=NOW,
        ),
        RiskNarrative(
            province_code="46", narrative_type="emergency",
            content_es="ALERTA MAXIMA: Situacion de emergencia catastrofica en la provincia de Valencia. Inundaciones generalizadas con victimas confirmadas. Evacuaciones en curso en Paiporta, Sedavi y Alfafar. Si esta atrapado, suba al punto mas alto del edificio y llame al 112. No intente conducir. El agua arrastra vehiculos con apenas 30cm de profundidad.",
            content_en="MAXIMUM ALERT: Catastrophic emergency situation in Valencia province. Widespread flooding with confirmed casualties. Evacuations underway in Paiporta, Sedavi, and Alfafar. If trapped, move to the highest point of the building and call 112. Do not attempt to drive. Water can sweep vehicles with just 30cm depth.",
            generated_at=NOW,
        ),
        RiskNarrative(
            province_code="03", narrative_type="morning",
            content_es="**Alerta alta en Alicante.** La DANA afecta al sur de la Comunidad Valenciana con lluvias torrenciales de 150-200mm. Ramblas desbordadas en zona costera. Precaucion extrema en desplazamientos. Embalses de la cuenca del Segura recibiendo caudales extraordinarios.",
            content_en="**High alert in Alicante.** The DANA is impacting southern Valencia region with torrential rainfall of 150-200mm. Coastal ravines overflowing. Extreme caution when traveling. Segura basin reservoirs receiving extraordinary water flows.",
            generated_at=NOW,
        ),
        RiskNarrative(
            province_code="12", narrative_type="morning",
            content_es="**Aviso importante para Castellon.** Lluvias fuertes con acumulaciones de 80-120mm previstas. Vigilancia de cauces y zonas bajas. La situacion podria empeorar si la DANA se desplaza hacia el norte.",
            content_en="**Important warning for Castellon.** Heavy rainfall with accumulations of 80-120mm expected. Monitor riverbeds and low-lying areas. Conditions may worsen if the DANA system moves northward.",
            generated_at=NOW,
        ),
        RiskNarrative(
            province_code="28", narrative_type="morning",
            content_es="**Condiciones normales en Madrid.** Sin alertas activas. Cielos parcialmente nublados con temperaturas de 18-22C. La DANA se concentra en el Mediterraneo y no afecta significativamente a la meseta central. Mantenga su preparacion habitual.",
            content_en="**Normal conditions in Madrid.** No active alerts. Partly cloudy skies with temperatures of 18-22C. The DANA is concentrated over the Mediterranean and does not significantly affect the central plateau. Maintain your usual preparedness.",
            generated_at=NOW,
        ),
    ]
    session.add_all(narratives)
    session.flush()
    print(f"    {len(narratives)} risk narratives seeded.")


def seed_property_reports(session: Session) -> None:
    print("  Seeding property reports...")
    maria = session.execute(
        text("SELECT id FROM users WHERE email = :e"),
        {"e": "maria@demo.truerisk.local"},
    ).fetchone()
    maria_id = maria[0] if maria else None

    reports = [
        PropertyReport(
            report_id=str(uuid.uuid4()),
            user_id=maria_id,
            address_text="Calle Mayor 15, Paiporta, Valencia",
            formatted_address="Calle Mayor 15, 46200 Paiporta, Valencia, Spain",
            latitude=39.4286, longitude=-0.4183,
            province_code="46", municipality_code="46190",
            flood_score=95.0, wildfire_score=12.0, drought_score=30.0,
            heatwave_score=8.0, seismic_score=18.0, coldwave_score=4.0, windstorm_score=78.0,
            composite_score=92.0, dominant_hazard="flood", severity="critical",
            flood_details={
                "score": 95.0, "severity": "critical", "province_score": 95.0,
                "modifier": 15.0, "explanation": "Property located in ARPSI flood zone near Barranco del Poyo. Ground floor with basement significantly increases vulnerability.",
                "in_arpsi_zone": True, "zone_id": "ES080_ARPSI_0038",
                "zone_name": "Barranco del Poyo T10", "return_period": "T10",
                "distance_m": 180.0,
            },
            wildfire_details={
                "score": 12.0, "severity": "low", "province_score": 15.0,
                "modifier": -3.0, "explanation": "Urban area with low wildfire exposure.",
                "nearest_fire_km": 45.0, "fire_count_50km": 0,
            },
            terrain_details={
                "elevation_m": 28.0, "slope_pct": 1.2,
                "aspect": "SE", "land_use": "urban",
                "distance_to_river_m": 180.0,
            },
            province_flood_score=95.0, province_wildfire_score=15.0,
            province_composite_score=94.0, province_severity="critical",
            computed_at=NOW, expires_at=NOW + timedelta(days=30),
            access_count=3,
        ),
        PropertyReport(
            report_id=str(uuid.uuid4()),
            user_id=maria_id,
            address_text="Plaza del Ayuntamiento 1, Valencia",
            formatted_address="Plaza del Ayuntamiento 1, 46002 Valencia, Spain",
            latitude=39.4699, longitude=-0.3763,
            province_code="46", municipality_code="46250",
            flood_score=68.0, wildfire_score=8.0, drought_score=28.0,
            heatwave_score=10.0, seismic_score=15.0, coldwave_score=5.0, windstorm_score=62.0,
            composite_score=72.0, dominant_hazard="flood", severity="high",
            flood_details={
                "score": 68.0, "severity": "high", "province_score": 95.0,
                "modifier": -5.0, "explanation": "City center location. Higher elevation reduces direct flood risk, but urban drainage capacity exceeded during extreme events.",
                "in_arpsi_zone": False, "distance_m": 800.0,
            },
            wildfire_details={"score": 8.0, "severity": "low", "province_score": 15.0, "modifier": -7.0, "explanation": "Dense urban area."},
            terrain_details={"elevation_m": 15.0, "slope_pct": 0.5, "aspect": "E", "land_use": "urban", "distance_to_river_m": 800.0},
            province_flood_score=95.0, province_wildfire_score=15.0,
            province_composite_score=94.0, province_severity="critical",
            computed_at=NOW, expires_at=NOW + timedelta(days=30),
            access_count=1,
        ),
        PropertyReport(
            report_id=str(uuid.uuid4()),
            user_id=None,
            address_text="Gran Via 1, Madrid",
            formatted_address="Gran Via 1, 28013 Madrid, Spain",
            latitude=40.4200, longitude=-3.7025,
            province_code="28", municipality_code="28079",
            flood_score=10.0, wildfire_score=6.0, drought_score=18.0,
            heatwave_score=5.0, seismic_score=4.0, coldwave_score=8.0, windstorm_score=12.0,
            composite_score=15.0, dominant_hazard="drought", severity="low",
            flood_details={"score": 10.0, "severity": "low", "province_score": 12.0, "modifier": -2.0, "explanation": "Low flood risk. Adequate drainage infrastructure."},
            wildfire_details={"score": 6.0, "severity": "low", "province_score": 8.0, "modifier": -2.0, "explanation": "Dense urban setting."},
            terrain_details={"elevation_m": 652.0, "slope_pct": 2.5, "aspect": "S", "land_use": "urban", "distance_to_river_m": 2500.0},
            province_flood_score=12.0, province_wildfire_score=8.0,
            province_composite_score=14.0, province_severity="low",
            computed_at=NOW, expires_at=NOW + timedelta(days=30),
            access_count=0,
        ),
    ]
    session.add_all(reports)
    session.flush()
    print(f"    {len(reports)} property reports seeded.")


def seed_preparedness(session: Session) -> None:
    print("  Seeding preparedness data...")
    maria = session.execute(
        text("SELECT id FROM users WHERE email = :e"),
        {"e": "maria@demo.truerisk.local"},
    ).fetchone()
    if not maria:
        return
    uid = maria[0]

    # Checklist items: (category, key, completed, days_ago_completed)
    items_data = [
        ("kit", "water_supply", True, 28),
        ("kit", "non_perishable_food", True, 28),
        ("kit", "first_aid_kit", True, 25),
        ("kit", "flashlight_batteries", True, 22),
        ("kit", "phone_charger", True, 20),
        ("kit", "important_documents", True, 15),
        ("kit", "portable_radio", False, None),
        ("kit", "cash_reserve", False, None),
        ("kit", "whistle", False, None),
        ("kit", "multi_tool", False, None),
        ("plan", "emergency_contact", True, 26),
        ("plan", "meeting_point", True, 24),
        ("plan", "evacuation_route", True, 18),
        ("plan", "household_plan", True, 12),
        ("plan", "utility_shutoff", False, None),
        ("plan", "insurance_review", False, None),
        ("alerts", "severity_configured", True, 27),
        ("alerts", "push_enabled", True, 27),
        ("alerts", "hazard_preferences", False, None),
        ("alerts", "quiet_hours_set", False, None),
        ("community", "first_report", True, 10),
        ("community", "upvote_report", True, 8),
        ("knowledge", "dashboard_explored", True, 30),
        ("knowledge", "models_explored", True, 20),
        ("knowledge", "emergency_page", False, None),
        ("knowledge", "map_explored", True, 15),
    ]

    items = []
    for cat, key, completed, days_ago in items_data:
        items.append(PreparednessItem(
            user_id=uid,
            category=cat,
            item_key=key,
            completed=completed,
            completed_at=(NOW - timedelta(days=days_ago)) if completed else None,
        ))
    session.add_all(items)

    # Score snapshots over 30 days (showing upward progress)
    snapshot_data = [
        (30, 25, 15, 10, 20, 0, 5),
        (25, 35, 25, 15, 30, 0, 10),
        (20, 45, 35, 25, 40, 10, 15),
        (15, 52, 40, 30, 50, 15, 20),
        (10, 60, 50, 40, 55, 25, 30),
        (5, 68, 60, 50, 60, 40, 35),
        (0, 72, 60, 55, 65, 50, 40),
    ]
    for days_ago, total, kit, plan, alerts, community, knowledge in snapshot_data:
        session.add(PreparednessSnapshot(
            user_id=uid,
            total_score=total,
            kit_score=kit,
            plan_score=plan,
            alerts_score=alerts,
            community_score=community,
            knowledge_score=knowledge,
            computed_at=NOW - timedelta(days=days_ago),
        ))

    session.flush()
    print(f"    {len(items)} preparedness items + {len(snapshot_data)} snapshots seeded.")


def seed_gamification(session: Session) -> None:
    print("  Seeding gamification data...")
    maria = session.execute(
        text("SELECT id FROM users WHERE email = :e"),
        {"e": "maria@demo.truerisk.local"},
    ).fetchone()
    if not maria:
        return
    uid = maria[0]

    # Badges (idempotent -- check existing first)
    badges_data = [
        ("first_steps", "Primeros Pasos", "First Steps", "Completa el onboarding", "Complete onboarding", "rocket", "onboarding_complete"),
        ("reporter", "Reportero Ciudadano", "Community Reporter", "Envia tu primer informe de peligro", "Submit your first hazard report", "megaphone", "community_reports>=1"),
        ("verifier", "Verificador", "Verifier", "Verifica 3 informes de la comunidad", "Verify 3 community reports", "check-circle", "verifications>=3"),
        ("week_streak", "Racha Semanal", "Weekly Streak", "Accede 7 dias consecutivos", "Access 7 consecutive days", "flame", "streak>=7"),
        ("prepared", "Preparado", "Prepared", "Alcanza 50 puntos de preparacion", "Reach 50 preparedness points", "shield", "preparedness_score>=50"),
        ("fully_prepared", "Totalmente Preparado", "Fully Prepared", "Alcanza 80 puntos de preparacion", "Reach 80 preparedness points", "shield-check", "preparedness_score>=80"),
    ]

    badge_ids = {}
    for key, name_es, name_en, desc_es, desc_en, icon, cond in badges_data:
        existing = session.execute(
            text("SELECT id FROM badges WHERE key = :k"), {"k": key}
        ).fetchone()
        if existing:
            badge_ids[key] = existing[0]
        else:
            b = Badge(key=key, name_es=name_es, name_en=name_en,
                      description_es=desc_es, description_en=desc_en,
                      icon=icon, condition=cond)
            session.add(b)
            session.flush()
            badge_ids[key] = b.id

    # User points
    session.add(UserPoints(
        user_id=uid,
        total_points=1250,
        current_streak_days=12,
        longest_streak_days=18,
        last_active_date=TODAY,
    ))

    # Award badges
    for badge_key in ["first_steps", "reporter", "week_streak", "prepared"]:
        session.add(UserBadge(
            user_id=uid,
            badge_id=badge_ids[badge_key],
            earned_at=NOW - timedelta(days=random.randint(5, 25)),
        ))

    session.flush()
    print(f"    {len(badges_data)} badges + points + 4 earned badges seeded.")


def seed_river_gauges(session: Session) -> None:
    print("  Seeding river gauges and readings...")

    gauges_data = [
        ("DEMO_POYO_01", "Barranco del Poyo - Paiporta", "jucar", "Barranco del Poyo", "46", 39.428, -0.418, 15.0, 25.0, 50.0),
        ("DEMO_TURIA_01", "Turia - Valencia", "jucar", "Turia", "46", 39.480, -0.370, 80.0, 120.0, 200.0),
        ("DEMO_JUCAR_01", "Jucar - Alzira", "jucar", "Jucar", "46", 39.150, -0.430, 200.0, 350.0, 600.0),
        ("DEMO_MAGRO_01", "Magro - Algemesi", "jucar", "Magro", "46", 39.190, -0.430, 30.0, 50.0, 90.0),
        ("DEMO_SERPIS_01", "Serpis - Gandia", "jucar", "Serpis", "46", 38.970, -0.180, 25.0, 40.0, 70.0),
        ("DEMO_SEGURA_01", "Segura - Murcia", "segura", "Segura", "30", 37.990, -1.130, 60.0, 90.0, 150.0),
        ("DEMO_VINALOPO_01", "Vinalopo - Elche", "jucar", "Vinalopo", "03", 38.270, -0.700, 8.0, 15.0, 30.0),
        ("DEMO_MIJARES_01", "Mijares - Castellon", "jucar", "Mijares", "12", 39.960, -0.050, 40.0, 60.0, 100.0),
    ]

    for gid, name, basin, river, prov, lat, lon, p90, p95, p99 in gauges_data:
        session.add(RiverGauge(
            gauge_id=gid, name=name, basin=basin, river_name=river,
            province_code=prov, latitude=lat, longitude=lon,
            threshold_p90=p90, threshold_p95=p95, threshold_p99=p99,
            is_active=True,
        ))

    # River readings -- last 24 hours, hourly
    readings = []
    for gid, name, basin, river, prov, lat, lon, p90, p95, p99 in gauges_data:
        is_poyo = "POYO" in gid
        is_valencia = prov == "46"
        base_flow = p90 * 0.3  # Normal flow

        for h in range(24, -1, -1):
            ts = NOW - timedelta(hours=h)
            progress = 1.0 - h / 24  # 0 at -24h, 1 at now

            if is_poyo:
                # Barranco del Poyo: dramatic spike (real event hit 2000+ m3/s)
                if progress < 0.3:
                    flow = base_flow + random.uniform(-1, 2)
                elif progress < 0.5:
                    flow = base_flow + (progress - 0.3) / 0.2 * 500
                elif progress < 0.7:
                    flow = 500 + (progress - 0.5) / 0.2 * 1500
                else:
                    flow = 2000 + random.gauss(0, 200)
                flow = max(0, flow)
            elif is_valencia:
                # Valencia province gauges: significant rise
                flow = base_flow + progress * p99 * 1.2 + random.gauss(0, p90 * 0.1)
            else:
                # Other gauges: moderate rise
                flow = base_flow + progress * p95 * 0.5 + random.gauss(0, p90 * 0.05)

            level = (flow / p99) * 3.0 + random.uniform(-0.1, 0.1)

            readings.append(RiverReading(
                gauge_id=gid,
                flow_m3s=round(max(0, flow), 1),
                level_m=round(max(0, level), 2),
                recorded_at=ts,
                source="demo",
            ))

    session.bulk_save_objects(readings)
    session.flush()
    print(f"    {len(gauges_data)} gauges + {len(readings)} readings seeded.")


def seed_water_restrictions(session: Session) -> None:
    print("  Seeding water restrictions...")
    restrictions = [
        WaterRestriction(
            province_code="30", restriction_level=2,
            description="Alerta por sequia en la cuenca del Segura. Restricciones de riego agricola y uso recreativo del agua. Reduccion del 25% en dotaciones urbanas.",
            source="demo", effective_date=NOW - timedelta(days=60), is_active=True,
        ),
        WaterRestriction(
            province_code="04", restriction_level=2,
            description="Alerta por sequia prolongada. Embalses por debajo del 30%. Prohibido llenado de piscinas y riego de jardines.",
            source="demo", effective_date=NOW - timedelta(days=45), is_active=True,
        ),
        WaterRestriction(
            province_code="46", restriction_level=1,
            description="Pre-alerta por situacion hidrologica. Aunque la DANA ha aportado precipitaciones, las infraestructuras danadas limitan la distribucion de agua potable en zonas afectadas.",
            source="demo", effective_date=NOW, is_active=True,
        ),
    ]
    session.add_all(restrictions)
    session.flush()
    print(f"    {len(restrictions)} water restrictions seeded.")


def seed_emergency_plan(session: Session) -> None:
    print("  Seeding emergency plan...")
    maria = session.execute(
        text("SELECT id FROM users WHERE email = :e"),
        {"e": "maria@demo.truerisk.local"},
    ).fetchone()
    if not maria:
        return

    session.add(EmergencyPlan(
        user_id=maria[0],
        household_members=[
            {"name": "Carlos Garcia", "role": "adult", "phone": "+34612345678", "relationship": "spouse"},
            {"name": "Lucia Garcia", "role": "child", "age": 12, "school": "CEIP Les Carolines"},
        ],
        meeting_points=[
            {"name": "Plaza del Ayuntamiento", "address": "Valencia centro", "lat": 39.4699, "lon": -0.3763, "type": "primary"},
            {"name": "Hospital La Fe", "address": "Av. Fernando Abril Martorell 106", "lat": 39.4339, "lon": -0.3432, "type": "secondary"},
        ],
        communication_plan=[
            {"contact": "Carlos", "method": "phone", "number": "+34612345678", "backup": "whatsapp"},
            {"contact": "Abuelos (Castellon)", "method": "landline", "number": "+34964123456"},
            {"contact": "Vecina Ana", "method": "phone", "number": "+34698765432", "role": "neighbor_contact"},
        ],
        evacuation_notes="Ruta principal: V-31 direccion norte hacia A-7. Evitar zona del Barranco del Poyo. Si V-31 cortada, alternativa por CV-400 hacia Torrent. Llevar documentos, medicinas y agua. Luna (perra) en transportin del coche.",
        insurance_info={"company": "Mapfre", "policy_number": "HG-2023-456789", "phone": "900 100 200", "coverage": "hogar_plus"},
        pet_info=[{"name": "Luna", "type": "dog", "chip_id": "941000024681357", "vet": "Clinica Veterinaria Paiporta", "vet_phone": "+34961234567"}],
        important_documents={"stored_at": "Carpeta roja en armario entrada", "digital_backup": True, "items": ["DNI", "Escritura vivienda", "Poliza seguro", "Libro familia", "Cartilla vacunacion Luna"]},
    ))
    session.flush()
    print("    Emergency plan seeded.")


def main():
    global DB_PATH
    parser = argparse.ArgumentParser(description="Seed demo data for TrueRisk DANA scenario")
    parser.add_argument("--reset", action="store_true", help="Remove all demo data and exit")
    parser.add_argument("--db-path", type=str, default=str(DB_PATH), help="Path to SQLite DB")
    args = parser.parse_args()

    DB_PATH = Path(args.db_path)

    if not DB_PATH.exists():
        print(f"ERROR: Database not found at {DB_PATH}")
        print("Start the backend first to create the database: uvicorn app.main:app")
        sys.exit(1)

    engine = get_engine()

    with Session(engine) as session:
        clean_demo_data(session)

        if args.reset:
            print("Demo data removed. Exiting.")
            return

        print("\nSeeding DANA demo scenario...")
        seed_users(session)
        seed_risk_scores(session)
        seed_weather_records(session)
        seed_weather_daily_summaries(session)
        seed_alerts(session)
        seed_community_reports(session)
        seed_risk_forecasts(session)
        seed_risk_narratives(session)
        seed_property_reports(session)
        seed_preparedness(session)
        seed_gamification(session)
        seed_river_gauges(session)
        seed_water_restrictions(session)
        seed_emergency_plan(session)

        session.commit()
        print("\n All demo data seeded successfully!")
        print("Start the backend with: DEMO_MODE=true uvicorn app.main:app --reload")
        print("Then start the frontend: npm run dev")


if __name__ == "__main__":
    main()
