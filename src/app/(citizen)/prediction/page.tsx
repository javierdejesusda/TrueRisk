'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/app-store';
import { PredictionHeader } from '@/components/predictions/prediction-header';
import { GumbelChart } from '@/components/predictions/gumbel-chart';
import { RegressionChart } from '@/components/predictions/regression-chart';
import { BayesianChart } from '@/components/predictions/bayesian-chart';
import { EmaChart } from '@/components/predictions/ema-chart';
import { ZScoreChart } from '@/components/predictions/zscore-chart';
import { DecisionTreeCard } from '@/components/predictions/decision-tree-card';
import { KnnMatches } from '@/components/predictions/knn-matches';
import { LoadingSkeleton, type PredictionResponse } from '@/components/predictions/shared';

export default function PredictionPage() {
  const provinceCode = useAppStore((s) => s.provinceCode);
  const [data, setData] = useState<PredictionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/analysis/predictions?province=${provinceCode}`)
      .then((res) => res.json().then((json) => ({ ok: res.ok, json })))
      .then(({ ok, json }) => {
        if (ok) {
          setData(json);
          setError(null);
        } else {
          setError(json.detail ?? 'Failed to load predictions');
        }
      })
      .catch(() => setError('Failed to load predictions'))
      .finally(() => setIsLoading(false));
  }, [provinceCode]);

  if (isLoading) return <LoadingSkeleton />;

  if (error || !data) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-red/10">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-red)" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
        </div>
        <p className="text-sm text-text-muted">{error ?? 'No prediction data available'}</p>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen pt-20 px-6 lg:px-12 pb-12 max-w-7xl mx-auto overflow-y-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <PredictionHeader current={data.current} />

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <GumbelChart data={data.gumbel} />
        <RegressionChart data={data.regression} />
        <BayesianChart data={data.bayesian} />
        <EmaChart data={data.ema} />
        <ZScoreChart data={data.zScore} />
        <DecisionTreeCard data={data.decisionTree} />
        <KnnMatches data={data.knn} />
      </div>
    </motion.div>
  );
}
