import time
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.api.errors import register_error_handlers
from app.config import settings
from app.database import engine, Base
from app.api import provinces, weather, alerts, risk, backoffice, analysis, push, community, advisor

_start_time = time.time()

limiter = Limiter(key_func=get_remote_address, default_limits=["30/minute"])


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
    description=(
        "Multi-hazard climate risk intelligence platform for Spain. "
        "Provides real-time risk scoring for 52 provinces using 7 ML models "
        "(XGBoost, LightGBM, LSTM, rule-based), live weather data from "
        "AEMET and Open-Meteo, and community-sourced hazard reports."
    ),
    version="2.0.0",
    lifespan=lifespan,
    contact={
        "name": "TrueRisk Team",
        "url": "https://truerisk.cloud",
    },
    license_info={
        "name": "MIT",
    },
    responses={
        422: {
            "description": "Validation Error",
            "content": {
                "application/json": {
                    "example": {
                        "error": "ValidationError",
                        "detail": "body.province_code: field required",
                        "code": 422,
                        "timestamp": "2026-03-20T12:00:00+00:00",
                    }
                }
            },
        },
        500: {
            "description": "Internal Server Error",
            "content": {
                "application/json": {
                    "example": {
                        "error": "InternalServerError",
                        "detail": "An unexpected error occurred.",
                        "code": 500,
                        "timestamp": "2026-03-20T12:00:00+00:00",
                    }
                }
            },
        },
    },
)

# Error handlers
register_error_handlers(app)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.backend_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(provinces.router, prefix="/api/v1/provinces", tags=["provinces"])
app.include_router(weather.router, prefix="/api/v1/weather", tags=["weather"])
app.include_router(alerts.router, prefix="/api/v1/alerts", tags=["alerts"])
app.include_router(risk.router, prefix="/api/v1/risk", tags=["risk"])
app.include_router(backoffice.router, prefix="/api/v1/backoffice", tags=["backoffice"])
app.include_router(analysis.router, prefix="/api/v1/analysis", tags=["analysis"])
app.include_router(push.router, prefix="/api/v1/push", tags=["push"])
app.include_router(community.router, prefix="/api/v1/community", tags=["community"])
app.include_router(advisor.router, prefix="/api/v1/advisor", tags=["advisor"])


@app.get("/health", tags=["system"], summary="Health check")
async def health():
    """Check API health, database connectivity, and uptime."""
    from sqlalchemy import text
    from app.database import async_session

    db_status = "ok"
    try:
        async with async_session() as session:
            await session.execute(text("SELECT 1"))
    except Exception:
        db_status = "unavailable"

    return {
        "status": "ok",
        "version": "2.0.0",
        "database": db_status,
        "uptime_seconds": round(time.time() - _start_time, 1),
        "models_loaded": 7,
    }
