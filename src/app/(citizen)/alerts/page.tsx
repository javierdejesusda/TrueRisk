'use client';

import { motion } from 'framer-motion';
import { useAlerts } from '@/hooks/use-alerts';
import { useAemetAlerts } from '@/hooks/use-aemet-alerts';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

function severityLabel(severity: number): string {
  if (severity >= 5) return 'Critical';
  if (severity >= 4) return 'Very High';
  if (severity >= 3) return 'High';
  if (severity >= 2) return 'Moderate';
  if (severity >= 1) return 'Low';
  return 'None';
}

function severityVariant(severity: number): 'danger' | 'warning' | 'success' | 'neutral' {
  if (severity >= 4) return 'danger';
  if (severity >= 3) return 'warning';
  if (severity >= 1) return 'success';
  return 'neutral';
}

function formatTime(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('es-ES', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function AlertsPage() {
  const { alerts, isLoading } = useAlerts();
  const { alerts: aemetAlerts, isLoading: aemetLoading } = useAemetAlerts();

  const totalCount = alerts.length + aemetAlerts.length;

  return (
    <motion.div
      className="h-screen pt-20 px-6 lg:px-12 pb-12 max-w-5xl mx-auto overflow-y-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Active Alerts</h1>
          <p className="mt-1 text-sm text-text-muted">
            Real-time weather and risk alerts from TrueRisk and AEMET
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          {totalCount > 0 ? (
            <>
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-red opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent-red" />
              </span>
              <span className="font-medium">{totalCount} active</span>
            </>
          ) : (
            <span className="text-accent-green font-medium">All clear</span>
          )}
        </div>
      </div>

      {(isLoading || aemetLoading) ? (
        <div className="mt-8 flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-bg-secondary animate-pulse" />
          ))}
        </div>
      ) : totalCount === 0 ? (
        <Card variant="glass" className="mt-8">
          <div className="flex flex-col items-center gap-3 py-8">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-green)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <p className="text-sm text-text-secondary">No active alerts at this time</p>
            <p className="text-xs text-text-muted">Alerts from TrueRisk and AEMET will appear here when active</p>
          </div>
        </Card>
      ) : (
        <div className="mt-8 flex flex-col gap-3">
          {alerts.length > 0 && (
            <div>
              <h2 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">TrueRisk Alerts</h2>
              <div className="flex flex-col gap-2">
                {alerts.map((alert) => (
                  <Card key={alert.id} variant="glass" hoverable>
                    <div className="flex items-start gap-3">
                      <Badge variant={severityVariant(alert.severity)} size="sm">
                        {severityLabel(alert.severity)}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary">{alert.title}</p>
                        <p className="text-xs text-text-secondary mt-1 line-clamp-2">{alert.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-text-muted">
                          <span className="capitalize">{alert.hazard_type}</span>
                          {alert.province_code && <span>Province {alert.province_code}</span>}
                          <span>Onset: {formatTime(alert.onset)}</span>
                          <span>Expires: {formatTime(alert.expires)}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {aemetAlerts.length > 0 && (
            <div className={alerts.length > 0 ? 'mt-4' : ''}>
              <h2 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">AEMET Alerts</h2>
              <div className="flex flex-col gap-2">
                {aemetAlerts.map((alert, i) => (
                  <Card key={`aemet-${i}`} variant="glass" hoverable>
                    <div className="flex items-start gap-3">
                      <Badge
                        variant={
                          alert.severity === 'red' ? 'danger' :
                          alert.severity === 'orange' ? 'warning' :
                          'info'
                        }
                        size="sm"
                      >
                        {alert.severity}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary">{alert.headline || alert.event}</p>
                        <p className="text-xs text-text-secondary mt-1 line-clamp-2">{alert.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-text-muted">
                          <span>{alert.event}</span>
                          <span>{alert.area_desc}</span>
                          <span>Onset: {formatTime(alert.onset)}</span>
                          <span>Expires: {formatTime(alert.expires)}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
