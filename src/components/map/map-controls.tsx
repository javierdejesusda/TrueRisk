'use client';

import { useTranslations } from 'next-intl';
import { useAppStore } from '@/store/app-store';
import type { DataLayerVisibility } from './data-layers';

export interface MapControlsProps {
  alertCount: number;
  lastUpdated: string | null;
  onResetView: () => void;
  onRefresh: () => void;
  terrainEnabled?: boolean;
  onToggleTerrain?: () => void;
  dataLayers?: DataLayerVisibility;
  onToggleDataLayer?: (layer: keyof DataLayerVisibility) => void;
  fireCount?: number;
  quakeCount?: number;
  reservoirCount?: number;
}

function formatRelativeTime(dateStr: string, t: (key: string, values?: Record<string, string | number | Date>) => string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('justNow');
  if (mins < 60) return t('minutesAgo', { mins });
  const hours = Math.floor(mins / 60);
  return t('hoursAgo', { hrs: hours });
}

export function MapControls({ alertCount, lastUpdated, onResetView, onRefresh, terrainEnabled, onToggleTerrain, dataLayers, onToggleDataLayer, fireCount, quakeCount, reservoirCount }: MapControlsProps) {
  const t = useTranslations('Map');
  const activeMapLayer = useAppStore((s) => s.activeMapLayer);
  const setActiveMapLayer = useAppStore((s) => s.setActiveMapLayer);
  const sseStatus = useAppStore((s) => s.sseStatus);

  return (
    <div className="absolute top-16 right-2 lg:right-4 z-10 flex flex-col gap-2">
      {/* Layer toggle */}
      <div className="glass-heavy rounded-2xl p-1.5 flex gap-0.5">
        <button
          onClick={() => setActiveMapLayer('risk')}
          className={[
            'px-2.5 py-1 rounded-md font-[family-name:var(--font-sans)] text-[11px] font-medium transition-all duration-200 cursor-pointer',
            activeMapLayer === 'risk'
              ? 'bg-accent-green/20 text-accent-green border border-accent-green/30'
              : 'text-text-muted hover:text-text-secondary border border-transparent',
          ].join(' ')}
        >
          {t('risk')}
        </button>
        <button
          onClick={() => setActiveMapLayer('alerts')}
          className={[
            'px-2.5 py-1 rounded-md font-[family-name:var(--font-sans)] text-[11px] font-medium transition-all duration-200 cursor-pointer',
            activeMapLayer === 'alerts'
              ? 'bg-accent-red/20 text-accent-red border border-accent-red/30'
              : 'text-text-muted hover:text-text-secondary border border-transparent',
          ].join(' ')}
        >
          {t('alerts')}
        </button>
        {onToggleTerrain && (
          <button
            onClick={onToggleTerrain}
            className={[
              'px-2.5 py-1 rounded-md font-[family-name:var(--font-sans)] text-[11px] font-medium transition-all duration-200 cursor-pointer',
              terrainEnabled
                ? 'bg-accent-green/20 text-accent-green border border-accent-green/30'
                : 'text-text-muted hover:text-text-secondary border border-transparent',
            ].join(' ')}
            aria-label="Toggle 3D terrain"
          >
            3D
          </button>
        )}
      </div>

      {/* Data layer toggles */}
      {dataLayers && onToggleDataLayer && (
        <div className="glass-heavy rounded-2xl p-1.5 flex flex-col gap-0.5">
          <button
            onClick={() => onToggleDataLayer('fires')}
            className={[
              'px-2.5 py-1 rounded-md font-[family-name:var(--font-sans)] text-[11px] font-medium transition-all duration-200 cursor-pointer flex items-center gap-1.5',
              dataLayers.fires
                ? 'bg-accent-orange/20 text-accent-orange border border-accent-orange/30'
                : 'text-text-muted hover:text-text-secondary border border-transparent',
            ].join(' ')}
          >
            <span className="text-[9px]">🔥</span>
            {t('fires')}{fireCount ? ` (${fireCount})` : ''}
          </button>
          <button
            onClick={() => onToggleDataLayer('earthquakes')}
            className={[
              'px-2.5 py-1 rounded-md font-[family-name:var(--font-sans)] text-[11px] font-medium transition-all duration-200 cursor-pointer flex items-center gap-1.5',
              dataLayers.earthquakes
                ? 'bg-accent-red/20 text-accent-red border border-accent-red/30'
                : 'text-text-muted hover:text-text-secondary border border-transparent',
            ].join(' ')}
          >
            {t('quakes')}{quakeCount ? ` (${quakeCount})` : ''}
          </button>
          <button
            onClick={() => onToggleDataLayer('reservoirs')}
            className={[
              'px-2.5 py-1 rounded-md font-[family-name:var(--font-sans)] text-[11px] font-medium transition-all duration-200 cursor-pointer flex items-center gap-1.5',
              dataLayers.reservoirs
                ? 'bg-accent-blue/20 text-accent-blue border border-accent-blue/30'
                : 'text-text-muted hover:text-text-secondary border border-transparent',
            ].join(' ')}
          >
            {t('reservoirs')}{reservoirCount ? ` (${reservoirCount})` : ''}
          </button>
        </div>
      )}

      {/* Controls card */}
      <div className="glass-heavy rounded-2xl p-3">
        <div className="flex flex-col gap-2">
          {/* Alert count */}
          <div className="flex items-center gap-2">
            {alertCount > 0 && (
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-red opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent-red" />
              </span>
            )}
            <span className="font-[family-name:var(--font-sans)] text-xs font-medium text-text-primary">
              {alertCount > 0 ? `${alertCount} ${t('active')}` : t('noAlertsLabel')}
            </span>
          </div>

          {/* Buttons */}
          <div className="flex gap-1.5">
            <button
              onClick={onResetView}
              className="flex items-center gap-1 rounded-md bg-bg-card px-2 py-1 text-[11px] text-text-secondary hover:bg-white/5 hover:text-text-primary transition-colors cursor-pointer"
              aria-label="Reset map view"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 1v4l2.5 1.5" />
                <circle cx="6" cy="6" r="5" />
              </svg>
              {t('reset')}
            </button>
            <button
              onClick={onRefresh}
              className="flex items-center gap-1 rounded-md bg-bg-card px-2 py-1 text-[11px] text-text-secondary hover:bg-white/5 hover:text-text-primary transition-colors cursor-pointer"
              aria-label="Refresh alerts"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 1v3.5h3.5" />
                <path d="M11 11V7.5H7.5" />
                <path d="M9.7 4.5A4.5 4.5 0 0 0 2.3 3L1 4.5" />
                <path d="M2.3 7.5A4.5 4.5 0 0 0 9.7 9L11 7.5" />
              </svg>
              {t('refreshLabel')}
            </button>
          </div>

          {/* Last updated */}
          {lastUpdated && (
            <div className="flex items-center gap-1.5">
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${
                sseStatus === 'connected' ? 'bg-accent-green' :
                sseStatus === 'connecting' ? 'bg-accent-yellow animate-pulse' :
                'bg-accent-red'
              }`} />
              <span className="font-[family-name:var(--font-mono)] text-[10px] text-text-muted">
                {t('updatedAgo', { time: formatRelativeTime(lastUpdated, t) })}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
