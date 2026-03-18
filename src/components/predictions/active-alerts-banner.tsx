'use client';

import { useAlerts } from '@/hooks/use-alerts';
import { useAemetAlerts } from '@/hooks/use-aemet-alerts';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export function ActiveAlertsBanner() {
  const { alerts } = useAlerts();
  const { alerts: aemetAlerts } = useAemetAlerts();
  const totalCount = alerts.length + aemetAlerts.length;

  return (
    <Card variant="glass" className="mt-6">
      <div className="flex items-center gap-3">
        {totalCount > 0 ? (
          <>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-red opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent-red" />
              </span>
              <span className="text-sm font-medium text-text-primary">
                {totalCount} Active Alert{totalCount !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex flex-1 gap-2 overflow-x-auto">
              {alerts.map((a) => (
                <Badge key={a.id} variant={a.severity >= 4 ? 'danger' : a.severity >= 3 ? 'warning' : 'info'} size="sm">
                  {a.title}
                </Badge>
              ))}
              {aemetAlerts.map((a, i) => (
                <Badge
                  key={`aemet-${i}`}
                  variant={a.severity === 'red' ? 'danger' : a.severity === 'orange' ? 'warning' : 'info'}
                  size="sm"
                >
                  {a.headline || a.event}
                </Badge>
              ))}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span className="text-sm text-accent-green font-medium">No active alerts</span>
          </div>
        )}
      </div>
    </Card>
  );
}
