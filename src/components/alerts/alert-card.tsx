'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { AlertSeverity } from '@/types/alert';

export interface AlertCardProps {
  alert: {
    id: number;
    severity: number;
    type: string;
    province: string | null;
    title: string;
    description: string;
    isActive: boolean;
    createdAt: string;
  };
  onGetAdvice?: (alertId: number) => void;
  adviceLoading?: boolean;
  advice?: string | null;
}

function getSeverityBorderClass(severity: number): string {
  const classes: Record<number, string> = {
    1: 'border-l-severity-1',
    2: 'border-l-severity-2',
    3: 'border-l-severity-3',
    4: 'border-l-severity-4',
    5: 'border-l-severity-5',
  };
  return classes[severity] ?? 'border-l-border';
}

function getSeverityLabel(severity: number): string {
  const labels: Record<number, string> = {
    1: 'Low',
    2: 'Moderate',
    3: 'High',
    4: 'Very High',
    5: 'Critical',
  };
  return labels[severity] ?? 'Unknown';
}

function formatType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function AlertCard({ alert, onGetAdvice, adviceLoading, advice }: AlertCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <Card
        padding="none"
        hoverable
        className={[
          'border-l-4 transition-all duration-200',
          getSeverityBorderClass(alert.severity),
        ].join(' ')}
      >
        <div className="p-5">
          {/* Top row: severity + type + province */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge severity={alert.severity as AlertSeverity} size="sm">
              {getSeverityLabel(alert.severity)}
            </Badge>
            <Badge variant="neutral" size="sm">
              {formatType(alert.type)}
            </Badge>
            {alert.province && (
              <span className="text-xs text-text-muted">{alert.province}</span>
            )}
          </div>

          {/* Title */}
          <h3 className="mb-1.5 text-base font-semibold text-text-primary">
            {alert.title}
          </h3>

          {/* Description */}
          <p className="mb-3 text-sm leading-relaxed text-text-secondary">
            {alert.description}
          </p>

          {/* Footer: timestamp + action */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-text-muted">
              {formatRelativeTime(alert.createdAt)}
            </span>
            {onGetAdvice && (
              <Button
                variant="outline"
                size="sm"
                loading={adviceLoading}
                onClick={() => onGetAdvice(alert.id)}
              >
                Get Personal Advice
              </Button>
            )}
          </div>
        </div>

        {/* Expandable advice section */}
        {advice && (
          <div className="border-t border-border">
            <button
              type="button"
              className="flex w-full cursor-pointer items-center justify-between px-5 py-3 text-left"
              onClick={() => setExpanded(!expanded)}
            >
              <span className="text-sm font-medium text-accent-green">
                Personal Recommendation
              </span>
              <span className="text-xs text-text-muted">
                {expanded ? '\u25B2' : '\u25BC'}
              </span>
            </button>
            {expanded && (
              <div className="px-5 pb-4">
                <p className="text-sm leading-relaxed text-text-primary whitespace-pre-wrap">
                  {advice}
                </p>
              </div>
            )}
          </div>
        )}
      </Card>
    </motion.div>
  );
}
