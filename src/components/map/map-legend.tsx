'use client';

import { useState, useEffect } from 'react';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useAppStore } from '@/store/app-store';

const ALERT_LEVELS = [
  { label: 'No alerts', color: '#008000' },
  { label: 'Low', color: '#84CC16' },
  { label: 'Moderate', color: '#FBBF24' },
  { label: 'High', color: '#F97316' },
  { label: 'Very High', color: '#EF4444' },
  { label: 'Critical', color: '#EC4899' },
];

const RISK_LEVELS = [
  { label: 'Low', color: '#008000' },
  { label: 'Moderate', color: '#FBBF24' },
  { label: 'High', color: '#F97316' },
  { label: 'Very High', color: '#EF4444' },
  { label: 'Critical', color: '#EC4899' },
];

export function MapLegend() {
  const [collapsed, setCollapsed] = useState(false);
  const isMobile = useMediaQuery('(max-width: 1023px)');
  const activeMapLayer = useAppStore((s) => s.activeMapLayer);

  useEffect(() => {
    if (!isMobile) return;
    const id = requestAnimationFrame(() => setCollapsed(true));
    return () => cancelAnimationFrame(id);
  }, [isMobile]);

  const levels = activeMapLayer === 'risk' ? RISK_LEVELS : ALERT_LEVELS;
  const title = activeMapLayer === 'risk' ? 'Risk Score' : 'Alert Levels';

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="absolute bottom-4 left-4 z-10 flex h-8 gap-0.5 glass-heavy rounded-xl overflow-hidden border border-border cursor-pointer"
        aria-label="Show legend"
      >
        {levels.map((level) => (
          <div
            key={level.label}
            className="w-4 h-full"
            style={{ backgroundColor: level.color }}
          />
        ))}
      </button>
    );
  }

  return (
    <div className="absolute bottom-4 left-4 z-10">
      <div className="glass-heavy rounded-2xl p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="font-[family-name:var(--font-sans)] text-xs font-medium text-text-secondary">{title}</span>
          <button
            onClick={() => setCollapsed(true)}
            className="text-text-muted hover:text-text-primary hover:bg-white/5 rounded-md px-1.5 text-xs lg:hidden cursor-pointer transition-colors"
            aria-label="Collapse legend"
          >
            Hide
          </button>
        </div>
        {activeMapLayer === 'risk' ? (
          /* Gradient bar for risk */
          <div className="flex flex-col gap-1.5">
            <div className="flex h-2.5 rounded-full overflow-hidden">
              {RISK_LEVELS.map((level) => (
                <div
                  key={level.label}
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
          /* Color blocks for alerts */
          <div className="flex flex-col gap-1.5">
            {levels.map((level) => (
              <div key={level.label} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-sm shrink-0 border border-border/50"
                  style={{ backgroundColor: level.color }}
                />
                <span className="font-[family-name:var(--font-mono)] text-[10px] text-text-secondary">{level.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
