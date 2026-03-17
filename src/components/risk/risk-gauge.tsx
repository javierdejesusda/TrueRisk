'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export interface RiskGaugeProps {
  score: number;
  severity: string;
  isLoading: boolean;
}

function getGaugeColor(score: number): string {
  if (score <= 20) return 'var(--color-severity-1)';
  if (score <= 40) return 'var(--color-severity-2)';
  if (score <= 60) return 'var(--color-severity-3)';
  if (score <= 80) return 'var(--color-severity-4)';
  return 'var(--color-severity-5)';
}

function getSeverityLabel(severity: string): string {
  const labels: Record<string, string> = {
    low: 'Low',
    moderate: 'Moderate',
    high: 'High',
    very_high: 'Very High',
    critical: 'Critical',
  };
  return labels[severity] ?? severity;
}

function getSeverityTextClass(severity: string): string {
  const classes: Record<string, string> = {
    low: 'text-severity-1',
    moderate: 'text-severity-2',
    high: 'text-severity-3',
    very_high: 'text-severity-4',
    critical: 'text-severity-5',
  };
  return classes[severity] ?? 'text-text-secondary';
}

export function RiskGauge({ score, severity, isLoading }: RiskGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Animate the score number
  useEffect(() => {
    if (!mounted || isLoading) return;

    const target = Math.round(score);
    const duration = 800;
    const startTime = performance.now();
    const startValue = animatedScore;

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (target - startValue) * eased);

      setAnimatedScore(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
    // Only re-run when score or mounted changes, not animatedScore
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score, mounted, isLoading]);

  if (isLoading) {
    return (
      <Card padding="md">
        <div className="flex flex-col items-center gap-4">
          <Skeleton width="120px" height="16px" />
          <Skeleton width="160px" height="80px" rounded="lg" />
          <Skeleton width="60px" height="20px" />
        </div>
      </Card>
    );
  }

  const color = getGaugeColor(score);
  const label = getSeverityLabel(severity);
  const textClass = getSeverityTextClass(severity);

  // SVG semicircle gauge
  const radius = 60;
  const strokeWidth = 12;
  const centerX = 80;
  const centerY = 70;

  // Arc from 180deg to 0deg (left to right, semicircle)
  const circumference = Math.PI * radius;
  const fillPercent = Math.min(score / 100, 1);
  const dashOffset = circumference * (1 - fillPercent);

  return (
    <Card padding="md">
      <div className="flex flex-col items-center gap-2">
        <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider">
          Risk Score
        </h3>

        <div className="relative">
          <svg width="160" height="90" viewBox="0 0 160 90">
            {/* Background arc */}
            <path
              d={`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`}
              fill="none"
              stroke="var(--color-border)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
            {/* Filled arc */}
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
              }}
            />
          </svg>

          {/* Score number overlay */}
          <div className="absolute inset-0 flex items-end justify-center pb-1">
            <span className="text-3xl font-bold text-text-primary tabular-nums">
              {animatedScore}
            </span>
          </div>
        </div>

        <span className={`text-sm font-semibold ${textClass}`}>
          {label}
        </span>

        {/* Screen reader accessible description */}
        <span className="sr-only">
          Risk score: {Math.round(score)} out of 100, {label}
        </span>
      </div>
    </Card>
  );
}
