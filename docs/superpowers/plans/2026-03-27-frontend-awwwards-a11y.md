# TrueRisk Frontend: Accessibility, Walkthrough & Awwwards Polish

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elevate TrueRisk's frontend to Awwwards-quality with WCAG accessibility compliance, an enhanced multi-page walkthrough, and premium micro-interactions.

**Architecture:** Add accessibility primitives (skip-link, aria attributes, focus management) across all citizen routes. Rewrite the walkthrough as a multi-page tour engine with animated spotlight transitions. Layer scroll-reveal animations, stagger effects, animated numbers, and a sliding NavPill indicator using Framer Motion (already installed).

**Tech Stack:** Next.js 16, React 19, Framer Motion 12.38, Tailwind CSS v4, Zustand, next-intl

**Scope exclusions:** Hero/landing page (`src/app/page.tsx`), login page, register page -- DO NOT TOUCH.

---

## Task 1: Accessibility Foundation -- Skip Link & Main Landmark

**Files:**
- Modify: `src/app/(citizen)/layout.tsx:61-69`
- Modify: `messages/en.json` (Common namespace)
- Modify: `messages/es.json` (Common namespace)

- [ ] **Step 1: Add skip-to-content link and `<main>` landmark in citizen layout**

In `src/app/(citizen)/layout.tsx`, inside the outer `<div>` at line 62 (before `<NavPill />`), add:

```tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[200] focus:rounded-lg focus:bg-accent-green focus:px-4 focus:py-2 focus:text-bg-primary focus:text-sm focus:font-bold focus:outline-none"
>
  {t('skipToContent')}
</a>
```

Add `useTranslations('Common')` import at the top. Wrap `{children}` at line 66 with `<main id="main-content">...</main>`.

The component already uses `'use client'` and has access to hooks, so add:
```tsx
const t = useTranslations('Common');
```

- [ ] **Step 2: Add i18n keys**

In `messages/en.json`, under `"Common"`:
```json
"skipToContent": "Skip to content"
```

In `messages/es.json`, under `"Common"`:
```json
"skipToContent": "Saltar al contenido"
```

- [ ] **Step 3: Verify skip link works**

Run: `npm run dev`
Tab into the page -- the skip link should appear visually on focus and jump focus to `#main-content`.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(citizen\)/layout.tsx messages/en.json messages/es.json
git commit -m "a11y: add skip-to-content link and main landmark in citizen layout"
```

---

## Task 2: Accessibility -- NavPill `aria-current` and Sliding Active Indicator

**Files:**
- Modify: `src/components/layout/nav-pill.tsx:84-107`

- [ ] **Step 1: Add `aria-current="page"` to active nav links**

In `src/components/layout/nav-pill.tsx`, on each `<Link>` in the navItems loop (line 86), add the `aria-current` prop:

```tsx
<Link
  key={item.href}
  href={item.href}
  aria-current={isActive(item.href) ? 'page' : undefined}
  className={[
    'relative px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200',
    // ... existing active/inactive classes
  ].join(' ')}
>
```

- [ ] **Step 2: Add animated sliding active indicator with `layoutId`**

Replace the current nav link rendering (lines 84-108) with a version that includes a Framer Motion shared layout pill:

```tsx
<div className="flex gap-1 overflow-x-auto scrollbar-hide whitespace-nowrap">
  {navItems.map((item) => {
    const active = isActive(item.href);
    const isHighRiskSpecial =
      item.href === '/safety' && isHighRisk
        ? 'bg-pink-500/20 text-pink-400 animate-[glow-pulse_2s_infinite]'
        : item.href === '/emergency' && isHighRisk
        ? 'bg-red-500/20 text-red-400 animate-[glow-pulse_2s_infinite]'
        : null;

    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? 'page' : undefined}
        className={[
          'relative px-3 py-1 rounded-lg text-xs font-medium transition-colors duration-200',
          isHighRiskSpecial
            ? isHighRiskSpecial
            : active
              ? 'text-accent-green'
              : 'text-text-secondary hover:text-text-primary hover:bg-white/5',
        ].join(' ')}
        {...(item.href === '/safety' && isHighRisk
          ? { style: { '--glow-color': 'rgba(236, 72, 153, 0.3)' } as React.CSSProperties }
          : item.href === '/emergency' && isHighRisk
          ? { style: { '--glow-color': 'rgba(239, 68, 68, 0.3)' } as React.CSSProperties }
          : {})}
      >
        {active && !isHighRiskSpecial && (
          <motion.span
            layoutId="nav-active-pill"
            className="absolute inset-0 rounded-lg bg-accent-green/15"
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          />
        )}
        <span className="relative z-10">{item.label}</span>
      </Link>
    );
  })}
</div>
```

The `layoutId="nav-active-pill"` makes Framer Motion smoothly animate the green background pill between active tabs.

- [ ] **Step 3: Verify navigation animation**

Run: `npm run dev`
Click between nav items -- the green pill should slide smoothly between them. Check that `aria-current="page"` is set correctly on the active link.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/nav-pill.tsx
git commit -m "a11y+polish: add aria-current to nav links, animated sliding active indicator"
```

---

## Task 3: Accessibility -- Map Controls `aria-pressed`, Labels & Status

**Files:**
- Modify: `src/components/map/map-controls.tsx:41-189`
- Modify: `messages/en.json` (Map namespace)
- Modify: `messages/es.json` (Map namespace)

- [ ] **Step 1: Add `aria-pressed` and `aria-label` to layer toggle buttons**

In `src/components/map/map-controls.tsx`:

Risk button (line 41-51): add `aria-pressed={activeMapLayer === 'risk'}` and `aria-label={t('risk')}`.

Alerts button (line 52-62): add `aria-pressed={activeMapLayer === 'alerts'}` and `aria-label={t('alerts')}`.

Terrain button (line 64-76): add `aria-pressed={terrainEnabled ?? false}` (already has `aria-label`).

- [ ] **Step 2: Add `aria-pressed` and `aria-hidden` on emoji in data layer buttons**

Data layer buttons (lines 82-127):

For fires button (line 83): add `aria-pressed={dataLayers.fires}`. Wrap the emoji at line 91 with `<span aria-hidden="true">`.

For earthquakes (line 95): add `aria-pressed={dataLayers.earthquakes}`.

For reservoirs (line 106): add `aria-pressed={dataLayers.reservoirs}`.

For riverGauges (line 117): add `aria-pressed={dataLayers.riverGauges}`.

- [ ] **Step 3: Add accessible status label to SSE connection indicator**

At lines 177-181, add `role="status"` and an `aria-label` to the status dot:

```tsx
<span
  className={`inline-block h-1.5 w-1.5 rounded-full ${
    sseStatus === 'connected' ? 'bg-accent-green' :
    sseStatus === 'connecting' ? 'bg-accent-yellow animate-pulse' :
    'bg-accent-red'
  }`}
  role="status"
  aria-label={
    sseStatus === 'connected' ? t('statusConnected') :
    sseStatus === 'connecting' ? t('statusConnecting') :
    t('statusDisconnected')
  }
/>
```

- [ ] **Step 4: Add i18n keys**

In `messages/en.json` under `"Map"`:
```json
"statusConnected": "Live data connected",
"statusConnecting": "Connecting to live data",
"statusDisconnected": "Live data disconnected"
```

In `messages/es.json` under `"Map"`:
```json
"statusConnected": "Datos en vivo conectados",
"statusConnecting": "Conectando a datos en vivo",
"statusDisconnected": "Datos en vivo desconectados"
```

- [ ] **Step 5: Commit**

```bash
git add src/components/map/map-controls.tsx messages/en.json messages/es.json
git commit -m "a11y: add aria-pressed to map toggles, accessible status indicator"
```

---

## Task 4: Accessibility -- Toast Assertive Live Region & Modal Label Fallback

**Files:**
- Modify: `src/components/ui/toast.tsx:67-110`
- Modify: `src/components/ui/modal.tsx:57-61`

- [ ] **Step 1: Split toast container into polite/assertive regions**

In `src/components/ui/toast.tsx`, replace the single container (lines 67-110) with two:

```tsx
return (
  <>
    {/* Critical alerts: announced immediately */}
    <div role="alert" aria-live="assertive" className="pointer-events-none fixed top-4 right-4 z-50 flex flex-col gap-2 w-80">
      <AnimatePresence mode="popLayout">
        {items.filter((i) => i.severity >= 4).map((item) => {
          const colors = severityColors[item.severity] ?? severityColors[1];
          return (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, x: 80, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className={`pointer-events-auto flex items-start gap-3 rounded-lg border ${colors.border} ${colors.bg} p-3 shadow-lg backdrop-blur-md cursor-pointer`}
              onClick={() => dismiss(item.id)}
            >
              <div className="mt-0.5 flex-shrink-0">
                <span className="relative flex h-3 w-3">
                  <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${colors.icon} bg-current opacity-40`} />
                  <span className={`relative inline-flex h-3 w-3 rounded-full ${colors.icon} bg-current`} />
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-text-primary truncate">{item.title}</span>
                  <span className={`text-xs font-medium ${colors.icon}`}>{severityLabels[item.severity] ?? `Lv ${item.severity}`}</span>
                </div>
                {item.description && (
                  <p className="mt-0.5 text-xs text-text-secondary line-clamp-2">{item.description}</p>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>

    {/* Non-critical: announced politely */}
    <div role="status" aria-live="polite" className="pointer-events-none fixed top-4 right-4 z-50 flex flex-col gap-2 w-80" style={{ marginTop: items.filter(i => i.severity >= 4).length > 0 ? `${items.filter(i => i.severity >= 4).length * 72}px` : undefined }}>
      <AnimatePresence mode="popLayout">
        {items.filter((i) => i.severity < 4).map((item) => {
          // Same rendering as above
        })}
      </AnimatePresence>
    </div>
  </>
);
```

To avoid duplicating the toast item markup, extract a `ToastItemCard` inline component:

```tsx
function ToastItemCard({ item, dismiss }: { item: ToastItem; dismiss: (id: string) => void }) {
  const colors = severityColors[item.severity] ?? severityColors[1];
  return (
    <motion.div
      key={item.id}
      layout
      initial={{ opacity: 0, x: 80, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`pointer-events-auto flex items-start gap-3 rounded-lg border ${colors.border} ${colors.bg} p-3 shadow-lg backdrop-blur-md cursor-pointer`}
      onClick={() => dismiss(item.id)}
    >
      <div className="mt-0.5 flex-shrink-0">
        <span className="relative flex h-3 w-3">
          <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${colors.icon} bg-current opacity-40`} />
          <span className={`relative inline-flex h-3 w-3 rounded-full ${colors.icon} bg-current`} />
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-text-primary truncate">{item.title}</span>
          <span className={`text-xs font-medium ${colors.icon}`}>{severityLabels[item.severity] ?? `Lv ${item.severity}`}</span>
        </div>
        {item.description && (
          <p className="mt-0.5 text-xs text-text-secondary line-clamp-2">{item.description}</p>
        )}
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 2: Add `aria-label` fallback on modal when title is empty**

In `src/components/ui/modal.tsx`, modify the dialog props (line 58-60). Add an `ariaLabel` prop to `ModalProps`:

```tsx
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  ariaLabel?: string;
  children: ReactNode;
}
```

On the dialog element (line 58-60):
```tsx
aria-labelledby={title ? titleId : undefined}
aria-label={!title ? (ariaLabel ?? 'Dialog') : undefined}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/toast.tsx src/components/ui/modal.tsx
git commit -m "a11y: assertive live region for critical toasts, modal aria-label fallback"
```

---

## Task 5: AnimatedNumber Component

**Files:**
- Create: `src/components/ui/animated-number.tsx`

- [ ] **Step 1: Create the AnimatedNumber component**

```tsx
'use client';

import { useEffect, useRef } from 'react';
import { useSpring, useTransform, useReducedMotion } from 'framer-motion';

interface AnimatedNumberProps {
  value: number;
  className?: string;
  duration?: number;
}

export function AnimatedNumber({ value, className, duration = 0.8 }: AnimatedNumberProps) {
  const reducedMotion = useReducedMotion();
  const spring = useSpring(0, {
    duration: reducedMotion ? 0 : duration * 1000,
  });
  const display = useTransform(spring, (v) => Math.round(v));
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  useEffect(() => {
    const unsubscribe = display.on('change', (v) => {
      if (ref.current) ref.current.textContent = String(v);
    });
    return unsubscribe;
  }, [display]);

  return <span ref={ref} className={className} />;
}
```

This writes directly to DOM via ref -- zero re-renders during counting.

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/animated-number.tsx
git commit -m "feat: add AnimatedNumber component for counting animations"
```

---

## Task 6: Apply AnimatedNumber to Risk Score & Dashboard

**Files:**
- Modify: `src/components/dashboard/risk-overview.tsx:87-94,125-127`

- [ ] **Step 1: Replace static risk score with AnimatedNumber**

In `src/components/dashboard/risk-overview.tsx`, add import:
```tsx
import { AnimatedNumber } from '@/components/ui/animated-number';
```

Replace lines 87-94 (the motion.span displaying the composite score):
```tsx
<motion.span
  className={`font-[family-name:var(--font-display)] text-5xl font-extrabold tabular-nums ${scoreColor(risk.composite_score)}`}
  initial={{ opacity: 0, scale: 0.8 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ duration: 0.4 }}
>
  {Math.round(risk.composite_score)}
</motion.span>
```

With:
```tsx
<motion.span
  className={`font-[family-name:var(--font-display)] text-5xl font-extrabold tabular-nums ${scoreColor(risk.composite_score)}`}
  initial={{ opacity: 0, scale: 0.8 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ duration: 0.4 }}
>
  <AnimatedNumber value={Math.round(risk.composite_score)} />
</motion.span>
```

- [ ] **Step 2: Replace individual hazard scores with AnimatedNumber**

At line 125-127, replace:
```tsx
<span className="font-[family-name:var(--font-mono)] text-[10px] text-text-muted w-7 text-right tabular-nums">
  {Math.round(score)}
</span>
```

With:
```tsx
<span className="font-[family-name:var(--font-mono)] text-[10px] text-text-muted w-7 text-right tabular-nums">
  <AnimatedNumber value={Math.round(score)} duration={0.5} />
</span>
```

- [ ] **Step 3: Verify counting animation**

Run: `npm run dev`
Navigate to dashboard -- the risk score should count up from 0. Changing province should re-animate.

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/risk-overview.tsx
git commit -m "polish: animated counting for risk scores"
```

---

## Task 7: RevealOnScroll Component

**Files:**
- Create: `src/components/ui/reveal-on-scroll.tsx`

- [ ] **Step 1: Create the RevealOnScroll wrapper**

```tsx
'use client';

import { type ReactNode, useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';

interface RevealOnScrollProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  width?: 'fit' | 'full';
}

export function RevealOnScroll({ children, delay = 0, className, width = 'full' }: RevealOnScrollProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      className={className}
      style={width === 'full' ? { width: '100%' } : undefined}
      initial={reducedMotion ? false : { opacity: 0, y: 24, filter: 'blur(4px)' }}
      animate={isInView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : { opacity: 0, y: 24, filter: 'blur(4px)' }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/reveal-on-scroll.tsx
git commit -m "feat: add RevealOnScroll component for scroll-driven animations"
```

---

## Task 8: Dashboard Stagger Animations & Scroll Reveal

**Files:**
- Modify: `src/app/(citizen)/dashboard/page.tsx:28-101`

- [ ] **Step 1: Add stagger container and item variants for the bento grid**

Add imports at the top:
```tsx
import { RevealOnScroll } from '@/components/ui/reveal-on-scroll';
```

Replace the outer `<motion.div>` (lines 29-33) and wrap the bento grid children with `RevealOnScroll`:

```tsx
<motion.div
  className="h-screen pt-20 px-6 lg:px-12 pb-12 max-w-6xl mx-auto overflow-y-auto"
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.3 }}
>
  {/* Header */}
  <motion.div
    className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8"
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: 0.05 }}
  >
    {/* ... header content unchanged ... */}
  </motion.div>

  {/* DANA + RiskNarrative */}
  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="mb-4">
    <DanaWarningBanner />
  </motion.div>
  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }} className="mb-4">
    <RiskNarrative />
  </motion.div>

  {/* Bento grid with staggered reveal */}
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pb-8">
    <RevealOnScroll delay={0} className="lg:row-span-2">
      <div data-tour="risk-overview"><RiskOverview /></div>
    </RevealOnScroll>
    <RevealOnScroll delay={0.08}>
      <div data-tour="weather-card"><WeatherCard /></div>
    </RevealOnScroll>
    <RevealOnScroll delay={0.16}>
      <div data-tour="alert-feed"><AlertFeed /></div>
    </RevealOnScroll>
    <RevealOnScroll delay={0.24}>
      <QuickActions />
    </RevealOnScroll>
    <RevealOnScroll delay={0.32}>
      <DataQualityPanel />
    </RevealOnScroll>
    <RevealOnScroll delay={0.4} className="lg:col-span-3">
      <PreparednessWidget />
    </RevealOnScroll>
    <RevealOnScroll delay={0.48} className="lg:col-span-3">
      <PersonalizedSuggestions />
    </RevealOnScroll>
  </div>
  <Walkthrough />
</motion.div>
```

- [ ] **Step 2: Verify stagger effect**

Run: `npm run dev`
Navigate to dashboard -- cards should fade in with a blur-to-sharp effect, staggered by 80ms each. Scroll down to see below-fold cards reveal on scroll.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(citizen\)/dashboard/page.tsx
git commit -m "polish: staggered entrance and scroll-reveal for dashboard bento grid"
```

---

## Task 9: Enhanced Quick Actions Micro-Interactions

**Files:**
- Modify: `src/components/dashboard/quick-actions.tsx:66-88`

- [ ] **Step 1: Add spring hover/tap animations and enhanced glow**

Add `motion` import:
```tsx
import { motion } from 'framer-motion';
```

Wrap each `<Link>` inside a `<motion.div>` with spring physics:

```tsx
{ACTIONS.map(({ titleKey, subtitleKey, href, icon }) => (
  <motion.div
    key={href}
    whileHover={{ scale: 1.03, y: -2 }}
    whileTap={{ scale: 0.97 }}
    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
  >
    <Link
      href={href}
      className="group relative block overflow-hidden rounded-2xl border border-border bg-bg-card p-4 transition-all duration-200 hover:border-accent-green/30 hover:shadow-[0_0_40px_rgba(255,255,255,0.08)]"
    >
      <div className="flex flex-col gap-2">
        <span className="text-text-secondary group-hover:text-accent-green transition-colors duration-200">
          {icon}
        </span>
        <p className="font-[family-name:var(--font-display)] text-sm font-bold text-text-primary">
          {t(titleKey)}
        </p>
        <p className="font-[family-name:var(--font-sans)] text-[11px] text-text-muted leading-relaxed">
          {t(subtitleKey)}
        </p>
      </div>
      <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.06),transparent_70%)]" />
    </Link>
  </motion.div>
))}
```

Key changes: `motion.div` wrapper with `whileHover`/`whileTap`, stronger box shadow (0.08 instead of 0.06), radial gradient glow instead of linear.

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/quick-actions.tsx
git commit -m "polish: spring hover/tap animations on quick action cards"
```

---

## Task 10: Alert Feed Entrance Animations

**Files:**
- Modify: `src/components/dashboard/alert-feed.tsx`

- [ ] **Step 1: Add staggered entrance to alert feed items**

Add `motion` import. Wrap each alert item in the list with `<motion.div>`:

```tsx
<motion.div
  key={alert.id ?? index}
  initial={{ opacity: 0, x: -12 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ delay: index * 0.06, duration: 0.3, ease: 'easeOut' }}
>
  {/* existing alert item content */}
</motion.div>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/alert-feed.tsx
git commit -m "polish: staggered entrance animation for alert feed items"
```

---

## Task 11: Enhanced Card Hover Effects

**Files:**
- Modify: `src/components/ui/card.tsx:39-40`

- [ ] **Step 1: Upgrade hover effect on Card component**

Replace line 39-40 (the hoverable styles):
```tsx
hoverable &&
  'transition-all duration-200 hover:border-accent-green/20 hover:shadow-[0_0_30px_rgba(255,255,255,0.04)]',
```

With:
```tsx
hoverable &&
  'transition-all duration-300 hover:border-accent-green/25 hover:shadow-[0_0_40px_rgba(255,255,255,0.06),inset_0_1px_0_rgba(255,255,255,0.08)] hover:-translate-y-0.5',
```

The `-translate-y-0.5` lift, inset shadow, and increased glow make it feel premium.

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/card.tsx
git commit -m "polish: enhanced hover effects on Card component"
```

---

## Task 12: Scroll-Reveal on Prediction Page

**Files:**
- Modify: `src/app/(citizen)/prediction/page.tsx:97-144`

- [ ] **Step 1: Wrap prediction page sections with RevealOnScroll**

Add import:
```tsx
import { RevealOnScroll } from '@/components/ui/reveal-on-scroll';
```

Wrap each section (from the header, forecast grid, hydro grid, hazard models grid, and statistical methods grid):

```tsx
<RevealOnScroll>
  <PredictionHeader current={data.current} />
</RevealOnScroll>

<RevealOnScroll delay={0.05}>
  <PredictionsExplainer />
</RevealOnScroll>

<RevealOnScroll delay={0.1}>
  <AiWeatherSummary />
</RevealOnScroll>

<RevealOnScroll delay={0.15}>
  <PipelineDiagram />
</RevealOnScroll>

<RevealOnScroll delay={0.2}>
  <h2 className="...">{t('forecastTitle')}</h2>
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
    <ForecastChart data={forecastData} isLoading={forecastLoading} />
    <AttentionWeightsChart data={forecastData} />
  </div>
</RevealOnScroll>

{/* ... same pattern for remaining sections ... */}
```

Also add `data-tour="prediction-forecast"` on the forecast section wrapper and `data-tour="prediction-hazards"` on the hazard models section wrapper (for walkthrough Task 15).

- [ ] **Step 2: Commit**

```bash
git add src/app/\(citizen\)/prediction/page.tsx
git commit -m "polish: scroll-reveal animations on prediction page"
```

---

## Task 13: Scroll-Reveal on Emergency Page

**Files:**
- Modify: `src/app/(citizen)/emergency/page.tsx:55-126`

- [ ] **Step 1: Wrap emergency page sections with RevealOnScroll**

Add import:
```tsx
import { RevealOnScroll } from '@/components/ui/reveal-on-scroll';
```

Wrap each `<section>` in the emergency page:

```tsx
<RevealOnScroll>
  {isAuthenticated && <UserEmergencyCard />}
</RevealOnScroll>

<RevealOnScroll delay={0.05}>
  <section className="text-center space-y-3" data-tour="emergency-call">
    {/* 112 button section */}
  </section>
</RevealOnScroll>

<RevealOnScroll delay={0.1}>
  <section className="space-y-2">{/* Province selector */}</section>
</RevealOnScroll>

<RevealOnScroll delay={0.15}>
  <section className="space-y-3" data-tour="emergency-contacts">
    {/* Emergency contacts */}
  </section>
</RevealOnScroll>

<RevealOnScroll delay={0.2}>
  <section className="space-y-3"><AdvisorPanel /></section>
</RevealOnScroll>

<RevealOnScroll delay={0.25}>
  <section className="space-y-3">
    <h2>...</h2>
    <FirstAidCards />
  </section>
</RevealOnScroll>
```

Note: `data-tour="emergency-call"` and `data-tour="emergency-contacts"` are added here for the walkthrough (Task 15).

- [ ] **Step 2: Commit**

```bash
git add src/app/\(citizen\)/emergency/page.tsx
git commit -m "polish: scroll-reveal animations on emergency page"
```

---

## Task 14: Walkthrough Store Extensions

**Files:**
- Modify: `src/store/app-store.ts`

- [ ] **Step 1: Add walkthrough state to the store**

Add new fields to the `AppState` interface (after line 41):

```ts
walkthroughActive: boolean;
setWalkthroughActive: (active: boolean) => void;
resetOnboarding: () => void;
```

Add implementations in the store (after line 84):

```ts
walkthroughActive: false,
setWalkthroughActive: (walkthroughActive) => set({ walkthroughActive }),
resetOnboarding: () => set({ hasSeenOnboarding: false, walkthroughActive: true }),
```

Do NOT add `walkthroughActive` to `partialize` -- it should not be persisted (resets on reload). Only `hasSeenOnboarding` needs persistence.

- [ ] **Step 2: Commit**

```bash
git add src/store/app-store.ts
git commit -m "feat: add walkthrough active state and resetOnboarding to store"
```

---

## Task 15: Enhanced Multi-Page Walkthrough

**Files:**
- Modify: `src/components/ui/walkthrough.tsx` (full rewrite)
- Modify: `src/components/map/map-controls.tsx` (add `data-tour` attributes)
- Modify: `messages/en.json` (Walkthrough namespace)
- Modify: `messages/es.json` (Walkthrough namespace)

- [ ] **Step 1: Add `data-tour` attributes to map controls**

In `src/components/map/map-controls.tsx`:
- Line 40 (layer toggle container): add `data-tour="map-layer-toggle"`
- Line 81 (data layer container): add `data-tour="map-data-layers"`

- [ ] **Step 2: Rewrite walkthrough.tsx as multi-page tour engine**

Full rewrite of `src/components/ui/walkthrough.tsx`:

```tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { useAppStore } from '@/store/app-store';

interface Step {
  selector: string;
  titleKey: string;
  descKey: string;
}

interface PageTour {
  steps: Step[];
  nextPage?: string;
}

const TOURS: Record<string, PageTour> = {
  '/dashboard': {
    steps: [
      { selector: '[data-tour="province-select"]', titleKey: 'step1Title', descKey: 'step1Desc' },
      { selector: '[data-tour="risk-overview"]', titleKey: 'step2Title', descKey: 'step2Desc' },
      { selector: '[data-tour="weather-card"]', titleKey: 'step3Title', descKey: 'step3Desc' },
      { selector: '[data-tour="alert-feed"]', titleKey: 'step4Title', descKey: 'step4Desc' },
    ],
    nextPage: '/map',
  },
  '/map': {
    steps: [
      { selector: '[data-tour="map-layer-toggle"]', titleKey: 'mapStep1Title', descKey: 'mapStep1Desc' },
      { selector: '[data-tour="map-data-layers"]', titleKey: 'mapStep2Title', descKey: 'mapStep2Desc' },
    ],
    nextPage: '/prediction',
  },
  '/prediction': {
    steps: [
      { selector: '[data-tour="prediction-forecast"]', titleKey: 'predStep1Title', descKey: 'predStep1Desc' },
      { selector: '[data-tour="prediction-hazards"]', titleKey: 'predStep2Title', descKey: 'predStep2Desc' },
    ],
    nextPage: '/emergency',
  },
  '/emergency': {
    steps: [
      { selector: '[data-tour="emergency-call"]', titleKey: 'emergStep1Title', descKey: 'emergStep1Desc' },
      { selector: '[data-tour="emergency-contacts"]', titleKey: 'emergStep2Title', descKey: 'emergStep2Desc' },
    ],
  },
};

const TOTAL_STEPS = Object.values(TOURS).reduce((sum, t) => sum + t.steps.length, 0);

function getGlobalStepIndex(pathname: string, localStep: number): number {
  let count = 0;
  for (const [path, tour] of Object.entries(TOURS)) {
    if (path === pathname) return count + localStep;
    count += tour.steps.length;
  }
  return count;
}

export function Walkthrough() {
  const t = useTranslations('Walkthrough');
  const pathname = usePathname();
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const hasSeenOnboarding = useAppStore((s) => s.hasSeenOnboarding);
  const walkthroughActive = useAppStore((s) => s.walkthroughActive);
  const dismissOnboarding = useAppStore((s) => s.dismissOnboarding);
  const setWalkthroughActive = useAppStore((s) => s.setWalkthroughActive);

  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [visible, setVisible] = useState(false);
  const nextBtnRef = useRef<HTMLButtonElement>(null);

  const tour = TOURS[pathname];
  const isActive = (!hasSeenOnboarding || walkthroughActive) && !!tour;

  // Delay initial appearance
  useEffect(() => {
    if (isActive) {
      setStep(0);
      const timer = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [isActive, pathname]);

  // Measure target element
  const updateRect = useCallback(() => {
    if (!tour) return;
    const el = document.querySelector(tour.steps[step]?.selector ?? '');
    if (el) {
      setRect(el.getBoundingClientRect());
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      setRect(null);
    }
  }, [step, tour]);

  useEffect(() => {
    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);
    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [updateRect]);

  // Auto-focus next button
  useEffect(() => {
    if (visible && nextBtnRef.current) {
      nextBtnRef.current.focus();
    }
  }, [visible, step]);

  // Keyboard navigation
  useEffect(() => {
    if (!visible) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleSkip();
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); handleNext(); }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); handleBack(); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });

  if (!isActive || !visible || !tour) return null;

  const current = tour.steps[step];
  const isLastOnPage = step === tour.steps.length - 1;
  const isLastOverall = isLastOnPage && !tour.nextPage;
  const globalStep = getGlobalStepIndex(pathname, step) + 1;

  function handleNext() {
    if (isLastOverall) {
      handleSkip();
    } else if (isLastOnPage && tour.nextPage) {
      router.push(tour.nextPage);
    } else {
      setStep((s) => Math.min(s + 1, tour.steps.length - 1));
    }
  }

  function handleBack() {
    if (step > 0) setStep((s) => s - 1);
  }

  function handleSkip() {
    setVisible(false);
    setWalkthroughActive(false);
    dismissOnboarding();
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100]"
        role="dialog"
        aria-modal="true"
        aria-label={t('tourLabel')}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/60" onClick={handleSkip} />

        {/* Animated spotlight cutout */}
        {rect && (
          <motion.div
            className="absolute rounded-xl ring-2 ring-accent-green/60 pointer-events-none"
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={{
              opacity: 1,
              top: rect.top - 6,
              left: rect.left - 6,
              width: rect.width + 12,
              height: rect.height + 12,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.6), 0 0 24px 4px rgba(255,255,255,0.08)',
            }}
          />
        )}

        {/* Tooltip card */}
        <motion.div
          key={`${pathname}-${step}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="absolute z-[101] w-72"
          style={{
            top: rect ? rect.bottom + 16 : '50%',
            left: rect ? Math.min(Math.max(rect.left, 16), window.innerWidth - 304) : '50%',
            transform: rect ? undefined : 'translate(-50%, -50%)',
          }}
        >
          <div className="glass-heavy rounded-xl border border-accent-green/30 bg-bg-card p-4 shadow-xl">
            {/* Progress bar */}
            <div className="h-1 rounded-full bg-white/5 mb-3 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-accent-green/40"
                initial={{ width: 0 }}
                animate={{ width: `${(globalStep / TOTAL_STEPS) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            <div className="flex items-center justify-between mb-2">
              <span className="font-[family-name:var(--font-mono)] text-[10px] text-accent-green">
                {globalStep}/{TOTAL_STEPS}
              </span>
              <button
                onClick={handleSkip}
                className="cursor-pointer font-[family-name:var(--font-sans)] text-[10px] text-text-muted hover:text-text-primary transition-colors"
              >
                {t('skip')}
              </button>
            </div>

            <h3 className="font-[family-name:var(--font-display)] text-sm font-bold text-text-primary mb-1">
              {t(current.titleKey)}
            </h3>
            <p className="font-[family-name:var(--font-sans)] text-[11px] text-text-secondary leading-relaxed mb-3">
              {t(current.descKey)}
            </p>

            <div className="flex gap-2">
              {step > 0 && (
                <button
                  onClick={handleBack}
                  className="cursor-pointer flex-1 rounded-lg border border-border px-3 py-1.5 font-[family-name:var(--font-sans)] text-xs text-text-muted transition-colors hover:border-white/20 hover:text-text-primary"
                >
                  {t('back')}
                </button>
              )}
              <button
                ref={nextBtnRef}
                onClick={handleNext}
                className="cursor-pointer flex-1 rounded-lg bg-accent-green/15 px-3 py-1.5 font-[family-name:var(--font-sans)] text-xs font-medium text-accent-green transition-colors hover:bg-accent-green/25"
              >
                {isLastOverall ? t('getStarted') : isLastOnPage ? t('nextPage') : t('next')}
              </button>
            </div>

            <p className="font-[family-name:var(--font-mono)] text-[9px] text-text-muted/50 text-center mt-2">
              {t('keyboardHint')}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
```

Key improvements over the original:
- Multi-page tour (dashboard -> map -> prediction -> emergency)
- Animated spotlight position with spring physics
- Progress bar showing global step count
- Back/Next buttons with keyboard shortcuts (Escape, arrows)
- `role="dialog"` and `aria-modal` for accessibility
- Auto-focus on next button
- Auto-scroll target element into view
- Supports both initial onboarding AND manual restart via `walkthroughActive`

- [ ] **Step 3: Add i18n keys for new walkthrough steps**

In `messages/en.json` under `"Walkthrough"`, add:

```json
"tourLabel": "Guided tour",
"back": "Back",
"nextPage": "Continue tour",
"keyboardHint": "Arrow keys to navigate, Esc to skip",
"mapStep1Title": "Layer Controls",
"mapStep1Desc": "Switch between risk heat map and active alerts view. Toggle 3D terrain for elevation context.",
"mapStep2Title": "Data Overlays",
"mapStep2Desc": "Toggle real-time data layers: active fires, seismic activity, reservoir levels, and river gauges.",
"predStep1Title": "Risk Forecasts",
"predStep1Desc": "Multi-horizon forecasts show how risk levels are expected to evolve over the coming days.",
"predStep2Title": "Hazard Models",
"predStep2Desc": "Each hazard has a dedicated ML model. Explore the methodology, confidence, and key drivers.",
"emergStep1Title": "Emergency Call",
"emergStep1Desc": "One tap to call 112. This button works even when the app is offline.",
"emergStep2Title": "Local Contacts",
"emergStep2Desc": "Province-specific emergency numbers for fire, police, civil protection, and hospitals."
```

Add equivalent Spanish translations in `messages/es.json`.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/walkthrough.tsx src/components/map/map-controls.tsx messages/en.json messages/es.json
git commit -m "feat: multi-page walkthrough with animated spotlight, keyboard nav, and a11y"
```

---

## Task 16: Restart Tour from Profile

**Files:**
- Modify: `src/app/(citizen)/profile/page.tsx:29-30`
- Modify: `messages/en.json` (Profile namespace)
- Modify: `messages/es.json` (Profile namespace)

- [ ] **Step 1: Add restart tour button to profile page**

In `src/app/(citizen)/profile/page.tsx`, add imports:
```tsx
import { useAppStore } from '@/store/app-store';
import { useRouter } from 'next/navigation';
```

After the subtitle `<p>` (line 27), add:

```tsx
<button
  type="button"
  onClick={() => {
    resetOnboarding();
    router.push('/dashboard');
  }}
  className="mt-3 cursor-pointer rounded-lg border border-border px-4 py-2 font-[family-name:var(--font-sans)] text-xs text-text-secondary transition-colors hover:border-accent-green hover:text-accent-green"
>
  {t('restartTour')}
</button>
```

Destructure from store:
```tsx
const resetOnboarding = useAppStore((s) => s.resetOnboarding);
const router = useRouter();
```

- [ ] **Step 2: Add i18n keys**

`messages/en.json` under `"Profile"`:
```json
"restartTour": "Restart guided tour"
```

`messages/es.json` under `"Profile"`:
```json
"restartTour": "Reiniciar recorrido guiado"
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(citizen\)/profile/page.tsx messages/en.json messages/es.json
git commit -m "feat: restart guided tour button on profile page"
```

---

## Task 17: ScrollProgress & ScrollToTop Components

**Files:**
- Create: `src/components/ui/scroll-progress.tsx`
- Create: `src/components/ui/scroll-to-top.tsx`

- [ ] **Step 1: Create ScrollProgress component**

```tsx
'use client';

import { motion, useScroll, useSpring } from 'framer-motion';
import type { RefObject } from 'react';

interface ScrollProgressProps {
  containerRef?: RefObject<HTMLElement | null>;
}

export function ScrollProgress({ containerRef }: ScrollProgressProps) {
  const { scrollYProgress } = useScroll({ container: containerRef });
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 20 });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-accent-green/40 via-accent-green/60 to-accent-green/40 origin-left z-[60]"
      style={{ scaleX }}
    />
  );
}
```

- [ ] **Step 2: Create ScrollToTop component**

```tsx
'use client';

import { useState, useEffect, type RefObject } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

interface ScrollToTopProps {
  containerRef?: RefObject<HTMLElement | null>;
}

export function ScrollToTop({ containerRef }: ScrollToTopProps) {
  const [visible, setVisible] = useState(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const el = containerRef?.current;
    if (!el) return;
    const handler = () => setVisible(el.scrollTop > 400);
    el.addEventListener('scroll', handler, { passive: true });
    return () => el.removeEventListener('scroll', handler);
  }, [containerRef]);

  const scrollToTop = () => {
    containerRef?.current?.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={scrollToTop}
          aria-label="Scroll to top"
          className="fixed bottom-6 right-6 z-50 glass-heavy h-10 w-10 rounded-full flex items-center justify-center text-text-secondary hover:text-accent-green transition-colors cursor-pointer border border-border hover:border-accent-green/30"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 15l-6-6-6 6" />
          </svg>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/scroll-progress.tsx src/components/ui/scroll-to-top.tsx
git commit -m "feat: add ScrollProgress and ScrollToTop components"
```

---

## Task 18: Apply ScrollProgress & ScrollToTop to Long Pages

**Files:**
- Modify: `src/app/(citizen)/prediction/page.tsx`
- Modify: `src/app/(citizen)/emergency/page.tsx`
- Modify: `src/app/(citizen)/dashboard/page.tsx`

- [ ] **Step 1: Add ref and scroll components to prediction page**

In `src/app/(citizen)/prediction/page.tsx`, add:
```tsx
import { useRef } from 'react';
import { ScrollProgress } from '@/components/ui/scroll-progress';
import { ScrollToTop } from '@/components/ui/scroll-to-top';
```

Add a ref to the scrollable container (the outer `<motion.div>` at line 79):
```tsx
const scrollRef = useRef<HTMLDivElement>(null);

// In JSX:
<motion.div ref={scrollRef} className="h-screen pt-20 px-6 lg:px-12 pb-12 max-w-7xl mx-auto overflow-y-auto" ...>
  <ScrollProgress containerRef={scrollRef} />
  {/* ... existing content ... */}
  <ScrollToTop containerRef={scrollRef} />
</motion.div>
```

- [ ] **Step 2: Add ref and scroll components to dashboard page**

Same pattern for `src/app/(citizen)/dashboard/page.tsx`:
```tsx
const scrollRef = useRef<HTMLDivElement>(null);

<motion.div ref={scrollRef} className="h-screen pt-20 px-6 lg:px-12 pb-12 max-w-6xl mx-auto overflow-y-auto" ...>
  <ScrollProgress containerRef={scrollRef} />
  {/* ... existing content ... */}
  <ScrollToTop containerRef={scrollRef} />
</motion.div>
```

- [ ] **Step 3: Add to emergency page**

In `src/app/(citizen)/emergency/page.tsx`, the scrollable container is `<div className="h-full overflow-y-auto bg-bg-primary">` at line 48. Add a ref to it:

```tsx
const scrollRef = useRef<HTMLDivElement>(null);

<div ref={scrollRef} className="h-full overflow-y-auto bg-bg-primary">
  <ScrollProgress containerRef={scrollRef} />
  {/* ... existing content ... */}
  <ScrollToTop containerRef={scrollRef} />
</div>
```

- [ ] **Step 4: Verify scroll progress and scroll-to-top**

Run: `npm run dev`
On prediction/emergency pages, scroll down -- a thin green progress bar should appear at the top, and a scroll-to-top button should appear at the bottom-right after 400px scroll.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(citizen\)/prediction/page.tsx src/app/\(citizen\)/dashboard/page.tsx src/app/\(citizen\)/emergency/page.tsx
git commit -m "polish: scroll progress bar and scroll-to-top on long pages"
```

---

## Verification Plan

After all tasks are complete:

1. **Accessibility audit:**
   - Tab through the entire app -- skip link should appear on first tab, all interactive elements should have visible focus indicators
   - Use a screen reader (NVDA or VoiceOver) on key pages: dashboard, map, emergency
   - Check `aria-current="page"` is correctly set when navigating
   - Check `aria-pressed` toggles correctly on map controls
   - Trigger a severity 4+ toast and verify it's announced immediately (assertive)
   - Open a modal without a title and verify `aria-label="Dialog"` is present

2. **Walkthrough test:**
   - Clear localStorage (`truerisk-province` key) to reset onboarding
   - Complete onboarding wizard, then verify walkthrough starts on dashboard
   - Navigate through all 4 pages (dashboard -> map -> prediction -> emergency) using the tour
   - Test keyboard navigation: Arrow Right/Down to advance, Arrow Left/Up to go back, Escape to skip
   - Go to Profile and click "Restart guided tour" -- verify it navigates to dashboard and starts again

3. **Animation verification:**
   - Dashboard: Cards should stagger in on load, below-fold cards should reveal on scroll
   - Quick actions: Cards should scale up on hover with spring physics
   - NavPill: Active indicator should slide smoothly between tabs
   - Risk score: Numbers should count up from 0 on load
   - Prediction/emergency pages: Sections should reveal on scroll
   - Scroll progress bar should fill as user scrolls
   - Scroll-to-top button should appear after 400px scroll

4. **Reduced motion:**
   - Enable `prefers-reduced-motion: reduce` in browser
   - Verify all animations are disabled/instant
   - AnimatedNumber should show final value immediately
   - RevealOnScroll should show content without animation

5. **i18n verification:**
   - Switch to English and Spanish -- all new strings should be translated
   - Walkthrough step titles/descriptions should appear in correct language

Run: `npm run build` to verify no TypeScript errors.
