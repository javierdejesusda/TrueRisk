'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import type { PropertyReportResponse } from '@/types/property';

interface RiskComparisonProps {
  report: PropertyReportResponse;
}

const hazards = [
  { key: 'flood', label: 'Inundacion' },
  { key: 'wildfire', label: 'Incendio Forestal' },
  { key: 'drought', label: 'Sequia' },
  { key: 'heatwave', label: 'Ola de Calor' },
  { key: 'seismic', label: 'Seismo' },
  { key: 'coldwave', label: 'Ola de Frio' },
  { key: 'windstorm', label: 'Tormenta' },
] as const;

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-severity-4';
  if (score >= 60) return 'text-severity-2';
  if (score >= 40) return 'text-accent-blue';
  return 'text-severity-1';
}

function getBarColor(score: number): string {
  if (score >= 80) return 'bg-severity-4';
  if (score >= 60) return 'bg-severity-2';
  if (score >= 40) return 'bg-accent-blue';
  return 'bg-severity-1';
}

export function RiskComparison({ report }: RiskComparisonProps) {
  const t = useTranslations('PropertyReport');

  return (
    <Card variant="default" padding="lg">
      <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-text-primary mb-6">
        {t('addressVsProvince')}
      </h2>

      {/* Table header */}
      <div className="hidden sm:grid grid-cols-[1fr_80px_1fr_80px_64px] gap-2 text-xs text-text-muted mb-3 px-1">
        <span />
        <span className="text-right">{t('addressScore')}</span>
        <span />
        <span className="text-right">{t('provinceScore')}</span>
        <span className="text-right">{t('modifier')}</span>
      </div>

      <div className="space-y-3">
        {hazards.map((hazard, i) => {
          const detail = report[hazard.key];
          const addressScore = detail.score;
          const provinceScore = detail.province_score;
          const modifier = detail.modifier;

          return (
            <motion.div
              key={hazard.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.04 }}
            >
              {/* Mobile layout */}
              <div className="sm:hidden rounded-lg border border-border bg-bg-secondary/50 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-text-primary font-medium">
                    {hazard.label}
                  </span>
                  <span className="text-xs font-mono text-text-muted">
                    x{modifier.toFixed(1)}
                  </span>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <p className="text-xs text-text-muted mb-1">{t('addressScore')}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-3 rounded-full bg-bg-card overflow-hidden">
                        <div
                          className={`h-full rounded-full ${getBarColor(addressScore)}`}
                          style={{ width: `${Math.max(addressScore, 2)}%` }}
                        />
                      </div>
                      <span className={`text-sm font-mono font-semibold tabular-nums ${getScoreColor(addressScore)}`}>
                        {addressScore}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-text-muted mb-1">{t('provinceScore')}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-3 rounded-full bg-bg-card overflow-hidden">
                        <div
                          className="h-full rounded-full bg-text-muted/40"
                          style={{ width: `${Math.max(provinceScore, 2)}%` }}
                        />
                      </div>
                      <span className="text-sm font-mono font-semibold tabular-nums text-text-secondary">
                        {provinceScore}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Desktop layout */}
              <div className="hidden sm:grid grid-cols-[1fr_80px_1fr_80px_64px] gap-2 items-center px-1 py-1.5 rounded-lg hover:bg-bg-secondary/30 transition-colors">
                {/* Address bar */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-text-secondary w-32 shrink-0 truncate">
                    {hazard.label}
                  </span>
                  <div className="flex-1 h-4 rounded-full bg-bg-secondary overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${getBarColor(addressScore)}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(addressScore, 2)}%` }}
                      transition={{ duration: 0.5, delay: 0.1 + i * 0.04 }}
                    />
                  </div>
                </div>
                <span className={`text-sm font-mono font-semibold tabular-nums text-right ${getScoreColor(addressScore)}`}>
                  {addressScore}
                </span>

                {/* Province bar */}
                <div className="flex-1 h-4 rounded-full bg-bg-secondary overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-text-muted/40"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(provinceScore, 2)}%` }}
                    transition={{ duration: 0.5, delay: 0.1 + i * 0.04 }}
                  />
                </div>
                <span className="text-sm font-mono tabular-nums text-right text-text-secondary">
                  {provinceScore}
                </span>

                {/* Modifier */}
                <span className="text-xs font-mono text-text-muted text-right">
                  x{modifier.toFixed(1)}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
}
