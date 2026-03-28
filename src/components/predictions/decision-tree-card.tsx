'use client';

import { motion } from 'framer-motion';
import { ModelCard } from './model-card';
import { getConfidenceColor, SemiCircleGauge, EMERGENCY_LABELS, EMERGENCY_COLORS, type PredictionResponse } from './shared';

interface Props {
  data: PredictionResponse['decisionTree'];
}

export function DecisionTreeCard({ data }: Props) {
  const confidenceColor = getConfidenceColor(data.confidence);
  const confidencePct = data.confidence * 100;

  return (
    <ModelCard
      title="Emergency Classification"
      subtitle="Rule-based weather classifier"
      methodology="Evaluates current conditions against a decision tree of weather thresholds to classify the most likely emergency type and confidence level."
      confidence={data.confidence}
      index={5}
    >
      <div className="flex flex-col gap-4">
        {/* Classification header */}
        <div className="text-center">
          <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1 font-[family-name:var(--font-sans)]">Classification</p>
          <div className={`font-[family-name:var(--font-display)] text-2xl font-bold ${EMERGENCY_COLORS[data.type] ?? 'text-text-primary'}`}>
            {EMERGENCY_LABELS[data.type] ?? data.type}
          </div>
        </div>

        {/* Semi-circle gauge replaces confidence bar */}
        <SemiCircleGauge value={confidencePct} max={100} size={140} label="Confidence" />

        {/* Vertical flowchart of matched rules */}
        <div className="w-full">
          <p className="font-[family-name:var(--font-sans)] text-[10px] text-text-muted uppercase tracking-wider mb-2">Decision Path</p>
          <div className="relative">
            {data.matchedRules.map((rule, i) => {
              const isLast = i === data.matchedRules.length - 1;
              // Confidence gradient: earlier rules are lighter, last is strongest
              const ruleConfidence = ((i + 1) / data.matchedRules.length) * data.confidence;
              const borderColor = getConfidenceColor(ruleConfidence);

              return (
                <div key={i} className="relative">
                  {/* Connecting vertical line between rules */}
                  {i > 0 && (
                    <div className="ml-4 h-3 border-l-2 border-white/10" />
                  )}

                  {/* Rule card */}
                  <motion.div
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.3 }}
                    className="rounded-lg bg-white/[0.03] p-3 border-l-3"
                    style={{ borderLeftColor: borderColor }}
                  >
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-bg-secondary font-[family-name:var(--font-mono)] text-[9px] text-text-muted">
                        {i + 1}
                      </span>
                      <p className="font-[family-name:var(--font-sans)] text-xs text-text-secondary leading-relaxed">
                        {rule}
                      </p>
                    </div>
                  </motion.div>

                  {/* Connector to final node */}
                  {isLast && (
                    <>
                      <div className="ml-4 h-3 border-l-2 border-white/10" />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: (i + 1) * 0.1, duration: 0.3 }}
                        className="rounded-lg p-3 text-center"
                        style={{ backgroundColor: confidenceColor + '15', border: `1px solid ${confidenceColor}30` }}
                      >
                        <p className="text-[10px] text-text-muted uppercase tracking-wider mb-0.5 font-[family-name:var(--font-sans)]">Result</p>
                        <span
                          className="font-[family-name:var(--font-display)] text-sm font-bold"
                          style={{ color: confidenceColor }}
                        >
                          {EMERGENCY_LABELS[data.type] ?? data.type} ({confidencePct.toFixed(0)}%)
                        </span>
                      </motion.div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </ModelCard>
  );
}
