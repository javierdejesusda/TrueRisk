'use client';

import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useWeather } from '@/hooks/use-weather';

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function WeatherCard() {
  const t = useTranslations('Dashboard');
  const { weather, isLoading } = useWeather();

  if (isLoading) {
    return (
      <Card variant="glass" padding="md" className="h-full">
        <Skeleton height="20px" width="120px" className="mb-4" />
        <Skeleton height="48px" width="80px" className="mb-4" />
        <div className="grid grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height="40px" />
          ))}
        </div>
      </Card>
    );
  }

  if (!weather) {
    return (
      <Card variant="glass" padding="md" className="h-full">
        <p className="font-[family-name:var(--font-sans)] text-sm text-text-muted">{t('noWeatherData')}</p>
      </Card>
    );
  }

  const stats = [
    { label: t('humidity'), value: `${weather.humidity}%`, icon: dropletIcon },
    { label: t('wind'), value: `${weather.wind_speed ?? 0} km/h`, icon: windIcon },
    { label: t('precipitation'), value: `${weather.precipitation} mm`, icon: rainIcon },
    { label: t('pressure'), value: `${weather.pressure ?? '—'} hPa`, icon: gaugeIcon },
  ];

  return (
    <Card variant="glass" padding="md" className="h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-[family-name:var(--font-display)] text-[11px] font-bold uppercase tracking-[0.15em] text-text-muted">
          {t('weather')}
        </h2>
        <span className="font-[family-name:var(--font-mono)] text-[10px] text-text-muted">
          {formatTime(weather.recorded_at)}
        </span>
      </div>

      <div className="flex items-baseline gap-1 mb-5">
        <span className="font-[family-name:var(--font-display)] text-5xl font-extrabold text-text-primary tabular-nums">
          {Math.round(weather.temperature)}
        </span>
        <span className="font-[family-name:var(--font-sans)] text-lg text-text-secondary">°C</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {stats.map(({ label, value, icon }) => (
          <div key={label} className="flex items-center gap-2">
            <span className="text-text-muted">{icon}</span>
            <div>
              <p className="font-[family-name:var(--font-mono)] text-xs text-text-primary">{value}</p>
              <p className="font-[family-name:var(--font-sans)] text-[10px] text-text-muted">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* Inline SVG icons — small, no external dependency */
const dropletIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
  </svg>
);

const windIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.7 7.7A2.5 2.5 0 0 1 17 13H3" />
    <path d="M9.6 4.6A2 2 0 0 1 11 9H3" />
    <path d="M12.6 19.4A2 2 0 0 0 14 15H3" />
  </svg>
);

const rainIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
    <path d="M16 14v6M8 14v6M12 16v6" />
  </svg>
);

const gaugeIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0-18 0" />
    <path d="M12 12l4-3" />
    <path d="M12 7v1" />
  </svg>
);
