'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface ScoreGaugeProps {
  score: number;
  isLoading: boolean;
  label?: string;
  size?: 'sm' | 'lg';
}

function getScoreColor(score: number): string {
  if (score <= 30) return '#ef4444';
  if (score <= 60) return '#f59e0b';
  return '#22c55e';
}

function getScoreLabel(score: number): string {
  if (score <= 20) return 'Very Low';
  if (score <= 40) return 'Low';
  if (score <= 60) return 'Moderate';
  if (score <= 80) return 'Good';
  return 'Excellent';
}

export function ScoreGauge({ score: rawScore, isLoading, label, size = 'lg' }: ScoreGaugeProps) {
  const score = Math.min(rawScore, 100);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted || isLoading) return;

    const target = Math.round(score);
    const duration = 800;
    const startTime = performance.now();
    const startValue = animatedScore;

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (target - startValue) * eased);
      setAnimatedScore(current);
      if (progress < 1) requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score, mounted, isLoading]);

  if (isLoading) {
    return (
      <Card variant="glass" padding="md">
        <div className="flex flex-col items-center gap-4">
          <Skeleton width="120px" height="16px" />
          <Skeleton width="160px" height="80px" rounded="lg" />
        </div>
      </Card>
    );
  }

  const isSmall = size === 'sm';
  const radius = isSmall ? 40 : 60;
  const strokeWidth = isSmall ? 8 : 12;
  const svgWidth = isSmall ? 100 : 160;
  const svgHeight = isSmall ? 60 : 90;
  const centerX = svgWidth / 2;
  const centerY = isSmall ? 50 : 70;

  const circumference = Math.PI * radius;
  const fillPercent = score / 100;
  const dashOffset = circumference * (1 - fillPercent);
  const color = getScoreColor(score);
  const scoreLabel = getScoreLabel(score);

  return (
    <Card variant="glass" padding="md">
      <div className="flex flex-col items-center gap-2">
        {label && (
          <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider">
            {label}
          </h3>
        )}

        <div className="relative">
          <svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
            <path
              d={`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`}
              fill="none"
              stroke="var(--color-border)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
            <path
              d={`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{
                transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.3s ease',
                filter: `drop-shadow(0 0 6px ${color}40)`,
              }}
            />
          </svg>

          <div className="absolute inset-0 flex items-end justify-center pb-1">
            <span className={`${isSmall ? 'text-xl' : 'text-3xl'} font-bold text-text-primary tabular-nums`}>
              {animatedScore}
            </span>
          </div>
        </div>

        <span
          className="text-sm font-semibold"
          style={{ color }}
        >
          {scoreLabel}
        </span>
      </div>
    </Card>
  );
}
