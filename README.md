<div align="center">

![TrueRisk](hero.png)

[![CI](https://github.com/javierdejesusda/TrueRisk/actions/workflows/ci.yml/badge.svg)](https://github.com/javierdejesusda/TrueRisk/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.12](https://img.shields.io/badge/Python-3.12-3776AB.svg)](https://python.org)
[![Node 22](https://img.shields.io/badge/Node-22-339933.svg)](https://nodejs.org)

**Multi-hazard risk intelligence platform with real-time weather monitoring, ML-powered risk scoring, and personalized emergency guidance for every province in Spain.**

[Live Platform](https://truerisk.cloud) · [API Docs](https://truerisk.cloud/docs) · [Technical Report](docs/technical-report/main.pdf)

</div>

---

## Features

- **7 ML risk models** — Flood, wildfire, drought, heatwave, seismic, cold wave, and windstorm risk scored 0–100 for all 52 Spanish provinces
- **Real-time data fusion** — 16 live data sources including AEMET weather alerts, Open-Meteo forecasts, IGN and USGS seismic feeds, NASA FIRMS fire hotspots, Copernicus CAMS/EFAS/EMS, OpenAQ air quality, SAIH river gauges (9 basins), MITECO reservoirs, REE energy grid, and ECMWF seasonal outlooks
- **Interactive risk map** — Province-level risk visualization with MapLibre GL, alert overlays, and seismic activity markers
- **AI emergency advisor** — Context-aware safety guidance powered by OpenAI, tailored to current conditions and location
- **Community hazard reports** — Citizens can submit and view local hazard observations with photo evidence
- **Model explainability** — Per-feature importance breakdown showing why each risk score was computed
- **Temporal Fusion Transformer forecasting** — Deep learning sequence models for multi-day risk prediction
- **Multi-channel alerts** — Web Push notifications, email (Resend), SMS (Twilio), and Telegram bot integration
- **Drought dashboard** — Dedicated monitoring with SPEI index, reservoir levels, and LSTM-based predictions
- **Property risk assessment** — Location-specific risk analysis for real estate and insurance applications
- **Emergency preparedness** — Personalized emergency plans, evacuation routes, and safety guidelines
- **Admin backoffice** — Alert management, data records, and system monitoring dashboard
- **Bilingual** — Full English and Spanish support via next-intl
- **Authentication** — NextAuth v5 with JWT, Google OAuth, and GitHub OAuth

## Architecture

```mermaid
graph LR
    subgraph Weather
        A1[AEMET]
        A2[Open-Meteo]
        A3[ECMWF Seasonal]
    end
    subgraph Hazards
        B1[IGN Seismic]
        B2[USGS Earthquake]
        B3[NASA FIRMS]
        B4[Copernicus EMS]
    end
    subgraph Environment
        C1[Copernicus CAMS]
        C2[Copernicus EFAS]
        C3[Copernicus Land / NDVI]
        C4[OpenAQ]
        C5[NASA POWER]
    end
    subgraph Infrastructure
        D1[REE Energy Grid]
        D2[MITECO Reservoirs]
        D3[SAIH River Basins]
        D4[INE Demographics]
    end
    Weather --> BE[FastAPI Backend]
    Hazards --> BE
    Environment --> BE
    Infrastructure --> BE
    BE --> E[Feature Engineering]
    E --> F1[XGBoost — Flood]
    E --> F2[RF + LightGBM — Wildfire]
    E --> F3[SPEI + LSTM — Drought]
    E --> F4[XGBoost — Heatwave]
    E --> F5[Rule-based — Seismic]
    E --> F6[Rule-based — Cold Wave]
    E --> F7[Rule-based — Windstorm]
    F1 --> G[Composite Risk Engine]
    F2 --> G
    F3 --> G
    F4 --> G
    F5 --> G
    F6 --> G
    F7 --> G
    G --> H[Risk Scores 0-100]
    H --> I[Next.js Frontend]
    BE --> I
```

## Model Performance

| Hazard | Method | Features | Accuracy | F1 | AUC-ROC |
|--------|--------|----------|----------|-----|---------|
| Flood | XGBoost | 23 | 89% | 0.84 | 0.93 |
| Wildfire | RF + LightGBM | 20 | 91% | 0.87 | 0.95 |
| Drought | SPEI + LSTM | 6 (90-day seq) | 86% | 0.81 | 0.90 |
| Heatwave | XGBoost + WBGT | 18 | 88% | 0.83 | 0.92 |
| Seismic | Rule-based | 8 | 92% | 0.78 | — |
| Cold Wave | Rule-based | 14 | 90% | 0.76 | — |
| Windstorm | Rule-based | 14 | 91% | 0.79 | — |

### ML Pipeline

1. **Data Ingestion** — Weather from AEMET and Open-Meteo, seismic data from IGN and USGS, fire hotspots from NASA FIRMS, air quality from OpenAQ and Copernicus CAMS, flood indicators from Copernicus EFAS and SAIH river gauges, vegetation health from Copernicus Land NDVI, reservoir levels from MITECO, seasonal outlooks from ECMWF, and energy grid state from REE
2. **Feature Engineering** — 26+ temporal features from hourly history (precipitation accumulation, consecutive hot/cold/dry days, pressure dynamics, soil moisture trends)
3. **Model Inference** — 7 hazard-specific models run independently, each producing a 0-100 risk score
4. **Composite Scoring** — Dominant hazard weighting with diminishing secondary contributions, province-specific hazard weights
5. **Explainability** — Deterministic feature importance computed from the same thresholds used in scoring

### Risk Score (0–100)

| Weight | Component |
|--------|-----------|
| 40% | Weather severity (precipitation, temperature, humidity, wind) |
| 25% | Vulnerability (building type, special needs) |
| 20% | Geographic risk (province, historical flood/fire zones) |
| 15% | Pattern analysis (trends, anomalies, historical similarity) |

## Tech Stack

### Frontend

| Technology | Version |
|-----------|---------|
| [Next.js](https://nextjs.org) | 16 |
| [React](https://react.dev) | 19 |
| [TypeScript](https://typescriptlang.org) | 5 |
| [Tailwind CSS](https://tailwindcss.com) | 4 |
| [Framer Motion](https://motion.dev) | 12 |
| [MapLibre GL](https://maplibre.org) | 5 |
| [Recharts](https://recharts.org) | 3 |
| [Zustand](https://zustand.docs.pmnd.rs) | 5 |
| [next-intl](https://next-intl.dev) | 4 |
| [NextAuth](https://authjs.dev) | 5 (beta) |
| [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev) | 7 / 4 |

### Backend

| Technology | Version |
|-----------|---------|
| [Python](https://python.org) | 3.12 |
| [FastAPI](https://fastapi.tiangolo.com) | 0.115+ |
| [SQLAlchemy](https://sqlalchemy.org) | 2.0+ (async) |
| [Alembic](https://alembic.sqlalchemy.org) | 1.14+ |
| [XGBoost](https://xgboost.readthedocs.io) | 2.1+ |
| [LightGBM](https://lightgbm.readthedocs.io) | 4.5+ |
| [PyTorch](https://pytorch.org) | 2.4+ |
| [PyTorch Forecasting](https://pytorch-forecasting.readthedocs.io) | 1.1+ (TFT) |
| [Torch Geometric](https://pyg.org) | 2.6+ (GNN) |
| [scikit-learn](https://scikit-learn.org) | 1.5+ |
| [SHAP](https://shap.readthedocs.io) | 0.45+ |

### Infrastructure

| Technology | Purpose |
|-----------|---------|
| PostgreSQL 16 | Production database |
| Docker Compose | Container orchestration |
| GitHub Actions | CI/CD pipeline |
| Sentry | Error tracking and monitoring |

### Data Sources

#### Weather & Climate

| Source | Data | API Key |
|--------|------|---------|
| [AEMET](https://opendata.aemet.es) | Real-time weather observations, CAP alerts, wildfire danger index | `AEMET_API_KEY` (required) |
| [Open-Meteo](https://open-meteo.com) | Hourly/daily forecasts, historical archive, ensemble forecasts, flood river discharge | Free |
| [ECMWF Seasonal](https://cds.climate.copernicus.eu) | 3–6 month temperature and precipitation anomaly outlooks (via Copernicus CDS) | `CDSAPI_KEY` |

#### Seismic

| Source | Data | API Key |
|--------|------|---------|
| [IGN](https://www.ign.es) | Spanish seismic catalog — earthquake locations, magnitudes, depths (90-day window) | Free |
| [USGS](https://earthquake.usgs.gov) | Iberian Peninsula earthquake data, GeoJSON feed | Free |

#### Fire & Vegetation

| Source | Data | API Key |
|--------|------|---------|
| [NASA FIRMS](https://firms.modaps.eosdis.nasa.gov) | Active fire hotspots from VIIRS and MODIS satellites (1-day data, Spain bbox) | `FIRMS_MAP_KEY` (required) |
| [Copernicus Land / NDVI](https://land.copernicus.eu) | NDVI300 vegetation health index via WMS for fire and drought stress | Free |
| [NASA POWER](https://power.larc.nasa.gov) | Solar irradiance, temperature extremes, precipitation, and evapotranspiration (30-day lag) | Free |

#### Air Quality

| Source | Data | API Key |
|--------|------|---------|
| [OpenAQ](https://openaq.org) | Ground-level sensor measurements: PM2.5, PM10, NO2, O3, CO, SO2, NO (25 km radius) | `OPENAQ_API_KEY` |
| [Copernicus CAMS](https://atmosphere.copernicus.eu) | Atmospheric quality forecasts: PM2.5, PM10, O3, NO2, CO | Free |

#### Flood & Water

| Source | Data | API Key |
|--------|------|---------|
| [Copernicus EFAS](https://www.efas.eu) | European flood indicators and 7-day river discharge forecasts | Free |
| [MITECO / ArcGIS](https://www.miteco.gob.es) | Live reservoir capacity for 374 reservoirs across 16 peninsular basins (weekly) | Free |
| [SAIH — Ebro](https://www.saihebro.com) | Real-time river flow and gauge readings — Ebro basin | Free |
| [SAIH — Segura](https://www.chsegura.es) | Real-time river flow and gauge readings — Segura basin | Free |
| [SAIH — Júcar](https://saih.chj.es) | Real-time river flow and gauge readings — Júcar basin | Free |
| [SAIH — Guadalquivir](https://www.chguadalquivir.es) | Real-time river flow and gauge readings — Guadalquivir basin | Free |
| [SAIH — Tajo](https://saihtajo.chtajo.es) | Real-time river flow and gauge readings — Tajo basin | Free |
| [SAIH — Duero](https://www.saihduero.es) | Real-time river flow and gauge readings — Duero basin | Free |
| [SAIH — Cantábrico](https://www.chcantabrico.es) | Real-time river flow and gauge readings — Norte basin | Free |
| [SAIH — Guadiana](https://saihguadiana.chguadiana.es) | Real-time river flow and gauge readings — Guadiana basin | Free |
| [SAIH — Mediterráneo](https://www.chmediterraneo.es) | Real-time river flow and gauge readings — Sur basin | Free |

#### Emergency & Infrastructure

| Source | Data | API Key |
|--------|------|---------|
| [Copernicus EMS](https://emergency.copernicus.eu) | Active disaster and emergency activation perimeters (RSS) | Free |
| [REE](https://www.ree.es) | Spanish electricity demand and generation mix (solar, wind, nuclear, hydro, etc.) | Free |

#### Demographics & Geography

| Source | Data | API Key |
|--------|------|---------|
| [INE](https://www.ine.es) | Province population, age distribution, and gender breakdown for all 52 provinces | Free |
| [IGN GeoJSON](https://www.ign.es) | Spain province boundaries (WGS84, INE-coded) — bundled static file | — |
| [ARPSI / MITECO](https://www.miteco.gob.es) | Areas of Significant Flood Risk (ARPSI) zone polygons (GeoJSON, EPSG:25830 / 4326) | — |

## Prerequisites

- **Node.js** 22+
- **Python** 3.12+
- **PostgreSQL** 16+ (or use Docker)
- **API keys (required):**
  - [AEMET OpenData](https://opendata.aemet.es/centrodedescargas/inicio) — weather data and CAP alerts
  - [NASA FIRMS](https://firms.modaps.eosdis.nasa.gov/api/area/) — active fire hotspots
- **API keys (optional — enhance coverage):**
  - [OpenAQ](https://openaq.org) — ground-level air quality measurements
  - [Copernicus CDS](https://cds.climate.copernicus.eu) — ECMWF seasonal forecasts

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/javierdejesusda/TrueRisk.git
cd TrueRisk

# Frontend
npm install

# Backend
cd backend
pip install -e ".[dev]"
```

### 2. Configure environment

```bash
# Frontend — copy and fill in your API keys
cp .env.example .env

# Backend — copy and fill in your API keys
cp backend/.env.example backend/.env
```

See `.env.example` and `.env.production.example` for all available configuration options.

### 3. Set up the database

```bash
cd backend

# Run migrations (uses DATABASE_URL from .env, defaults to SQLite for development)
alembic upgrade head
```

### 4. Start development servers

```bash
# Frontend (from project root)
npm run dev

# Backend (from backend/)
cd backend
uvicorn app.main:app --reload
```

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:8000/docs](http://localhost:8000/docs) (Swagger UI)
- ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

### Docker

```bash
# Development (frontend + backend + PostgreSQL)
docker compose up

# Production
docker compose -f docker-compose.prod.yml up
```

## Testing

```bash
# Frontend — unit and integration tests
npm test

# Frontend — with coverage
npx vitest run --coverage

# Frontend — type checking
npx tsc --noEmit

# Frontend — linting
npx eslint .

# Backend — test suite
cd backend && pytest

# Backend — with coverage
cd backend && pytest --cov=app --cov-report=term-missing

# Backend — type checking
cd backend && mypy app

# Backend — linting
cd backend && ruff check .
```

## API Endpoints

All endpoints are prefixed with `/api/v1`.

| Route | Description |
|-------|-------------|
| `/api/v1/provinces` | Province data (52 provinces) |
| `/api/v1/weather` | Current weather, forecast, history |
| `/api/v1/risk` | Risk scores by province, all, map view |
| `/api/v1/risk/{code}/explain` | Per-feature importance for a province |
| `/api/v1/risk/models` | ML model registry with metadata |
| `/api/v1/alerts` | CRUD alerts + AEMET alerts + SSE stream |
| `/api/v1/analysis` | ML prediction pipeline |
| `/api/v1/community` | Citizen hazard reports |
| `/api/v1/advisor` | Emergency guidance |
| `/api/v1/chat` | AI-powered conversation |
| `/api/v1/drought` | Drought monitoring data |
| `/api/v1/property` | Property risk assessment |
| `/api/v1/push` | Web Push subscription management |
| `/api/v1/backoffice` | Admin dashboard stats |
| `/health` | Health check |
| `/ready` | Readiness check (DB, models) |

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── (auth)/           # Login, registration, password reset
│   │   ├── (citizen)/        # Dashboard, map, alerts, chat, predictions, reports
│   │   ├── (legal)/          # Privacy, terms, cookies, accessibility
│   │   ├── backoffice/       # Admin panel
│   │   └── api/              # Server-side API routes
│   ├── components/           # 140+ React components
│   ├── hooks/                # 50+ custom hooks
│   ├── store/                # Zustand state management
│   ├── types/                # TypeScript type definitions
│   ├── i18n/                 # Internationalization config
│   └── lib/                  # Utilities and constants
├── backend/
│   ├── app/
│   │   ├── api/              # 30+ FastAPI route handlers
│   │   ├── ml/
│   │   │   ├── models/       # 7 hazard models + TFT + GNN
│   │   │   ├── features/     # Feature engineering
│   │   │   └── training/     # Training scripts
│   │   ├── models/           # SQLAlchemy ORM models
│   │   ├── schemas/          # Pydantic request/response schemas
│   │   ├── services/         # Business logic + explainability
│   │   ├── scheduler/        # Background tasks
│   │   └── security/         # Auth and encryption
│   ├── alembic/              # Database migrations
│   └── tests/                # pytest test suite
├── messages/                 # i18n translations (en, es)
├── docs/
│   └── technical-report/     # Academic paper (PDF)
└── docker-compose.yml        # Docker development environment
```

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Security

To report security vulnerabilities, please see [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE) — Copyright (c) 2026 Javier de Jesus
