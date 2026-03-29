'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAlerts } from '@/hooks/use-alerts';
import { useAemetAlerts } from '@/hooks/use-aemet-alerts';
import { aemetSeverityToNumeric } from '@/lib/geo-data';
import type { Alert } from '@/types/alert';
import type { AemetCapAlert, AemetSeverity } from '@/types/aemet';

interface UnifiedAlert {
  id: string;
  title: string;
  severity: number;
  badgeVariant: 'success' | 'info' | 'warning' | 'danger' | 'neutral';
  badgeLabel: string;
  source: string;
  time: string;
}

function severityVariant(severity: number): 'success' | 'info' | 'warning' | 'danger' {
  if (severity >= 4) return 'danger';
  if (severity >= 3) return 'warning';
  if (severity >= 2) return 'info';
  return 'success';
}

function formatRelativeTime(iso: string | null): string {
  if (!iso) return '';
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `${days}d`;
  } catch {
    return '';
  }
}

function unifyAlerts(
  alerts: Alert[],
  aemetAlerts: AemetCapAlert[],
  t: (key: string) => string,
): UnifiedAlert[] {
  const unified: UnifiedAlert[] = [];

  for (const a of alerts) {
    unified.push({
      id: `tr-${a.id}`,
      title: a.title,
      severity: a.severity,
      badgeVariant: severityVariant(a.severity),
      badgeLabel: severityLabel(a.severity, t),
      source: 'TrueRisk',
      time: formatRelativeTime(a.onset ?? a.created_at),
    });
  }

  for (const a of aemetAlerts) {
    const sev = aemetSeverityToNumeric(a.severity as AemetSeverity);
    unified.push({
      id: `aemet-${a.identifier}-${a.geocode}`,
      title: a.headline || a.event,
      severity: sev,
      badgeVariant: severityVariant(sev),
      badgeLabel: a.severity.toUpperCase(),
      source: 'AEMET',
      time: formatRelativeTime(a.onset),
    });
  }

  // Sort by severity desc, take top 5
  unified.sort((a, b) => b.severity - a.severity);
  return unified.slice(0, 5);
}

function severityLabel(severity: number, t: (key: string) => string): string {
  if (severity >= 5) return t('critical');
  if (severity >= 4) return t('veryHigh');
  if (severity >= 3) return t('high');
  if (severity >= 2) return t('moderate');
  return t('low');
}

export function AlertFeed() {
  const t = useTranslations('Dashboard');
  const ta = useTranslations('Alerts');
  const { alerts, isLoading } = useAlerts();
  const { alerts: aemetAlerts, isLoading: aemetLoading } = useAemetAlerts();

  const loading = isLoading || aemetLoading;

  if (loading) {
    return (
      <Card variant="glass" padding="md" className="h-full">
        <Skeleton height="20px" width="120px" className="mb-4" />
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height="48px" />
          ))}
        </div>
      </Card>
    );
  }

  const unified = unifyAlerts(alerts, aemetAlerts, ta);

  return (
    <Card variant="glass" padding="md" className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-[family-name:var(--font-display)] text-[11px] font-bold uppercase tracking-[0.15em] text-text-muted">
          {t('activeAlerts')}
        </h2>
        {unified.length > 0 && (
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-red opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-red" />
          </span>
        )}
      </div>

      {unified.length === 0 ? (
        <div className="flex flex-col items-center py-6 gap-2">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-green)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <p className="font-[family-name:var(--font-sans)] text-sm text-accent-green">{t('noAlerts')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2" aria-live="polite" aria-atomic="false">
          {unified.map((alert) => (
            <div
              key={alert.id}
              className="flex items-center gap-3 rounded-lg bg-bg-secondary/50 px-3 py-2.5"
            >
              <Badge variant={alert.badgeVariant} size="sm">
                {alert.badgeLabel}
              </Badge>
              <div className="flex-1 min-w-0">
                <p className="font-[family-name:var(--font-sans)] text-xs font-medium text-text-primary truncate">
                  {alert.title}
                </p>
                <p className="font-[family-name:var(--font-mono)] text-[10px] text-text-muted" suppressHydrationWarning>
                  {alert.source} {alert.time && `· ${alert.time}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Link
        href="/alerts"
        className="mt-auto pt-4 block text-center font-[family-name:var(--font-sans)] text-xs font-medium text-accent-blue hover:text-accent-blue/80 transition-colors"
      >
        {t('viewAll')} &rarr;
      </Link>
    </Card>
  );
}
