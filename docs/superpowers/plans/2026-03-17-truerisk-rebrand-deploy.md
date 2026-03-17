# TrueRisk Rebrand & Cloud Deployment Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebrand AlertML to TrueRisk, create production deployment infrastructure, deploy to truerisk.cloud, and update documentation.

**Architecture:** Next.js standalone output mode for Docker deployment. Turso (LibSQL cloud) for production database since project already uses @libsql/client. Vercel as primary deploy target (best Next.js DX), with Dockerfile as alternative.

**Tech Stack:** Next.js 16, Prisma + Turso, Docker, Vercel, GitHub Actions

---

### Task 1: Rebrand AlertML → TrueRisk (all references)

**Files:**
- Modify: `package.json` (name field)
- Modify: `src/app/layout.tsx` (metadata title, description)
- Modify: `src/app/page.tsx` (landing page title, hero text)
- Modify: `src/components/layout/header.tsx` (logo/brand text)
- Modify: `src/components/layout/sidebar.tsx` (brand text if any)
- Modify: `README.md` (all AlertML references)
- Modify: Any other files referencing "AlertML"

- [ ] **Step 1: Search all files for "AlertML" or "alertml" references**
- [ ] **Step 2: Update package.json name to "truerisk"**
- [ ] **Step 3: Update layout.tsx metadata (title: "TrueRisk", description updated)**
- [ ] **Step 4: Update landing page hero/title text**
- [ ] **Step 5: Update header/sidebar brand text**
- [ ] **Step 6: Verify no remaining AlertML references (except git history)**

---

### Task 2: Production Next.js Configuration

**Files:**
- Modify: `next.config.ts` (add output: 'standalone' for Docker)
- Create: `.dockerignore`
- Create: `Dockerfile` (multi-stage Next.js standalone build)
- Create: `docker-compose.yml` (local production testing)

- [ ] **Step 1: Update next.config.ts with standalone output**
- [ ] **Step 2: Create .dockerignore**
- [ ] **Step 3: Create multi-stage Dockerfile**

```dockerfile
FROM node:22-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma/
RUN npm ci
RUN npx prisma generate

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
```

- [ ] **Step 4: Create docker-compose.yml for local testing**

---

### Task 3: Vercel Deployment Configuration

**Files:**
- Create: `vercel.json` (configuration)
- Modify: `prisma/schema.prisma` (ensure Turso-compatible for production)

- [ ] **Step 1: Create vercel.json with build and env config**
- [ ] **Step 2: Verify Prisma schema works with Turso cloud**
- [ ] **Step 3: Add vercel deployment instructions to README**

---

### Task 4: GitHub Actions CI/CD

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create CI workflow (lint, build, type-check)**

```yaml
name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm ci
      - run: npx prisma generate
      - run: npm run build
```

---

### Task 5: Update README with full documentation

**Files:**
- Modify: `README.md` (complete rewrite with TrueRisk branding, deployment docs)

- [ ] **Step 1: Rewrite README with TrueRisk branding**
- [ ] **Step 2: Add deployment section (Vercel + Docker)**
- [ ] **Step 3: Add CI/CD badge**
- [ ] **Step 4: Keep all existing technical docs (architecture, endpoints, etc.)**

---

### Task 6: Verify Build & Functionality

- [ ] **Step 1: Run npm run build and fix any errors**
- [ ] **Step 2: Verify all pages render (check for TypeScript errors)**
- [ ] **Step 3: Verify API routes respond correctly**

---

## Execution Notes

- Tasks 1, 2, 3, 4 are independent and can run in parallel
- Task 5 depends on Task 1 (needs final branding)
- Task 6 depends on all other tasks
- For deployment to truerisk.cloud: user needs to configure DNS to point to Vercel (or Docker host)
