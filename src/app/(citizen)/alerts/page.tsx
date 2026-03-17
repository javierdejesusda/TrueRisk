'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCard } from '@/components/alerts/alert-card';
import { useAuth } from '@/hooks/use-auth';
import type { ApiResponse } from '@/types/api';

interface AlertData {
  id: number;
  severity: number;
  type: string;
  province: string | null;
  title: string;
  description: string;
  isActive: boolean;
  createdAt: string;
}

export default function AlertsPage() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [adviceLoadingId, setAdviceLoadingId] = useState<number | null>(null);
  const [adviceMap, setAdviceMap] = useState<Record<number, string>>({});

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch('/api/alerts?active=true');
      const json = (await res.json()) as ApiResponse<AlertData[]>;

      if (json.success && json.data) {
        setAlerts(json.data);
      }
    } catch {
      // Silently handle -- empty list is shown
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleGetAdvice = useCallback(
    async (alertId: number) => {
      if (!user || adviceLoadingId !== null) return;

      setAdviceLoadingId(alertId);
      try {
        const res = await fetch('/api/llm/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, disaster: true }),
        });

        const json = (await res.json()) as ApiResponse<{
          recommendation: string;
        }>;

        if (json.success && json.data) {
          setAdviceMap((prev) => ({
            ...prev,
            [alertId]: json.data!.recommendation,
          }));
        }
      } catch {
        // Silently handle
      } finally {
        setAdviceLoadingId(null);
      }
    },
    [user, adviceLoadingId],
  );

  return (
    <motion.div
      className="flex flex-col gap-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Active Alerts</h1>
        <p className="mt-1 text-sm text-text-muted">
          Current climate emergency alerts in your area
        </p>
      </div>

      {/* Loading skeletons */}
      {isLoading && (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} padding="md">
              <div className="flex flex-col gap-3">
                <div className="flex gap-2">
                  <Skeleton width="80px" height="22px" rounded="full" />
                  <Skeleton width="100px" height="22px" rounded="full" />
                </div>
                <Skeleton width="60%" height="20px" />
                <Skeleton width="100%" height="14px" />
                <Skeleton width="85%" height="14px" />
                <div className="flex items-center justify-between pt-1">
                  <Skeleton width="100px" height="14px" />
                  <Skeleton width="140px" height="32px" rounded="lg" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* No alerts message */}
      {!isLoading && alerts.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border bg-bg-card py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-green/10">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-accent-green"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-text-primary">
              No Active Alerts
            </h3>
            <p className="mt-1 text-sm text-text-muted">
              There are currently no active climate alerts. Stay safe!
            </p>
          </div>
        </div>
      )}

      {/* Alert cards */}
      {!isLoading && alerts.length > 0 && (
        <div className="flex flex-col gap-4">
          {alerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onGetAdvice={handleGetAdvice}
              adviceLoading={adviceLoadingId === alert.id}
              advice={adviceMap[alert.id] ?? null}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
