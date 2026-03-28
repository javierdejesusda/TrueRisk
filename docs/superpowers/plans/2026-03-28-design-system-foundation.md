# Design System Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace TrueRisk's current color palette, typography, and component styling with the Steel & Surgical intelligence platform design system (IBM Plex fonts, navy/slate/blue palette).

**Architecture:** Update CSS custom properties in globals.css, swap Geist fonts for IBM Plex in layout.tsx, then restyle all 14 UI components to use the new tokens. No structural changes — only visual tokens and class names.

**Tech Stack:** Tailwind CSS v4, next/font/google, Framer Motion, CSS custom properties

---

## File Structure

| Action | File | Responsibility |
|--------|------|---------------|
| Modify | `src/app/globals.css` | CSS variables, glass morphism, animations, MapLibre overrides |
| Modify | `src/app/layout.tsx` | Font imports (IBM Plex Sans + IBM Plex Mono) |
| Modify | `src/components/ui/button.tsx` | Button variants and styles |
| Modify | `src/components/ui/card.tsx` | Card variants and border radius |
| Modify | `src/components/ui/badge.tsx` | Badge colors and font |
| Modify | `src/components/ui/input.tsx` | Input focus states and colors |
| Modify | `src/components/ui/select.tsx` | Select focus states and colors |
| Modify | `src/components/ui/modal.tsx` | Modal backdrop and panel styling |
| Modify | `src/components/ui/toast.tsx` | Toast severity styling |
| Modify | `src/components/ui/tooltip.tsx` | Tooltip styling |
| Modify | `src/components/ui/pagination.tsx` | Pagination active state |
| Modify | `src/components/ui/skeleton.tsx` | Skeleton base color |
| Modify | `src/components/ui/empty-state.tsx` | Empty state icon and text colors |
| Modify | `src/components/ui/auth-card.tsx` | Auth card glow color |
| Modify | `src/components/ui/offline-indicator.tsx` | Offline indicator styling |

---

### Task 1: Update CSS Variables — New Color Palette

**Files:**
- Modify: `src/app/globals.css` (lines 1-25, the `@theme` block)

- [ ] **Step 1: Replace the `@theme` block with new Steel & Surgical tokens**

In `src/app/globals.css`, replace the entire `@theme { ... }` block with:

```css
@theme {
  /* ── Steel & Surgical Palette ──────────────────────────────── */
  --color-bg-void: #060810;
  --color-bg-primary: #080B12;
  --color-bg-panel: #111827;
  --color-bg-elevated: #1E293B;
  --color-bg-glass: rgba(17, 24, 39, 0.8);

  /* Legacy aliases — keep so existing Tailwind classes still resolve */
  --color-bg-secondary: #080B12;
  --color-bg-card: #111827;
  --color-bg-card-hover: #1E293B;

  --color-border: rgba(248, 250, 252, 0.06);
  --color-border-hover: rgba(248, 250, 252, 0.12);

  --color-text-primary: #F8FAFC;
  --color-text-secondary: #94A3B8;
  --color-text-muted: #64748B;

  --color-accent-primary: #3B82F6;
  --color-accent-blue: #3B82F6;
  --color-accent-blue-light: #60A5FA;
  --color-accent-green: #3B82F6;  /* Remap green accent → blue for consistency */
  --color-accent-yellow: #FBBF24;
  --color-accent-orange: #F97316;
  --color-accent-red: #EF4444;
  --color-accent-purple: #A855F7;

  --color-severity-1: #84CC16;
  --color-severity-2: #FBBF24;
  --color-severity-3: #F97316;
  --color-severity-4: #EF4444;
  --color-severity-5: #DC2626;

  --font-display: 'IBM Plex Sans', system-ui, sans-serif;
  --font-sans: 'IBM Plex Sans', system-ui, sans-serif;
  --font-mono: 'IBM Plex Mono', monospace;
}
```

Key changes:
- Added `--color-bg-void` and `--color-bg-panel`/`--color-bg-elevated` as new semantic names
- Kept legacy aliases (`--color-bg-secondary`, `--color-bg-card`, `--color-bg-card-hover`) so existing Tailwind classes resolve without breaking
- Borders changed from solid hex to rgba for subtlety
- `--color-accent-green` remapped to `#3B82F6` (blue) so all "primary accent" references now use intel blue
- `--color-severity-5` changed from `#e51f1f` to `#DC2626` (standard Tailwind red-600)
- Fonts swapped from Geist to IBM Plex

- [ ] **Step 2: Update base body styles**

In `src/app/globals.css`, replace the body rule:

```css
body {
  background-color: var(--color-bg-void);
  color: var(--color-text-primary);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

Change: `--color-bg-primary` → `--color-bg-void` for deepest background.

- [ ] **Step 3: Update selection and focus ring colors**

Replace selection highlight:

```css
::selection {
  background-color: color-mix(in srgb, var(--color-accent-blue) 30%, transparent);
  color: var(--color-text-primary);
}
```

Replace focus ring:

```css
:focus-visible {
  outline: 2px solid var(--color-accent-blue);
  outline-offset: 2px;
}
```

- [ ] **Step 4: Verify CSS compiles**

Run: `cd C:/Projects/TrueRisk && npx tsc --noEmit`
Expected: No errors (CSS changes don't affect TypeScript, but verify no import issues)

Run: `cd C:/Projects/TrueRisk && npm run dev` (start and immediately stop)
Expected: No build errors

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css
git commit -m "feat(design): replace color palette with Steel & Surgical tokens"
```

---

### Task 2: Update Font Imports — IBM Plex

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Replace Geist imports with IBM Plex**

In `src/app/layout.tsx`, replace the font imports and configuration:

Replace:
```typescript
import { Geist, Geist_Mono } from "next/font/google";
```

With:
```typescript
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
```

Replace:
```typescript
const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});
```

With:
```typescript
const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});
```

- [ ] **Step 2: Update className references in body tag**

Replace:
```typescript
className={`${geistSans.variable} ${geistMono.variable} antialiased`}
```

With:
```typescript
className={`${plexSans.variable} ${plexMono.variable} antialiased`}
```

- [ ] **Step 3: Verify fonts load**

Run: `cd C:/Projects/TrueRisk && npx tsc --noEmit`
Expected: No TypeScript errors

Run: `cd C:/Projects/TrueRisk && npm run dev`
Expected: Dev server starts. Visit http://localhost:3000 — text should render in IBM Plex Sans (notably different from Geist: more "corporate" letterforms, different a/g shapes).

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat(design): replace Geist fonts with IBM Plex Sans and Mono"
```

---

### Task 3: Update Glass Morphism & Animations

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Replace glass utilities**

Replace the three glass classes:

```css
.glass {
  backdrop-filter: blur(24px) saturate(140%);
  -webkit-backdrop-filter: blur(24px) saturate(140%);
  background: rgba(17, 24, 39, 0.8);
  border: 1px solid rgba(248, 250, 252, 0.06);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2);
}

.glass-heavy {
  backdrop-filter: blur(40px) saturate(160%);
  -webkit-backdrop-filter: blur(40px) saturate(160%);
  background: rgba(17, 24, 39, 0.92);
  border: 1px solid rgba(248, 250, 252, 0.08);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4), 0 0 1px rgba(59, 130, 246, 0.1);
}

.glass-light {
  backdrop-filter: blur(16px) saturate(130%);
  -webkit-backdrop-filter: blur(16px) saturate(130%);
  background: rgba(17, 24, 39, 0.5);
  border: 1px solid rgba(248, 250, 252, 0.04);
}
```

Key changes: Reduced blur values for cleaner look. Glass-heavy shadow now has subtle blue tint (`rgba(59,130,246,0.1)`). Colors aligned to new palette.

- [ ] **Step 2: Update MapLibre popup styles**

Replace `rgba(12, 12, 20, 0.95)` → `rgba(17, 24, 39, 0.95)` in all MapLibre popup rules (4 occurrences for popup-content and the 4 anchor-tip rules).

```css
.maplibregl-popup-content {
  background-color: rgba(17, 24, 39, 0.95) !important;
  backdrop-filter: blur(40px) saturate(160%) !important;
  -webkit-backdrop-filter: blur(40px) saturate(160%) !important;
  border: 1px solid rgba(248, 250, 252, 0.08) !important;
  border-radius: 0.5rem !important;
  color: var(--color-text-primary) !important;
  padding: 0 !important;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4) !important;
}

.maplibregl-popup-anchor-bottom .maplibregl-popup-tip {
  border-top-color: rgba(17, 24, 39, 0.95) !important;
}
.maplibregl-popup-anchor-top .maplibregl-popup-tip {
  border-bottom-color: rgba(17, 24, 39, 0.95) !important;
}
.maplibregl-popup-anchor-left .maplibregl-popup-tip {
  border-right-color: rgba(17, 24, 39, 0.95) !important;
}
.maplibregl-popup-anchor-right .maplibregl-popup-tip {
  border-left-color: rgba(17, 24, 39, 0.95) !important;
}
```

Also change popup border-radius from `1rem` to `0.5rem` (8px, matching new system).

- [ ] **Step 3: Update MapLibre control styles**

Replace:
```css
.maplibregl-ctrl-group {
  background-color: var(--color-bg-secondary) !important;
  border: 1px solid var(--color-border) !important;
}
```

With:
```css
.maplibregl-ctrl-group {
  background-color: var(--color-bg-panel) !important;
  border: 1px solid rgba(248, 250, 252, 0.06) !important;
  border-radius: 6px !important;
}
```

- [ ] **Step 4: Verify no build errors**

Run: `cd C:/Projects/TrueRisk && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css
git commit -m "feat(design): refine glass morphism and map overlays for Steel palette"
```

---

### Task 4: Update Button Component

**Files:**
- Modify: `src/components/ui/button.tsx`

- [ ] **Step 1: Replace variant styles**

Replace the `variantStyles` object:

```typescript
const variantStyles = {
  primary:
    'bg-accent-blue text-white hover:bg-accent-blue-light hover:shadow-[0_0_20px_rgba(59,130,246,0.25)]',
  danger:
    'bg-accent-red text-white hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]',
  ghost:
    'bg-transparent text-text-secondary hover:bg-white/5 hover:text-text-primary',
  outline:
    'border border-border text-text-primary hover:border-accent-blue/50 hover:text-accent-blue-light',
  secondary:
    'bg-bg-panel text-text-secondary hover:bg-bg-elevated hover:text-text-primary',
} as const;
```

- [ ] **Step 2: Update size styles for new border-radius (6px)**

Replace `sizeStyles`:

```typescript
const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm rounded-[6px] gap-1.5',
  md: 'px-4 py-2 text-sm rounded-[6px] gap-2',
  lg: 'px-6 py-3 text-base rounded-[6px] gap-2.5',
} as const;
```

- [ ] **Step 3: Update focus ring to blue**

In the className array, replace:
```typescript
'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-green',
```
With:
```typescript
'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue',
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `cd C:/Projects/TrueRisk && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/button.tsx
git commit -m "feat(design): restyle Button with Steel & Surgical palette"
```

---

### Task 5: Update Card Component

**Files:**
- Modify: `src/components/ui/card.tsx`

- [ ] **Step 1: Replace variant styles and border radius**

Replace `variantStyles`:

```typescript
const variantStyles = {
  default: 'border border-border bg-bg-panel',
  glass: 'glass',
  'glass-heavy': 'glass-heavy',
} as const;
```

Replace `rounded-2xl` with `rounded-[8px]` in the className:

```typescript
className={[
  'relative overflow-hidden rounded-[8px]',
  variantStyles[variant],
  paddingStyles[padding],
  hoverable &&
    'transition-all duration-200 hover:border-border-hover hover:shadow-[0_1px_3px_rgba(0,0,0,0.3),0_1px_2px_rgba(0,0,0,0.2)]',
  className,
]
  .filter(Boolean)
  .join(' ')}
```

Key changes: `bg-bg-card` → `bg-bg-panel`, hover uses `border-border-hover` instead of green tint, border radius from 16px to 8px, hover shadow uses new depth system.

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd C:/Projects/TrueRisk && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/card.tsx
git commit -m "feat(design): restyle Card with 8px radius and panel bg"
```

---

### Task 6: Update Badge Component

**Files:**
- Modify: `src/components/ui/badge.tsx`

- [ ] **Step 1: Update variant opacity levels to 12%**

Replace `variantStyles`:

```typescript
const variantStyles = {
  success: 'bg-severity-1/12 text-severity-1 border-severity-1/25',
  warning: 'bg-accent-yellow/12 text-accent-yellow border-accent-yellow/25',
  danger: 'bg-accent-red/12 text-accent-red border-accent-red/25',
  info: 'bg-accent-blue/12 text-accent-blue border-accent-blue/25',
  neutral: 'bg-bg-panel text-text-secondary border-border',
} as const;
```

Replace `severityStyles`:

```typescript
const severityStyles: Record<number, string> = {
  1: 'bg-severity-1/12 text-severity-1 border-severity-1/25',
  2: 'bg-severity-2/12 text-severity-2 border-severity-2/25',
  3: 'bg-severity-3/12 text-severity-3 border-severity-3/25',
  4: 'bg-severity-4/12 text-severity-4 border-severity-4/25',
  5: 'bg-severity-5/12 text-severity-5 border-severity-5/25',
};
```

- [ ] **Step 2: Update badge base styles**

Replace the outer className in the `<span>`:

```typescript
className={[
  'inline-flex items-center gap-1 rounded-[4px] border font-medium font-[family-name:var(--font-mono)] whitespace-nowrap transition-transform duration-150 hover:scale-105',
  colorStyle,
  sizeStyles[size],
  pulse && 'animate-pulse',
  className,
]
  .filter(Boolean)
  .join(' ')}
```

Key changes: `rounded-full` → `rounded-[4px]`, always use mono font (not just when severity), removed conditional `severity && 'font-mono'`.

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd C:/Projects/TrueRisk && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/badge.tsx
git commit -m "feat(design): restyle Badge with 4px radius and mono font"
```

---

### Task 7: Update Input and Select Components

**Files:**
- Modify: `src/components/ui/input.tsx`
- Modify: `src/components/ui/select.tsx`

- [ ] **Step 1: Update Input focus styles — green to blue**

In `src/components/ui/input.tsx`, replace the non-error border/focus line:

```typescript
: 'border-border hover:border-border-hover focus:border-accent-blue/60 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]',
```

Replace the label className:

```typescript
className="text-xs font-medium uppercase tracking-[0.12em] text-text-muted font-[family-name:var(--font-mono)]"
```

Key changes: `accent-green` → `accent-blue` in focus states. Label uses IBM Plex Mono styling with 0.12em tracking. `font-bold` → `font-medium`, `text-text-secondary` → `text-text-muted`, `font-display` → `font-mono`.

Also change Input base bg from `bg-bg-secondary` to `bg-bg-primary`:

```typescript
'w-full rounded-[6px] border bg-bg-primary px-3 py-2 text-sm text-text-primary',
```

And change `rounded-lg` → `rounded-[6px]`.

- [ ] **Step 2: Update Select focus styles — green to blue**

In `src/components/ui/select.tsx`, apply the same changes:

Replace non-error border/focus:
```typescript
: 'border-border hover:border-border-hover focus:border-accent-blue/60 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]',
```

Replace label className:
```typescript
className="text-xs font-medium uppercase tracking-[0.12em] text-text-muted font-[family-name:var(--font-mono)]"
```

Replace base className: `bg-bg-secondary` → `bg-bg-primary`, `rounded-lg` → `rounded-[6px]`.

Update the dropdown arrow SVG fill color from `%237A7A90` to `%2364748B` (new `--text-muted` hex):

```typescript
style={{
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%2364748B' viewBox='0 0 16 16'%3E%3Cpath d='M4.5 6l3.5 4 3.5-4z'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 8px center',
}}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd C:/Projects/TrueRisk && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/input.tsx src/components/ui/select.tsx
git commit -m "feat(design): restyle Input and Select with blue focus and mono labels"
```

---

### Task 8: Update Modal Component

**Files:**
- Modify: `src/components/ui/modal.tsx`

- [ ] **Step 1: Update modal panel styling**

Replace the panel className:

```typescript
className="relative z-10 w-full max-w-lg glass-heavy rounded-[12px] p-6 shadow-xl"
```

Change: `rounded-2xl` → `rounded-[12px]`.

- [ ] **Step 2: Update backdrop opacity**

Replace backdrop className:

```typescript
className="absolute inset-0 bg-black/60 backdrop-blur-sm"
```

Change: `bg-black/70` → `bg-black/60`.

- [ ] **Step 3: Update close button hover**

Replace close button className:

```typescript
className="rounded-[6px] p-1 text-text-muted transition-colors hover:bg-white/5 hover:text-text-primary cursor-pointer"
```

Change: `rounded-md` → `rounded-[6px]`.

- [ ] **Step 4: Verify TypeScript compiles**

Run: `cd C:/Projects/TrueRisk && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/modal.tsx
git commit -m "feat(design): restyle Modal with 12px radius"
```

---

### Task 9: Update Toast Component

**Files:**
- Modify: `src/components/ui/toast.tsx`

- [ ] **Step 1: Update toast container background**

The toast already uses severity-based colors which remain unchanged. Update the base styling to use new panel background. In the `motion.div` for each toast item, replace:

```typescript
className={`pointer-events-auto flex items-start gap-3 rounded-[8px] border ${colors.border} ${colors.bg} p-3 shadow-lg backdrop-blur-md cursor-pointer`}
```

Change: `rounded-lg` → `rounded-[8px]`.

- [ ] **Step 2: Update text font references**

In the title span, add mono font for severity label:

```typescript
<span className={`text-xs font-medium font-[family-name:var(--font-mono)] ${colors.icon}`}>
  {severityLabels[item.severity] ?? `Lv ${item.severity}`}
</span>
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd C:/Projects/TrueRisk && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/toast.tsx
git commit -m "feat(design): restyle Toast with 8px radius and mono labels"
```

---

### Task 10: Update Tooltip Component

**Files:**
- Modify: `src/components/ui/tooltip.tsx`

- [ ] **Step 1: Update tooltip panel and arrow styles**

Replace the tooltip inner span className:

```typescript
<span className="block glass-heavy rounded-[6px] border border-border bg-bg-elevated px-2.5 py-1.5 shadow-lg whitespace-nowrap">
  <span className="font-[family-name:var(--font-sans)] text-[11px] text-text-secondary leading-tight">
    {content}
  </span>
</span>
```

Changes: `rounded-md` → `rounded-[6px]`, `bg-bg-card` → `bg-bg-elevated`.

Replace `arrowStyles` to match new token names:

```typescript
const arrowStyles: Record<TooltipSide, string> = {
  top: 'top-full left-1/2 -translate-x-1/2 border-t-bg-elevated border-x-transparent border-b-transparent',
  bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-bg-elevated border-x-transparent border-t-transparent',
  left: 'left-full top-1/2 -translate-y-1/2 border-l-bg-elevated border-y-transparent border-r-transparent',
  right: 'right-full top-1/2 -translate-y-1/2 border-r-bg-elevated border-y-transparent border-l-transparent',
};
```

Changes: `border-*-bg-card` → `border-*-bg-elevated`.

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd C:/Projects/TrueRisk && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/tooltip.tsx
git commit -m "feat(design): restyle Tooltip with elevated bg and 6px radius"
```

---

### Task 11: Update Pagination, Skeleton, and EmptyState

**Files:**
- Modify: `src/components/ui/pagination.tsx`
- Modify: `src/components/ui/skeleton.tsx`
- Modify: `src/components/ui/empty-state.tsx`

- [ ] **Step 1: Update Pagination active state — green to blue**

In `src/components/ui/pagination.tsx`, replace the active page style:

```typescript
p === page
  ? 'bg-accent-blue/15 text-accent-blue-light font-bold'
  : 'text-text-muted hover:text-text-primary hover:bg-bg-primary'
```

Changes: `accent-green/15` → `accent-blue/15`, `text-accent-green` → `text-accent-blue-light`, `hover:bg-bg-secondary` → `hover:bg-bg-primary`.

- [ ] **Step 2: Update Skeleton base color**

In `src/components/ui/skeleton.tsx`, replace the className:

```typescript
className={[
  'bg-bg-panel animate-[shimmer_1.5s_infinite]',
  roundedStyles[rounded],
  className,
].join(' ')}
```

Change: `bg-bg-secondary` → `bg-bg-panel`.

- [ ] **Step 3: Update EmptyState colors — green to blue**

In `src/components/ui/empty-state.tsx`, replace the icon container:

```typescript
className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-blue/10"
```

Replace the title:

```typescript
<p className="font-[family-name:var(--font-sans)] text-lg font-semibold text-text-primary">{title}</p>
```

Changes: `bg-accent-green/10` → `bg-accent-blue/10`, title uses `text-text-primary` with `font-semibold` instead of `text-accent-green`.

- [ ] **Step 4: Verify TypeScript compiles**

Run: `cd C:/Projects/TrueRisk && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/pagination.tsx src/components/ui/skeleton.tsx src/components/ui/empty-state.tsx
git commit -m "feat(design): restyle Pagination, Skeleton, EmptyState with blue accents"
```

---

### Task 12: Update AuthCard Component

**Files:**
- Modify: `src/components/ui/auth-card.tsx`

- [ ] **Step 1: Update background color**

In `AuthCardBackground`, replace:

```typescript
className="min-h-screen w-screen bg-bg-void relative overflow-hidden flex items-center justify-center"
```

Change: `bg-black` → `bg-bg-void`.

- [ ] **Step 2: Update glow animation to blue tint**

Replace the box-shadow animation values:

```typescript
animate={{
  boxShadow: [
    '0 0 10px 2px rgba(59,130,246,0.05)',
    '0 0 15px 5px rgba(59,130,246,0.1)',
    '0 0 10px 2px rgba(59,130,246,0.05)',
  ],
  opacity: [0.3, 0.5, 0.3],
}}
```

The glow already uses blue (rgba(59,130,246)) — just increase opacity slightly for visibility against new darker background.

- [ ] **Step 3: Update inner card bg and radius**

Replace the inner card div:

```typescript
<div className="relative bg-bg-panel/80 backdrop-blur-xl rounded-[12px] p-6 border border-border shadow-2xl overflow-hidden">
```

Changes: `bg-bg-card/80` → `bg-bg-panel/80`, `rounded-2xl` → `rounded-[12px]`.

- [ ] **Step 4: Verify TypeScript compiles**

Run: `cd C:/Projects/TrueRisk && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/auth-card.tsx
git commit -m "feat(design): restyle AuthCard with void bg and blue glow"
```

---

### Task 13: Update OfflineIndicator

**Files:**
- Modify: `src/components/ui/offline-indicator.tsx`

- [ ] **Step 1: Update styling**

The offline indicator already uses glass-heavy and accent-orange which are correct for the new palette. Only update the border radius:

Replace `rounded-xl` → `rounded-[8px]` and `rounded-lg` → `rounded-[6px]`:

```typescript
<div className="glass-heavy rounded-[8px] border border-accent-orange/30 px-4 py-2 flex items-center gap-3">
```

And the link:

```typescript
<Link
  href="/emergency"
  className="text-[10px] font-medium font-[family-name:var(--font-mono)] text-white bg-accent-orange/20 hover:bg-accent-orange/30 px-2 py-0.5 rounded-[6px] transition-colors"
>
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd C:/Projects/TrueRisk && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/offline-indicator.tsx
git commit -m "feat(design): restyle OfflineIndicator with consistent radii"
```

---

### Task 14: Full Verification Pass

**Files:** All modified files

- [ ] **Step 1: Run TypeScript check**

Run: `cd C:/Projects/TrueRisk && npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 2: Run ESLint**

Run: `cd C:/Projects/TrueRisk && npx eslint src/app/globals.css src/app/layout.tsx src/components/ui/`
Expected: No errors (or only pre-existing warnings)

- [ ] **Step 3: Start dev server and verify**

Run: `cd C:/Projects/TrueRisk && npm run dev`

Verify:
1. Visit http://localhost:3000 — landing page loads with IBM Plex fonts and new dark navy palette
2. Visit http://localhost:3000/login — AuthCard renders with blue glow, new background
3. Buttons, inputs, cards use the new color tokens
4. No console errors

- [ ] **Step 4: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix(design): resolve design system verification issues"
```

Only create this commit if fixes were made in Step 3. If everything passed, skip this step.
