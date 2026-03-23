'use client';

import { useTranslations } from 'next-intl';

interface FeatureContribution {
  feature: string;
  attention_weight: number;
  contribution_pct: number;
  description: string;
}

interface AttentionExplanation {
  hazard_type: string;
  predicted_score: number;
  confidence_lower: number | null;
  confidence_upper: number | null;
  top_features: FeatureContribution[];
  generated_at: string | null;
}

interface AttentionChartProps {
  explanations: AttentionExplanation[];
}

const HAZARD_COLORS: Record<string, string> = {
  flood: 'bg-blue-500/70',
  wildfire: 'bg-orange-500/70',
  heatwave: 'bg-red-500/70',
  drought: 'bg-amber-600/70',
  coldwave: 'bg-cyan-500/70',
  windstorm: 'bg-violet-500/70',
  seismic: 'bg-rose-500/70',
};

export function AttentionChart({ explanations }: AttentionChartProps) {
  const t = useTranslations('Explainability');

  if (!explanations.length) {
    return (
      <div className="rounded-2xl border border-border bg-bg-card p-4">
        <h3 className="font-[family-name:var(--font-display)] text-sm font-bold text-text-primary mb-2">
          {t('title')}
        </h3>
        <p className="text-[11px] text-text-muted">{t('noData')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {explanations.map((exp) => (
        <div key={exp.hazard_type} className="rounded-2xl border border-border bg-bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-[family-name:var(--font-display)] text-sm font-bold text-text-primary capitalize">
              {exp.hazard_type.replace('_', ' ')} — {t('title')}
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs font-[family-name:var(--font-mono)] text-text-secondary">
                {exp.predicted_score?.toFixed(1)}
              </span>
              {exp.confidence_lower != null && exp.confidence_upper != null && (
                <span className="text-[10px] text-text-muted font-[family-name:var(--font-mono)]">
                  [{exp.confidence_lower.toFixed(0)}-{exp.confidence_upper.toFixed(0)}]
                </span>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            {exp.top_features.map((f) => (
              <div key={f.feature} className="flex items-center gap-2">
                <span className="text-[10px] text-text-secondary font-[family-name:var(--font-sans)] w-36 shrink-0 truncate" title={f.description}>
                  {f.description}
                </span>
                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${HAZARD_COLORS[exp.hazard_type] || 'bg-accent-green/70'}`}
                    style={{ width: `${Math.min(100, f.contribution_pct)}%` }}
                  />
                </div>
                <span className="text-[10px] text-text-muted font-[family-name:var(--font-mono)] w-10 text-right">
                  {f.contribution_pct.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>

          {exp.generated_at && (
            <div className="mt-2 text-[9px] text-text-muted font-[family-name:var(--font-mono)]">
              {t('generatedAt')}: {new Date(exp.generated_at).toLocaleString()}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
