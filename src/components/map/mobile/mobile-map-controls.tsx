'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useAppStore } from '@/store/app-store';
import type { DataLayerVisibility } from '../data-layers';

export interface MobileMapControlsProps {
  alertCount: number;
  onResetView: () => void;
  onRefresh: () => void;
  dataLayers?: DataLayerVisibility;
  onToggleDataLayer?: (layer: keyof DataLayerVisibility) => void;
  fireCount?: number;
  quakeCount?: number;
  reservoirCount?: number;
  gaugeCount?: number;
}

const LAYER_ITEMS = [
  { key: 'fires' as const, label: 'fires', color: 'bg-accent-orange/20 text-accent-orange border-accent-orange/30' },
  { key: 'earthquakes' as const, label: 'quakes', color: 'bg-accent-red/20 text-accent-red border-accent-red/30' },
  { key: 'reservoirs' as const, label: 'reservoirs', color: 'bg-accent-blue/20 text-accent-blue border-accent-blue/30' },
  { key: 'riverGauges' as const, label: 'gauges', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-400/30' },
] as const;

export function MobileMapControls({
  onResetView,
  onRefresh,
  dataLayers,
  onToggleDataLayer,
  fireCount,
  quakeCount,
  reservoirCount,
  gaugeCount,
}: MobileMapControlsProps) {
  const t = useTranslations('Map');
  const activeMapLayer = useAppStore((s) => s.activeMapLayer);
  const setActiveMapLayer = useAppStore((s) => s.setActiveMapLayer);
  const [layersOpen, setLayersOpen] = useState(false);

  const counts: Record<string, number | undefined> = {
    fires: fireCount,
    earthquakes: quakeCount,
    reservoirs: reservoirCount,
    riverGauges: gaugeCount,
  };

  return (
    <div className="absolute top-20 right-2 z-30 flex flex-col items-end gap-1.5">
      {/* Risk / Alerts layer toggle */}
      <div className="glass-heavy rounded-xl p-0.5 flex gap-0.5">
        <button
          onClick={() => setActiveMapLayer('risk')}
          className={[
            'px-2.5 py-1.5 rounded-[10px] text-[10px] font-semibold transition-all duration-200 cursor-pointer font-[family-name:var(--font-sans)]',
            activeMapLayer === 'risk'
              ? 'bg-white/[0.1] text-text-primary border border-white/[0.12]'
              : 'text-text-muted border border-transparent',
          ].join(' ')}
        >
          {t('risk')}
        </button>
        <button
          onClick={() => setActiveMapLayer('alerts')}
          className={[
            'px-2.5 py-1.5 rounded-[10px] text-[10px] font-semibold transition-all duration-200 cursor-pointer font-[family-name:var(--font-sans)]',
            activeMapLayer === 'alerts'
              ? 'bg-accent-red/15 text-accent-red border border-accent-red/20'
              : 'text-text-muted border border-transparent',
          ].join(' ')}
        >
          {t('alerts')}
        </button>
      </div>

      {/* Data layers toggle */}
      {dataLayers && onToggleDataLayer && (
        <div className="flex flex-col items-end gap-1">
          <button
            onClick={() => setLayersOpen((o) => !o)}
            className={[
              'glass-heavy w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-200',
              layersOpen ? 'bg-white/[0.1] border-white/[0.15]' : '',
            ].join(' ')}
            aria-label={t('layers')}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-secondary">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </button>

          <AnimatePresence>
            {layersOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: -4 }}
                transition={{ duration: 0.15 }}
                className="glass-heavy rounded-xl p-1 flex flex-col gap-0.5"
              >
                {LAYER_ITEMS.map(({ key, label, color }) => (
                  <button
                    key={key}
                    onClick={() => onToggleDataLayer(key)}
                    className={[
                      'px-2.5 py-1.5 rounded-[10px] text-[10px] font-medium transition-all duration-200 cursor-pointer font-[family-name:var(--font-sans)] text-left whitespace-nowrap border',
                      dataLayers[key] ? color : 'text-text-muted border-transparent',
                    ].join(' ')}
                  >
                    {t(label)}{counts[key] ? ` (${counts[key]})` : ''}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Reset + Refresh */}
      <div className="flex gap-1">
        <button
          onClick={onResetView}
          className="glass-heavy w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-200 active:scale-95"
          aria-label={t('reset')}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-secondary">
            <path d="M6 1v4l2.5 1.5" />
            <circle cx="6" cy="6" r="5" />
          </svg>
        </button>
        <button
          onClick={onRefresh}
          className="glass-heavy w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-200 active:scale-95"
          aria-label={t('refreshLabel')}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-secondary">
            <path d="M1 1v3.5h3.5" />
            <path d="M11 11V7.5H7.5" />
            <path d="M9.7 4.5A4.5 4.5 0 0 0 2.3 3L1 4.5" />
            <path d="M2.3 7.5A4.5 4.5 0 0 0 9.7 9L11 7.5" />
          </svg>
        </button>
      </div>
    </div>
  );
}
