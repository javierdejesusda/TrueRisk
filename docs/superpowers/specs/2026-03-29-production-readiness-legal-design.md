# Production Readiness — Legal & Compliance Design Spec

**Date:** 2026-03-29
**Status:** Approved
**Scope:** Legal pages, cookie banner, enhanced footer, full i18n (en/es)

## Context

TrueRisk is a multi-hazard risk intelligence platform for Spain, deployed at truerisk.cloud. It is an open-source community project (MIT license) that collects extensive personal data including health information, GPS locations, emergency contacts, building details, and economic vulnerability indicators. As a Spain-targeted platform, GDPR compliance is mandatory. Currently the app has zero legal pages, no cookie consent banner, and a minimal landing footer.

## Architecture

### Approach: Dedicated `(legal)` Route Group

All legal pages live under a Next.js route group `(legal)` with its own minimal layout (no auth, no NavPill, no sidebar). Pages are public and individually addressable.

```
src/app/(legal)/
  layout.tsx              ← minimal layout with LegalHeader + LegalFooter
  privacy/page.tsx        ← GDPR privacy policy
  terms/page.tsx          ← terms of use
  cookies/page.tsx        ← cookie policy
  license/page.tsx        ← MIT license + open source info
  about/page.tsx          ← credits, third-party services, attribution
  accessibility/page.tsx  ← accessibility statement
```

### New Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `CookieBanner` | `src/components/legal/cookie-banner.tsx` | Informational cookie banner in root layout |
| `LegalPageShell` | `src/components/legal/legal-page-shell.tsx` | Shared wrapper for all legal pages (heading, last-updated, ToC) |

### Modified Components

| Component | Change |
|-----------|--------|
| `src/components/landing/footer.tsx` | Add legal links row (Privacy, Terms, Cookies, License, About, Accessibility) |
| `src/app/layout.tsx` | Mount CookieBanner component |

### i18n

All legal content goes in `messages/en.json` and `messages/es.json` under a `Legal` namespace. Cookie banner strings under `Legal.cookieBanner`. Structure:

```
Legal.cookieBanner.message
Legal.cookieBanner.learnMore
Legal.cookieBanner.dismiss
Legal.privacy.title
Legal.privacy.lastUpdated
Legal.privacy.sections.dataController.*
Legal.privacy.sections.dataWeCollect.*
Legal.privacy.sections.legalBasis.*
... (same pattern for all pages)
Legal.terms.*
Legal.cookies.*
Legal.license.*
Legal.about.*
Legal.accessibility.*
Legal.footer.* (link labels)
```

## Page Content

### 1. Privacy Policy (`/privacy`)

**Sections:**
1. **Data Controller** — TrueRisk open-source community project, GitHub repo as primary contact
2. **Data We Collect** — 12 categories:
   - Identity & authentication (email, nickname, OAuth provider, avatar)
   - Location data (home/work addresses, coordinates, real-time GPS)
   - Health & medical (medical conditions, mobility level, age range, power-dependent medical)
   - Emergency contacts (names, phone numbers)
   - Household information (members, pets, special needs)
   - Building details (construction year, materials, stories, condition)
   - Economic vulnerability (income, insurance, property value, savings)
   - Safety check-ins (status, location, messages)
   - Family links (relationships, linked accounts)
   - Community reports (hazard reports, photos, locations)
   - Preparedness data (checklist progress, emergency plans, scores)
   - Notification preferences (push endpoints, phone numbers, Telegram IDs)
3. **Legal Basis** — GDPR Article 6:
   - Consent (account creation, optional profile fields)
   - Contract performance (service delivery)
   - Legitimate interest (security, abuse prevention)
   - Vital interests (emergency safety features)
4. **How We Use Data** — Risk scoring, personalized alerts, emergency coordination, preparedness tracking, community safety
5. **Data Storage & Encryption** — EU servers (Cubepath hosting), Fernet encryption on sensitive fields (email, addresses, medical conditions, emergency contacts, phone numbers)
6. **Data Retention** — Property reports expire after 30 days, safety check-ins expire per configuration, account data retained until deletion
7. **Third-Party Services** — Google OAuth, GitHub OAuth, Open-Meteo (weather), AEMET (Spanish meteorological agency), OpenFreeMap/MapLibre (map tiles), Nominatim (geocoding)
8. **International Transfers** — OAuth providers (Google, GitHub) may process data outside EU, covered by their own GDPR compliance
9. **Your Rights** — Access, rectification, erasure (DELETE /auth/me), data portability, restriction, objection, withdraw consent
10. **How to Exercise Rights** — GitHub issues, email contact
11. **Children's Privacy** — Service not directed at children under 16
12. **Changes** — Notify via app, update date on page
13. **Contact** — GitHub repository issues

### 2. Terms of Use (`/terms`)

**Sections:**
1. **Acceptance** — By using TrueRisk you agree to these terms
2. **Service Description** — Multi-hazard risk intelligence, ML-powered scoring, 7 natural hazards, 52 provinces
3. **Account Registration** — Accurate info, one account per person, password security responsibility
4. **Acceptable Use** — No abuse, no scraping, no false community reports, no impersonation
5. **Risk Information Disclaimer** — **Critical**: Risk scores are informational only, not a substitute for official emergency services (112, Protección Civil, AEMET). AI summaries are ML-generated and may contain inaccuracies. Users must always follow official emergency guidance.
6. **Community Reports** — User-submitted, unverified. Platform not liable for inaccurate reports. Users grant license to display their reports.
7. **Intellectual Property** — Platform is MIT licensed. User content remains user's property but is licensed to the platform for display.
8. **Limitation of Liability** — Open-source project provided as-is. No warranty. No guarantee of availability during emergencies. Not liable for decisions based on risk scores.
9. **Service Availability** — No SLA. May be unavailable for maintenance. Best-effort uptime.
10. **Termination** — Users can delete accounts anytime. Project can suspend abusive accounts.
11. **Governing Law** — Laws of Spain. Jurisdiction: courts of Spain.
12. **Changes** — Terms may be updated, continued use constitutes acceptance.

### 3. Cookie Policy (`/cookies`)

**Sections:**
1. **What Are Cookies** — Brief explanation
2. **Cookies We Use** — Table:
   | Cookie | Type | Purpose | Duration |
   |--------|------|---------|----------|
   | `locale` | Functional | Language preference | Persistent |
   | `authjs.session-token` | Essential | Authentication session | 7 days |
   | `__Secure-authjs.session-token` | Essential | Secure auth (HTTPS) | 7 days |
3. **Local Storage** — Table:
   | Key | Purpose |
   |-----|---------|
   | `truerisk-province` | App preferences (province, locale, map settings) |
   | `truerisk-cookie-consent` | Cookie banner dismiss state |
4. **No Analytics or Tracking** — Explicit statement that no analytics, advertising, or tracking cookies are used
5. **Third-Party Cookies** — None. OAuth authentication redirects to provider but no third-party cookies are set on truerisk.cloud
6. **Managing Cookies** — Browser settings instructions, note that disabling essential cookies breaks authentication
7. **Changes** — Policy may be updated

### 4. License (`/license`)

**Sections:**
1. **MIT License** — Full license text
2. **What This Means** — Plain-language explanation: free to use, modify, distribute, include in commercial projects, must include license notice
3. **Contributing** — How to contribute, link to GitHub
4. **Third-Party Licenses** — Summary of key dependency licenses (Next.js: MIT, React: MIT, MapLibre GL: BSD-3-Clause, etc.)

### 5. About (`/about`)

**Sections:**
1. **Mission** — Making natural hazard risk information accessible to everyone in Spain
2. **The Project** — Open-source community project, GitHub repository, MIT license
3. **What We Do** — ML-powered risk scoring across 7 hazards, real-time monitoring, personalized preparedness
4. **Third-Party Services & Attribution:**
   - Google OAuth — authentication
   - GitHub OAuth — authentication
   - Open-Meteo — weather data (open-source weather API)
   - AEMET — Spanish State Meteorological Agency official data
   - OpenFreeMap / MapLibre — map tile rendering
   - Nominatim / OpenStreetMap — geocoding
   - INE — Spanish National Statistics Institute (province/municipality data)
5. **Technology Stack** — Next.js, FastAPI, MapLibre, XGBoost/LightGBM/PyTorch
6. **How to Contribute** — GitHub link, issues, PRs welcome
7. **Contact** — GitHub issues, email

### 6. Accessibility (`/accessibility`)

**Sections:**
1. **Commitment** — Committed to WCAG 2.1 Level AA conformance
2. **Current Features** — Keyboard navigation, skip-to-content link, semantic HTML, ARIA labels, color contrast in UI elements, responsive design, screen reader compatibility
3. **Known Limitations** — Map component (MapLibre) has limited keyboard/screen reader support, some dynamic content may not announce to screen readers immediately
4. **Assistive Technology** — Tested with: screen readers, keyboard navigation, browser zoom up to 200%
5. **Reporting Issues** — GitHub issues for accessibility bugs, treated as high priority
6. **Contact** — GitHub repository

## Components

### CookieBanner

- **Position:** Fixed bottom of viewport, full width
- **Style:** Glass effect (`glass` class) matching app theme, dark background
- **Content:** Brief message about essential/functional cookies only, "Learn more" link to `/cookies`, "Got it" dismiss button
- **State:** Checks `localStorage.getItem('truerisk-cookie-consent')`. If `'dismissed'`, don't render. On dismiss, sets the key.
- **Mounting:** In root `layout.tsx`, rendered as client component
- **Animation:** Slide up on mount, slide down on dismiss (Framer Motion)

### LegalPageShell

- **Props:** `titleKey: string`, `lastUpdated: string`, `children: ReactNode`
- **Renders:** Page title from i18n, last updated date, prose-styled content area
- **Style:** Max-width container, readable line length (~65ch), generous spacing, consistent heading hierarchy
- **Navigation:** Back link to landing page, language switcher

### Legal Layout (`(legal)/layout.tsx`)

- **Minimal wrapper:** No auth provider, no NavPill, no sidebar
- **Contains:** Simple header with TrueRisk logo (links to `/`), language switcher, and the page content
- **Footer:** Legal links grid with all 6 page links + copyright

### Enhanced Landing Footer

- **Addition:** New row between the tech stack / GitHub section and copyright
- **Content:** 6 text links: Privacy Policy · Terms of Use · Cookie Policy · License · About · Accessibility
- **Style:** Same `text-xs text-text-muted` with hover transition, separated by `·` or flex gap

## Non-Goals

- Cookie opt-in/opt-out toggles (all cookies are essential/functional)
- Cookie preference management panel
- Analytics integration
- GDPR consent management platform (CMP)
- Light mode for legal pages
- PDF export of legal documents
- Legal page search functionality
