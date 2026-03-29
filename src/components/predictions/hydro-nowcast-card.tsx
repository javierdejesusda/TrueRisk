'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DarkTooltip, StatBox, staggerItem } from './shared';
import { useHydroNowcast } from '@/hooks/use-hydro-nowcast';

const RISK_BADGE: Record<
  string,
  { variant: 'success' | 'info' | 'warning' | 'danger'; pulse?: boolean }
> = {
  normal: { variant: 'success' },
  elevated: { variant: 'info' },
  moderate: { variant: 'warning' },
  high: { variant: 'danger' },
  critical: { variant: 'danger', pulse: true },
};

const RISK_COLOR: Record<string, string> = {
  normal: '#22c55e',
  elevated: '#3b82f6',
  moderate: '#eab308',
  high: '#f97316',
  critical: '#ef4444',
};

function FlowBar({
  label,
  value,
  baseFlow,
  unit,
}: {
  label: string;
  value: number;
  baseFlow: number;
  unit: string;
}) {
  const ratio = baseFlow > 0 ? Math.min(value / (baseFlow * 10), 1) : 0;
  const color =
    value > baseFlow * 5
      ? '#ef4444'
      : value > baseFlow * 3
        ? '#f97316'
        : value > baseFlow * 1.5
          ? '#eab308'
          : '#3b82f6';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="font-[family-name:var(--font-sans)] text-[10px] text-text-muted">
          {label}
        </span>
        <span className="font-[family-name:var(--font-mono)] text-xs font-bold text-text-primary">
          {value.toFixed(1)} {unit}
        </span>
      </div>
      <div className="h-2 rounded-full bg-bg-secondary overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${ratio * 100}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export function HydroNowcastCard() {
  const t = useTranslations('HydroNowcast');
  const tPred = useTranslations('Predictions');
  const { data, isLoading } = useHydroNowcast();

  const chartData = useMemo(() => {
    if (!data?.flow_series) return [];
    return data.flow_series.map((p) => ({
      hour: `+${p.hour}h`,
      flow: p.estimated_flow_m3s,
      runoff: p.runoff_flow_m3s,
    }));
  }, [data]);

  if (isLoading) {
    return (
      <motion.div
        variants={staggerItem}
        initial="hidden"
        animate="visible"
        custom={0}
        className="lg:col-span-2"
      >
        <Card variant="glass">
          <Skeleton width="60%" height="16px" className="mb-3" />
          <Skeleton width="100%" height="240px" />
        </Card>
      </motion.div>
    );
  }

  if (!data?.available) {
    return (
      <motion.div
        variants={staggerItem}
        initial="hidden"
        animate="visible"
        custom={0}
        className="lg:col-span-2"
      >
        <Card variant="glass">
          <div className="flex items-center gap-2 mb-1">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-accent-blue)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 12c2-4 6-4 8 0s6 4 8 0" />
              <path d="M2 18c2-4 6-4 8 0s6 4 8 0" />
              <path d="M2 6c2-4 6-4 8 0s6 4 8 0" />
            </svg>
            <h3 className="font-[family-name:var(--font-display)] text-sm font-bold text-text-secondary">
              {t('title')}
            </h3>
          </div>
          <p className="font-[family-name:var(--font-sans)] text-[11px] text-text-muted">
            {t('notAvailable')}
          </p>
        </Card>
      </motion.div>
    );
  }

  const riskLevel = data.risk_level ?? 'normal';
  const badgeConfig = RISK_BADGE[riskLevel] ?? RISK_BADGE.normal;
  const riskColor = RISK_COLOR[riskLevel] ?? '#3b82f6';
  const baseFlow = data.base_flow_m3s ?? 0;
  const t1h = data.predictions?.t1h;
  const t3h = data.predictions?.t3h;
  const t6h = data.predictions?.t6h;

  return (
    <motion.div
      variants={staggerItem}
      initial="hidden"
      animate="visible"
      custom={0}
      className="lg:col-span-2"
    >
      <Card variant="glass" className="hover:border-accent-blue/15 transition-all duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-accent-blue)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 12c2-4 6-4 8 0s6 4 8 0" />
              <path d="M2 18c2-4 6-4 8 0s6 4 8 0" />
              <path d="M2 6c2-4 6-4 8 0s6 4 8 0" />
            </svg>
            <h3 className="font-[family-name:var(--font-display)] text-sm font-bold text-text-secondary">
              {t('title')}
            </h3>
          </div>
          <Badge variant={badgeConfig.variant} size="sm" pulse={badgeConfig.pulse}>
            {t(riskLevel)}
          </Badge>
        </div>
        <p className="font-[family-name:var(--font-sans)] text-[10px] text-text-muted uppercase tracking-wider mb-4">
          {t('subtitle', { catchment: data.catchment ?? '' })}
        </p>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <StatBox label={t('catchment')} value={data.catchment ?? '--'} />
          <StatBox
            label={t('area')}
            value={`${(data.catchment_area_km2 ?? 0).toLocaleString()} km\u00B2`}
          />
          <StatBox
            label={t('baseFlow')}
            value={`${baseFlow} ${t('m3s')}`}
          />
        </div>

        {/* Flow prediction bars */}
        <div className="space-y-2.5 mb-5">
          {t1h && (
            <FlowBar
              label={t('in1h')}
              value={t1h.estimated_flow_m3s}
              baseFlow={baseFlow}
              unit={t('m3s')}
            />
          )}
          {t3h && (
            <FlowBar
              label={t('in3h')}
              value={t3h.estimated_flow_m3s}
              baseFlow={baseFlow}
              unit={t('m3s')}
            />
          )}
          {t6h && (
            <FlowBar
              label={t('in6h')}
              value={t6h.estimated_flow_m3s}
              baseFlow={baseFlow}
              unit={t('m3s')}
            />
          )}
        </div>

        {/* 24h Flow Chart */}
        {chartData.length > 0 && (
          <>
            <p className="font-[family-name:var(--font-sans)] text-[10px] text-text-muted uppercase tracking-wider mb-2">
              {t('flowChart')}
            </p>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="hydroFlowGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={riskColor} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={riskColor} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.06)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="hour"
                    tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    interval={Math.max(Math.floor(chartData.length / 8), 1)}
                  />
                  <YAxis
                    tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    width={50}
                    tickFormatter={(v: number) => `${v}`}
                  />
                  <Tooltip content={<DarkTooltip />} />
                  <ReferenceLine
                    y={baseFlow}
                    stroke="rgba(255,255,255,0.2)"
                    strokeDasharray="4 4"
                    label={{
                      value: `${t('baseFlow')}: ${baseFlow}`,
                      position: 'right',
                      fill: 'var(--color-text-muted)',
                      fontSize: 9,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="flow"
                    name={t('predictedFlow')}
                    stroke={riskColor}
                    strokeWidth={2}
                    fill="url(#hydroFlowGrad)"
                    dot={false}
                    activeDot={{ r: 3, fill: riskColor }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {/* Methodology note */}
        <div className="mt-3 border-l-2 border-text-muted/20 pl-3">
          <p className="font-[family-name:var(--font-sans)] text-[11px] text-text-muted leading-relaxed">
            {tPred('hydroMethod')}
          </p>
        </div>
      </Card>
    </motion.div>
  );
}
