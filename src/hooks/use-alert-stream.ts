'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store/app-store';
import { showToast } from '@/components/ui/toast';
import type { Alert } from '@/types/alert';

const RECONNECT_DELAY = 5_000;

export function useAlertStream() {
  const setAlerts = useAppStore((s) => s.setAlerts);
  const currentAlerts = useAppStore((s) => s.alerts);
  const alertsRef = useRef(currentAlerts);

  useEffect(() => {
    alertsRef.current = currentAlerts;
  }, [currentAlerts]);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let unmounted = false;

    function connect() {
      if (unmounted) return;

      eventSource = new EventSource('/api/alerts/stream');

      eventSource.onmessage = (event: MessageEvent) => {
        try {
          const newAlerts: Alert[] = JSON.parse(event.data);
          const existingIds = new Set(alertsRef.current.map((a) => a.id));
          const unique = newAlerts.filter((a) => !existingIds.has(a.id));

          if (unique.length > 0) {
            setAlerts([...unique, ...alertsRef.current]);
            for (const alert of unique) {
              showToast({
                title: alert.title,
                severity: alert.severity,
                description: alert.description,
              });
            }
          }
        } catch {
          // Ignore parse errors (heartbeats, etc.)
        }
      };

      eventSource.onerror = () => {
        eventSource?.close();
        eventSource = null;
        if (!unmounted) {
          reconnectTimer = setTimeout(connect, RECONNECT_DELAY);
        }
      };
    }

    connect();

    return () => {
      unmounted = true;
      eventSource?.close();
      if (reconnectTimer !== null) clearTimeout(reconnectTimer);
    };
  }, [setAlerts]);
}
