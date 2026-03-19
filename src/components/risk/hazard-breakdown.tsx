'use client';

import { Card } from '@/components/ui/card';
import type { CompositeRiskScore, HazardType } from '@/types/risk';

interface HazardBreakdownProps {
  risk: CompositeRiskScore | null;
  isLoading: boolean;
}

const HAZARDS: { key: HazardType; label: string; color: string }[] = [
  { key: 'flood', label: 'Flood', color: 'bg-blue-500' },
  { key: 'wildfire', label: 'Wildfire', color: 'bg-orange-500' },
  { key: 'drought', label: 'Drought', color: 'bg-amber-600' },
  { key: 'heatwave', label: 'Heatwave', color: 'bg-red-500' },
  { key: 'seismic', label: 'Seismic', color: 'bg-purple-500' },
  { key: 'coldwave', label: 'Cold Wave', color: 'bg-cyan-500' },
  { key: 'windstorm', label: 'Windstorm', color: 'bg-emerald-500' },
];

export function HazardBreakdown({ risk, isLoading }: HazardBreakdownProps) {
  return (
    <Card padding="md">
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider">
          Hazard Breakdown
        </h3>
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-4 w-20 rounded bg-bg-secondary animate-pulse" />
                <div className="flex-1 h-4 rounded bg-bg-secondary animate-pulse" />
                <div className="h-4 w-10 rounded bg-bg-secondary animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {HAZARDS.map(({ key, label, color }) => {
              const score = risk ? risk[`${key}_score` as keyof CompositeRiskScore] as number : 0;
              const isDominant = risk?.dominant_hazard === key;
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className={`text-sm w-20 ${isDominant ? 'font-semibold text-text-primary' : 'text-text-secondary'}`}>
                    {label}
                  </span>
                  <div className="flex-1 h-3 bg-bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
                      style={{ width: `${Math.min(100, score)}%` }}
                    />
                  </div>
                  <span className={`text-sm w-10 text-right font-mono ${isDominant ? 'font-bold text-text-primary' : 'text-text-muted'}`}>
                    {score.toFixed(0)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
