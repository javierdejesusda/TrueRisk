'use client';

import { motion } from 'framer-motion';
import { ModelCard } from './model-card';
import { getConfidenceColor, EMERGENCY_LABELS, EMERGENCY_COLORS, type PredictionResponse } from './shared';

interface Props {
  data: PredictionResponse['decisionTree'];
}

export function DecisionTreeCard({ data }: Props) {
  return (
    <ModelCard
      title="Emergency Classification"
      subtitle="Rules-based decision tree"
      methodology="Evaluates current conditions against a decision tree of weather thresholds to classify the most likely emergency type and confidence level."
      confidence={data.confidence}
      index={5}
    >
      <div className="flex flex-col items-center gap-4">
        <div className={`text-2xl font-bold ${EMERGENCY_COLORS[data.type] ?? 'text-text-primary'}`}>
          {EMERGENCY_LABELS[data.type] ?? data.type}
        </div>

        {/* Confidence bar */}
        <div className="w-full">
          <div className="flex justify-between text-xs text-text-muted mb-1.5">
            <span>Confidence</span>
            <span className="font-medium text-text-secondary">
              {(data.confidence * 100).toFixed(0)}%
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-bg-secondary overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${data.confidence * 100}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              style={{ backgroundColor: getConfidenceColor(data.confidence) }}
            />
          </div>
        </div>

        {/* Matched rules */}
        <div className="w-full space-y-1.5">
          <p className="text-[10px] text-text-muted uppercase tracking-wider">Matched Rules</p>
          {data.matchedRules.map((rule, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-text-muted">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-green/50" />
              <span>{rule}</span>
            </div>
          ))}
        </div>
      </div>
    </ModelCard>
  );
}
