'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { PROVINCE_CAPITALS } from '@/lib/constants/province-capitals';
import type { MunicipalityForecast, HourlyForecast, DailyForecast } from '@/lib/aemet-forecast';

export interface MapPopupProps {
  provinceName: string;
  summary: {
    maxSeverity: number;
    alertCount: number;
    alerts: { title: string; severity: number; type: string; source: 'alertml' | 'aemet' }[];
  };
  municipalityCode?: string;
  provinceCode?: string;
}

type TabId = 'now' | 'hourly' | 'daily';

function severityLabel(severity: number): string {
  if (severity >= 5) return 'Critical';
  if (severity >= 4) return 'Very High';
  if (severity >= 3) return 'High';
  if (severity >= 2) return 'Moderate';
  if (severity >= 1) return 'Low';
  return 'None';
}

function severityVariant(severity: number): 'neutral' | 'success' | 'warning' | 'danger' {
  if (severity >= 4) return 'danger';
  if (severity >= 3) return 'warning';
  if (severity >= 1) return 'success';
  return 'neutral';
}

function tempColor(temp: number): string {
  if (temp >= 35) return 'text-accent-red';
  if (temp >= 25) return 'text-accent-yellow';
  return 'text-accent-green';
}

function formatHour(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return isoString;
  }
}

function formatDayName(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
  } catch {
    return dateString;
  }
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-6">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-text-primary" />
    </div>
  );
}

function NowTab({ forecast, alerts }: { forecast: MunicipalityForecast | null; alerts: MapPopupProps['summary']['alerts'] }) {
  const current = forecast?.hourly?.[0] ?? null;

  return (
    <div className="flex flex-col gap-2">
      {current ? (
        <>
          {/* Current conditions */}
          <div className="flex items-start justify-between">
            <div>
              <span className={`text-3xl font-bold ${tempColor(current.temperature)}`}>
                {current.temperature}°
              </span>
              <p className="text-xs text-text-secondary mt-0.5">{current.skyDescription}</p>
              <p className="text-[10px] text-text-muted">
                Feels like {current.feelsLike}°
              </p>
            </div>
            {forecast && (
              <p className="text-[10px] text-text-muted text-right max-w-[120px]">
                {forecast.name}
              </p>
            )}
          </div>

          {/* Conditions grid */}
          <div className="grid grid-cols-2 gap-1.5">
            <div className="rounded-md bg-bg-card p-1.5">
              <p className="text-[10px] text-text-muted">Wind</p>
              <p className="text-xs text-text-primary font-medium">
                {current.windSpeed} km/h {current.windDirection}
              </p>
            </div>
            <div className="rounded-md bg-bg-card p-1.5">
              <p className="text-[10px] text-text-muted">Humidity</p>
              <p className="text-xs text-text-primary font-medium">{current.humidity}%</p>
            </div>
            <div className="rounded-md bg-bg-card p-1.5">
              <p className="text-[10px] text-text-muted">Precip. prob.</p>
              <p className="text-xs text-text-primary font-medium">{current.precipitationProb}%</p>
            </div>
            <div className="rounded-md bg-bg-card p-1.5">
              <p className="text-[10px] text-text-muted">Gusts</p>
              <p className="text-xs text-text-primary font-medium">{current.gustSpeed} km/h</p>
            </div>
          </div>
        </>
      ) : (
        <p className="text-xs text-text-muted py-2">Forecast unavailable</p>
      )}

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="border-t border-border pt-2">
          <p className="text-[10px] text-text-muted mb-1.5 uppercase tracking-wider">Active Alerts</p>
          <div className="flex flex-col gap-1">
            {alerts.map((alert, i) => (
              <div
                key={i}
                className="flex items-start gap-2 rounded-lg bg-bg-card p-2"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-text-primary truncate">
                    {alert.title}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-text-muted">{alert.type}</span>
                    <span className="text-[10px] text-text-muted">·</span>
                    <span className="text-[10px] text-text-muted capitalize">{alert.source}</span>
                  </div>
                </div>
                <span
                  className="text-[10px] font-medium shrink-0 mt-0.5"
                  style={{
                    color:
                      alert.severity >= 4 ? '#ef4444' :
                      alert.severity >= 3 ? '#f97316' :
                      alert.severity >= 2 ? '#fbbf24' :
                      '#34d399',
                  }}
                >
                  {severityLabel(alert.severity)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {alerts.length === 0 && (
        <p className="text-xs text-text-muted border-t border-border pt-2">No active alerts</p>
      )}
    </div>
  );
}

function HourlyTab({ hourly }: { hourly: HourlyForecast[] }) {
  const next24 = hourly.slice(0, 24);

  if (next24.length === 0) {
    return <p className="text-xs text-text-muted py-4 text-center">Hourly forecast unavailable</p>;
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
      {next24.map((h, i) => (
        <div
          key={i}
          className="flex flex-col items-center gap-1 rounded-md bg-bg-card p-1.5 min-w-[60px] shrink-0"
        >
          <span className="text-[10px] text-text-muted">{formatHour(h.hour)}</span>
          <span className={`text-sm font-bold ${tempColor(h.temperature)}`}>
            {h.temperature}°
          </span>
          <span className="text-[10px] text-text-secondary text-center leading-tight">
            {h.skyDescription}
          </span>
          {h.precipitationProb > 0 && (
            <span className="text-[10px] text-accent-blue">{h.precipitationProb}%</span>
          )}
          <span className="text-[10px] text-text-muted">
            {h.windSpeed} {h.windDirection}
          </span>
        </div>
      ))}
    </div>
  );
}

function DailyTab({ daily }: { daily: DailyForecast[] }) {
  const days = daily.slice(0, 7);

  if (days.length === 0) {
    return <p className="text-xs text-text-muted py-4 text-center">Daily forecast unavailable</p>;
  }

  return (
    <div className="flex flex-col gap-1">
      {days.map((d, i) => (
        <div
          key={i}
          className="flex items-center gap-2 rounded-md bg-bg-card p-2"
        >
          <span className="text-xs text-text-secondary w-[52px] shrink-0">
            {formatDayName(d.date)}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-text-primary truncate">{d.skyDescription}</p>
            <div className="flex items-center gap-2 mt-0.5">
              {d.precipitationProb > 0 && (
                <span className="text-[10px] text-accent-blue">{d.precipitationProb}%</span>
              )}
              <span className="text-[10px] text-text-muted">
                {d.windSpeed} km/h {d.windDirection}
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className={`text-xs font-bold ${tempColor(d.tempMax)}`}>{d.tempMax}°</span>
            <span className="text-[10px] text-text-muted mx-0.5">/</span>
            <span className="text-xs text-text-muted">{d.tempMin}°</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function MapPopup({ provinceName, summary, municipalityCode, provinceCode }: MapPopupProps) {
  const [activeTab, setActiveTab] = useState<TabId>('now');
  const [forecast, setForecast] = useState<MunicipalityForecast | null>(null);
  const [forecastLoading, setForecastLoading] = useState(false);

  useEffect(() => {
    const code = municipalityCode || (provinceCode ? PROVINCE_CAPITALS[provinceCode] : null);
    if (!code) return;
    setForecastLoading(true);
    fetch(`/api/forecast/${code}`)
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) setForecast(json.data);
      })
      .catch(() => {})
      .finally(() => setForecastLoading(false));
  }, [municipalityCode, provinceCode]);

  const tabConfig: { id: TabId; label: string }[] = [
    { id: 'now', label: 'Now' },
    { id: 'hourly', label: 'Hourly' },
    { id: 'daily', label: '7 Days' },
  ];

  return (
    <div className="p-3 max-w-[320px]">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <h3 className="text-sm font-semibold text-text-primary truncate">{provinceName}</h3>
        {summary.alertCount > 0 && (
          <Badge variant={severityVariant(summary.maxSeverity)} size="sm">
            {summary.alertCount} alert{summary.alertCount !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-2 rounded-md bg-bg-card/50 p-0.5">
        {tabConfig.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 text-xs py-1 px-2 rounded transition-colors ${
              activeTab === tab.id
                ? 'bg-bg-card text-text-primary font-medium'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="max-h-[350px] overflow-y-auto">
        {forecastLoading ? (
          <LoadingSpinner />
        ) : (
          <>
            {activeTab === 'now' && (
              <NowTab forecast={forecast} alerts={summary.alerts} />
            )}
            {activeTab === 'hourly' && (
              <HourlyTab hourly={forecast?.hourly ?? []} />
            )}
            {activeTab === 'daily' && (
              <DailyTab daily={forecast?.daily ?? []} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
