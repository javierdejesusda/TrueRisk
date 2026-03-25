'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import type { HydroNowcast } from '@/hooks/use-hydro-nowcast';

const RISK_BADGE: Record<string, { variant: 'success' | 'info' | 'warning' | 'danger'; pulse?: boolean }> = {
  normal: { variant: 'success' },
  elevated: { variant: 'info' },
  moderate: { variant: 'warning' },
  high: { variant: 'danger' },
  critical: { variant: 'danger', pulse: true },
};

interface RiverFlowLayerProps {
  data: HydroNowcast | null;
  isLoading: boolean;
}

export function RiverFlowLayer({ data, isLoading }: RiverFlowLayerProps) {
  const t = useTranslations('HydroNowcast');

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-bg-card/80 backdrop-blur-sm p-3 animate-pulse">
        <div className="h-4 w-32 rounded bg-bg-secondary mb-2" />
        <div className="h-3 w-24 rounded bg-bg-secondary" />
      </div>
    );
  }

  if (!data?.available) return null;

  const riskLevel = data.risk_level ?? 'normal';
  const badgeConfig = RISK_BADGE[riskLevel] ?? RISK_BADGE.normal;
  const t1h = data.predictions?.t1h;
  const t3h = data.predictions?.t3h;
  const t6h = data.predictions?.t6h;

  return (
    <div className="rounded-xl border border-border bg-bg-card/90 backdrop-blur-sm p-3 space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12c2-4 6-4 8 0s6 4 8 0" />
            <path d="M2 18c2-4 6-4 8 0s6 4 8 0" />
            <path d="M2 6c2-4 6-4 8 0s6 4 8 0" />
          </svg>
          <span className="font-[family-name:var(--font-display)] text-xs font-bold text-text-secondary">
            {t('title')}
          </span>
        </div>
        <Badge variant={badgeConfig.variant} size="sm" pulse={badgeConfig.pulse}>
          {t(riskLevel)}
        </Badge>
      </div>

      {/* Catchment info */}
      <p className="font-[family-name:var(--font-sans)] text-[10px] text-text-muted">
        {data.catchment} &middot; {data.catchment_area_km2?.toLocaleString()} km&sup2;
      </p>

      {/* Flow predictions */}
      <div className="grid grid-cols-3 gap-1.5">
        {[
          { label: t('in1h'), pred: t1h },
          { label: t('in3h'), pred: t3h },
          { label: t('in6h'), pred: t6h },
        ].map(({ label, pred }) => (
          <div key={label} className="rounded-lg bg-bg-secondary px-2 py-1.5 text-center">
            <p className="font-[family-name:var(--font-sans)] text-[9px] text-text-muted">{label}</p>
            <p className="font-[family-name:var(--font-mono)] text-xs font-bold text-text-primary">
              {pred ? `${pred.estimated_flow_m3s}` : '--'}
            </p>
            <p className="font-[family-name:var(--font-sans)] text-[8px] text-text-muted">{t('m3s')}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
