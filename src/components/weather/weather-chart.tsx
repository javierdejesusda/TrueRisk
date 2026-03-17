'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

interface WeatherChartProps {
  data: Array<{
    time: string;
    temperature: number;
    precipitation: number;
    humidity: number;
  }>;
  isLoading: boolean;
}

interface TooltipPayloadEntry {
  name: string;
  value: number;
  color: string;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-bg-card p-3 shadow-lg">
      <p className="mb-1.5 text-xs font-medium text-text-secondary">{label}</p>
      {payload.map((entry) => (
        <p
          key={entry.name}
          className="text-sm"
          style={{ color: entry.color }}
        >
          {entry.name}: {entry.value.toFixed(1)}
        </p>
      ))}
    </div>
  );
}

export function WeatherChart({ data, isLoading }: WeatherChartProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-bg-card p-5">
        <Skeleton className="mb-4" width="160px" height="20px" />
        <Skeleton width="100%" height="300px" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-xl border border-border bg-bg-card p-5">
        <p className="text-sm text-text-muted">
          No weather data available yet.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-bg-card p-5">
      <h3 className="mb-4 text-sm font-medium text-text-secondary">
        Weather Trend (Last {data.length} Records)
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.08)"
          />
          <XAxis
            dataKey="time"
            tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
            stroke="rgba(255,255,255,0.1)"
          />
          <YAxis
            tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
            stroke="rgba(255,255,255,0.1)"
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 12, color: 'var(--color-text-secondary)' }}
          />
          <Line
            type="monotone"
            dataKey="temperature"
            name="Temp (\u00B0C)"
            stroke="#f97316"
            strokeWidth={2}
            dot={false}
            animationDuration={800}
          />
          <Line
            type="monotone"
            dataKey="precipitation"
            name="Precip (mm)"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            animationDuration={800}
          />
          <Line
            type="monotone"
            dataKey="humidity"
            name="Humidity (%)"
            stroke="#22c55e"
            strokeWidth={2}
            dot={false}
            animationDuration={800}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
