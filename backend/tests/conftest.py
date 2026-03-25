import pytest
import respx
from httpx import ASGITransport, AsyncClient, Response
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import StaticPool

from app.database import Base

# Import all models so Base.metadata knows about them
import app.models.province  # noqa: F401
import app.models.alert  # noqa: F401
import app.models.weather_record  # noqa: F401
import app.models.risk_score  # noqa: F401
import app.models.community_report  # noqa: F401
import app.models.push_subscription  # noqa: F401
import app.models.user  # noqa: F401
import app.models.weather_daily_summary  # noqa: F401
import app.models.risk_forecast  # noqa: F401
import app.models.river_gauge  # noqa: F401
import app.models.municipality  # noqa: F401
import app.models.safety_check  # noqa: F401
import app.models.sms_subscription  # noqa: F401
import app.models.preparedness  # noqa: F401
import app.models.emergency_plan  # noqa: F401
import app.models.alert_preference  # noqa: F401
import app.models.property_report  # noqa: F401
import app.models.arpsi_flood_zone  # noqa: F401
import app.models.geocode_cache  # noqa: F401
import app.models.api_key  # noqa: F401

TEST_DATABASE_URL = "sqlite+aiosqlite://"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
test_session_factory = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)


@pytest.fixture(autouse=True)
async def setup_database():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


async def override_get_db():
    async with test_session_factory() as session:
        try:
            yield session
        finally:
            await session.close()


@pytest.fixture
async def client():
    from app.main import app
    from app.database import get_db as database_get_db
    from app.api.deps import get_db as deps_get_db

    # Override both get_db references so all routes use the test DB
    app.dependency_overrides[database_get_db] = override_get_db
    app.dependency_overrides[deps_get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest.fixture()
def mock_external_apis():
    """Opt-in fixture — mocks external HTTP calls so endpoints return 200."""
    with respx.mock(assert_all_called=False) as respx_mock:
        # Open-Meteo weather API
        respx_mock.get(url__startswith="https://api.open-meteo.com/").mock(
            return_value=Response(200, json={
                "current": {
                    "temperature_2m": 22.0, "relative_humidity_2m": 55,
                    "precipitation": 0.0, "wind_speed_10m": 12.0,
                    "surface_pressure": 1013.0, "weather_code": 1,
                    "wind_gusts_10m": 20.0, "is_day": 1,
                },
                "current_units": {"temperature_2m": "°C"},
                "daily": {
                    "time": ["2024-01-15"],
                    "temperature_2m_max": [25.0], "temperature_2m_min": [10.0],
                    "precipitation_sum": [0.0], "wind_speed_10m_max": [20.0],
                    "wind_gusts_10m_max": [30.0], "et0_fao_evapotranspiration": [3.0],
                    "soil_moisture_0_to_7cm_mean": [0.3],
                    "weather_code": [1], "uv_index_max": [5.0],
                    "sunrise": ["2024-01-15T08:00"], "sunset": ["2024-01-15T18:00"],
                },
                "hourly": {
                    "time": ["2024-01-15T12:00"],
                    "temperature_2m": [22.0], "precipitation": [0.0],
                    "wind_speed_10m": [12.0], "relative_humidity_2m": [55],
                    "surface_pressure": [1013.0], "dew_point_2m": [12.0],
                    "soil_moisture_0_to_7cm": [0.3], "wind_gusts_10m": [20.0],
                    "cape": [0.0],
                },
            })
        )
        # Open-Meteo archive API
        respx_mock.get(url__startswith="https://archive-api.open-meteo.com/").mock(
            return_value=Response(200, json={
                "daily": {
                    "time": [], "temperature_2m_max": [], "temperature_2m_min": [],
                    "precipitation_sum": [], "wind_speed_10m_max": [],
                },
            })
        )
        # AEMET OpenData
        respx_mock.get(url__startswith="https://opendata.aemet.es/").mock(
            return_value=Response(200, json={
                "estado": 200, "datos": "https://opendata.aemet.es/datos",
                "metadatos": "https://opendata.aemet.es/meta",
            })
        )
        # NASA FIRMS
        respx_mock.get(url__startswith="https://firms.modaps.eosdis.nasa.gov/").mock(
            return_value=Response(200, text="latitude,longitude,brightness,frp\n")
        )
        # USGS Earthquake
        respx_mock.get(url__startswith="https://earthquake.usgs.gov/").mock(
            return_value=Response(200, json={"type": "FeatureCollection", "features": []})
        )
        # REE Energy
        respx_mock.get(url__startswith="https://apidatos.ree.es/").mock(
            return_value=Response(200, json={"included": []})
        )
        # OpenAQ
        respx_mock.get(url__startswith="https://api.openaq.org/").mock(
            return_value=Response(200, json={"results": []})
        )
        # INE Demographics
        respx_mock.get(url__startswith="https://servicios.ine.es/").mock(
            return_value=Response(200, json=[])
        )
        # Copernicus EMS
        respx_mock.get(url__startswith="https://emergency.copernicus.eu/").mock(
            return_value=Response(200, text="<rss><channel></channel></rss>")
        )
        # Copernicus Land (NDVI)
        respx_mock.get(url__startswith="https://land.copernicus.eu/").mock(
            return_value=Response(200, json={})
        )
        # SAIH basin portals (various)
        for domain in ["saihtajo", "saihduero", "chcantabrico", "saihguadiana", "chmediterraneo",
                       "saih.chj.es", "saihebro", "chguadalquivir", "chsegura"]:
            respx_mock.get(host__regex=rf".*{domain}.*").mock(
                return_value=Response(200, text="<html></html>")
            )
        # Catch-all for any other external HTTP
        respx_mock.route().mock(return_value=Response(200, json={}))
        yield respx_mock
