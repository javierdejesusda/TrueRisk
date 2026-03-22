'use client';

import { motion } from 'framer-motion';
import { useAlerts } from '@/hooks/use-alerts';
import { useAemetAlerts } from '@/hooks/use-aemet-alerts';
import { useAlertPreferences } from '@/hooks/use-alert-preferences';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { AlertExplanationToggle } from '@/components/alerts/alert-explanation';
import { useTranslations } from 'next-intl';

type TranslateFn = (key: string) => string;

function severityLabel(severity: number, t: TranslateFn): string {
  if (severity >= 5) return t('critical');
  if (severity >= 4) return t('veryHigh');
  if (severity >= 3) return t('high');
  if (severity >= 2) return t('moderate');
  if (severity >= 1) return t('low');
  return t('none');
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
  const t = useTranslations('Alerts');
  const { alerts, isLoading } = useAlerts();
  const { alerts: aemetAlerts, isLoading: aemetLoading } = useAemetAlerts();
  const { explainAlert } = useAlertPreferences();

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
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold text-text-primary">{t('title')}</h1>
          <p className="font-[family-name:var(--font-sans)] mt-1 text-sm text-text-muted">
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
              <span className="font-[family-name:var(--font-mono)] font-bold">{totalCount} {t('activeAlerts').toLowerCase()}</span>
            </>
          ) : (
            <span className="font-[family-name:var(--font-display)] text-lg text-accent-green font-medium">{t('noAlerts')}</span>
          )}
        </div>
      </div>

      {(isLoading || aemetLoading) ? (
        <div className="mt-8 flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-bg-secondary animate-[shimmer_1.5s_infinite]" />
          ))}
        </div>
      ) : totalCount === 0 ? (
        <Card variant="glass" className="mt-8">
          <div className="flex flex-col items-center gap-3 py-8">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-green)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <p className="font-[family-name:var(--font-display)] text-lg text-accent-green">{t('noAlerts')}</p>
            <p className="font-[family-name:var(--font-sans)] text-xs text-text-muted">{t('noAlertsDesc')}</p>
          </div>
        </Card>
      ) : (
        <div className="mt-8 flex flex-col gap-3">
          {alerts.length > 0 && (
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-[11px] font-bold uppercase tracking-[0.15em] text-text-muted border-l-2 border-accent-green pl-3 mb-3">TrueRisk Alerts</h2>
              <div className="flex flex-col gap-2">
                {alerts.map((alert) => (
                  <Card key={alert.id} variant="glass" hoverable>
                    <div className="flex items-start gap-3">
                      <Badge variant={severityVariant(alert.severity)} size="sm">
                        {severityLabel(alert.severity, t)}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="font-[family-name:var(--font-sans)] text-sm font-semibold text-text-primary">{alert.title}</p>
                        <p className="font-[family-name:var(--font-sans)] text-xs text-text-secondary mt-1 line-clamp-2">{alert.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-text-muted">
                          <span className="font-[family-name:var(--font-mono)] uppercase tracking-wider capitalize">{alert.hazard_type}</span>
                          {alert.province_code && <span className="font-[family-name:var(--font-mono)]">Province {alert.province_code}</span>}
                          <span className="font-[family-name:var(--font-mono)]">Onset: {formatTime(alert.onset)}</span>
                          <span className="font-[family-name:var(--font-mono)]">Expires: {formatTime(alert.expires)}</span>
                        </div>
                        <AlertExplanationToggle alertId={alert.id} onExplain={explainAlert} />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {aemetAlerts.length > 0 && (
            <div className={alerts.length > 0 ? 'mt-4' : ''}>
              <h2 className="font-[family-name:var(--font-display)] text-[11px] font-bold uppercase tracking-[0.15em] text-text-muted border-l-2 border-accent-green pl-3 mb-3">AEMET Alerts</h2>
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
                        <p className="font-[family-name:var(--font-sans)] text-sm font-semibold text-text-primary">{alert.headline || alert.event}</p>
                        <p className="font-[family-name:var(--font-sans)] text-xs text-text-secondary mt-1 line-clamp-2">{alert.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-text-muted">
                          <span className="font-[family-name:var(--font-mono)] uppercase tracking-wider">{alert.event}</span>
                          <span className="font-[family-name:var(--font-mono)]">{alert.area_desc}</span>
                          <span className="font-[family-name:var(--font-mono)]">Onset: {formatTime(alert.onset)}</span>
                          <span className="font-[family-name:var(--font-mono)]">Expires: {formatTime(alert.expires)}</span>
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
