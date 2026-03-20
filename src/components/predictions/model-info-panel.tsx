'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { StatBox } from './shared';

interface ModelMetrics {
  accuracy: number;
  f1_score: number;
  auc_roc: number | null;
}

interface ModelInfo {
  id: string;
  name: string;
  method: string;
  description: string;
  feature_count: number;
  features: string[];
  architecture: string;
  metrics: ModelMetrics;
}

interface ModelRegistryResponse {
  models: ModelInfo[];
  total: number;
}

export function ModelInfoPanel() {
  const [registry, setRegistry] = useState<ModelRegistryResponse | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/risk/models')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setRegistry(data); })
      .catch(() => {});
  }, []);

  if (!registry) return null;

  return (
    <div className="mt-8">
      <h2 className="font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-[0.15em] text-text-secondary mb-4 border-l-2 border-accent-green pl-3">
        Model Registry ({registry.total} models)
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {registry.models.map((model, i) => (
          <motion.div
            key={model.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
          >
            <div
              className="cursor-pointer"
              onClick={() => setExpanded(expanded === model.id ? null : model.id)}
            >
            <Card className="transition-colors hover:border-accent-green/40">
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-[family-name:var(--font-display)] text-xs font-bold text-text-primary">
                    {model.name}
                  </h3>
                  <span className="font-[family-name:var(--font-mono)] text-[10px] px-1.5 py-0.5 rounded bg-accent-green/10 text-accent-green">
                    {model.method}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5 mb-2">
                  <StatBox label="Accuracy" value={`${(model.metrics.accuracy * 100).toFixed(0)}%`} />
                  <StatBox label="F1 Score" value={`${(model.metrics.f1_score * 100).toFixed(0)}%`} />
                  <StatBox
                    label="AUC-ROC"
                    value={model.metrics.auc_roc ? `${(model.metrics.auc_roc * 100).toFixed(0)}%` : 'N/A'}
                  />
                </div>

                <p className="font-[family-name:var(--font-mono)] text-[10px] text-text-muted">
                  {model.feature_count} features
                </p>

                <AnimatePresence>
                  {expanded === model.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2 pt-2 border-t border-border">
                        <p className="font-[family-name:var(--font-sans)] text-[10px] text-text-muted uppercase tracking-wider mb-1">Architecture</p>
                        <p className="font-[family-name:var(--font-sans)] text-[11px] text-text-secondary mb-2">{model.architecture}</p>

                        <p className="font-[family-name:var(--font-sans)] text-[10px] text-text-muted uppercase tracking-wider mb-1">Features</p>
                        <div className="flex flex-wrap gap-1">
                          {model.features.map((f) => (
                            <span
                              key={f}
                              className="font-[family-name:var(--font-mono)] text-[9px] px-1 py-0.5 rounded bg-bg-secondary text-text-muted"
                            >
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Card>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
