'use client';

import { useOfflineStatus } from '@/hooks/use-offline-status';

export function OfflineIndicator() {
  const { isOffline, lastSyncedAt } = useOfflineStatus();

  if (!isOffline) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div className="glass-heavy rounded-xl border border-accent-orange/30 px-4 py-2 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-accent-orange animate-pulse" />
        <span className="text-[10px] text-accent-orange">
          Sin conexion
          {lastSyncedAt && ` — datos de ${new Date(lastSyncedAt).toLocaleTimeString('es-ES')}`}
        </span>
      </div>
    </div>
  );
}
