# TrueRisk

[![CI](https://github.com/javierdejesusda/TrueRisk/actions/workflows/ci.yml/badge.svg)](https://github.com/javierdejesusda/TrueRisk/actions/workflows/ci.yml)

**Climate emergency management platform with ML-powered risk scoring for every province in Spain.**

**Live:** [truerisk.cloud](https://truerisk.cloud)

## Screenshots

| Desktop Map View | Province Popup |
|:-:|:-:|
| ![Desktop Map](map-desktop.png) | ![Province Popup](map-popup-open.png) |

| Fly-to Animation | Madrid Detail |
|:-:|:-:|
| ![Fly-to Popup](map-flyto-popup.png) | ![Madrid Popup](map-madrid-popup.png) |

## What It Does

- **Real-time risk scoring** for all 52 Spanish provinces using 7 ML models and live weather data from AEMET and Open-Meteo.
- **Interactive map** with per-province risk levels, alerts, and seismic activity from the IGN catalog.
- **Community reporting** where citizens can submit and view local hazard observations.
- **Emergency advisor** providing AI-driven guidance tailored to current conditions and risk levels.

## Architecture

```mermaid
graph LR
    A[AEMET API] --> D[FastAPI Backend]
    B[Open-Meteo API] --> D
    C[IGN Catalog] --> D
    D --> E[ML Pipeline — 7 Models]
    E --> F[Risk Scores 0–100]
    F --> G[Next.js Frontend]
    D --> G
```

## ML Models

| Hazard | Method | Details |
|--------|--------|---------|
| Flood | XGBoost | 23 features |
| Wildfire | RF + LightGBM | 20 features |
| Drought | SPEI + LSTM | 90-day sequences |
| Heatwave | XGBoost + WBGT | 18 features |
| Seismic | Rule-based | IGN catalog |
| Cold wave | Rule-based | Wind chill + persistence |
| Windstorm | Rule-based | Pressure dynamics |

## Risk Score (0–100)

| Weight | Component |
|--------|-----------|
| 40% | Weather severity (precipitation, temperature, humidity, wind) |
| 25% | Vulnerability (building type, special needs) |
| 20% | Geographic risk (province, historical flood/fire zones) |
| 15% | Pattern analysis (trends, anomalies, historical similarity) |

## Tech Stack

**Frontend:** Next.js 16, TypeScript, React 19, Tailwind CSS v4, Framer Motion, Zustand, Recharts, MapLibre GL, React Hook Form + Zod, next-intl

**Backend:** Python 3.12, FastAPI, SQLAlchemy, Alembic, scikit-learn, XGBoost, LightGBM, PyTorch (LSTM), httpx

**Data Sources:** AEMET (Spanish weather agency), Open-Meteo (forecast), IGN (seismic catalog)

**Infrastructure:** Docker Compose, GitHub Actions CI

## Getting Started

### Frontend

```bash
npm install
npm run dev
```

### Backend

```bash
cd backend
pip install -e ".[dev]"
uvicorn app.main:app --reload
```

## Docker

```bash
docker-compose up
```

## API Endpoints

All endpoints are prefixed with `/api/v1`.

| Route | Description |
|-------|-------------|
| `/api/v1/provinces` | Province data (52 provinces) |
| `/api/v1/weather` | Current weather, forecast, history |
| `/api/v1/risk` | Risk scores by province, all, map |
| `/api/v1/alerts` | CRUD alerts + AEMET alerts + SSE stream |
| `/api/v1/analysis` | ML prediction pipeline |
| `/api/v1/community` | Citizen hazard reports |
| `/api/v1/advisor` | AI emergency guidance |
| `/api/v1/backoffice` | Admin dashboard stats |
| `/api/v1/push` | Web Push subscription management |

## Project Structure

```
src/
  app/
    (auth)/           # Login and registration
    (citizen)/        # Dashboard, alerts, history, profile, map
    backoffice/       # Admin panel
  components/
    ui/               # Button, Card, Badge, Input, Modal, ...
    layout/           # Sidebar, Header, PageTransition
    map/              # Interactive MapLibre map
    weather/          # WeatherCard, WeatherChart
    risk/             # RiskGauge, RiskBreakdown
    alerts/           # AlertBanner, AlertCard
    dashboard/        # Dashboard widgets
    community/        # Community report components
    emergency/        # Emergency advisor
    predictions/      # ML prediction views
  hooks/              # useWeather, useRiskScore, useAlerts, ...
  store/              # Zustand store
  types/              # TypeScript type definitions
  i18n/               # Internationalization (next-intl)
  lib/
    constants/        # Provinces, thresholds

backend/
  app/
    api/              # FastAPI route handlers
    ml/               # 7 ML models + feature engineering
    models/           # SQLAlchemy ORM models
    schemas/          # Pydantic request/response schemas
    services/         # Business logic layer
    scheduler/        # Background tasks
  alembic/            # Database migrations
  tests/              # pytest test suite
  data/               # Seed data and historical records
```
