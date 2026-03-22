'use client';

import Link from 'next/link';
import { useOfflineStatus } from '@/hooks/use-offline-status';
import { useTranslations } from 'next-intl';

export function OfflineIndicator() {
  const { isOffline, lastSyncedAt } = useOfflineStatus();
  const t = useTranslations('Offline');

  if (!isOffline) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div className="glass-heavy rounded-xl border border-accent-orange/30 px-4 py-2 flex items-center gap-3">
        <span className="h-2 w-2 rounded-full bg-accent-orange animate-pulse" />
        <span className="text-[10px] text-accent-orange">
          {t('noConnection')}
          {lastSyncedAt &&
            ` — ${t('dataFrom')} ${new Date(lastSyncedAt).toLocaleTimeString('es-ES')}`}
        </span>
        <Link
          href="/emergency"
          className="text-[10px] font-medium text-white bg-accent-orange/20 hover:bg-accent-orange/30 px-2 py-0.5 rounded-lg transition-colors"
        >
          {t('viewEmergencyData')}
        </Link>
      </div>
    </div>
  );
}
