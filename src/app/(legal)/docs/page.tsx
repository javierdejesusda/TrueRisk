'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Shield,
  Cloud,
  MapPin,
  Bell,
  Users,
  Smartphone,
  Lock,
  Database,
  Copy,
  Check,
  ExternalLink,
  Gauge,
  BookOpen,
} from 'lucide-react';

const METHOD_COLORS: Record<string, { bg: string; text: string }> = {
  GET: { bg: 'rgba(132,204,22,0.12)', text: '#84CC16' },
  POST: { bg: 'rgba(59,130,246,0.12)', text: '#3B82F6' },
  PUT: { bg: 'rgba(251,191,36,0.12)', text: '#FBBF24' },
  PATCH: { bg: 'rgba(249,115,22,0.12)', text: '#F97316' },
  DELETE: { bg: 'rgba(239,68,68,0.12)', text: '#EF4444' },
};

interface Endpoint {
  method: string;
  path: string;
}

interface Category {
  key: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  endpoints: Endpoint[];
}

const CATEGORIES: Category[] = [
  {
    key: 'risk',
    icon: Shield,
    color: '#EF4444',
    endpoints: [
      { method: 'GET', path: '/risk/all' },
      { method: 'GET', path: '/risk/{province_code}' },
      { method: 'GET', path: '/risk/{province_code}/forecast' },
      { method: 'GET', path: '/risk/map' },
      { method: 'GET', path: '/risk/{province_code}/explain/attention' },
      { method: 'GET', path: '/analysis/predictions' },
      { method: 'GET', path: '/ai-summary/stream/{province_code}' },
    ],
  },
  {
    key: 'weather',
    icon: Cloud,
    color: '#3B82F6',
    endpoints: [
      { method: 'GET', path: '/data/health' },
      { method: 'GET', path: '/data/earthquakes' },
      { method: 'GET', path: '/data/fire-hotspots' },
      { method: 'GET', path: '/data/reservoirs' },
      { method: 'GET', path: '/data/air-quality/{province_code}' },
      { method: 'GET', path: '/data/river-gauges' },
      { method: 'GET', path: '/drought/{province_code}' },
      { method: 'GET', path: '/flash-flood/{province_code}' },
    ],
  },
  {
    key: 'geography',
    icon: MapPin,
    color: '#84CC16',
    endpoints: [
      { method: 'GET', path: '/provinces' },
      { method: 'GET', path: '/provinces/{code}' },
      { method: 'GET', path: '/municipalities/{province_code}/risk' },
      { method: 'GET', path: '/climate/projections/{province_code}' },
      { method: 'GET', path: '/location/current-province' },
    ],
  },
  {
    key: 'alerts',
    icon: Bell,
    color: '#FBBF24',
    endpoints: [
      { method: 'GET', path: '/alerts' },
      { method: 'GET', path: '/alerts/aemet' },
      { method: 'GET', path: '/alerts/stream' },
      { method: 'POST', path: '/alerts' },
      { method: 'GET', path: '/emergency-plan' },
      { method: 'GET', path: '/evacuation/routes/{province_code}' },
      { method: 'GET', path: '/safety/tips' },
    ],
  },
  {
    key: 'community',
    icon: Users,
    color: '#A855F7',
    endpoints: [
      { method: 'GET', path: '/community/reports' },
      { method: 'POST', path: '/community/reports' },
      { method: 'POST', path: '/community/reports/{id}/upvote' },
      { method: 'POST', path: '/chat/send' },
      { method: 'GET', path: '/suggestions' },
    ],
  },
  {
    key: 'data',
    icon: Database,
    color: '#06B6D4',
    endpoints: [
      { method: 'GET', path: '/data/demographics/{province_code}' },
      { method: 'GET', path: '/data/vegetation/{province_code}' },
      { method: 'GET', path: '/data/seismic/{province_code}' },
      { method: 'GET', path: '/data/energy' },
      { method: 'GET', path: '/data/weather-stations' },
      { method: 'GET', path: '/data/wildfire-index' },
    ],
  },
  {
    key: 'notifications',
    icon: Smartphone,
    color: '#F97316',
    endpoints: [
      { method: 'POST', path: '/push/subscribe' },
      { method: 'POST', path: '/push/unsubscribe' },
      { method: 'POST', path: '/sms/send' },
      { method: 'POST', path: '/email/test' },
    ],
  },
  {
    key: 'auth',
    icon: Lock,
    color: '#A0A0B4',
    endpoints: [
      { method: 'POST', path: '/auth/register' },
      { method: 'POST', path: '/auth/login' },
      { method: 'POST', path: '/auth/refresh' },
      { method: 'GET', path: '/auth/me' },
      { method: 'PATCH', path: '/auth/me' },
      { method: 'DELETE', path: '/auth/me' },
      { method: 'POST', path: '/property/report' },
      { method: 'GET', path: '/insurance/report' },
    ],
  },
];

function MethodBadge({ method }: { method: string }) {
  const colors = METHOD_COLORS[method] ?? { bg: 'rgba(160,160,180,0.12)', text: '#A0A0B4' };
  return (
    <span
      className="inline-block w-16 shrink-0 rounded px-2 py-0.5 text-center font-[family-name:var(--font-mono)] text-[11px] font-semibold uppercase tracking-wider"
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      {method}
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="rounded p-1.5 text-text-muted transition-colors hover:bg-border/40 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue active:scale-95"
      aria-label="Copy"
    >
      {copied ? <Check className="h-4 w-4 text-severity-1" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

export default function DocsPage() {
  const t = useTranslations('Docs');

  const codeExample = `fetch('https://truerisk.cloud/api/risk/all')
  .then(res => res.json())
  .then(data => {
    // Array of risk scores for all 52 provinces
    console.log(data);
    // → [{ province_code: "28", province_name: "Madrid",
    //       composite_risk: 3.2, hazards: {...} }, ...]
  });`;

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-text-muted transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary rounded"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('backToHome')}
        </Link>

        <motion.div initial="hidden" animate="visible" variants={stagger}>
          {/* Hero */}
          <motion.div variants={fadeUp} className="mt-6">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
                {t('title')}
              </h1>
              <span className="rounded-full border border-border bg-bg-secondary px-3 py-0.5 font-[family-name:var(--font-mono)] text-xs text-text-muted">
                v2.0.0
              </span>
            </div>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-text-secondary">
              {t('subtitle')}
            </p>
          </motion.div>

          {/* Quick reference pills */}
          <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-3">
            <div className="glass-light flex items-center gap-2 rounded-lg px-4 py-2.5">
              <BookOpen className="h-4 w-4 text-text-muted" />
              <span className="text-xs text-text-muted">{t('baseUrl')}</span>
              <code className="font-[family-name:var(--font-mono)] text-sm text-text-primary">
                https://truerisk.cloud/api
              </code>
            </div>
            <div className="glass-light flex items-center gap-2 rounded-lg px-4 py-2.5">
              <Lock className="h-4 w-4 text-text-muted" />
              <span className="text-xs text-text-muted">{t('authLabel')}</span>
              <code className="font-[family-name:var(--font-mono)] text-sm text-text-primary">
                Bearer JWT
              </code>
            </div>
            <div className="glass-light flex items-center gap-2 rounded-lg px-4 py-2.5">
              <Gauge className="h-4 w-4 text-text-muted" />
              <span className="text-xs text-text-muted">{t('formatLabel')}</span>
              <code className="font-[family-name:var(--font-mono)] text-sm text-text-primary">
                JSON + SSE
              </code>
            </div>
          </motion.div>

          {/* Quick Start */}
          <motion.section variants={fadeUp} className="mt-14">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight text-text-primary">
              {t('quickStart')}
            </h2>
            <p className="mt-2 text-sm text-text-secondary">{t('quickStartDesc')}</p>
            <div className="relative mt-4 overflow-hidden rounded-xl border border-border bg-bg-secondary">
              <div className="flex items-center justify-between border-b border-border px-4 py-2">
                <span className="font-[family-name:var(--font-mono)] text-xs text-text-muted">
                  JavaScript
                </span>
                <CopyButton text={codeExample} />
              </div>
              <pre className="overflow-x-auto p-4 font-[family-name:var(--font-mono)] text-[13px] leading-relaxed text-text-secondary">
                <code>{codeExample}</code>
              </pre>
            </div>
          </motion.section>

          {/* Auth section */}
          <motion.section variants={fadeUp} className="mt-14">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight text-text-primary">
              {t('authTitle')}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">
              {t('authDesc')}
            </p>
            <div className="relative mt-4 overflow-hidden rounded-xl border border-border bg-bg-secondary">
              <div className="flex items-center justify-between border-b border-border px-4 py-2">
                <span className="font-[family-name:var(--font-mono)] text-xs text-text-muted">
                  HTTP Header
                </span>
              </div>
              <pre className="overflow-x-auto p-4 font-[family-name:var(--font-mono)] text-[13px] leading-relaxed text-text-secondary">
                <code>Authorization: Bearer {'<your_jwt_token>'}</code>
              </pre>
            </div>
          </motion.section>

          {/* Endpoint categories */}
          <motion.section variants={fadeUp} className="mt-14">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight text-text-primary">
              {t('endpointsTitle')}
            </h2>
            <p className="mt-2 text-sm text-text-secondary">{t('endpointsDesc')}</p>

            <motion.div
              variants={stagger}
              className="mt-6 grid gap-4 sm:grid-cols-2"
            >
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <motion.div
                    key={cat.key}
                    variants={fadeUp}
                    className="group relative overflow-hidden rounded-xl border border-border bg-bg-card transition-colors hover:border-border-hover hover:bg-bg-card-hover"
                  >
                    {/* Color accent bar */}
                    <div
                      className="absolute left-0 top-0 h-full w-[3px]"
                      style={{ backgroundColor: cat.color }}
                    />

                    <div className="p-5 pl-6">
                      {/* Category header */}
                      <div className="flex items-center gap-2.5">
                        <span style={{ color: cat.color }}>
                          <Icon className="h-4.5 w-4.5 shrink-0" />
                        </span>
                        <h3 className="font-[family-name:var(--font-display)] text-sm font-semibold text-text-primary">
                          {t(`categories.${cat.key}.name`)}
                        </h3>
                      </div>
                      <p className="mt-1.5 text-xs leading-relaxed text-text-muted">
                        {t(`categories.${cat.key}.desc`)}
                      </p>

                      {/* Endpoints list */}
                      <div className="mt-3 space-y-1.5">
                        {cat.endpoints.map((ep) => (
                          <div
                            key={`${ep.method}-${ep.path}`}
                            className="flex items-center gap-2"
                          >
                            <MethodBadge method={ep.method} />
                            <code className="truncate font-[family-name:var(--font-mono)] text-xs text-text-secondary">
                              {ep.path}
                            </code>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.section>

          {/* Rate Limiting */}
          <motion.section variants={fadeUp} className="mt-14">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight text-text-primary">
              {t('rateLimitTitle')}
            </h2>
            <div className="mt-3 rounded-xl border border-border bg-bg-card p-5">
              <p className="text-sm leading-relaxed text-text-secondary">
                {t('rateLimitDesc')}
              </p>
              <div className="mt-3 flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-severity-1" />
                  <span className="font-[family-name:var(--font-mono)] text-xs text-text-secondary">
                    {t('rateLimitPublic')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-accent-blue" />
                  <span className="font-[family-name:var(--font-mono)] text-xs text-text-secondary">
                    {t('rateLimitAuth')}
                  </span>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Errors */}
          <motion.section variants={fadeUp} className="mt-14">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight text-text-primary">
              {t('errorsTitle')}
            </h2>
            <p className="mt-2 text-sm text-text-secondary">{t('errorsDesc')}</p>
            <div className="relative mt-4 overflow-hidden rounded-xl border border-border bg-bg-secondary">
              <pre className="overflow-x-auto p-4 font-[family-name:var(--font-mono)] text-[13px] leading-relaxed text-text-secondary">
                <code>{`{
  "error": "ValidationError",
  "detail": "body.province_code: field required",
  "code": 422,
  "timestamp": "2026-03-31T12:00:00+00:00"
}`}</code>
              </pre>
            </div>
          </motion.section>

          {/* Interactive docs link */}
          <motion.section variants={fadeUp} className="mt-14 mb-8">
            <div className="glass rounded-xl p-6 text-center">
              <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-text-primary">
                {t('interactiveTitle')}
              </h2>
              <p className="mt-2 text-sm text-text-secondary">
                {t('interactiveDesc')}
              </p>
              <a
                href="https://truerisk.cloud/api/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border bg-bg-secondary px-5 py-2.5 text-sm font-medium text-text-primary transition-all hover:border-border-hover hover:bg-bg-card-hover hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
              >
                <ExternalLink className="h-4 w-4" />
                {t('interactiveButton')}
              </a>
            </div>
          </motion.section>
        </motion.div>
      </div>
    </div>
  );
}
