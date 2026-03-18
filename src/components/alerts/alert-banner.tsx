'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Alert, AlertSeverity } from '@/types/alert';

export interface AlertBannerProps {
  alert: Alert | null;
  onDismiss: () => void;
}

function getSeverityBorderClass(severity: AlertSeverity): string {
  const classes: Record<number, string> = {
    1: 'border-severity-1',
    2: 'border-severity-2',
    3: 'border-severity-3',
    4: 'border-severity-4',
    5: 'border-severity-5',
  };
  return classes[severity] ?? 'border-border';
}

function getSeverityBgClass(severity: AlertSeverity): string {
  const classes: Record<number, string> = {
    1: 'bg-severity-1/5',
    2: 'bg-severity-2/5',
    3: 'bg-severity-3/5',
    4: 'bg-severity-4/5',
    5: 'bg-severity-5/5',
  };
  return classes[severity] ?? 'bg-bg-card';
}

function formatType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function AlertBanner({ alert, onDismiss }: AlertBannerProps) {
  return (
    <AnimatePresence>
      {alert && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="overflow-hidden"
        >
          <div
            role="alert"
            aria-live="polite"
            className={[
              'rounded-xl border-2 p-4',
              getSeverityBorderClass(alert.severity),
              getSeverityBgClass(alert.severity),
              'animate-pulse-border',
            ].join(' ')}
            style={{
              animation: 'pulse-border 2s ease-in-out infinite',
            }}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-semibold text-text-primary">
                    {alert.title}
                  </h3>
                  <Badge severity={alert.severity} size="sm" pulse>
                    {formatType(alert.hazard_type)}
                  </Badge>
                </div>
                <p className="text-sm text-text-secondary line-clamp-2">
                  {alert.description}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDismiss}
                  aria-label="Dismiss alert"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M4 4l8 8M12 4l-8 8" />
                  </svg>
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
