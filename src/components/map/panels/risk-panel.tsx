'use client';

import { useTranslations } from 'next-intl';
import { useRiskScore } from '@/hooks/use-risk-score';
import { PanelShell } from './panel-shell';
import type { CompositeRiskScore, HazardType } from '@/types/risk';

const HAZARDS: { key: HazardType; label: string; color: string }[] = [
  { key: 'flood', label: 'Flood', color: 'bg-accent-blue' },
  { key: 'wildfire', label: 'Wildfire', color: 'bg-accent-orange' },
  { key: 'drought', label: 'Drought', color: 'bg-accent-yellow' },
  { key: 'heatwave', label: 'Heatwave', color: 'bg-accent-red' },
  { key: 'seismic', label: 'Seismic', color: 'bg-accent-purple' },
  { key: 'coldwave', label: 'Cold Wave', color: 'bg-severity-1' },
  { key: 'windstorm', label: 'Windstorm', color: 'bg-accent-green' },
];

function severityColor(score: number): string {
  if (score >= 85) return 'text-accent-red';
  if (score >= 70) return 'text-accent-orange';
  if (score >= 50) return 'text-accent-yellow';
  return 'text-accent-green';
}

function severityDot(score: number): string {
  if (score >= 85) return 'bg-accent-red';
  if (score >= 70) return 'bg-accent-orange';
  if (score >= 50) return 'bg-accent-yellow';
  return 'bg-accent-green';
}

const ShieldIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

export function RiskPanel() {
  const { risk, isLoading } = useRiskScore();

  const score = risk?.composite_score ?? 0;
  const dominant = risk?.dominant_hazard ?? '';

  const collapsedContent = (
    <div className="flex items-center gap-2">
      <span className={`text-3xl font-bold font-[family-name:var(--font-mono)] ${severityColor(score)}`}>
        {isLoading ? '—' : score.toFixed(0)}
      </span>
      <span className={`h-2 w-2 rounded-full ${severityDot(score)}`} />
      {dominant && (
        <span className="text-[10px] text-text-muted capitalize">{dominant}</span>
      )}
    </div>
  );

  return (
    <PanelShell
      title="Risk Score"
      icon={ShieldIcon}
      collapsedContent={collapsedContent}
    >
      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-3 rounded bg-bg-secondary animate-pulse" />
          ))}
        </div>
      ) : risk ? (
        <div className="flex flex-col gap-3">
          {/* Score display */}
          <div className="flex items-center gap-3">
            <span className={`text-3xl font-bold font-[family-name:var(--font-mono)] ${severityColor(score)}`}>
              {score.toFixed(0)}
            </span>
            <div className="flex flex-col">
              <span className="text-[10px] text-text-muted uppercase tracking-wider font-[family-name:var(--font-sans)]">Composite</span>
              <span className="text-xs text-text-secondary capitalize">{risk.severity.replace('_', ' ')}</span>
            </div>
          </div>

          {/* Hazard bars */}
          <div className="flex flex-col gap-2">
            {HAZARDS.map(({ key, label, color }) => {
              const hazardScore = risk[`${key}_score` as keyof CompositeRiskScore] as number;
              const isDominant = risk.dominant_hazard === key;
              return (
                <div key={key} className={`flex items-center gap-2 ${isDominant ? 'border-l-2 border-current pl-1' : ''}`}>
                  <span className={`text-[10px] w-14 font-[family-name:var(--font-sans)] ${isDominant ? 'font-semibold text-text-primary' : 'text-text-muted'}`}>
                    {label}
                  </span>
                  <div className="flex-1 h-[6px] bg-bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${color}`}
                      style={{ width: `${Math.min(100, hazardScore)}%` }}
                    />
                  </div>
                  <span className={`text-[10px] w-6 text-right font-[family-name:var(--font-mono)] ${isDominant ? 'font-bold text-text-primary' : 'text-text-muted'}`}>
                    {hazardScore.toFixed(0)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="text-xs text-text-muted">No risk data</p>
      )}
    </PanelShell>
  );
}
