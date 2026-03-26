'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { PageTransition } from '@/components/layout/page-transition';
import { Select } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore } from '@/store/app-store';
import { useDroughtDashboard } from '@/hooks/use-drought-dashboard';
import { useReservoirs } from '@/hooks/use-reservoirs';
import { DroughtClassificationCard } from '@/components/drought/drought-classification-card';
import { ReservoirChart } from '@/components/drought/reservoir-chart';
import { PROVINCES } from '@/lib/provinces';

const provinceOptions = PROVINCES
  .map((p) => ({ value: p.code, label: p.name }))
  .sort((a, b) => a.label.localeCompare(b.label));

const RESTRICTION_LEVELS: Record<number, { label: string; color: string }> = {
  0: { label: 'None', color: '#22c55e' },
  1: { label: 'Alert', color: '#fbbf24' },
  2: { label: 'Warning', color: '#f97316' },
  3: { label: 'Emergency', color: '#ef4444' },
  4: { label: 'Exceptional', color: '#991b1b' },
};

export default function DroughtPage() {
  const t = useTranslations('Drought');
  const tDash = useTranslations('Dashboard');
  const provinceCode = useAppStore((s) => s.provinceCode);
  const setProvinceCode = useAppStore((s) => s.setProvinceCode);

  const { data, isLoading, error } = useDroughtDashboard(provinceCode);
  const { data: reservoirs, isLoading: reservoirsLoading } = useReservoirs();

  const provinceName =
    PROVINCES.find((p) => p.code === provinceCode)?.name ?? provinceCode;

  return (
    <PageTransition transitionKey="drought">
      <div className="h-screen pt-20 px-4 sm:px-6 lg:px-12 pb-12 max-w-6xl mx-auto overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold text-text-primary">
              {t('title')}
            </h1>
            <p className="font-[family-name:var(--font-sans)] mt-1 text-sm text-text-secondary">
              {t('subtitle', { province: provinceName })}
            </p>
          </div>
          <div className="w-full sm:w-56">
            <Select
              label={tDash('province')}
              options={provinceOptions}
              value={provinceCode}
              onChange={(e) => setProvinceCode(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div className="glass-heavy rounded-2xl p-4 mb-4 border border-red-500/20">
            <p className="font-[family-name:var(--font-sans)] text-xs text-red-400">
              {t('loadError')}
            </p>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card variant="glass" padding="md">
              <Skeleton height="20px" width="140px" className="mb-4" />
              <Skeleton height="56px" width="100%" className="mb-3" />
              <div className="grid grid-cols-3 gap-3">
                <Skeleton height="60px" />
                <Skeleton height="60px" />
                <Skeleton height="60px" />
              </div>
            </Card>
            <Card variant="glass" padding="md">
              <Skeleton height="20px" width="140px" className="mb-4" />
              <Skeleton height="200px" />
            </Card>
          </div>
        ) : !data || error ? (
          <Card variant="glass" padding="md">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-text-muted"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                  />
                </svg>
              </div>
              <h3 className="font-[family-name:var(--font-display)] text-base font-bold text-text-primary mb-1">
                {t('noDataTitle')}
              </h3>
              <p className="font-[family-name:var(--font-sans)] text-sm text-text-secondary max-w-md">
                {error ? t('loadError') : t('noData')}
              </p>
            </div>
          </Card>
        ) : data.data_available === false ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-8">
            {/* Show the no-data message card */}
            <Card variant="glass" padding="md" className="lg:col-span-2">
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-14 h-14 rounded-2xl glass flex items-center justify-center mb-4">
                  <svg
                    className="w-7 h-7 text-text-muted"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                    />
                  </svg>
                </div>
                <h3 className="font-[family-name:var(--font-display)] text-base font-bold text-text-primary mb-1">
                  {t('noDataTitle')}
                </h3>
                <p className="font-[family-name:var(--font-sans)] text-sm text-text-secondary max-w-md">
                  {t('noData')}
                </p>
              </div>
            </Card>

            {/* Still show reservoir chart independently */}
            <div className="lg:col-span-2">
              {reservoirsLoading ? (
                <Card variant="glass" padding="md">
                  <Skeleton height="20px" width="140px" className="mb-4" />
                  <Skeleton height="200px" />
                </Card>
              ) : (
                <ReservoirChart reservoirs={reservoirs ?? []} />
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-8">
            {/* Left: classification card */}
            <DroughtClassificationCard
              classification={data.classification}
              spei1m={data.spei_1m}
              spei3m={data.spei_3m}
              droughtScore={data.drought_score}
            />

            {/* Right: drought score gauge */}
            <Card variant="glass" padding="md">
              <h2 className="font-[family-name:var(--font-display)] text-[11px] font-bold uppercase tracking-[0.15em] text-text-muted mb-4">
                {t('droughtScore')}
              </h2>
              <div className="flex flex-col items-center justify-center py-4">
                <div className="relative w-36 h-36">
                  <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                    {/* Background track */}
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="rgba(255,255,255,0.06)"
                      strokeWidth="10"
                    />
                    {/* Progress arc */}
                    <motion.circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke={data.classification.color}
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${(data.drought_score / 100) * 314.16} 314.16`}
                      initial={{ strokeDasharray: '0 314.16' }}
                      animate={{
                        strokeDasharray: `${(data.drought_score / 100) * 314.16} 314.16`,
                      }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span
                      className="font-[family-name:var(--font-display)] text-3xl font-extrabold tabular-nums"
                      style={{ color: data.classification.color }}
                    >
                      {Math.round(data.drought_score)}
                    </span>
                    <span className="font-[family-name:var(--font-mono)] text-[10px] text-text-muted">
                      / 100
                    </span>
                  </div>
                </div>
              </div>

              {/* SPEI comparison bar */}
              <div className="mt-4 space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-[family-name:var(--font-sans)] text-xs text-text-secondary">
                      {t('spei1m')}
                    </span>
                    <span className="font-[family-name:var(--font-mono)] text-xs text-text-muted tabular-nums">
                      {data.spei_1m.toFixed(2)}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-bg-secondary overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        backgroundColor: data.spei_1m >= 0 ? '#22c55e' : '#ef4444',
                      }}
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min(Math.abs(data.spei_1m) * 25, 100)}%`,
                      }}
                      transition={{ duration: 0.6 }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-[family-name:var(--font-sans)] text-xs text-text-secondary">
                      {t('spei3m')}
                    </span>
                    <span className="font-[family-name:var(--font-mono)] text-xs text-text-muted tabular-nums">
                      {data.spei_3m.toFixed(2)}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-bg-secondary overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        backgroundColor: data.spei_3m >= 0 ? '#22c55e' : '#ef4444',
                      }}
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min(Math.abs(data.spei_3m) * 25, 100)}%`,
                      }}
                      transition={{ duration: 0.6, delay: 0.1 }}
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Water restrictions */}
            <Card variant="glass" padding="md" className="lg:col-span-2">
              <h2 className="font-[family-name:var(--font-display)] text-[11px] font-bold uppercase tracking-[0.15em] text-text-muted mb-4">
                {t('restrictions')}
              </h2>
              {data.restrictions.length === 0 ? (
                <div className="flex items-center gap-3 p-3 glass rounded-xl">
                  <div className="w-2 h-2 rounded-full bg-accent-green" />
                  <p className="font-[family-name:var(--font-sans)] text-sm text-text-secondary">
                    {t('noRestrictions')}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {data.restrictions.map((r, idx) => {
                    const level = RESTRICTION_LEVELS[r.level] ?? RESTRICTION_LEVELS[0];
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-start gap-3 p-3 glass rounded-xl"
                      >
                        <div
                          className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                          style={{ backgroundColor: level.color }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span
                              className="font-[family-name:var(--font-display)] text-xs font-bold"
                              style={{ color: level.color }}
                            >
                              {t('level')} {r.level}
                            </span>
                            <span className="font-[family-name:var(--font-sans)] text-[10px] text-text-muted">
                              {r.source}
                            </span>
                          </div>
                          <p className="font-[family-name:var(--font-sans)] text-xs text-text-secondary">
                            {r.description}
                          </p>
                          {r.effective_date && (
                            <p className="font-[family-name:var(--font-mono)] text-[10px] text-text-muted mt-1">
                              {new Date(r.effective_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Reservoir chart */}
            <div className="lg:col-span-2">
              {reservoirsLoading ? (
                <Card variant="glass" padding="md">
                  <Skeleton height="20px" width="140px" className="mb-4" />
                  <Skeleton height="200px" />
                </Card>
              ) : (
                <ReservoirChart reservoirs={reservoirs ?? []} />
              )}
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
