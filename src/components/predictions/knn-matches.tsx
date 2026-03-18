'use client';

import { Badge } from '@/components/ui/badge';
import { ModelCard } from './model-card';
import type { PredictionResponse } from './shared';

interface Props {
  data: PredictionResponse['knn'];
}

export function KnnMatches({ data }: Props) {
  return (
    <ModelCard
      title="Historical Pattern Matching (KNN)"
      subtitle="Nearest historical weather events by Euclidean distance"
      methodology="Finds the most similar historical weather patterns and shows what happened next, ranked by similarity distance. Lower distance means a closer match to current conditions."
      className="md:col-span-2 lg:col-span-2"
      index={6}
    >
      <div className="space-y-2.5">
        {data.map((event, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-lg bg-bg-secondary p-3 transition-colors hover:bg-bg-secondary/80"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-sm font-bold text-amber-400">
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-text-primary">{event.event}</span>
                <Badge variant="neutral" size="sm">{event.year}</Badge>
              </div>
              <p className="mt-0.5 text-xs text-text-muted line-clamp-1">{event.outcome}</p>
            </div>
            <div className="flex flex-col items-end shrink-0">
              <span className="text-[10px] text-text-muted">Distance</span>
              <div className="mt-0.5 flex items-center gap-2">
                <div className="h-1.5 w-16 rounded-full bg-bg-primary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-400 transition-all duration-700"
                    style={{ width: `${Math.max(5, (1 - event.distance) * 100)}%` }}
                  />
                </div>
                <span className="text-xs font-medium tabular-nums text-amber-400">{event.distance.toFixed(3)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ModelCard>
  );
}
