'use client';

import { useMemo, memo } from 'react';
import { useTranslations } from 'next-intl';
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { ModelCard } from './model-card';
import { StatBox, DarkTooltip, type PredictionResponse } from './shared';

interface Props {
  data: PredictionResponse['regression'];
}

function RegressionChartInner({ data }: Props) {
  const t = useTranslations('StatisticalModels');
  // Compute confidence band: ± standard error estimated from rSquared
  const chartData = useMemo(() => {
    return data.data.map((d) => {
      const se = d.fitted * Math.sqrt(1 - data.rSquared) * 0.3;
      return {
        ...d,
        upper: d.fitted + se,
        lower: Math.max(0, d.fitted - se),
      };
    });
  }, [data.data, data.rSquared]);

  // Check if 6h and 12h projection steps exist
  const has6h = chartData.some((d) => d.step === 6 && d.actual === null);
  const has12h = chartData.some((d) => d.step === 12 && d.actual === null);

  // Determine the start of projected region (first null actual)
  const projectionStart = useMemo(() => {
    const idx = chartData.findIndex((d) => d.actual === null);
    return idx >= 0 ? chartData[idx].step : null;
  }, [chartData]);

  // Slope direction arrow
  const slopeArrow = data.slope > 0.001 ? '\u25B2' : data.slope < -0.001 ? '\u25BC' : '\u2192';
  const slopeColor = data.slope > 0.001 ? 'text-accent-red' : data.slope < -0.001 ? 'text-accent-green' : 'text-text-secondary';

  return (
    <ModelCard
      title={t('regression')}
      subtitle={t('regressionSubtitle')}
      methodology={t('regressionMethod')}
      index={1}
    >
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="regressionBand" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FFFFFF" stopOpacity={0.06} />
              <stop offset="95%" stopColor="#FFFFFF" stopOpacity={0.01} />
            </linearGradient>
            <linearGradient id="regressionProjection" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.12} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="step" tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} stroke="rgba(255,255,255,0.1)" />
          <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} stroke="rgba(255,255,255,0.1)" />
          <Tooltip content={<DarkTooltip />} />

          {/* Confidence band area */}
          <Area
            type="monotone"
            dataKey="upper"
            name={t('upperBound')}
            stroke="none"
            fill="url(#regressionBand)"
            fillOpacity={0.06}
            animationDuration={800}
          />
          <Area
            type="monotone"
            dataKey="lower"
            name={t('lowerBound')}
            stroke="none"
            fill="transparent"
            animationDuration={800}
          />

          {/* Projection region gradient (if projectionStart exists) */}
          {projectionStart !== null && (
            <Area
              type="monotone"
              dataKey="fitted"
              name={t('projection')}
              stroke="none"
              fill="url(#regressionProjection)"
              animationDuration={1000}
            />
          )}

          {/* 6h and 12h reference markers */}
          {has6h && (
            <ReferenceLine
              x={6}
              stroke="#22c55e"
              strokeDasharray="4 3"
              strokeWidth={1}
              label={{ value: `${t('forecast6h')}: ${data.projected6h}`, position: 'top', fill: '#22c55e', fontSize: 9, fontFamily: 'var(--font-mono)' }}
            />
          )}
          {has12h && (
            <ReferenceLine
              x={12}
              stroke="#22c55e"
              strokeDasharray="4 3"
              strokeWidth={1}
              label={{ value: `${t('forecast12h')}: ${data.projected12h}`, position: 'top', fill: '#22c55e', fontSize: 9, fontFamily: 'var(--font-mono)' }}
            />
          )}

          {/* Actual data line (blue, solid) */}
          <Line type="monotone" dataKey="actual" name={t('actual')} stroke="#3b82f6" strokeWidth={2} dot={{ r: 1.5, fill: '#3b82f6' }} connectNulls={false} animationDuration={800} />

          {/* Fitted/predicted line (white, dashed) */}
          <Line type="monotone" dataKey="fitted" name={t('predicted')} stroke="#FFFFFF" strokeWidth={2} strokeDasharray="6 3" dot={false} connectNulls animationDuration={1000} />
        </ComposedChart>
      </ResponsiveContainer>

      <div className="mt-3 grid grid-cols-4 gap-2">
        <StatBox label={t('rSquared')} value={data.rSquared.toFixed(3)} />
        <StatBox label={t('slope')} value={`${slopeArrow} ${data.slope >= 0 ? '+' : ''}${data.slope.toFixed(3)}`} accent={slopeColor} />
        <StatBox label={t('forecast6h')} value={`${data.projected6h} mm`} accent="text-accent-green" />
        <StatBox label={t('forecast12h')} value={`${data.projected12h} mm`} accent="text-accent-green" />
      </div>
    </ModelCard>
  );
}

export const RegressionChart = memo(RegressionChartInner);
