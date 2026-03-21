'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import type { ForecastResponse, HourlyForecast, DailyForecast } from '@/types/weather';
import type { RiskMapEntry, HazardType } from '@/types/risk';
import type { AirQualityData } from '@/hooks/use-air-quality';
import type { DemographicsData } from '@/hooks/use-demographics';
import type { VegetationData } from '@/hooks/use-vegetation';
import type { SeismicData } from '@/hooks/use-seismic';
import type { SolarData } from '@/hooks/use-solar';

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
  { key: 'flood', label: 'Flood', color: 'bg-accent-blue' },
  { key: 'wildfire', label: 'Wildfire', color: 'bg-accent-orange' },
  { key: 'drought', label: 'Drought', color: 'bg-accent-yellow' },
  { key: 'heatwave', label: 'Heatwave', color: 'bg-accent-red' },
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
  if (score >= 85) return 'text-accent-red';
  if (score >= 70) return 'text-accent-orange';
  if (score >= 50) return 'text-accent-yellow';
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
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-accent-green" />
    </div>
  );
}

function RiskSection({ riskData, provinceCode }: { riskData: RiskMapEntry; provinceCode: string }) {
  return (
    <div className="mb-3 pb-3 border-b border-white/5">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`text-xl font-bold font-[family-name:var(--font-mono)] ${riskScoreColor(riskData.composite_score)}`}>
            {riskData.composite_score.toFixed(0)}
          </span>
          <div className="flex flex-col">
            <span className="text-[9px] text-text-secondary uppercase font-[family-name:var(--font-sans)]">Risk Score</span>
            <span className="text-[10px] text-text-secondary capitalize font-[family-name:var(--font-sans)]">{riskData.dominant_hazard}</span>
          </div>
        </div>
        <Link
          href={`/prediction?province=${provinceCode}`}
          className="text-[10px] text-accent-green hover:underline font-[family-name:var(--font-sans)]"
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
              <span className="text-[9px] text-text-secondary w-12 font-[family-name:var(--font-sans)]">{label}</span>
              <div className="flex-1 h-1 bg-bg-secondary rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, score)}%` }} />
              </div>
              <span className="text-[9px] text-text-secondary w-5 text-right font-[family-name:var(--font-mono)]">{score.toFixed(0)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AirQualitySection({ data }: { data: AirQualityData }) {
  const params = [
    { key: 'no2', label: 'NO₂', value: data.no2, unit: 'μg/m³', warn: 40 },
    { key: 'co', label: 'CO', value: data.co, unit: 'μg/m³', warn: 10000 },
    { key: 'so2', label: 'SO₂', value: data.so2, unit: 'μg/m³', warn: 20 },
    { key: 'pm25', label: 'PM2.5', value: data.pm25, unit: 'μg/m³', warn: 25 },
    { key: 'pm10', label: 'PM10', value: data.pm10, unit: 'μg/m³', warn: 50 },
    { key: 'o3', label: 'O₃', value: data.o3, unit: 'μg/m³', warn: 100 },
  ].filter(p => p.value != null);

  if (params.length === 0) return null;

  return (
    <div className="border-t border-border pt-2">
      <p className="text-[10px] text-text-secondary mb-1.5 uppercase tracking-wider">Air Quality — {data.station_name}</p>
      <div className="grid grid-cols-3 gap-1">
        {params.map(p => (
          <div key={p.key} className="rounded-lg bg-white/[0.03] p-1.5 text-center">
            <p className="text-[9px] text-text-secondary">{p.label}</p>
            <p className={`text-xs font-medium font-[family-name:var(--font-mono)] ${
              p.value! > p.warn ? 'text-accent-red' : 'text-accent-green'
            }`}>
              {p.value!.toFixed(0)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function DemographicsSection({ data }: { data: DemographicsData }) {
  if (!data.total_population) return null;
  return (
    <div className="border-t border-border pt-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-text-secondary uppercase tracking-wider">Population</p>
        <p className="text-xs font-medium font-[family-name:var(--font-mono)] text-text-primary">
          {data.total_population.toLocaleString('es-ES')}
        </p>
      </div>
    </div>
  );
}

function VegetationSection({ data }: { data: VegetationData }) {
  if (!data.classification && data.ndvi == null) return null;
  const ndviColor = (data.ndvi ?? 0) >= 0.5 ? 'text-accent-green' : (data.ndvi ?? 0) >= 0.2 ? 'text-accent-yellow' : 'text-accent-red';
  return (
    <div className="border-t border-border pt-2">
      <p className="text-[10px] text-text-secondary mb-1.5 uppercase tracking-wider">Vegetation Health</p>
      <div className="flex items-center justify-between">
        {data.ndvi != null && (
          <p className={`text-xs font-medium font-[family-name:var(--font-mono)] ${ndviColor}`}>
            NDVI: {data.ndvi.toFixed(2)}
          </p>
        )}
        {data.classification && (
          <p className="text-xs text-text-secondary capitalize font-[family-name:var(--font-sans)]">{data.classification}</p>
        )}
      </div>
    </div>
  );
}

function SeismicSection({ data }: { data: SeismicData }) {
  if (!data.event_count && !data.max_magnitude) return null;
  return (
    <div className="border-t border-border pt-2">
      <p className="text-[10px] text-text-secondary mb-1.5 uppercase tracking-wider">Seismic Activity (90d)</p>
      <div className="grid grid-cols-3 gap-1">
        {data.event_count != null && (
          <div className="rounded-lg bg-white/[0.03] p-1.5 text-center">
            <p className="text-[9px] text-text-secondary">Events</p>
            <p className="text-xs font-medium font-[family-name:var(--font-mono)] text-text-primary">{data.event_count}</p>
          </div>
        )}
        {data.max_magnitude != null && (
          <div className="rounded-lg bg-white/[0.03] p-1.5 text-center">
            <p className="text-[9px] text-text-secondary">Max Mag</p>
            <p className={`text-xs font-medium font-[family-name:var(--font-mono)] ${data.max_magnitude >= 4 ? 'text-accent-red' : data.max_magnitude >= 3 ? 'text-accent-orange' : 'text-accent-green'}`}>
              {data.max_magnitude.toFixed(1)}
            </p>
          </div>
        )}
        {data.closest_distance_km != null && (
          <div className="rounded-lg bg-white/[0.03] p-1.5 text-center">
            <p className="text-[9px] text-text-secondary">Nearest</p>
            <p className="text-xs font-medium font-[family-name:var(--font-mono)] text-text-primary">{data.closest_distance_km.toFixed(0)} km</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SolarSection({ data }: { data: SolarData }) {
  if (data.allsky_sfc_sw_dwn == null) return null;
  return (
    <div className="border-t border-border pt-2">
      <p className="text-[10px] text-text-secondary mb-1.5 uppercase tracking-wider">Solar & Agmet</p>
      <div className="grid grid-cols-2 gap-1">
        <div className="rounded-lg bg-white/[0.03] p-1.5 text-center">
          <p className="text-[9px] text-text-secondary">Solar Rad.</p>
          <p className="text-xs font-medium font-[family-name:var(--font-mono)] text-accent-yellow">{data.allsky_sfc_sw_dwn.toFixed(1)} kWh/m²</p>
        </div>
        {data.rh2m != null && (
          <div className="rounded-lg bg-white/[0.03] p-1.5 text-center">
            <p className="text-[9px] text-text-secondary">Humidity</p>
            <p className="text-xs font-medium font-[family-name:var(--font-mono)] text-text-primary">{data.rh2m.toFixed(0)}%</p>
          </div>
        )}
      </div>
    </div>
  );
}

function NowTab({ forecast, alerts, airQuality, demographics, vegetation, seismic, solar }: { forecast: ForecastResponse | null; alerts: MapPopupProps['summary']['alerts']; airQuality?: AirQualityData | null; demographics?: DemographicsData | null; vegetation?: VegetationData | null; seismic?: SeismicData | null; solar?: SolarData | null }) {
  const current = forecast?.hourly?.[0] ?? null;

  return (
    <div className="flex flex-col gap-2">
      {current ? (
        <>
          <div className="flex items-start justify-between">
            <div>
              <span className={`text-3xl font-bold font-[family-name:var(--font-mono)] ${tempColor(current.temperature)}`}>
                {current.temperature}°
              </span>
              <p className="text-[10px] text-text-secondary mt-0.5">
                Wind: {current.wind_speed} km/h
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <div className="rounded-xl bg-white/[0.03] p-2">
              <p className="text-[10px] text-text-secondary font-[family-name:var(--font-sans)]">Wind</p>
              <p className="text-xs text-text-primary font-medium font-[family-name:var(--font-mono)]">{current.wind_speed} km/h</p>
            </div>
            <div className="rounded-xl bg-white/[0.03] p-2">
              <p className="text-[10px] text-text-secondary font-[family-name:var(--font-sans)]">Humidity</p>
              <p className="text-xs text-text-primary font-medium font-[family-name:var(--font-mono)]">{current.humidity}%</p>
            </div>
            <div className="rounded-xl bg-white/[0.03] p-2">
              <p className="text-[10px] text-text-secondary font-[family-name:var(--font-sans)]">Precipitation</p>
              <p className="text-xs text-text-primary font-medium font-[family-name:var(--font-mono)]">{current.precipitation} mm</p>
            </div>
            <div className="rounded-xl bg-white/[0.03] p-2">
              <p className="text-[10px] text-text-secondary font-[family-name:var(--font-sans)]">Pressure</p>
              <p className="text-xs text-text-primary font-medium font-[family-name:var(--font-mono)]">{current.pressure ?? '—'} hPa</p>
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
            {alerts.map((alert, i) => {
              const severityColor =
                alert.severity >= 4 ? '#ef4444' :
                alert.severity >= 3 ? '#f97316' :
                alert.severity >= 2 ? '#fbbf24' :
                '#008000';
              return (
                <div key={i} className="flex items-start gap-2 rounded-lg bg-white/[0.03] border-l-[3px] p-2" style={{ borderLeftColor: severityColor }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-text-primary truncate">{alert.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-text-secondary font-[family-name:var(--font-mono)] uppercase">{alert.hazardType}</span>
                      <span className="text-[10px] text-text-secondary">·</span>
                      <span className="text-[10px] text-text-secondary capitalize">{alert.source}</span>
                    </div>
                  </div>
                  <span
                    className="text-[10px] font-medium shrink-0 mt-0.5"
                    style={{ color: severityColor }}
                  >
                    {severityLabel(alert.severity)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {alerts.length === 0 && (
        <p className="text-xs text-text-secondary border-t border-border pt-2">No active alerts</p>
      )}

      {airQuality && <AirQualitySection data={airQuality} />}
      {vegetation && <VegetationSection data={vegetation} />}
      {seismic && <SeismicSection data={seismic} />}
      {solar && <SolarSection data={solar} />}
      {demographics && <DemographicsSection data={demographics} />}
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
        <div key={i} className="flex flex-col items-center gap-1 rounded-xl bg-white/[0.03] p-2 min-w-[60px] shrink-0">
          <span className="text-[10px] text-text-secondary font-[family-name:var(--font-mono)]">{formatHour(h.time)}</span>
          <span className={`text-sm font-bold font-[family-name:var(--font-mono)] ${tempColor(h.temperature)}`}>{h.temperature}°</span>
          <span className="text-[10px] text-text-secondary font-[family-name:var(--font-mono)]">{h.humidity}%</span>
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
        <div key={i} className="flex items-center gap-2 rounded-lg bg-white/[0.03] p-2 hover:bg-white/[0.05] transition-colors">
          <span className="text-xs text-text-secondary w-[52px] shrink-0 font-[family-name:var(--font-sans)]">
            {formatDayName(d.date)}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {d.precipitation_sum > 0 && (
                <span className="text-[10px] text-accent-blue font-[family-name:var(--font-mono)]">{d.precipitation_sum}mm</span>
              )}
              <span className="text-[10px] text-text-secondary font-[family-name:var(--font-mono)]">{d.wind_speed_max} km/h</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className={`text-xs font-bold font-[family-name:var(--font-mono)] ${tempColor(d.temperature_max)}`}>{d.temperature_max}°</span>
            <span className="text-[10px] text-text-secondary mx-0.5">/</span>
            <span className="text-xs text-text-secondary font-[family-name:var(--font-mono)]">{d.temperature_min}°</span>
          </div>
        </div>
      ))}
    </div>
  );
}

const forecastCache = new Map<string, { data: ForecastResponse; fetchedAt: number }>();
const aqCache = new Map<string, { data: AirQualityData | null; fetchedAt: number }>();
const demoCache = new Map<string, { data: DemographicsData | null; fetchedAt: number }>();
const vegCache = new Map<string, { data: VegetationData | null; fetchedAt: number }>();
const seismicCache = new Map<string, { data: SeismicData | null; fetchedAt: number }>();
const solarCache = new Map<string, { data: SolarData | null; fetchedAt: number }>();
const FORECAST_CACHE_TTL = 300_000;

export function MapPopup({ provinceName, summary, provinceCode, riskData, currentTemperature }: MapPopupProps) {
  const t = useTranslations('Map');
  const [activeTab, setActiveTab] = useState<TabId>('now');
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [airQuality, setAirQuality] = useState<AirQualityData | null>(null);
  const [demographics, setDemographics] = useState<DemographicsData | null>(null);
  const [vegetation, setVegetation] = useState<VegetationData | null>(null);
  const [seismic, setSeismic] = useState<SeismicData | null>(null);
  const [solar, setSolar] = useState<SolarData | null>(null);

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

    async function loadAirQuality() {
      const cached = aqCache.get(provinceCode!);
      if (cached && Date.now() - cached.fetchedAt < FORECAST_CACHE_TTL) {
        if (!cancelled) setAirQuality(cached.data);
        return;
      }
      try {
        const res = await fetch(`/api/data/air-quality/${provinceCode}`);
        if (!res.ok) return;
        const data = await res.json();
        const result = Object.keys(data).length > 0 && data.station_name ? data : null;
        if (!cancelled) setAirQuality(result);
        aqCache.set(provinceCode!, { data: result, fetchedAt: Date.now() });
      } catch { /* ignore */ }
    }

    async function loadDemographics() {
      const cached = demoCache.get(provinceCode!);
      if (cached && Date.now() - cached.fetchedAt < FORECAST_CACHE_TTL) {
        if (!cancelled) setDemographics(cached.data);
        return;
      }
      try {
        const res = await fetch(`/api/data/demographics/${provinceCode}`);
        if (!res.ok) return;
        const data = await res.json();
        const result = data.total_population ? data : null;
        if (!cancelled) setDemographics(result);
        demoCache.set(provinceCode!, { data: result, fetchedAt: Date.now() });
      } catch { /* ignore */ }
    }

    async function loadVegetation() {
      const cached = vegCache.get(provinceCode!);
      if (cached && Date.now() - cached.fetchedAt < FORECAST_CACHE_TTL) {
        if (!cancelled) setVegetation(cached.data);
        return;
      }
      try {
        const res = await fetch(`/api/data/vegetation/${provinceCode}`);
        if (!res.ok) return;
        const data = await res.json();
        const result = Object.keys(data).length > 0 ? data : null;
        if (!cancelled) setVegetation(result);
        vegCache.set(provinceCode!, { data: result, fetchedAt: Date.now() });
      } catch { /* ignore */ }
    }

    async function loadSeismic() {
      const cached = seismicCache.get(provinceCode!);
      if (cached && Date.now() - cached.fetchedAt < FORECAST_CACHE_TTL) {
        if (!cancelled) setSeismic(cached.data);
        return;
      }
      try {
        const res = await fetch(`/api/data/seismic/${provinceCode}`);
        if (!res.ok) return;
        const data = await res.json();
        const result = Object.keys(data).length > 0 ? data : null;
        if (!cancelled) setSeismic(result);
        seismicCache.set(provinceCode!, { data: result, fetchedAt: Date.now() });
      } catch { /* ignore */ }
    }

    async function loadSolar() {
      const cached = solarCache.get(provinceCode!);
      if (cached && Date.now() - cached.fetchedAt < FORECAST_CACHE_TTL) {
        if (!cancelled) setSolar(cached.data);
        return;
      }
      try {
        const res = await fetch(`/api/data/solar/${provinceCode}`);
        if (!res.ok) return;
        const data = await res.json();
        const result = Object.keys(data).length > 0 ? data : null;
        if (!cancelled) setSolar(result);
        solarCache.set(provinceCode!, { data: result, fetchedAt: Date.now() });
      } catch { /* ignore */ }
    }

    load();
    loadAirQuality();
    loadDemographics();
    loadVegetation();
    loadSeismic();
    loadSolar();
    return () => { cancelled = true; };
  }, [provinceCode]);

  const tabConfig: { id: TabId; label: string }[] = [
    { id: 'now', label: t('now') },
    { id: 'hourly', label: t('hourly') },
    { id: 'daily', label: t('sevenDays') },
  ];

  return (
    <div className="p-3 max-w-[320px]">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="text-base font-bold font-[family-name:var(--font-display)] text-text-primary truncate">{provinceName}</h3>
          {currentTemperature != null && (
            <span className={`text-2xl font-bold font-[family-name:var(--font-mono)] shrink-0 ${tempColor(currentTemperature)}`}>
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

      <div className="flex gap-0 mb-2 border-b border-white/5 pb-0">
        {tabConfig.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`font-[family-name:var(--font-sans)] text-[11px] px-3 py-2 transition-colors ${
              activeTab === tab.id
                ? 'border-b-2 border-accent-green text-accent-green bg-transparent'
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
            {activeTab === 'now' && <NowTab forecast={forecast} alerts={summary.alerts} airQuality={airQuality} demographics={demographics} vegetation={vegetation} seismic={seismic} solar={solar} />}
            {activeTab === 'hourly' && <HourlyTab hourly={forecast?.hourly ?? []} />}
            {activeTab === 'daily' && <DailyTab daily={forecast?.daily ?? []} />}
          </>
        )}
      </div>
    </div>
  );
}
