'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import type { PropertyReportResponse } from '@/types/property';

interface HazardBreakdownProps {
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

function getBarColor(score: number): string {
  if (score >= 80) return 'bg-severity-4';
  if (score >= 60) return 'bg-severity-2';
  if (score >= 40) return 'bg-accent-blue';
  return 'bg-severity-1';
}

function getBarBgColor(score: number): string {
  if (score >= 80) return 'bg-severity-4/10';
  if (score >= 60) return 'bg-severity-2/10';
  if (score >= 40) return 'bg-accent-blue/10';
  return 'bg-severity-1/10';
}

export function HazardBreakdown({ report }: HazardBreakdownProps) {
  const t = useTranslations('PropertyReport');

  return (
    <Card variant="default" padding="lg">
      <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-text-primary mb-6">
        {t('hazardBreakdown')}
      </h2>

      <div className="space-y-4">
        {hazards.map((hazard, i) => {
          const detail = report[hazard.key];
          const score = detail.score;
          const provinceScore = detail.province_score;

          return (
            <motion.div
              key={hazard.key}
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              {/* Hazard label */}
              <span className="text-sm text-text-secondary font-[family-name:var(--font-sans)] w-36 sm:w-40 shrink-0 truncate">
                {hazard.label}
              </span>

              {/* Bar */}
              <div className="flex-1 relative">
                <div className={`h-6 rounded-lg ${getBarBgColor(score)} overflow-hidden`}>
                  <motion.div
                    className={`h-full rounded-lg ${getBarColor(score)}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(score, 2)}%` }}
                    transition={{ duration: 0.6, delay: 0.1 + i * 0.05, ease: 'easeOut' }}
                  />
                </div>
                {/* Province score marker */}
                {provinceScore > 0 && (
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-1.5 h-4 rounded-full bg-text-muted/60 border border-bg-card"
                    style={{ left: `${Math.min(provinceScore, 100)}%` }}
                    title={`Provincia: ${provinceScore}`}
                  />
                )}
              </div>

              {/* Score number */}
              <span className="text-sm font-mono font-semibold text-text-primary w-10 text-right tabular-nums">
                {score}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 text-xs text-text-muted">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-severity-1" /> Bajo
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-severity-2" /> Moderado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-severity-4" /> Alto
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-4 rounded-full bg-text-muted/60" /> Provincia
        </span>
      </div>
    </Card>
  );
}
