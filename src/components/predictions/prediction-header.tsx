'use client';

import { useTranslations } from 'next-intl';
import type { PredictionResponse } from './shared';

interface Props {
  current: PredictionResponse['current'];
}

function tempColor(t: number | null): string {
  if (t == null) return 'text-text-primary';
  if (t >= 40) return 'text-accent-red';
  if (t >= 30) return 'text-accent-orange';
  if (t >= 20) return 'text-accent-yellow';
  return 'text-accent-green';
}

export function PredictionHeader({ current }: Props) {
  const t = useTranslations('Predictions');
  const tMap = useTranslations('Map');

  return (
    <div className="glass rounded-2xl p-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-extrabold text-text-primary">{t('title')}</h1>
        <p className="mt-1 text-sm font-[family-name:var(--font-sans)] text-text-muted">
          ML model forecasts and extreme value analysis
        </p>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-center">
          <span className={`font-[family-name:var(--font-mono)] text-xl font-bold ${tempColor(current.temperature)}`}>
            {current.temperature != null ? current.temperature.toFixed(1) : '—'}°C
          </span>
          <span className="font-[family-name:var(--font-sans)] text-[10px] uppercase tracking-wider text-text-muted">Temp</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="font-[family-name:var(--font-mono)] text-xl font-bold text-text-primary">
            {current.humidity}%
          </span>
          <span className="font-[family-name:var(--font-sans)] text-[10px] uppercase tracking-wider text-text-muted">{tMap('humidity')}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="font-[family-name:var(--font-mono)] text-xl font-bold text-text-primary">
            {current.windSpeed}
          </span>
          <span className="font-[family-name:var(--font-sans)] text-[10px] uppercase tracking-wider text-text-muted">km/h</span>
        </div>
      </div>
    </div>
  );
}
