'use client';

import { Card } from '@/components/ui/card';

export function PredictionsExplainer() {
  return (
    <Card variant="glass" className="mt-6 mb-2">
      <div className="flex flex-col gap-3">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">How Predictions Work</h2>
          <p className="text-xs text-text-secondary mt-1 leading-relaxed">
            TrueRisk combines multiple machine learning models to assess natural disaster risk across Spain.
            Each model is trained on historical weather data, satellite observations, and documented disaster events.
            Predictions update in real-time as new weather data arrives.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-lg bg-bg-secondary/50 p-3">
            <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Statistical Models</p>
            <p className="text-xs text-text-secondary leading-relaxed">
              Gumbel extreme-value analysis, linear regression trends, Bayesian risk classification,
              exponential moving averages, Z-score anomaly detection, and K-nearest neighbor historical matching.
            </p>
          </div>
          <div className="rounded-lg bg-bg-secondary/50 p-3">
            <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Hazard ML Models</p>
            <p className="text-xs text-text-secondary leading-relaxed">
              Trained classifiers for each hazard type: XGBoost for floods and heatwaves,
              RF+LightGBM ensemble for wildfires using the Canadian FWI system,
              and LSTM neural networks for drought trajectory prediction.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
