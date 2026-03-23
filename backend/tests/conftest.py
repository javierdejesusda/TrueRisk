import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.database import Base, get_db

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

TEST_DATABASE_URL = "sqlite+aiosqlite:///./test.db"

test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
test_session_factory = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)


@pytest.fixture(autouse=True, scope="session")
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

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()
