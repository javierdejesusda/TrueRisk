# TrueRisk Frontend Redesign — Design Specification

**Date:** 2026-03-28
**Status:** Approved
**Approach:** Foundation-first, 5 phases

---

## 1. Brand & Identity

- **Name:** TrueRisk
- **Tagline:** "Risk Intelligence Platform"
- **Tone:** Authoritative, technical, intelligence-grade
- **Visual World:** Intelligence Platform (Palantir/Bloomberg aesthetic)
- **Key Principle:** Looks like professionals built it. Not AI-generated. Every element intentional.

---

## 2. Design System Foundation (Phase 1)

### 2.1 Color System — Steel & Surgical

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-void` | `#060810` | Page background, deepest layer |
| `--bg-primary` | `#080B12` | Primary surface |
| `--bg-panel` | `#111827` | Cards, panels, elevated surfaces |
| `--bg-elevated` | `#1E293B` | Hover states, active panels, nested cards |
| `--text-primary` | `#F8FAFC` | Headings, primary content |
| `--text-secondary` | `#94A3B8` | Body text, descriptions |
| `--text-muted` | `#64748B` | Labels, metadata, timestamps |
| `--accent-blue` | `#3B82F6` | Primary accent, links, active states |
| `--accent-blue-light` | `#60A5FA` | Hover states, lighter emphasis |
| `--border` | `rgba(248,250,252,0.06)` | Card borders, dividers |
| `--border-hover` | `rgba(248,250,252,0.12)` | Hover borders |
| `--glass` | `rgba(17,24,39,0.8)` | Glass morphism base |

**Severity colors (functional, unchanged):**

| Level | Hex | Label |
|-------|-----|-------|
| 1 | `#84CC16` | Low |
| 2 | `#FBBF24` | Moderate |
| 3 | `#F97316` | High |
| 4 | `#EF4444` | Very High |
| 5 | `#DC2626` | Critical |

### 2.2 Typography — IBM Plex Family

Load via `next/font/google`: IBM Plex Sans (400, 500, 600, 700) + IBM Plex Mono (400, 500, 600).

| Role | Font | Weight | Tracking | Line Height |
|------|------|--------|----------|-------------|
| Labels/Categories | IBM Plex Mono | 500 | 0.12em | 1 |
| Page titles | IBM Plex Sans | 700 | -0.03em | 1.15 |
| Section headings | IBM Plex Sans | 600 | -0.02em | 1.3 |
| Body text | IBM Plex Sans | 400 | 0 | 1.7 |
| Data values | IBM Plex Mono | 600 | 0 | 1 |
| Small text | IBM Plex Sans | 400 | 0.01em | 1.5 |

### 2.3 Depth System

| Layer | Background | Shadow | Usage |
|-------|-----------|--------|-------|
| Base | `--bg-void` | None | Page background |
| Elevated | `--bg-panel` | `0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)` | Cards, panels |
| Floating | `--bg-elevated` | `0 8px 30px rgba(0,0,0,0.4), 0 0 1px rgba(59,130,246,0.1)` | Modals, dropdowns, tooltips |

### 2.4 Border Radius

- Cards: 8px
- Buttons/Inputs: 6px
- Badges: 4px
- Modals: 12px

### 2.5 Glass Morphism (refined)

```css
.glass {
  background: rgba(17, 24, 39, 0.8);
  backdrop-filter: blur(24px) saturate(140%);
  border: 1px solid rgba(248, 250, 252, 0.06);
}
.glass-heavy {
  background: rgba(17, 24, 39, 0.92);
  backdrop-filter: blur(40px) saturate(160%);
  border: 1px solid rgba(248, 250, 252, 0.08);
}
```

### 2.6 Component Library Updates

All 14 existing components updated with new tokens. No components removed, no new components in Phase 1 (except Walkthrough enhancement in Phase 2).

**Components to restyle:**
1. `Button` — New palette, IBM Plex Sans 500, 6px radius. Variants: primary (#3B82F6 solid), secondary (ghost + border), danger (red), outline.
2. `Card` — `--bg-panel`, `--border`, 8px radius. Variants: default, glass, glass-heavy. Hoverable: border transitions to `--border-hover`.
3. `Badge` — 4px radius, severity-based colors at 12% opacity bg / 100% text. IBM Plex Mono 500.
4. `Input` — `--bg-primary` bg, `--border`, focus: 2px `--accent-blue` ring. IBM Plex Sans 400.
5. `Select` — Same as Input. Dropdown: `--bg-panel`, `--border`.
6. `Modal` — 12px radius, `--bg-panel`, Framer Motion scale 0.97→1 + opacity. Backdrop: rgba(0,0,0,0.6).
7. `Toast` — Severity-based. Spring animation. IBM Plex Sans body, IBM Plex Mono timestamp.
8. `Pagination` — Current page: `--accent-blue` bg. Others: ghost.
9. `Tooltip` — `--bg-elevated`, 6px radius, IBM Plex Sans 13px. 4 positions.
10. `Skeleton` — Shimmer animation on `--bg-panel` base. 1.5s infinite.
11. `EmptyState` — Floating icon animation. IBM Plex Sans body.
12. `Walkthrough` — Enhanced in Phase 2 (spotlight tour).
13. `AuthCard` — Border glow animation restyled with blue instead of current green.
14. `OfflineIndicator` — More prominent, IBM Plex Mono label.

### 2.7 Interaction States (Every Interactive Element)

```
Hover:   border-color → --border-hover, OR transform scale(1.02), OR bg opacity shift
Focus:   2px solid --accent-blue outline, 2px offset
Active:  transform scale(0.97), 100-160ms duration
```

### 2.8 Animation Rules

- Only animate `transform` and `opacity`
- Never `transition-all`
- Page transitions: fade + translateY(12px), 200ms ease-out
- Card hover: 150ms ease
- Button active: scale(0.97), 120ms
- `prefers-reduced-motion`: all animations disabled
- Spring config for modals/toasts: stiffness 400, damping 30

---

## 3. Hero + Landing + Onboarding (Phase 2)

### 3.1 Globe Enhancement

- Restyle globe: dark navy oceans (#080B12), slate landmasses (#1E293B), province boundaries (#3B82F6 at 30%)
- On zoom into Spain: province polygons fill with severity-colored gradients from live composite scores
- Glowing dots pulse on provinces with active alerts
- HUD overlay fades in: IBM Plex Mono labels `52 PROVINCES · 7 MODELS · LIVE`
- Total animation: ~3 seconds rotation → zoom → data overlay

### 3.2 Hero Text

```
[IBM Plex Mono, 11px, #3B82F6, letter-spacing 0.15em]
RISK INTELLIGENCE PLATFORM

[IBM Plex Sans, 48-64px, weight 700, #F8FAFC, tracking -0.03em]
See Every Threat.
Before It Hits.

[IBM Plex Sans, 16px, weight 400, #94A3B8, line-height 1.7]
Real-time multi-hazard monitoring for Spain. 7 ML models analyzing
flood, wildfire, drought, heatwave, seismic, cold wave, and windstorm
risk across 52 provinces.

[Primary CTA] "Enter Platform" → /login (solid #3B82F6, white text)
[Secondary CTA] "See How It Works" → scroll to features (ghost, border only)
```

### 3.3 Below-Fold Landing Sections

1. **Capability Strip** — 4 glass cards: Real-Time Monitoring, 7 ML Models, Emergency Response, Community Intelligence. Each with icon + IBM Plex Mono label + description. Staggered reveal on scroll.
2. **Live Stats Bar** — Full-width: `52 Provinces Monitored · 14 Statistical Methods · 24/7 Alert Coverage`. Numbers count up on scroll.
3. **Province Coverage Map** — Static Spain SVG, provinces colored by current risk, hover reveals name + score.

### 3.4 Auth Flow (Preserved)

- Landing (/) → "Enter Platform" → /login
- Login: credentials + Google OAuth + GitHub OAuth
- Register: nickname, email, password, province
- After auth → redirect to /dashboard
- All existing auth flows unchanged

### 3.5 Guided Spotlight Walkthrough

- Triggers on first authenticated visit to /dashboard
- 6 steps:
  1. NavPill → "Your command center navigation"
  2. Province selector → "Choose your province for localized data"
  3. Risk Overview → "Real-time risk scores across 7 hazards"
  4. Alert Feed → "Live alerts from ML models and AEMET"
  5. Quick Actions → "Emergency tools at your fingertips"
  6. Map nav item → "Your primary tool — the full interactive risk map"
- Spotlight dims background, highlighted element has bright border
- "Next" / "Skip" / "3 of 6" step counter
- Zustand: `hasCompletedWalkthrough: true` → never shows again
- Re-trigger from Settings/Profile page

---

## 4. Map Section Redesign (Phase 3)

### 4.1 Layout

- Full-width map: `calc(100vh - 4rem)` height
- Right sidebar panel system: 360px wide, slide-in, glass morphism
- Panels stack vertically with collapse/expand toggles
- Max height: `calc(100vh - 6rem)` with internal scroll
- Bottom data strip: selected province name + composite score + severity badges + last update

### 4.2 Panels (Right Sidebar)

1. **Risk Panel** — Province risk scores, 7 hazard gauges, composite score prominent
2. **Weather Panel** — Current conditions (temp, wind, precip, humidity)
3. **Alerts Panel** — Active alerts for selected/visible provinces

### 4.3 Map Styling

- Province boundaries: 1px `--border` default, 2px `--accent-blue` hover, 3px white selected
- Risk fills: severity colors at 40% opacity
- Layer toggles: floating pills top-left (Risk Fill, Alerts, Fire Hotspots, Earthquakes, Reservoirs, Weather Stations)
- MapLibre popups: glass panel, IBM Plex Mono data values, severity badges

### 4.4 Responsive

- Desktop 1024px+: map + right sidebar
- Tablet 768-1023px: map + bottom sheet panels
- Mobile <768px: map + full-screen overlay panels with back button

### 4.5 Preserved Features

All existing map layers: province boundaries, alert icons, fire hotspots, earthquake epicenters, reservoir levels, weather stations. All hooks: useAemetAlerts, useMapAlerts, useRiskMap, useAllWeather, useFireHotspots, useEarthquakes, useReservoirs.

---

## 5. Dashboard Reorganization (Phase 4)

### 5.1 Layout — Command Center Grid

```
┌─────────────────────────────────────────────────┐
│  Province Selector (sticky top bar)              │
├─────────────────────────────────────────────────┤
│  DANA Warning Banner (conditional, full width)   │
├───────────────────────┬─────────────────────────┤
│  Risk Overview        │  Risk Narrative (AI)     │
│  (7 hazards +         │  (morning briefing or    │
│   composite score)    │   emergency alert)       │
│  [2 rows tall]        ├─────────────────────────┤
│                       │  Weather Card            │
├───────────────────────┼─────────────────────────┤
│  Alert Feed           │  Quick Actions           │
│  (latest 5 alerts)    │  (icon + label grid)     │
├───────────────────────┼─────────────────────────┤
│  Personalized         │  Preparedness Widget     │
│  Suggestions (AI)     │  + Data Quality Panel    │
└───────────────────────┴─────────────────────────┘
```

### 5.2 Key Changes

- Province selector: sticky top bar (not buried in cards)
- Risk Overview: left column, 2-row span, most prominent
- AI Narrative: top right, prominent placement
- Quick Actions: icon + label grid (not just buttons)
- All 10 existing components preserved, reorganized for hierarchy

---

## 6. Intelligence Center / Predictions (Phase 4)

### 6.1 Page Structure

A. **Header + Province Selector** (sticky top)
B. **AI Weather Summary** (streaming LLM, existing)
C. **ML Pipeline Explainer** (enhanced visual flow diagram)
   - 5 stages: Data Sources → Feature Engineering → Model Training → Prediction → Validation
   - Each stage clickable for detail
D. **7-Day Risk Forecast** (ForecastChart + AttentionWeightsChart, existing)
E. **7 ML Model Cards** (expanded detail)
F. **TFT Deep Dive** (new section)
G. **7 Statistical Methods** (expanded with explanations)
H. **Rule vs ML Comparison** (existing explainability, enhanced)
I. **Hydrological Nowcast** (existing, restyled)

### 6.2 ML Model Cards — Expanded Format

Each of the 7 hazard models (Flood/XGBoost, Wildfire/RF+LightGBM, Drought/SPEI+LSTM, Heatwave/XGBoost+WBGT, Seismic/Rules, ColdWave/Rules, Windstorm/Rules):

**Collapsed:**
- Hazard icon + name + model type badge + current risk score + mini accuracy bar

**Expanded:**
- **How it works** — 2-3 sentence plain-language explanation
- **Data sources** — AEMET, Open-Meteo, IGN, FIRMS with icons
- **Feature importance** — Top 10 features bar chart (SHAP values)
- **Performance metrics** — Accuracy, F1, AUC-ROC as gauges
- **Model architecture** — Technical description (ensemble method, tree depth, learning rate for ML; rule logic for rule-based)
- **Limitations** — Honest disclosure of blind spots and data gaps
- **Explainability toggle** — SHAP waterfall: "Why is flood risk 72 right now?"
- **Historical accuracy** — 90-day chart: predictions vs actual events

### 6.3 TFT Deep Dive

- **What is TFT?** — Visual explanation of multi-horizon forecasting
- **How TrueRisk uses it:** input (weather sequences, calendar, province attributes) → processing (variable selection → LSTM encoder → multi-head attention → quantile outputs) → output (probabilistic forecasts)
- **Attention visualization** — Enhanced AttentionWeightsChart: which past time steps the model weighs, interactive hover
- **Confidence intervals** — Fan chart with 10th/50th/90th percentile
- **Multi-horizon comparison** — 6h vs 12h vs 24h vs 48h vs 7d accuracy

### 6.4 Statistical Methods — 7 Cards

Each method: name + type badge + "What it does" (1 sentence) + "When it's useful" (1 sentence) + interactive chart (existing).

1. Gumbel — Extreme value, return period estimation
2. Regression — Trend detection over time
3. Bayesian — Probabilistic dependencies, cascading risks
4. EMA — Real-time trend smoothing
5. Z-Score — Anomaly detection vs historical norms
6. Decision Tree — Feature importance ranking
7. KNN — Historical pattern matching

---

## 7. Reports, LLM Features, SOS (Phase 5)

### 7.1 Report Section

- `/report` and `/report/[reportId]` styled with same panel system as all sections
- Same nav bar, same layout — no "leaving the app" feel
- All existing components preserved: PropertyRiskSummary, HazardBreakdown, FloodZoneCard, WildfireProximityCard, RiskComparison, ReportMap, RegulatoryNotice
- Address search: glass panel input with autocomplete

### 7.2 New LLM Features

- **AI Risk Summary** (new route `/ai-summary`): Full-page LLM analysis of current conditions. Streaming markdown via Streamdown. Uses existing OpenAI integration.
- **Conversational Advisor** (enhance existing AdvisorPanel on `/emergency`): Expand from single-response to multi-turn chat. User asks follow-up questions.
- **"Explain this" buttons** on complex data points across the platform (risk scores, model outputs, alert details): on-demand LLM micro-explanations.

### 7.3 SOS / Emergency Enhancement

- 112 button: full-width, larger, pulsing blue glow, more prominent
- Emergency contacts: icons per type (hospital, fire, police, civil protection)
- First aid cards: step-by-step with clearer structure
- SOS flow messages: more detailed, IBM Plex Mono for critical instructions
- Province-specific emergency info: more visible (not buried)
- Offline indicator: enhanced prominence

### 7.4 Bug Fixes

- Remove login button appearing when already authenticated
- Fix overlapping boxes/panels on map page
- Fix layout distribution issues across all sections
- Ensure all buttons have hover, focus-visible, and active states
- Consistent severity badges across all pages

---

## 8. Cross-Cutting Requirements (All Phases)

### 8.1 Performance

- LCP < 2.5s on all pages
- Lazy-load heavy components: maps, charts, globe
- Skeleton loaders on every async section — never blank screens
- Dynamic imports with `ssr: false` for MapLibre, Globe, Recharts

### 8.2 Accessibility

- `prefers-reduced-motion` respected everywhere
- Minimum 4.5:1 color contrast ratio (verified: #94A3B8 on #080B12 = 7.1:1)
- 44x44px minimum touch targets on mobile
- ARIA labels on all interactive elements
- Focus ring visible: 2px `--accent-blue` outline
- `aria-live="polite"` on alert feeds and streaming content
- Keyboard navigable: all modals, dropdowns, panels

### 8.3 Internationalization

- All new strings added to both `messages/en.json` and `messages/es.json`
- New i18n namespaces as needed: `IntelligenceCenter`, `Walkthrough` (enhanced), `AiSummary` (enhanced)
- Language switcher preserved in NavPill

### 8.4 Navigation

- Nav order: Map (first), Dashboard, Predictions, Alerts, Report, Preparedness, Safety, Evacuation, Drought, SOS, Phrases
- All 11 nav items preserved
- Mobile: collapsible nav
- All existing routes preserved, no route changes except adding `/ai-summary`

---

## 9. Phase Execution Order

| Phase | Scope | Dependencies |
|-------|-------|-------------|
| 1 | Design System Foundation: CSS variables, fonts, 14 components | None |
| 2 | Hero + Landing + Onboarding: globe, landing page, walkthrough | Phase 1 |
| 3 | Map Section: layout, panels, responsive, layers | Phase 1 |
| 4 | Dashboard + Intelligence Center: grid, predictions, ML explainers | Phase 1 |
| 5 | Reports + LLM + SOS: inline reports, new LLM features, emergency, bug fixes | Phase 1 |

Phases 3, 4, and 5 can be parallelized after Phase 1 completes. Phase 2 depends only on Phase 1.

---

## 10. Out of Scope

- Backend API changes (no new endpoints except what's needed for `/ai-summary` streaming)
- Database schema changes
- ML model retraining or new models
- Mobile native app
- Third-party integrations beyond existing (AEMET, OpenAI, Resend, Twilio, Telegram)
- New authentication providers
- Admin/backoffice redesign (stays as-is)
