'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';

const STAGES = [
  {
    label: 'Data Sources',
    items: ['Open-Meteo API', 'AEMET CAP', 'IGN Seismic'],
    color: '#3b82f6',
  },
  {
    label: 'Feature Engineering',
    items: ['23 flood features', '20 wildfire features', '18 heatwave features', '6 LSTM features', '8 seismic features', '14 coldwave features', '14 windstorm features'],
    color: '#8b5cf6',
  },
  {
    label: '7 ML Models',
    items: ['XGBoost (flood)', 'RF+LightGBM (wildfire)', 'SPEI+LSTM (drought)', 'XGBoost (heatwave)', 'Rule-based (seismic)', 'Rule-based (coldwave)', 'Rule-based (windstorm)'],
    color: '#22c55e',
  },
  {
    label: 'Composite Score',
    items: ['Dominant hazard weighting', 'Province-specific factors', 'Severity classification'],
    color: '#f97316',
  },
];

function Arrow() {
  return (
    <div className="flex items-center justify-center py-1 md:py-0 md:px-1">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="rotate-90 md:rotate-0">
        <path d="M4 10h12M12 6l4 4-4 4" stroke="var(--color-text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export function PipelineDiagram() {
  return (
    <div className="mt-8">
      <h2 className="font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-[0.15em] text-text-secondary mb-4 border-l-2 border-accent-green pl-3">
        ML Pipeline
      </h2>
      <Card>
        <div className="p-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-1">
            {STAGES.map((stage, i) => (
              <div key={stage.label} className="contents">
                <motion.div
                  className="flex-1 min-w-0"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.15, duration: 0.4 }}
                >
                  <div className="rounded-lg border border-border p-3 h-full" style={{ borderColor: `${stage.color}30` }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: stage.color }} />
                      <p
                        className="font-[family-name:var(--font-display)] text-[11px] font-bold uppercase tracking-wider"
                        style={{ color: stage.color }}
                      >
                        {stage.label}
                      </p>
                    </div>
                    <ul className="space-y-0.5">
                      {stage.items.map((item) => (
                        <li key={item} className="font-[family-name:var(--font-mono)] text-[9px] text-text-muted">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
                {i < STAGES.length - 1 && <Arrow />}
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
