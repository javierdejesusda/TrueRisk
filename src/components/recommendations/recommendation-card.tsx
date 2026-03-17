'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RecommendationSkeleton } from './recommendation-skeleton';
import type { AlertSeverity } from '@/types/alert';

export interface RecommendationCardProps {
  recommendation: string | null;
  riskScore: number | null;
  isLoading: boolean;
  onRequest: () => void;
}

function getRiskSeverityLevel(score: number): AlertSeverity {
  if (score <= 20) return 1;
  if (score <= 40) return 2;
  if (score <= 60) return 3;
  if (score <= 80) return 4;
  return 5;
}

function getRiskLabel(score: number): string {
  if (score <= 20) return 'Low';
  if (score <= 40) return 'Moderate';
  if (score <= 60) return 'High';
  if (score <= 80) return 'Very High';
  return 'Critical';
}

function RecommendationContent({ recommendation }: { recommendation: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = recommendation.length > 280;

  return (
    <div className="flex flex-col gap-1.5">
      <div
        className={[
          'text-sm text-text-secondary whitespace-pre-line leading-relaxed',
          !expanded && isLong ? 'line-clamp-5' : '',
        ].join(' ')}
      >
        {recommendation}
      </div>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="cursor-pointer self-start text-xs font-medium text-accent-green hover:underline"
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
      <p className="text-xs text-text-muted">
        Generated {new Date().toLocaleTimeString()}
      </p>
    </div>
  );
}

export function RecommendationCard({
  recommendation,
  riskScore,
  isLoading,
  onRequest,
}: RecommendationCardProps) {
  if (isLoading) {
    return (
      <Card padding="md">
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider">
            Personalized Recommendation
          </h3>
          <RecommendationSkeleton />
        </div>
      </Card>
    );
  }

  return (
    <Card padding="md">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider">
            Personalized Recommendation
          </h3>
          {riskScore !== null && (
            <Badge severity={getRiskSeverityLevel(riskScore)} size="sm">
              {getRiskLabel(riskScore)} Risk
            </Badge>
          )}
        </div>

        {recommendation ? (
          <RecommendationContent recommendation={recommendation} />
        ) : (
          <div className="flex flex-col items-center gap-3 py-4">
            <p className="text-sm text-text-muted text-center">
              Get AI-powered recommendations based on your risk profile and current conditions.
            </p>
            <Button variant="outline" size="sm" onClick={onRequest}>
              Get Personalized Advice
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
