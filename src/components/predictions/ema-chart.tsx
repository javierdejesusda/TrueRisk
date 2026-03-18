'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { ModelCard } from './model-card';
import { StatBox, DarkTooltip, type PredictionResponse } from './shared';

interface Props {
  data: PredictionResponse['ema'];
}

export function EmaChart({ data }: Props) {
  return (
    <ModelCard
      title="EMA Trend"
      subtitle="Exponential moving average on precipitation"
      methodology="Applies an exponential moving average to smooth out short-term fluctuations in precipitation data, revealing the underlying trend direction and rate of change."
      badge={{
        label: data.trend === 'rising' ? '↑ Rising' : data.trend === 'falling' ? '↓ Falling' : '→ Stable',
        variant: data.trend === 'rising' ? 'danger' : data.trend === 'falling' ? 'success' : 'neutral',
      }}
      index={3}
    >
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data.data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="step" tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} stroke="rgba(255,255,255,0.1)" />
          <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} stroke="rgba(255,255,255,0.1)" />
          <Tooltip content={<DarkTooltip />} />
          <Line type="monotone" dataKey="raw" name="Raw (mm)" stroke="#f97316" strokeWidth={1.5} strokeDasharray="4 2" dot={false} opacity={0.5} animationDuration={800} />
          <Line type="monotone" dataKey="smoothed" name="EMA (mm)" stroke="#22c55e" strokeWidth={2.5} dot={false} animationDuration={1000} />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <StatBox label="Trend" value={data.trend} accent={data.trend === 'rising' ? 'text-red-400' : data.trend === 'falling' ? 'text-green-400' : 'text-text-secondary'} />
        <StatBox label="Rate" value={`${data.rateOfChange >= 0 ? '+' : ''}${data.rateOfChange.toFixed(3)}/step`} />
      </div>
    </ModelCard>
  );
}
