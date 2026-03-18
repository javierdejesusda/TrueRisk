from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base
from app.api import auth, provinces, weather, alerts, risk, backoffice


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup (dev mode with SQLite)
    if "sqlite" in settings.database_url:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    # Seed province data on all database backends
    from app.data.province_data import seed_provinces
    await seed_provinces()

    # Start background scheduler
    from app.scheduler.jobs import setup_scheduler, shutdown_scheduler
    setup_scheduler()

    yield

    shutdown_scheduler()


app = FastAPI(
    title="TrueRisk API",
    description="Multi-hazard risk intelligence platform for Spain",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.backend_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(provinces.router, prefix="/api/v1/provinces", tags=["provinces"])
app.include_router(weather.router, prefix="/api/v1/weather", tags=["weather"])
app.include_router(alerts.router, prefix="/api/v1/alerts", tags=["alerts"])
app.include_router(risk.router, prefix="/api/v1/risk", tags=["risk"])
app.include_router(backoffice.router, prefix="/api/v1/backoffice", tags=["backoffice"])


@app.get("/health")
async def health():
    return {"status": "ok", "version": "2.0.0"}
