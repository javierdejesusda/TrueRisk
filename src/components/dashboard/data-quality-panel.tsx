'use client';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDataHealth } from '@/hooks/use-data-health';

function formatSourceName(raw: string): string {
  const map: Record<string, string> = {
    open_meteo: 'Open-Meteo',
    nasa_firms: 'NASA FIRMS',
    ign_seismic: 'IGN Seismic',
    aemet: 'AEMET',
    copernicus_ems: 'Copernicus EMS',
    copernicus_cams: 'Copernicus CAMS',
    copernicus_land: 'Copernicus Land',
    openaq: 'OpenAQ',
    saih: 'SAIH',
    usgs: 'USGS',
    ree_energy: 'REE Energy',
    ine_demographics: 'INE',
    nasa_power: 'NASA POWER',
    ecmwf_seasonal: 'ECMWF',
  };
  return (
    map[raw] ??
    raw
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
  );
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function statusDot(failures: number, hasSuccess: boolean): string {
  if (!hasSuccess) return 'bg-white/20';
  if (failures === 0) return 'bg-accent-green';
  if (failures <= 2) return 'bg-accent-yellow';
  return 'bg-accent-red';
}

export function DataQualityPanel() {
  const { sources, isLoading } = useDataHealth();

  if (isLoading) {
    return (
      <Card variant="glass" padding="md" className="h-full">
        <Skeleton height="14px" width="120px" className="mb-3" />
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} height="14px" className="mb-2" />
        ))}
      </Card>
    );
  }

  const entries = Object.entries(sources);

  if (entries.length === 0) {
    return (
      <Card variant="glass" padding="md" className="h-full">
        <h2 className="font-[family-name:var(--font-display)] text-[11px] font-bold uppercase tracking-[0.15em] text-text-muted mb-2">
          Data Sources
        </h2>
        <p className="font-[family-name:var(--font-sans)] text-xs text-text-muted">
          No data sources tracked yet.
        </p>
      </Card>
    );
  }

  return (
    <Card variant="glass" padding="md" className="h-full">
      <h2 className="font-[family-name:var(--font-display)] text-[11px] font-bold uppercase tracking-[0.15em] text-text-muted mb-3">
        Data Sources
      </h2>

      <div className="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto pr-1">
        {entries.map(([name, status]) => (
          <div key={name} className="flex items-center gap-2">
            <span
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusDot(status.consecutive_failures, status.last_success !== null)}`}
            />
            <span className="font-[family-name:var(--font-sans)] text-[11px] text-text-secondary flex-1 truncate">
              {formatSourceName(name)}
            </span>
            {status.total_records_last_fetch > 0 && (
              <span className="font-[family-name:var(--font-mono)] text-[9px] text-text-muted tabular-nums">
                {status.total_records_last_fetch}
              </span>
            )}
            <span className="font-[family-name:var(--font-mono)] text-[9px] text-text-muted tabular-nums shrink-0" suppressHydrationWarning>
              {status.last_success ? relativeTime(status.last_success) : '--'}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
