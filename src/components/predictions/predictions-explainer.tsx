'use client';

import { Card } from '@/components/ui/card';

export function PredictionsExplainer() {
  return (
    <Card variant="glass" className="mt-6 mb-2">
      <div className="flex flex-col gap-3">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-sm font-semibold text-text-primary">How Predictions Work</h2>
          <p className="font-[family-name:var(--font-sans)] text-xs text-text-secondary mt-1 leading-relaxed">
            TrueRisk combines multiple machine learning models to assess natural disaster risk across Spain.
            Each model is trained on historical weather data, satellite observations, and documented disaster events.
            Predictions update in real-time as new weather data arrives.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl bg-white/[0.03] p-3">
            <p className="font-[family-name:var(--font-display)] text-[10px] text-text-muted uppercase tracking-wider mb-1">Statistical Models</p>
            <p className="font-[family-name:var(--font-sans)] text-xs text-text-secondary leading-relaxed">
              <span className="font-[family-name:var(--font-mono)]">Gumbel</span> extreme-value analysis, linear regression trends, Bayesian risk classification,
              exponential moving averages, <span className="font-[family-name:var(--font-mono)]">Z-score</span> anomaly detection, and <span className="font-[family-name:var(--font-mono)]">K-nearest neighbor</span> historical matching.
            </p>
          </div>
          <div className="rounded-xl bg-white/[0.03] p-3">
            <p className="font-[family-name:var(--font-display)] text-[10px] text-text-muted uppercase tracking-wider mb-1">Hazard ML Models</p>
            <p className="font-[family-name:var(--font-sans)] text-xs text-text-secondary leading-relaxed">
              Trained classifiers for each hazard type: <span className="font-[family-name:var(--font-mono)]">XGBoost</span> for floods and heatwaves,
              <span className="font-[family-name:var(--font-mono)]"> RF+LightGBM</span> ensemble for wildfires using the Canadian FWI system,
              and <span className="font-[family-name:var(--font-mono)]">LSTM</span> neural networks for drought trajectory prediction.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
