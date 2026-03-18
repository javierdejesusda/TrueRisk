'use client';

import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WeatherCard } from '@/components/weather/weather-card';
import { RiskGauge } from '@/components/risk/risk-gauge';
import { AlertBanner } from '@/components/alerts/alert-banner';
import { HazardBreakdown } from '@/components/risk/hazard-breakdown';
import { useWeather } from '@/hooks/use-weather';
import { useRiskScore } from '@/hooks/use-risk-score';
import { useAppStore } from '@/store/app-store';
import type { Alert } from '@/types/alert';

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
  const provinceCode = useAppStore((s) => s.provinceCode);
  const alerts = useAppStore((s) => s.alerts) as Alert[];
  const { weather, isLoading: weatherLoading } = useWeather();
  const { risk, isLoading: riskLoading } = useRiskScore();
  const [dismissedAlertId, setDismissedAlertId] = useState<number | null>(null);

  const activeAlert = alerts.find(
    (a) => a.is_active && a.id !== dismissedAlertId
  ) ?? null;

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
          Multi-hazard risk monitoring
        </p>
      </div>

      {/* Active alert banner */}
      <AlertBanner
        alert={activeAlert}
        onDismiss={handleDismissAlert}
      />

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
          <WeatherCard weather={weather} isLoading={weatherLoading} province={provinceCode} />
        </motion.div>

        {/* Risk Gauge */}
        <motion.div
          variants={staggerItem}
          initial="hidden"
          animate="visible"
          custom={1}
        >
          <RiskGauge
            score={risk?.composite_score ?? 0}
            severity={risk?.severity ?? 'low'}
            isLoading={riskLoading}
          />
        </motion.div>

        {/* Hazard Breakdown -- full width */}
        <motion.div
          className="md:col-span-2 lg:col-span-3"
          variants={staggerItem}
          initial="hidden"
          animate="visible"
          custom={2}
        >
          <HazardBreakdown risk={risk} isLoading={riskLoading} />
        </motion.div>

        {/* Active Alerts summary */}
        <motion.div
          variants={staggerItem}
          initial="hidden"
          animate="visible"
          custom={3}
        >
          <Card padding="md">
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider">
                Active Alerts
              </h3>
              {alerts.length === 0 ? (
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

        {/* Dominant Hazard Detail */}
        <motion.div
          variants={staggerItem}
          initial="hidden"
          animate="visible"
          custom={4}
        >
          <Card padding="md">
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider">
                Dominant Hazard
              </h3>
              {risk ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg capitalize font-semibold text-text-primary">
                      {risk.dominant_hazard}
                    </span>
                    <Badge severity={risk.severity === 'critical' ? 5 : risk.severity === 'very_high' ? 4 : risk.severity === 'high' ? 3 : risk.severity === 'moderate' ? 2 : 1} size="sm">
                      {risk.severity.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-sm text-text-secondary">
                    Score: {risk[`${risk.dominant_hazard}_score` as keyof typeof risk]}/100
                  </p>
                </div>
              ) : (
                <p className="text-sm text-text-muted py-2">
                  Loading hazard analysis...
                </p>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          variants={staggerItem}
          initial="hidden"
          animate="visible"
          custom={5}
        >
          <Card padding="md">
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider">
                Risk Summary
              </h3>
              {risk ? (
                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Composite</span>
                    <span className="text-text-primary font-medium">{risk.composite_score.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Flood</span>
                    <span className="text-text-primary">{risk.flood_score.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Wildfire</span>
                    <span className="text-text-primary">{risk.wildfire_score.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Drought</span>
                    <span className="text-text-primary">{risk.drought_score.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Heatwave</span>
                    <span className="text-text-primary">{risk.heatwave_score.toFixed(1)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-text-muted py-2">No data available</p>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
