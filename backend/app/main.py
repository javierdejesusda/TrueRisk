import time
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.api.errors import register_error_handlers
from app.config import settings
from app.database import engine, Base
from app.rate_limit import limiter
from app.api import provinces, weather, alerts, risk, backoffice, analysis, push, community, advisor
from app.api import ai_summary, sms, data_sources
from app.api import auth, suggestions, preparedness, emergency_plan, safety
from app.api import flash_flood, drought
from app.api import gamification as gamification_api
from app.api import telegram as telegram_api
from app.api import property as property_api
from app.api import location as location_api
from app.api import evacuation as evacuation_api
from app.api import insurance as insurance_api
from app.api.municipality import router as municipality_router
from app.api.climate import router as climate_router

_start_time = time.time()


def _sync_missing_columns(conn):
    """Add any columns present in models but missing from the database.

    ``Base.metadata.create_all`` only creates *tables*, not columns added to
    existing tables.  This helper inspects each mapped table and issues
    ``ALTER TABLE … ADD COLUMN`` for anything the DB is missing, preventing
    500 errors when a migration hasn't been deployed yet.  Only nullable /
    server-defaulted columns are added automatically — others log a warning so
    the operator knows a migration is required.
    """
    import logging
    from sqlalchemy import inspect as sa_inspect, text

    log = logging.getLogger("truerisk.schema_sync")
    inspector = sa_inspect(conn)

    for table in Base.metadata.sorted_tables:
        if not inspector.has_table(table.name):
            continue
        db_col_names = {c["name"] for c in inspector.get_columns(table.name)}
        for col in table.columns:
            if col.name in db_col_names:
                continue
            if col.nullable or col.server_default is not None:
                col_type = col.type.compile(conn.dialect)
                default_clause = ""
                if col.server_default is not None:
                    default_clause = f" DEFAULT {col.server_default.arg}"
                ddl = f'ALTER TABLE {table.name} ADD COLUMN {col.name} {col_type}{default_clause}'
                log.warning("Auto-adding missing column: %s.%s", table.name, col.name)
                conn.execute(text(ddl))
            else:
                log.error(
                    "Column %s.%s is missing and is NOT nullable — "
                    "deploy the Alembic migration to add it",
                    table.name, col.name,
                )


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create any missing tables on startup (idempotent — skips existing tables)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.run_sync(_sync_missing_columns)

    # Seed province data on all database backends
    from app.data.province_data import seed_provinces
    await seed_provinces()

    # Seed safe points for evacuation routing
    from app.data.safe_points_seed import seed_safe_points
    await seed_safe_points()

    # Start background scheduler
    from app.scheduler.jobs import setup_scheduler, shutdown_scheduler
    setup_scheduler()

    yield

    shutdown_scheduler()


app = FastAPI(
    redirect_slashes=False,
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
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)  # type: ignore[arg-type]

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
app.include_router(ai_summary.router, prefix="/api/v1/ai-summary", tags=["ai-summary"])
app.include_router(sms.router, prefix="/api/v1/sms", tags=["sms"])
app.include_router(data_sources.router, prefix="/api/v1/data", tags=["data-sources"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(auth.router, prefix="/api/v1/account", tags=["account"])
app.include_router(suggestions.router, prefix="/api/v1/suggestions", tags=["suggestions"])
app.include_router(preparedness.router, prefix="/api/v1/preparedness", tags=["preparedness"])
app.include_router(emergency_plan.router, prefix="/api/v1/emergency-plan", tags=["emergency-plan"])
app.include_router(safety.router, prefix="/api/v1/safety", tags=["safety"])
app.include_router(property_api.router, prefix="/api/v1/property", tags=["property"])
app.include_router(flash_flood.router, prefix="/api/v1/flash-flood", tags=["flash-flood"])
app.include_router(telegram_api.router, prefix="/api/v1/telegram", tags=["telegram"])
app.include_router(location_api.router, prefix="/api/v1/location", tags=["location"])
app.include_router(evacuation_api.router, prefix="/api/v1/evacuation", tags=["evacuation"])
app.include_router(drought.router, prefix="/api/v1/drought", tags=["drought"])
app.include_router(insurance_api.router, prefix="/api/v1/insurance", tags=["insurance"])
app.include_router(gamification_api.router, prefix="/api/v1/gamification", tags=["gamification"])
app.include_router(municipality_router)
app.include_router(climate_router)


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
