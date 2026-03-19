'use client';

import { useAlerts } from '@/hooks/use-alerts';
import { useAemetAlerts } from '@/hooks/use-aemet-alerts';
import { Badge } from '@/components/ui/badge';
import { PanelShell } from './panel-shell';

function severityVariant(severity: number): 'neutral' | 'success' | 'warning' | 'danger' {
  if (severity >= 4) return 'danger';
  if (severity >= 3) return 'warning';
  if (severity >= 1) return 'success';
  return 'neutral';
}

function severityLabel(severity: number): string {
  if (severity >= 5) return 'Critical';
  if (severity >= 4) return 'Very High';
  if (severity >= 3) return 'High';
  if (severity >= 2) return 'Moderate';
  if (severity >= 1) return 'Low';
  return 'None';
}

const BellIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

export function AlertsPanel() {
  const { alerts, isLoading } = useAlerts();
  const { alerts: aemetAlerts } = useAemetAlerts();

  const totalCount = alerts.length + aemetAlerts.length;

  const collapsedContent = (
    <div className="flex items-center gap-2">
      {totalCount > 0 ? (
        <>
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-red opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-red" />
          </span>
          <span className="text-xs text-text-primary font-medium">{totalCount} active</span>
        </>
      ) : (
        <span className="text-xs text-accent-green">All clear</span>
      )}
    </div>
  );

  return (
    <PanelShell
      title="Active Alerts"
      icon={BellIcon}
      position="top-40 right-4"
      collapsedContent={collapsedContent}
    >
      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-8 rounded bg-bg-secondary animate-pulse" />
          ))}
        </div>
      ) : totalCount === 0 ? (
        <div className="flex items-center gap-2 py-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <span className="text-xs text-accent-green font-medium">All clear — no active alerts</span>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
          {/* TrueRisk alerts */}
          {alerts.map((alert) => (
            <div key={alert.id} className="flex items-start gap-2 rounded-lg bg-bg-secondary/50 p-2">
              <Badge variant={severityVariant(alert.severity)} size="sm">
                {severityLabel(alert.severity)}
              </Badge>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-text-primary truncate">{alert.title}</p>
                <p className="text-[9px] text-text-muted capitalize">{alert.hazard_type}</p>
              </div>
            </div>
          ))}
          {/* AEMET alerts */}
          {aemetAlerts.map((alert, i) => (
            <div key={`aemet-${i}`} className="flex items-start gap-2 rounded-lg bg-bg-secondary/50 p-2">
              <Badge
                variant={
                  alert.severity === 'red' ? 'danger' :
                  alert.severity === 'orange' ? 'warning' :
                  alert.severity === 'yellow' ? 'warning' :
                  'success'
                }
                size="sm"
              >
                {alert.severity}
              </Badge>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-text-primary truncate">
                  {alert.headline || alert.event}
                </p>
                <p className="text-[9px] text-text-muted">AEMET</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </PanelShell>
  );
}
