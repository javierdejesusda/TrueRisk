'use client';

import { useMemo, memo } from 'react';
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { ModelCard } from './model-card';
import { StatBox, DarkTooltip, type PredictionResponse } from './shared';

interface Props {
  data: PredictionResponse['ema'];
}

function EmaChartInner({ data }: Props) {
  // Dynamic color based on trend
  const trendColor = useMemo(() => {
    if (data.trend === 'rising') return '#ef4444';
    if (data.trend === 'falling') return '#22c55e';
    return '#FFFFFF';
  }, [data.trend]);

  // Last EMA value for reference line
  const lastEma = useMemo(() => {
    const lastPoint = data.data[data.data.length - 1];
    return lastPoint?.smoothed ?? 0;
  }, [data.data]);

  // Trend rate display
  const rateDisplay = useMemo(() => {
    const sign = data.rateOfChange >= 0 ? '+' : '';
    return `${data.trend === 'rising' ? 'Rising' : data.trend === 'falling' ? 'Falling' : 'Stable'} ${sign}${data.rateOfChange.toFixed(1)}%/h`;
  }, [data.trend, data.rateOfChange]);

  return (
    <ModelCard
      title="EMA Trend"
      subtitle="Exponential moving average on precipitation"
      methodology="Applies an exponential moving average to smooth out short-term fluctuations in precipitation data, revealing the underlying trend direction and rate of change."
      badge={{
        label: rateDisplay,
        variant: data.trend === 'rising' ? 'danger' : data.trend === 'falling' ? 'success' : 'neutral',
      }}
      index={3}
    >
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={data.data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="emaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={trendColor} stopOpacity={0.2} />
              <stop offset="95%" stopColor={trendColor} stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="step" tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} stroke="rgba(255,255,255,0.1)" />
          <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} stroke="rgba(255,255,255,0.1)" />
          <Tooltip content={<DarkTooltip />} />

          {/* EMA smoothed as gradient-filled area */}
          <Area
            type="monotone"
            dataKey="smoothed"
            name="EMA (mm)"
            stroke={trendColor}
            strokeWidth={2.5}
            fill="url(#emaGradient)"
            animationDuration={1000}
          />

          {/* Raw data as semi-transparent dashed line */}
          <Line
            type="monotone"
            dataKey="raw"
            name="Raw (mm)"
            stroke="#f97316"
            strokeWidth={1.5}
            strokeDasharray="4 2"
            dot={false}
            opacity={0.4}
            animationDuration={800}
          />

          {/* Reference line at last EMA value */}
          <ReferenceLine
            y={lastEma}
            stroke={trendColor}
            strokeDasharray="3 3"
            strokeWidth={1}
            label={{
              value: `EMA: ${lastEma.toFixed(1)}`,
              position: 'right',
              fill: trendColor,
              fontSize: 9,
              fontFamily: 'var(--font-mono)',
            }}
          />

          {/* EWMA Control Limits */}
          {data.controlLimits && (
            <>
              <ReferenceLine
                y={data.controlLimits.ucl}
                stroke="#ef4444"
                strokeDasharray="6 4"
                strokeWidth={1}
                label={{
                  value: `UCL: ${data.controlLimits.ucl.toFixed(1)}`,
                  position: 'right',
                  fill: '#ef4444',
                  fontSize: 9,
                  fontFamily: 'var(--font-mono)',
                }}
              />
              <ReferenceLine
                y={data.controlLimits.lcl}
                stroke="#3b82f6"
                strokeDasharray="6 4"
                strokeWidth={1}
                label={{
                  value: `LCL: ${data.controlLimits.lcl.toFixed(1)}`,
                  position: 'right',
                  fill: '#3b82f6',
                  fontSize: 9,
                  fontFamily: 'var(--font-mono)',
                }}
              />
            </>
          )}
        </ComposedChart>
      </ResponsiveContainer>

      <div className={`mt-3 grid gap-2 ${data.controlLimits ? 'grid-cols-3' : 'grid-cols-2'}`}>
        <StatBox label="Trend" value={data.trend} accent={data.trend === 'rising' ? 'text-accent-red' : data.trend === 'falling' ? 'text-accent-green' : 'text-text-secondary'} />
        <StatBox label="Rate" value={`${data.rateOfChange >= 0 ? '+' : ''}${data.rateOfChange.toFixed(3)}/step`} />
        {data.controlLimits && (
          <StatBox
            label="Control"
            value={data.outOfControl ? 'Out of Control' : 'In Control'}
            accent={data.outOfControl ? 'text-accent-red' : 'text-accent-green'}
          />
        )}
      </div>
    </ModelCard>
  );
}

export const EmaChart = memo(EmaChartInner);
