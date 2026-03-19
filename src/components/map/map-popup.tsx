'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import type { ForecastResponse, HourlyForecast, DailyForecast } from '@/types/weather';
import type { RiskMapEntry, HazardType } from '@/types/risk';

export interface MapPopupProps {
  provinceName: string;
  summary: {
    maxSeverity: number;
    alertCount: number;
    alerts: { title: string; severity: number; hazardType: string; source: 'truerisk' | 'aemet' }[];
  };
  provinceCode?: string;
  riskData?: RiskMapEntry;
  currentTemperature?: number;
}

type TabId = 'now' | 'hourly' | 'daily';

const HAZARDS: { key: HazardType; label: string; color: string }[] = [
  { key: 'flood', label: 'Flood', color: 'bg-blue-500' },
  { key: 'wildfire', label: 'Wildfire', color: 'bg-orange-500' },
  { key: 'drought', label: 'Drought', color: 'bg-amber-600' },
  { key: 'heatwave', label: 'Heatwave', color: 'bg-red-500' },
];

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

function riskScoreColor(score: number): string {
  if (score >= 85) return 'text-[#FF2D55]';
  if (score >= 70) return 'text-accent-red';
  if (score >= 50) return 'text-accent-orange';
  if (score >= 30) return 'text-accent-yellow';
  return 'text-accent-green';
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

function RiskSection({ riskData, provinceCode }: { riskData: RiskMapEntry; provinceCode: string }) {
  return (
    <div className="mb-3 pb-3 border-b border-white/5">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`text-xl font-bold font-mono ${riskScoreColor(riskData.composite_score)}`}>
            {riskData.composite_score.toFixed(0)}
          </span>
          <div className="flex flex-col">
            <span className="text-[9px] text-text-secondary uppercase">Risk Score</span>
            <span className="text-[10px] text-text-secondary capitalize">{riskData.dominant_hazard}</span>
          </div>
        </div>
        <Link
          href={`/prediction?province=${provinceCode}`}
          className="text-[10px] text-accent-green hover:underline"
        >
          View Predictions →
        </Link>
      </div>
      {/* Mini hazard bars */}
      <div className="flex flex-col gap-1">
        {HAZARDS.map(({ key, label, color }) => {
          const score = riskData[`${key}_score` as keyof RiskMapEntry] as number;
          return (
            <div key={key} className="flex items-center gap-1.5">
              <span className="text-[9px] text-text-secondary w-12">{label}</span>
              <div className="flex-1 h-1 bg-bg-secondary rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, score)}%` }} />
              </div>
              <span className="text-[9px] text-text-secondary w-5 text-right font-mono">{score.toFixed(0)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NowTab({ forecast, alerts }: { forecast: ForecastResponse | null; alerts: MapPopupProps['summary']['alerts'] }) {
  const current = forecast?.hourly?.[0] ?? null;

  return (
    <div className="flex flex-col gap-2">
      {current ? (
        <>
          <div className="flex items-start justify-between">
            <div>
              <span className={`text-3xl font-bold ${tempColor(current.temperature)}`}>
                {current.temperature}°
              </span>
              <p className="text-[10px] text-text-secondary mt-0.5">
                Wind: {current.wind_speed} km/h
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <div className="rounded-md bg-bg-card p-1.5">
              <p className="text-[10px] text-text-secondary">Wind</p>
              <p className="text-xs text-text-primary font-medium">{current.wind_speed} km/h</p>
            </div>
            <div className="rounded-md bg-bg-card p-1.5">
              <p className="text-[10px] text-text-secondary">Humidity</p>
              <p className="text-xs text-text-primary font-medium">{current.humidity}%</p>
            </div>
            <div className="rounded-md bg-bg-card p-1.5">
              <p className="text-[10px] text-text-secondary">Precipitation</p>
              <p className="text-xs text-text-primary font-medium">{current.precipitation} mm</p>
            </div>
            <div className="rounded-md bg-bg-card p-1.5">
              <p className="text-[10px] text-text-secondary">Pressure</p>
              <p className="text-xs text-text-primary font-medium">{current.pressure ?? '—'} hPa</p>
            </div>
          </div>
        </>
      ) : (
        <p className="text-xs text-text-secondary py-2">Forecast unavailable</p>
      )}

      {alerts.length > 0 && (
        <div className="border-t border-border pt-2">
          <p className="text-[10px] text-text-secondary mb-1.5 uppercase tracking-wider">Active Alerts</p>
          <div className="flex flex-col gap-1">
            {alerts.map((alert, i) => (
              <div key={i} className="flex items-start gap-2 rounded-lg bg-bg-card p-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-text-primary truncate">{alert.title}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-text-secondary">{alert.hazardType}</span>
                    <span className="text-[10px] text-text-secondary">·</span>
                    <span className="text-[10px] text-text-secondary capitalize">{alert.source}</span>
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
        <p className="text-xs text-text-secondary border-t border-border pt-2">No active alerts</p>
      )}
    </div>
  );
}

function HourlyTab({ hourly }: { hourly: HourlyForecast[] }) {
  const next24 = hourly.slice(0, 24);

  if (next24.length === 0) {
    return <p className="text-xs text-text-secondary py-4 text-center">Hourly forecast unavailable</p>;
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
      {next24.map((h, i) => (
        <div key={i} className="flex flex-col items-center gap-1 rounded-md bg-bg-card p-1.5 min-w-[60px] shrink-0">
          <span className="text-[10px] text-text-secondary">{formatHour(h.time)}</span>
          <span className={`text-sm font-bold ${tempColor(h.temperature)}`}>{h.temperature}°</span>
          <span className="text-[10px] text-text-secondary">{h.humidity}%</span>
          {h.precipitation > 0 && (
            <span className="text-[10px] text-accent-blue">{h.precipitation}mm</span>
          )}
        </div>
      ))}
    </div>
  );
}

function DailyTab({ daily }: { daily: DailyForecast[] }) {
  const days = daily.slice(0, 7);

  if (days.length === 0) {
    return <p className="text-xs text-text-secondary py-4 text-center">Daily forecast unavailable</p>;
  }

  return (
    <div className="flex flex-col gap-1">
      {days.map((d, i) => (
        <div key={i} className="flex items-center gap-2 rounded-md bg-bg-card p-2">
          <span className="text-xs text-text-secondary w-[52px] shrink-0">
            {formatDayName(d.date)}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {d.precipitation_sum > 0 && (
                <span className="text-[10px] text-accent-blue">{d.precipitation_sum}mm</span>
              )}
              <span className="text-[10px] text-text-secondary">{d.wind_speed_max} km/h</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className={`text-xs font-bold ${tempColor(d.temperature_max)}`}>{d.temperature_max}°</span>
            <span className="text-[10px] text-text-secondary mx-0.5">/</span>
            <span className="text-xs text-text-secondary">{d.temperature_min}°</span>
          </div>
        </div>
      ))}
    </div>
  );
}

const forecastCache = new Map<string, { data: ForecastResponse; fetchedAt: number }>();
const FORECAST_CACHE_TTL = 300_000;

export function MapPopup({ provinceName, summary, provinceCode, riskData, currentTemperature }: MapPopupProps) {
  const [activeTab, setActiveTab] = useState<TabId>('now');
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [forecastLoading, setForecastLoading] = useState(false);

  useEffect(() => {
    if (!provinceCode) return;
    let cancelled = false;

    async function load() {
      const cached = forecastCache.get(provinceCode!);
      if (cached && Date.now() - cached.fetchedAt < FORECAST_CACHE_TTL) {
        if (!cancelled) setForecast(cached.data);
        return;
      }
      if (!cancelled) setForecastLoading(true);
      try {
        const res = await fetch(`/api/weather/forecast/${provinceCode}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled && data) {
          setForecast(data);
          forecastCache.set(provinceCode!, { data, fetchedAt: Date.now() });
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setForecastLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [provinceCode]);

  const tabConfig: { id: TabId; label: string }[] = [
    { id: 'now', label: 'Now' },
    { id: 'hourly', label: 'Hourly' },
    { id: 'daily', label: '7 Days' },
  ];

  return (
    <div className="p-3 max-w-[320px]">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="text-sm font-semibold text-text-primary truncate">{provinceName}</h3>
          {currentTemperature != null && (
            <span className={`text-sm font-bold font-mono shrink-0 ${tempColor(currentTemperature)}`}>
              {currentTemperature.toFixed(0)}°
            </span>
          )}
        </div>
        {summary.alertCount > 0 && (
          <Badge variant={severityVariant(summary.maxSeverity)} size="sm">
            {summary.alertCount} alert{summary.alertCount !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Risk data section */}
      {riskData && provinceCode && (
        <RiskSection riskData={riskData} provinceCode={provinceCode} />
      )}

      <div className="flex gap-1 mb-2 rounded-md bg-bg-card/80 p-0.5">
        {tabConfig.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 text-xs py-1 px-2 rounded transition-colors ${
              activeTab === tab.id
                ? 'bg-bg-card text-text-primary font-medium'
                : 'text-text-secondary hover:text-text-secondary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="max-h-[350px] overflow-y-auto">
        {forecastLoading ? (
          <LoadingSpinner />
        ) : (
          <>
            {activeTab === 'now' && <NowTab forecast={forecast} alerts={summary.alerts} />}
            {activeTab === 'hourly' && <HourlyTab hourly={forecast?.hourly ?? []} />}
            {activeTab === 'daily' && <DailyTab daily={forecast?.daily ?? []} />}
          </>
        )}
      </div>
    </div>
  );
}
