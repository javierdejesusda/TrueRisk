'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';

const LEVELS = [
  { label: 'No alerts', color: '#1a2b1e' },
  { label: 'Low', color: '#34d399' },
  { label: 'Moderate', color: '#fbbf24' },
  { label: 'High', color: '#f97316' },
  { label: 'Very High', color: '#ef4444' },
  { label: 'Critical', color: '#dc2626' },
];

export function MapLegend() {
  const [collapsed, setCollapsed] = useState(false);

  // Mobile: collapsible toggle
  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="absolute bottom-4 left-4 z-10 flex h-8 gap-0.5 rounded-lg overflow-hidden border border-border cursor-pointer"
        aria-label="Show legend"
      >
        {LEVELS.map((level) => (
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
          <span className="text-xs font-medium text-text-secondary">Alert Levels</span>
          <button
            onClick={() => setCollapsed(true)}
            className="text-text-muted hover:text-text-primary text-xs lg:hidden cursor-pointer"
            aria-label="Collapse legend"
          >
            Hide
          </button>
        </div>
        <div className="flex flex-col gap-1.5">
          {LEVELS.map((level) => (
            <div key={level.label} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm shrink-0 border border-border/50"
                style={{ backgroundColor: level.color }}
              />
              <span className="text-xs text-text-secondary">{level.label}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
