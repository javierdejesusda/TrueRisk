# TrueRisk - Plataforma de Gestion de Emergencias Climaticas

[![CI](https://github.com/javierdejesusda/TrueRisk/actions/workflows/ci.yml/badge.svg)](https://github.com/javierdejesusda/TrueRisk/actions/workflows/ci.yml)

Plataforma web de gestion de emergencias climaticas con scoring de riesgo ML y recomendaciones personalizadas mediante prompt engineering multi-etapa.

**Live:** [truerisk.cloud](https://truerisk.cloud)

## Hackathon

**RETO: GESTION DE EMERGENCIAS CLIMATICAS** - UPM 2026 by Next Digital Hub

> "Alerta Roja por lluvia" no significa lo mismo para todos - el riesgo depende de la ubicacion, tipo de residencia y necesidades personales.

## Arquitectura

Los datos meteorologicos pasan por un pipeline ML de 6 modelos (EMA, Z-score, Bayesiano, regresion, arbol de decision, KNN) que produce un score de riesgo compuesto 0-100. Este score junto con el perfil del usuario alimenta un pipeline de prompt engineering de 3 etapas que construye prompts ricos en contexto para generar instrucciones de emergencia personalizadas.

### Pipeline ML

| Modelo | Funcion |
|--------|---------|
| EMA | Deteccion de tendencias en variables meteorologicas |
| Z-Score | Deteccion de anomalias estadisticas |
| Bayesiano | Estimacion probabilistica de riesgo por provincia/estacion |
| Regresion Lineal | Proyeccion de tendencias a 6h y 12h |
| Arbol de Decision | Clasificacion del tipo de emergencia |
| KNN | Similitud con desastres historicos espanoles |

### Score de Riesgo Compuesto (0-100)

```
40% Severidad Meteorologica (precipitacion, temperatura, humedad, viento)
25% Vulnerabilidad del Usuario (tipo de residencia, necesidades especiales)
20% Riesgo Geografico (provincia, zonas historicas de inundacion)
15% Analisis de Patrones (tendencia EMA, anomalias z-score, similitud KNN)
```

## Stack Tecnologico

- **Frontend:** Next.js 16, TypeScript, Tailwind CSS v4, Framer Motion, Recharts
- **Backend:** Next.js App Router API Routes, Prisma + SQLite
- **Estado:** Zustand
- **Formularios:** React Hook Form + Zod
- **LLM:** OpenAI SDK (gpt-4.1-nano dev / gpt-5.4 prod) + API del hackathon

## Estructura del Proyecto

```
src/
  app/           # Paginas y rutas API (Next.js App Router)
    (auth)/      # Login y registro
    (citizen)/   # Dashboard, alertas, historial, perfil
    backoffice/  # Panel de administracion
    api/         # Endpoints REST
  lib/
    ml/          # 6 modelos ML + motor de riesgo
    prompts/     # Templates y pipeline de prompt engineering
    constants/   # Provincias, tipos de residencia, umbrales
  components/
    ui/          # Primitivos: Button, Card, Badge, Input, Modal...
    layout/      # Sidebar, Header, PageTransition
    weather/     # WeatherCard, WeatherChart, WeatherTable
    risk/        # RiskGauge, RiskBreakdown, ProvinceMap
    alerts/      # AlertBanner, AlertCard, CreateAlertForm
    recommendations/  # RecommendationCard
  hooks/         # useWeather, useRiskScore, useAlerts, useAuth
  store/         # Zustand store
  types/         # TypeScript types
```

## Vistas

### Ciudadano
- **Dashboard:** Bento grid con clima actual, gauge de riesgo, alertas activas, recomendaciones IA
- **Alertas:** Lista de alertas activas con "Obtener consejo personalizado"
- **Historial:** Graficos de clima y consultas pasadas con el LLM
- **Mapa:** Mapa interactivo de Espana con alertas por provincia y municipio
- **Predicciones:** Visualizaciones de modelos ML y distribucion de Gumbel
- **Perfil:** Editar provincia, tipo de residencia, necesidades especiales

### Backoffice
- **Dashboard:** Vision general con deteccion automatica de alertas
- **Alertas:** CRUD completo, activar/desactivar, creacion automatica
- **Registros:** Historial meteorologico con analisis ML, exportar CSV
- **Ciudadanos:** Tabla de usuarios registrados

## Instalacion Local

```bash
# Instalar dependencias
npm install

# Generar cliente Prisma e inicializar base de datos
npx prisma generate
npx prisma db push

# Poblar base de datos con usuarios demo
npx tsx prisma/seed.ts

# Iniciar servidor de desarrollo
npm run dev
```

## Variables de Entorno

Crear `.env`:

```env
DATABASE_URL="file:./dev.db"
HACKATON_API_BASE="http://ec2-54-171-51-31.eu-west-1.compute.amazonaws.com"
HACKATON_API_KEY="<token>"
OPENAI_API_KEY="<key>"
OPENAI_MODEL="gpt-4.1-nano"
JWT_SECRET="<secret>"
USE_MOCK="false"
```

## Usuarios Demo

| Usuario | Password | Rol |
|---------|----------|-----|
| admin | admin123 | backoffice |
| maria_valencia | demo123 | citizen |
| carlos_madrid | demo123 | citizen |
| ana_sevilla | demo123 | citizen |

## Despliegue

### Vercel (Recomendado)

1. Conectar repositorio en [vercel.com](https://vercel.com)
2. Configurar variables de entorno en el dashboard de Vercel
3. Configurar dominio personalizado: `truerisk.cloud`
4. El deploy se ejecuta automaticamente con cada push a `main`

### Docker

```bash
# Construir imagen
docker build -t truerisk .

# Ejecutar contenedor
docker run -p 3000:3000 \
  -e DATABASE_URL="file:./dev.db" \
  -e JWT_SECRET="<secret>" \
  -e HACKATON_API_BASE="<url>" \
  -e HACKATON_API_KEY="<token>" \
  -e OPENAI_API_KEY="<key>" \
  truerisk

# O con docker-compose
docker compose up -d
```

### CI/CD

El proyecto incluye GitHub Actions que ejecuta en cada push/PR:
- Type checking (TypeScript)
- Linting (ESLint)
- Build de produccion

## API Endpoints

| Endpoint | Metodo | Descripcion |
|----------|--------|-------------|
| `/api/auth/register` | POST | Registro de usuario |
| `/api/auth/login` | POST | Inicio de sesion |
| `/api/auth/session` | GET | Verificar sesion |
| `/api/auth/profile` | GET/PATCH | Perfil de usuario |
| `/api/weather/current` | GET | Clima actual |
| `/api/weather/history` | GET | Historial meteorologico |
| `/api/analysis/risk` | GET | Analisis de riesgo ML |
| `/api/llm/recommend` | POST | Recomendacion personalizada |
| `/api/alerts` | GET/POST/PATCH/DELETE | CRUD de alertas |
| `/api/alerts/detect` | GET | Deteccion automatica |
| `/api/alerts/stream` | GET | SSE tiempo real |
| `/api/consultations` | GET/POST | Historial de consultas |
| `/api/citizens` | GET | Lista de ciudadanos |

## Equipo

Hackathon UPM 2026 - Next Digital Hub
