'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useRiskScore } from '@/hooks/use-risk-score';
import { Tooltip } from '@/components/ui/tooltip';
import { exportCsv } from '@/lib/export-csv';
import type { RiskSeverity } from '@/types/risk';

function severityVariant(severity: RiskSeverity): 'success' | 'info' | 'warning' | 'danger' {
  switch (severity) {
    case 'low': return 'success';
    case 'moderate': return 'info';
    case 'high': return 'warning';
    case 'very_high':
    case 'critical': return 'danger';
    default: return 'success';
  }
}

function scoreColor(score: number): string {
  if (score >= 80) return 'text-accent-red';
  if (score >= 60) return 'text-accent-yellow';
  if (score >= 40) return 'text-accent-blue';
  return 'text-accent-green';
}

function barColor(score: number): string {
  if (score >= 80) return 'bg-accent-red';
  if (score >= 60) return 'bg-accent-yellow';
  if (score >= 40) return 'bg-accent-blue';
  return 'bg-accent-green';
}

const HAZARDS = [
  { key: 'flood', field: 'flood_score', tip: '0-20 Low, 20-40 Moderate, 40-60 High, 60-80 Very High, 80+ Critical' },
  { key: 'wildfire', field: 'wildfire_score', tip: 'Based on FWI system, dry days, humidity, and temperature' },
  { key: 'drought', field: 'drought_score', tip: 'Derived from SPEI index and soil moisture deficit' },
  { key: 'heatwave', field: 'heatwave_score', tip: 'Heat index, consecutive hot days/nights, WBGT' },
  { key: 'seismic', field: 'seismic_score', tip: 'IGN earthquake data: magnitude, frequency, proximity' },
  { key: 'coldwave', field: 'coldwave_score', tip: 'Wind chill, consecutive cold days, elevation' },
  { key: 'windstorm', field: 'windstorm_score', tip: 'Wind gusts, pressure dynamics, coastal exposure' },
] as const;

export function RiskOverview() {
  const t = useTranslations('Dashboard');
  const th = useTranslations('HazardModels');
  const { risk, isLoading } = useRiskScore();

  if (isLoading) {
    return (
      <Card variant="glass" padding="md" className="h-full">
        <Skeleton height="20px" width="120px" className="mb-4" />
        <Skeleton height="64px" width="100px" className="mb-4" />
        <div className="flex flex-col gap-2">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} height="16px" />
          ))}
        </div>
      </Card>
    );
  }

  if (!risk) {
    return (
      <Card variant="glass" padding="md" className="h-full">
        <p className="font-[family-name:var(--font-sans)] text-sm text-text-muted">{t('noRiskData')}</p>
      </Card>
    );
  }

  return (
    <Card variant="glass" padding="md" className="h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-[family-name:var(--font-display)] text-[11px] font-bold uppercase tracking-[0.15em] text-text-muted">
          {t('riskOverview')}
        </h2>
        <Badge variant={severityVariant(risk.severity)} size="sm" pulse={risk.severity === 'critical'}>
          {t(`severity_${risk.severity}`)}
        </Badge>
      </div>

      <div className="flex items-baseline gap-2 mb-1">
        <motion.span
          className={`font-[family-name:var(--font-display)] text-5xl font-extrabold tabular-nums ${scoreColor(risk.composite_score)}`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          {Math.round(risk.composite_score)}
        </motion.span>
        <span className="font-[family-name:var(--font-mono)] text-xs text-text-muted">/100</span>
      </div>
      <p className="font-[family-name:var(--font-sans)] text-xs text-text-secondary mb-1">
        {t('dominantHazard')}: {th(risk.dominant_hazard)}
      </p>
      {risk.confidence != null && (
        <span className="font-[family-name:var(--font-mono)] text-[10px] text-text-muted inline-block mb-4">
          {Math.round(risk.confidence * 100)}% confidence
        </span>
      )}
      {risk.confidence == null && <div className="mb-4" />}

      <div className="flex flex-col gap-2.5">
        {HAZARDS.map(({ key, field, tip }) => {
          const score = risk[field] as number;
          return (
            <div key={key} className="flex items-center gap-3">
              <Tooltip content={tip} side="right">
                <span className="font-[family-name:var(--font-sans)] text-[11px] text-text-secondary w-24 shrink-0 truncate cursor-help">
                  {th(key)}
                </span>
              </Tooltip>
              <div className="flex-1 h-1.5 rounded-full bg-bg-secondary overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${barColor(score)}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(score, 100)}%` }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                />
              </div>
              <span className="font-[family-name:var(--font-mono)] text-[10px] text-text-muted w-7 text-right tabular-nums">
                {Math.round(score)}
              </span>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => {
          const rows = HAZARDS.map(({ key, field }) => ({
            hazard: key,
            score: Math.round(risk[field] as number),
            severity: risk.severity,
            dominant: risk.dominant_hazard,
            composite: Math.round(risk.composite_score),
          }));
          exportCsv(rows, `truerisk-${risk.province_code ?? 'data'}.csv`);
        }}
        className="mt-4 w-full cursor-pointer rounded-lg border border-border px-3 py-1.5 text-[11px] font-[family-name:var(--font-sans)] text-text-muted transition-colors hover:border-accent-green hover:text-accent-green"
      >
        Export CSV
      </button>
    </Card>
  );
}
