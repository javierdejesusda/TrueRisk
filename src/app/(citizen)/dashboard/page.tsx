'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WeatherCard } from '@/components/weather/weather-card';
import { RiskGauge } from '@/components/risk/risk-gauge';
import { AlertBanner } from '@/components/alerts/alert-banner';
import { RecommendationCard } from '@/components/recommendations/recommendation-card';
import { useWeather } from '@/hooks/use-weather';
import { useRiskScore } from '@/hooks/use-risk-score';
import { useAppStore } from '@/store/app-store';
import type { Alert } from '@/types/alert';
import type { ApiResponse } from '@/types/api';

const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      ease: 'easeOut' as const,
    },
  }),
};

export default function DashboardPage() {
  const user = useAppStore((s) => s.user);
  const alerts = useAppStore((s) => s.alerts) as Alert[];
  const { weather, isLoading: weatherLoading } = useWeather();
  const { risk, isLoading: riskLoading } = useRiskScore();
  const alertsLoading = false; // alerts come from layout's useAlerts via store
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [recLoading, setRecLoading] = useState(false);
  const [dismissedAlertId, setDismissedAlertId] = useState<number | null>(null);

  const activeAlert = alerts.find(
    (a) => a.isActive && a.id !== dismissedAlertId
  ) ?? null;

  const requestRecommendation = useCallback(async () => {
    if (!user) return;

    setRecLoading(true);
    try {
      const res = await fetch('/api/llm/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      const json = (await res.json()) as ApiResponse<{ recommendation: string }>;

      if (json.success && json.data) {
        setRecommendation(json.data.recommendation);
      }
    } catch {
      // Silently fail -- recommendation is optional
    } finally {
      setRecLoading(false);
    }
  }, [user]);

  const handleDismissAlert = useCallback(() => {
    if (activeAlert) {
      setDismissedAlertId(activeAlert.id);
    }
  }, [activeAlert]);

  return (
    <div className="flex flex-col gap-6">
      {/* Page heading */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">Dashboard</h1>
        <p className="text-sm text-text-muted mt-1">
          Real-time climate monitoring
        </p>
      </div>

      {/* Active alert banner */}
      {!alertsLoading && (
        <AlertBanner
          alert={activeAlert}
          onDismiss={handleDismissAlert}
          onGetAdvice={requestRecommendation}
        />
      )}

      {/* Bento grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Weather -- spans 2 cols on lg */}
        <motion.div
          className="md:col-span-2 lg:col-span-2"
          variants={staggerItem}
          initial="hidden"
          animate="visible"
          custom={0}
        >
          <WeatherCard weather={weather} isLoading={weatherLoading} province={user?.province} />
        </motion.div>

        {/* Risk Gauge */}
        <motion.div
          variants={staggerItem}
          initial="hidden"
          animate="visible"
          custom={1}
        >
          <RiskGauge
            score={risk?.score ?? 0}
            severity={risk?.severity ?? 'low'}
            isLoading={riskLoading}
          />
        </motion.div>

        {/* Active Alerts summary */}
        <motion.div
          variants={staggerItem}
          initial="hidden"
          animate="visible"
          custom={2}
        >
          <Card padding="md">
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider">
                Active Alerts
              </h3>
              {alertsLoading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-accent-primary" />
                </div>
              ) : alerts.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-4">
                  <span className="text-2xl">&#x2713;</span>
                  <p className="text-sm text-text-muted text-center">
                    No active alerts
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {alerts.slice(0, 3).map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-center justify-between gap-2 rounded-lg bg-bg-secondary p-2.5"
                    >
                      <span className="text-sm text-text-primary truncate">
                        {alert.title}
                      </span>
                      <Badge severity={alert.severity} size="sm">
                        Sev {alert.severity}
                      </Badge>
                    </div>
                  ))}
                  {alerts.length > 3 && (
                    <p className="text-xs text-text-muted text-center pt-1">
                      +{alerts.length - 3} more
                    </p>
                  )}
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* LLM Recommendation */}
        <motion.div
          variants={staggerItem}
          initial="hidden"
          animate="visible"
          custom={3}
        >
          <RecommendationCard
            recommendation={recommendation}
            riskScore={risk?.score ?? null}
            isLoading={recLoading}
            onRequest={requestRecommendation}
          />
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          variants={staggerItem}
          initial="hidden"
          animate="visible"
          custom={4}
        >
          <Card padding="md">
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider">
                Recent Activity
              </h3>
              <div className="flex flex-col gap-2.5">
                {risk?.anomalies && risk.anomalies.length > 0 ? (
                  risk.anomalies.slice(0, 4).map((anomaly, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-sm"
                    >
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-yellow" />
                      <span className="text-text-secondary">{anomaly}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-text-muted py-2">
                    No recent anomalies detected
                  </p>
                )}
                {risk?.trend && (
                  <div className="mt-1 flex items-center gap-2 border-t border-border pt-2">
                    <span className="text-xs text-text-muted">Trend:</span>
                    <span className="text-xs text-text-secondary">{risk.trend}</span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </motion.div>

      </div>
    </div>
  );
}
