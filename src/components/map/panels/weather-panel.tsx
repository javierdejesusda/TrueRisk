'use client';

import { useTranslations } from 'next-intl';
import { useWeather } from '@/hooks/use-weather';
import { PanelShell } from './panel-shell';

function tempColor(temp: number): string {
  if (temp >= 35) return 'text-accent-red';
  if (temp >= 25) return 'text-accent-orange';
  if (temp >= 15) return 'text-accent-yellow';
  return 'text-accent-blue';
}

const ThermometerIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
  </svg>
);

export function WeatherPanel() {
  const t = useTranslations('Map');
  const { weather, isLoading } = useWeather();

  const collapsedContent = weather ? (
    <div className="flex items-center gap-2">
      <span className={`font-[family-name:var(--font-mono)] text-2xl font-bold ${tempColor(weather.temperature ?? 0)}`}>
        {weather.temperature != null ? weather.temperature.toFixed(0) : '—'}°C
      </span>
    </div>
  ) : null;

  return (
    <PanelShell
      title={t('panelWeather')}
      icon={ThermometerIcon}
      collapsedContent={collapsedContent}
    >
      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-3 rounded bg-bg-secondary animate-pulse" />
          ))}
        </div>
      ) : weather ? (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-white/[0.03] p-3">
              <p className="text-[10px] text-text-muted uppercase tracking-wider font-[family-name:var(--font-sans)]">{t('temperature')}</p>
              <p className="text-lg font-bold text-text-primary font-[family-name:var(--font-mono)]">{weather.temperature != null ? weather.temperature.toFixed(1) : '—'}°C</p>
            </div>
            <div className="rounded-xl bg-white/[0.03] p-3">
              <p className="text-[10px] text-text-muted uppercase tracking-wider font-[family-name:var(--font-sans)]">{t('humidity')}</p>
              <p className="text-lg font-bold text-text-primary font-[family-name:var(--font-mono)]">{weather.humidity}%</p>
            </div>
            <div className="rounded-xl bg-white/[0.03] p-3">
              <p className="text-[10px] text-text-muted uppercase tracking-wider font-[family-name:var(--font-sans)]">{t('wind')}</p>
              <p className="text-lg font-bold text-text-primary font-[family-name:var(--font-mono)]">{weather.wind_speed ?? '—'} km/h</p>
            </div>
            <div className="rounded-xl bg-white/[0.03] p-3">
              <p className="text-[10px] text-text-muted uppercase tracking-wider font-[family-name:var(--font-sans)]">{t('precipitation')}</p>
              <p className="text-lg font-bold text-text-primary font-[family-name:var(--font-mono)]">{weather.precipitation} mm</p>
            </div>
            {weather.pressure != null && (
              <div className="rounded-xl bg-white/[0.03] p-3">
                <p className="text-[10px] text-text-muted uppercase tracking-wider font-[family-name:var(--font-sans)]">{t('pressure')}</p>
                <p className="text-lg font-bold text-text-primary font-[family-name:var(--font-mono)]">{weather.pressure} hPa</p>
              </div>
            )}
            {weather.uv_index != null && (
              <div className="rounded-xl bg-white/[0.03] p-3">
                <p className="text-[10px] text-text-muted uppercase tracking-wider font-[family-name:var(--font-sans)]">{t('uvIndex')}</p>
                <p className="text-lg font-bold text-text-primary font-[family-name:var(--font-mono)]">{weather.uv_index}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <p className="text-xs text-text-muted">{t('noWeatherData')}</p>
      )}
    </PanelShell>
  );
}
