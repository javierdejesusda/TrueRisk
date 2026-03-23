'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import type { RiskSeverity } from '@/types/risk';

interface PropertyRiskSummaryProps {
  compositeScore: number;
  dominantHazard: string;
  severity: RiskSeverity;
  address: string;
}

const severityToNumber: Record<RiskSeverity, 1 | 2 | 3 | 4 | 5> = {
  low: 1,
  moderate: 2,
  high: 3,
  very_high: 4,
  critical: 5,
};

const severityLabels: Record<RiskSeverity, string> = {
  low: 'Bajo',
  moderate: 'Moderado',
  high: 'Alto',
  very_high: 'Muy Alto',
  critical: 'Critico',
};

const hazardLabels: Record<string, string> = {
  flood: 'Inundacion',
  wildfire: 'Incendio Forestal',
  drought: 'Sequia',
  heatwave: 'Ola de Calor',
  seismic: 'Seismo',
  coldwave: 'Ola de Frio',
  windstorm: 'Tormenta',
};

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-severity-4';
  if (score >= 60) return 'text-severity-2';
  if (score >= 40) return 'text-accent-blue';
  return 'text-severity-1';
}

function getScoreRingColor(score: number): string {
  if (score >= 80) return 'border-severity-4';
  if (score >= 60) return 'border-severity-2';
  if (score >= 40) return 'border-accent-blue';
  return 'border-severity-1';
}

export function PropertyRiskSummary({
  compositeScore,
  dominantHazard,
  severity,
  address,
}: PropertyRiskSummaryProps) {
  const t = useTranslations('PropertyReport');

  return (
    <motion.div
      className="flex flex-col items-center text-center py-8 sm:py-12"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Score circle */}
      <motion.div
        className={`relative w-36 h-36 sm:w-44 sm:h-44 rounded-full border-4 ${getScoreRingColor(compositeScore)} flex items-center justify-center`}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="flex flex-col items-center">
          <span
            className={`font-[family-name:var(--font-display)] text-6xl font-extrabold tabular-nums ${getScoreColor(compositeScore)}`}
          >
            {compositeScore}
          </span>
          <span className="text-xs text-text-muted mt-1">/100</span>
        </div>
        {/* Background glow */}
        <div
          className={`absolute inset-0 rounded-full ${getScoreRingColor(compositeScore)} opacity-10 blur-xl`}
        />
      </motion.div>

      {/* Composite score label */}
      <p className="mt-4 text-sm text-text-secondary font-[family-name:var(--font-sans)]">
        {t('compositeScore')}
      </p>

      {/* Severity badge + dominant hazard */}
      <div className="mt-4 flex items-center gap-3 flex-wrap justify-center">
        <Badge severity={severityToNumber[severity]} size="md">
          {severityLabels[severity]}
        </Badge>
        <span className="text-sm text-text-secondary font-[family-name:var(--font-sans)]">
          {t('dominantHazard')}:{' '}
          <span className="text-text-primary font-medium">
            {hazardLabels[dominantHazard] ?? dominantHazard}
          </span>
        </span>
      </div>

      {/* Address */}
      <p className="mt-4 text-sm text-text-muted font-[family-name:var(--font-sans)] max-w-md">
        {address}
      </p>
    </motion.div>
  );
}
