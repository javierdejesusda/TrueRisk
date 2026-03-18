'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ModelCard } from './model-card';
import { StatBox, DarkTooltip, type PredictionResponse } from './shared';

interface Props {
  data: PredictionResponse['regression'];
}

export function RegressionChart({ data }: Props) {
  return (
    <ModelCard
      title="Trend Forecast"
      subtitle="Linear regression with 6h & 12h projection"
      methodology="Applies linear regression to recent weather observations to identify trends and project values 6 and 12 hours ahead. R² indicates how well the line fits the data."
      index={1}
    >
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data.data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="step" tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} stroke="rgba(255,255,255,0.1)" />
          <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} stroke="rgba(255,255,255,0.1)" />
          <Tooltip content={<DarkTooltip />} />
          <Line type="monotone" dataKey="actual" name="Actual (mm)" stroke="#3b82f6" strokeWidth={2} dot={{ r: 1.5, fill: '#3b82f6' }} connectNulls={false} animationDuration={800} />
          <Line type="monotone" dataKey="fitted" name="Predicted (mm)" stroke="#06b6d4" strokeWidth={2} strokeDasharray="6 3" dot={false} connectNulls animationDuration={1000} />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <StatBox label="R²" value={data.rSquared.toFixed(3)} />
        <StatBox label="Slope" value={`${data.slope >= 0 ? '+' : ''}${data.slope.toFixed(3)}`} />
        <StatBox label="6h Forecast" value={`${data.projected6h} mm`} accent="text-cyan-400" />
        <StatBox label="12h Forecast" value={`${data.projected12h} mm`} accent="text-cyan-400" />
      </div>
    </ModelCard>
  );
}
