'use client';

import { Badge } from '@/components/ui/badge';
import type { ProvinceAlertSummary } from '@/hooks/use-map-alerts';

export interface MapPopupProps {
  provinceName: string;
  summary: ProvinceAlertSummary;
}

function severityLabel(severity: number): string {
  if (severity >= 5) return 'Critical';
  if (severity >= 4) return 'Very High';
  if (severity >= 3) return 'High';
  if (severity >= 2) return 'Moderate';
  if (severity >= 1) return 'Low';
  return 'None';
}

function severityVariant(severity: number): 'neutral' | 'success' | 'warning' | 'danger' {
  if (severity >= 4) return 'danger';
  if (severity >= 3) return 'warning';
  if (severity >= 1) return 'success';
  return 'neutral';
}

export function MapPopup({ provinceName, summary }: MapPopupProps) {
  return (
    <div className="p-3 max-w-[300px]">
      <div className="flex items-center justify-between gap-2 mb-2">
        <h3 className="text-sm font-semibold text-text-primary truncate">{provinceName}</h3>
        {summary.alertCount > 0 && (
          <Badge variant={severityVariant(summary.maxSeverity)}>
            {summary.alertCount} alert{summary.alertCount !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {summary.alerts.length === 0 ? (
        <p className="text-xs text-text-muted">No active alerts</p>
      ) : (
        <div className="flex flex-col gap-1.5 max-h-[200px] overflow-y-auto">
          {summary.alerts.map((alert, i) => (
            <div
              key={i}
              className="flex items-start gap-2 rounded-lg bg-bg-card p-2"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-text-primary truncate">
                  {alert.title}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] text-text-muted">{alert.type}</span>
                  <span className="text-[10px] text-text-muted">·</span>
                  <span className="text-[10px] text-text-muted capitalize">{alert.source}</span>
                </div>
              </div>
              <span
                className="text-[10px] font-medium shrink-0 mt-0.5"
                style={{
                  color:
                    alert.severity >= 4 ? '#ef4444' :
                    alert.severity >= 3 ? '#f97316' :
                    alert.severity >= 2 ? '#fbbf24' :
                    '#34d399',
                }}
              >
                {severityLabel(alert.severity)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
