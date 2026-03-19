'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useAppStore } from '@/store/app-store';

const ALERT_LEVELS = [
  { label: 'No alerts', color: '#16A34A' },
  { label: 'Low', color: '#64D2FF' },
  { label: 'Moderate', color: '#fbbf24' },
  { label: 'High', color: '#f97316' },
  { label: 'Very High', color: '#ef4444' },
  { label: 'Critical', color: '#dc2626' },
];

const RISK_LEVELS = [
  { label: 'Low', color: '#16A34A' },
  { label: 'Moderate', color: '#FFD60A' },
  { label: 'High', color: '#FF9F0A' },
  { label: 'Very High', color: '#FF453A' },
  { label: 'Critical', color: '#FF2D55' },
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
        className="absolute bottom-4 left-4 z-10 flex h-8 gap-0.5 rounded-lg overflow-hidden border border-border cursor-pointer"
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
      <Card className="bg-bg-secondary/90 backdrop-blur-sm" padding="sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-text-secondary">{title}</span>
          <button
            onClick={() => setCollapsed(true)}
            className="text-text-muted hover:text-text-primary text-xs lg:hidden cursor-pointer"
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
              <span className="text-[9px] text-text-muted">0</span>
              <span className="text-[9px] text-text-muted">50</span>
              <span className="text-[9px] text-text-muted">100</span>
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
                <span className="text-xs text-text-secondary">{level.label}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
