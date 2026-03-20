'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { AlertSeverity } from '@/types/alert';

export interface AlertCardProps {
  alert: {
    id: number;
    severity: number;
    hazard_type: string;
    province_code: string | null;
    title: string;
    description: string;
    is_active: boolean;
    created_at: string;
  };
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

export function AlertCard({ alert }: AlertCardProps) {
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
          'glass rounded-xl border-l-4 transition-all duration-200',
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
              <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider">
                {formatType(alert.hazard_type)}
              </span>
            </Badge>
            {alert.province_code && (
              <span className="font-[family-name:var(--font-mono)] text-xs text-text-muted">{alert.province_code}</span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-[family-name:var(--font-sans)] mb-1.5 text-sm font-semibold text-text-primary">
            {alert.title}
          </h3>

          {/* Description */}
          <p className="font-[family-name:var(--font-sans)] mb-3 text-sm leading-relaxed text-text-secondary">
            {alert.description}
          </p>

          {/* Footer: timestamp */}
          <div className="flex items-center gap-3">
            <span className="font-[family-name:var(--font-mono)] text-[10px] text-text-muted">
              {formatRelativeTime(alert.created_at)}
            </span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
