'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useAppStore } from '@/store/app-store';

const ALERT_LEVEL_KEYS = [
  { key: 'noAlerts', color: '#008000' },
  { key: 'low', color: '#84CC16' },
  { key: 'moderate', color: '#FBBF24' },
  { key: 'high', color: '#F97316' },
  { key: 'veryHigh', color: '#EF4444' },
  { key: 'critical', color: '#e51f1f' },
] as const;

const RISK_LEVEL_KEYS = [
  { key: 'low', color: '#44ce1b' },
  { key: 'moderate', color: '#bbdb44' },
  { key: 'high', color: '#FFFF00' },
  { key: 'veryHigh', color: '#f2a134' },
  { key: 'critical', color: '#e51f1f' },
] as const;

export function MapLegend() {
  const [collapsed, setCollapsed] = useState(false);
  const isMobile = useMediaQuery('(max-width: 1023px)');
  const activeMapLayer = useAppStore((s) => s.activeMapLayer);
  const t = useTranslations('Map');

  useEffect(() => {
    if (!isMobile) return;
    const id = requestAnimationFrame(() => setCollapsed(true));
    return () => cancelAnimationFrame(id);
  }, [isMobile]);

  const levelKeys = activeMapLayer === 'risk' ? RISK_LEVEL_KEYS : ALERT_LEVEL_KEYS;
  const title = activeMapLayer === 'risk' ? t('riskScore') : t('alertLevels');

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="absolute bottom-4 left-4 lg:left-[296px] z-10 flex h-8 gap-0.5 glass-heavy rounded-xl overflow-hidden border border-border cursor-pointer"
        aria-label={t('showLegend')}
      >
        {levelKeys.map((level) => (
          <div
            key={level.key}
            className="w-4 h-full"
            style={{ backgroundColor: level.color }}
          />
        ))}
      </button>
    );
  }

  return (
    <div className="absolute bottom-4 left-4 lg:left-[296px] z-10">
      <div className="glass-heavy rounded-2xl p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="font-[family-name:var(--font-sans)] text-xs font-medium text-text-secondary">{title}</span>
          <button
            onClick={() => setCollapsed(true)}
            className="text-text-muted hover:text-text-primary hover:bg-white/5 rounded-md px-1.5 text-xs lg:hidden cursor-pointer transition-colors"
            aria-label={t('hideLegend')}
          >
            {t('hideLegend')}
          </button>
        </div>
        {activeMapLayer === 'risk' ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex h-2.5 rounded-full overflow-hidden">
              {RISK_LEVEL_KEYS.map((level) => (
                <div
                  key={level.key}
                  className="flex-1"
                  style={{ backgroundColor: level.color }}
                />
              ))}
            </div>
            <div className="flex justify-between">
              <span className="font-[family-name:var(--font-mono)] text-[10px] text-text-muted">0</span>
              <span className="font-[family-name:var(--font-mono)] text-[10px] text-text-muted">50</span>
              <span className="font-[family-name:var(--font-mono)] text-[10px] text-text-muted">100</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {levelKeys.map((level) => (
              <div key={level.key} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-sm shrink-0 border border-border/50"
                  style={{ backgroundColor: level.color }}
                />
                <span className="font-[family-name:var(--font-mono)] text-[10px] text-text-secondary">{t(level.key)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
