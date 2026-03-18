'use client';

import { useWeather } from '@/hooks/use-weather';
import { PanelShell } from './panel-shell';

function weatherEmoji(temp: number): string {
  if (temp >= 35) return '🔥';
  if (temp >= 25) return '☀️';
  if (temp >= 15) return '⛅';
  if (temp >= 5) return '🌥️';
  return '❄️';
}

const ThermometerIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
  </svg>
);

export function WeatherPanel() {
  const { weather, isLoading } = useWeather();

  const collapsedContent = weather ? (
    <div className="flex items-center gap-2">
      <span className="text-sm">{weatherEmoji(weather.temperature ?? 0)}</span>
      <span className="text-sm font-bold font-mono text-text-primary">
        {weather.temperature != null ? weather.temperature.toFixed(0) : '—'}°C
      </span>
    </div>
  ) : null;

  return (
    <PanelShell
      title="Weather"
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
            <div className="rounded-md bg-bg-secondary/50 p-2">
              <p className="text-[9px] text-text-muted">Temperature</p>
              <p className="text-xs font-bold text-text-primary">{weather.temperature != null ? weather.temperature.toFixed(1) : '—'}°C</p>
            </div>
            <div className="rounded-md bg-bg-secondary/50 p-2">
              <p className="text-[9px] text-text-muted">Humidity</p>
              <p className="text-xs font-bold text-text-primary">{weather.humidity}%</p>
            </div>
            <div className="rounded-md bg-bg-secondary/50 p-2">
              <p className="text-[9px] text-text-muted">Wind</p>
              <p className="text-xs font-bold text-text-primary">{weather.wind_speed ?? '—'} km/h</p>
            </div>
            <div className="rounded-md bg-bg-secondary/50 p-2">
              <p className="text-[9px] text-text-muted">Precipitation</p>
              <p className="text-xs font-bold text-text-primary">{weather.precipitation} mm</p>
            </div>
            {weather.pressure != null && (
              <div className="rounded-md bg-bg-secondary/50 p-2">
                <p className="text-[9px] text-text-muted">Pressure</p>
                <p className="text-xs font-bold text-text-primary">{weather.pressure} hPa</p>
              </div>
            )}
            {weather.uv_index != null && (
              <div className="rounded-md bg-bg-secondary/50 p-2">
                <p className="text-[9px] text-text-muted">UV Index</p>
                <p className="text-xs font-bold text-text-primary">{weather.uv_index}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <p className="text-xs text-text-muted">No weather data</p>
      )}
    </PanelShell>
  );
}
