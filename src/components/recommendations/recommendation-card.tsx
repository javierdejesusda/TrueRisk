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

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const segments = text.split(/(\*\*[^*]+\*\*)/g);
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (seg.startsWith('**') && seg.endsWith('**')) {
      parts.push(
        <strong key={`${keyPrefix}-${i}`} className="font-semibold text-text-primary">
          {seg.slice(2, -2)}
        </strong>,
      );
    } else if (seg) {
      parts.push(seg);
    }
  }
  return parts;
}

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Headers: ###, ##, #
    const headerMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      const content = headerMatch[2];
      const cls =
        level === 1
          ? 'text-base font-bold text-text-primary'
          : level === 2
            ? 'text-sm font-bold text-text-primary'
            : 'text-sm font-semibold text-text-primary';
      elements.push(
        <p key={i} className={`${cls} mt-1.5`}>
          {renderInline(content, `h-${i}`)}
        </p>,
      );
      continue;
    }

    // Unordered list: - or *
    const ulMatch = line.match(/^[\s]*[-*]\s+(.+)$/);
    if (ulMatch) {
      elements.push(
        <div key={i} className="flex items-start gap-2 pl-1">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-green/60" />
          <span>{renderInline(ulMatch[1], `li-${i}`)}</span>
        </div>,
      );
      continue;
    }

    // Numbered list: 1. 2. etc.
    const olMatch = line.match(/^[\s]*(\d+)[.)]\s+(.+)$/);
    if (olMatch) {
      elements.push(
        <div key={i} className="flex items-start gap-2 pl-1">
          <span className="shrink-0 text-xs font-semibold text-accent-green mt-0.5">
            {olMatch[1]}.
          </span>
          <span>{renderInline(olMatch[2], `ol-${i}`)}</span>
        </div>,
      );
      continue;
    }

    // Empty line -> small spacer
    if (line.trim() === '') {
      elements.push(<div key={i} className="h-1" />);
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={i}>{renderInline(line, `p-${i}`)}</p>,
    );
  }

  return elements;
}

function RecommendationContent({ recommendation }: { recommendation: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = recommendation.length > 280;

  return (
    <div className="flex flex-col gap-1.5">
      <div
        className={[
          'flex flex-col gap-0.5 text-sm text-text-secondary leading-relaxed',
          !expanded && isLong ? 'max-h-32 overflow-hidden' : '',
        ].join(' ')}
      >
        {renderMarkdown(recommendation)}
      </div>
      {isLong && !expanded && (
        <div className="h-6 -mt-6 bg-gradient-to-t from-bg-card to-transparent pointer-events-none" />
      )}
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
