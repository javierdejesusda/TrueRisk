'use client';

import { useTranslations } from 'next-intl';
import { useAlerts } from '@/hooks/use-alerts';
import { useAemetAlerts } from '@/hooks/use-aemet-alerts';
import { aemetSeverityToNumeric } from '@/lib/geo-data';
import { Badge } from '@/components/ui/badge';
import { PanelShell } from './panel-shell';

function severityVariant(severity: number): 'neutral' | 'success' | 'warning' | 'danger' {
  if (severity >= 4) return 'danger';
  if (severity >= 3) return 'warning';
  if (severity >= 1) return 'success';
  return 'neutral';
}

const BellIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

export function AlertsPanel() {
  const t = useTranslations('Map');
  const { alerts, isLoading } = useAlerts();
  const { alerts: aemetAlerts } = useAemetAlerts();

  const totalCount = alerts.length + aemetAlerts.length;

  function severityLabel(severity: number): string {
    if (severity >= 5) return t('critical');
    if (severity >= 4) return t('veryHigh');
    if (severity >= 3) return t('high');
    if (severity >= 2) return t('moderate');
    if (severity >= 1) return t('low');
    return t('none');
  }

  const collapsedContent = (
    <div className="flex items-center gap-2">
      {totalCount > 0 ? (
        <>
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-red opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-red" />
          </span>
          <span className="text-xs text-text-primary font-[family-name:var(--font-mono)] font-bold">{totalCount} {t('active')}</span>
        </>
      ) : (
        <span className="text-xs text-accent-green font-[family-name:var(--font-sans)]">{t('allClear')}</span>
      )}
    </div>
  );

  return (
    <PanelShell
      title={t('panelActiveAlerts')}
      icon={BellIcon}
      collapsedContent={collapsedContent}
      defaultCollapsed
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
          <span className="text-xs text-accent-green font-medium font-[family-name:var(--font-sans)]">{t('allClear')} — {t('allClearDesc')}</span>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto scrollbar-hide">
          {/* TrueRisk alerts */}
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-start gap-2 rounded-lg bg-white/[0.03] p-2 border-l-[3px]"
              style={{ borderLeftColor: alert.severity >= 5 ? '#e51f1f' : alert.severity >= 4 ? '#EF4444' : alert.severity >= 3 ? '#F97316' : alert.severity >= 2 ? '#FBBF24' : '#84CC16' }}
            >
              <Badge variant={severityVariant(alert.severity)} size="sm">
                {severityLabel(alert.severity)}
              </Badge>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-text-primary truncate font-[family-name:var(--font-sans)]">{alert.title}</p>
                <p className="text-text-muted font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider">{alert.hazard_type}</p>
              </div>
            </div>
          ))}
          {/* AEMET alerts */}
          {aemetAlerts.map((alert) => {
            const numSev = aemetSeverityToNumeric(alert.severity);
            return (
              <div
                key={`aemet-${alert.identifier}-${alert.geocode}`}
                className="flex items-start gap-2 rounded-lg bg-white/[0.03] p-2 border-l-[3px]"
                style={{ borderLeftColor: numSev >= 5 ? '#e51f1f' : numSev >= 4 ? '#EF4444' : numSev >= 3 ? '#F97316' : numSev >= 2 ? '#FBBF24' : '#84CC16' }}
              >
                <Badge variant={severityVariant(numSev)} size="sm">
                  {severityLabel(numSev)}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-text-primary truncate font-[family-name:var(--font-sans)]">
                    {alert.headline || alert.event}
                  </p>
                  <p className="text-text-muted font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider">AEMET</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PanelShell>
  );
}
