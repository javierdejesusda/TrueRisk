'use client';

import { Badge } from '@/components/ui/badge';
import type { PredictionResponse } from './shared';

interface Props {
  current: PredictionResponse['current'];
}

export function PredictionHeader({ current }: Props) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Predictions</h1>
        <p className="mt-1 text-sm text-text-muted">
          ML model forecasts and extreme value analysis
        </p>
      </div>
      <div className="flex items-center gap-3 text-xs text-text-secondary">
        <span>{current.temperature != null ? current.temperature.toFixed(1) : '—'}°C</span>
        <span className="text-text-muted">·</span>
        <span>{current.humidity}% humidity</span>
        <span className="text-text-muted">·</span>
        <span>{current.windSpeed} km/h</span>
      </div>
    </div>
  );
}
