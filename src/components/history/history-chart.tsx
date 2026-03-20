'use client';

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { WeatherHistoryRecord } from '@/hooks/use-weather-history';

interface ChartDataPoint {
  date: string;
  temperature: number;
  precipitation: number;
}

function HistoryTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-heavy rounded-lg border border-border bg-bg-card px-3 py-2 shadow-lg">
      {label !== undefined && (
        <p className="mb-1 text-[10px] text-text-muted">{label}</p>
      )}
      {payload.map((entry) => (
        <p
          key={entry.name}
          className="flex items-center font-[family-name:var(--font-mono)] text-xs"
          style={{ color: entry.color }}
        >
          <span
            className="inline-block h-2 w-2 rounded-full mr-1.5"
            style={{ backgroundColor: entry.color }}
          />
          {entry.name}:{' '}
          {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
        </p>
      ))}
    </div>
  );
}

interface HistoryChartProps {
  data: WeatherHistoryRecord[];
}

export function HistoryChart({ data }: HistoryChartProps) {
  const chartData = useMemo<ChartDataPoint[]>(() => {
    const sorted = [...data].sort(
      (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime(),
    );

    return sorted.map((r) => {
      const d = new Date(r.recorded_at);
      return {
        date: `${d.getMonth() + 1}/${d.getDate()}`,
        temperature: r.temperature,
        precipitation: r.precipitation,
      };
    });
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="historyTempGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.01} />
          </linearGradient>
          <linearGradient id="historyPrecipGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#14B8A6" stopOpacity={0.01} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis
          dataKey="date"
          tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }}
          stroke="rgba(255,255,255,0.1)"
        />
        <YAxis
          yAxisId="temp"
          tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }}
          stroke="rgba(255,255,255,0.1)"
          unit="°"
        />
        <YAxis
          yAxisId="precip"
          orientation="right"
          tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }}
          stroke="rgba(255,255,255,0.1)"
          unit="mm"
        />
        <Tooltip content={<HistoryTooltip />} />
        <Area
          yAxisId="temp"
          type="monotone"
          dataKey="temperature"
          name="Temperature (°C)"
          stroke="#3B82F6"
          strokeWidth={2}
          fill="url(#historyTempGrad)"
          animationDuration={800}
        />
        <Area
          yAxisId="precip"
          type="monotone"
          dataKey="precipitation"
          name="Precipitation (mm)"
          stroke="#14B8A6"
          strokeWidth={1.5}
          fill="url(#historyPrecipGrad)"
          animationDuration={800}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
