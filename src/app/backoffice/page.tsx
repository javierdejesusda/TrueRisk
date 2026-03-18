'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Modal } from '@/components/ui/modal';
import { CreateAlertForm } from '@/components/alerts/create-alert-form';

// ── Types ────────────────────────────────────────────────────────────────

interface DetectionResult {
  detected: boolean;
  suggestion?: {
    severity: number;
    type: string;
    title: string;
    description: string;
    riskScore: number;
  };
}

interface RiskData {
  score: number;
  severity: string;
  emergencyType: string;
}

interface WeatherData {
  temperature: number;
  humidity: number;
  precipitation: number;
  windSpeed: number | null;
  pressure: number | null;
}

interface Stats {
  activeAlerts: number;
  monitoredProvinces: number;
  totalConsultations: number;
}

// ── Component ────────────────────────────────────────────────────────────

export default function BackofficeDashboardPage() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [detection, setDetection] = useState<DetectionResult | null>(null);
  const [risk, setRisk] = useState<RiskData | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);

    const results = await Promise.allSettled([
      fetch('/api/weather/current/28').then((r) => r.ok ? r.json() : null),
      fetch('/api/alerts/detect').then((r) => r.ok ? r.json() : null),
      fetch('/api/risk/28').then((r) => r.ok ? r.json() : null),
      fetch('/api/alerts?active=true').then((r) => r.ok ? r.json() : null),
      fetch('/api/backoffice/stats').then((r) => r.ok ? r.json() : null),
    ]);

    // Weather
    if (results[0].status === 'fulfilled' && results[0].value) {
      const w = results[0].value;
      setWeather({
        temperature: w.temperature,
        humidity: w.humidity,
        precipitation: w.precipitation,
        windSpeed: w.wind_speed,
        pressure: w.pressure,
      });
    }

    // Detection
    if (results[1].status === 'fulfilled' && results[1].value) {
      setDetection(results[1].value);
    }

    // Risk
    if (results[2].status === 'fulfilled' && results[2].value) {
      const r = results[2].value;
      setRisk({
        score: r.composite_score,
        severity: r.severity,
        emergencyType: r.dominant_hazard,
      });
    }

    // Stats
    const alertData = results[3].status === 'fulfilled' ? results[3].value : null;
    const alertCount = Array.isArray(alertData) ? alertData.length : 0;
    const backofficeStats = results[4].status === 'fulfilled' ? results[4].value : null;

    setStats({
      activeAlerts: alertCount,
      monitoredProvinces: backofficeStats?.province_count ?? 52,
      totalConsultations: 0,
    });

    setIsLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetching data on mount is intentional
    fetchDashboardData();
  }, [fetchDashboardData]);

  const severityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'success' as const;
      case 'moderate':
        return 'info' as const;
      case 'high':
        return 'warning' as const;
      case 'very_high':
      case 'critical':
        return 'danger' as const;
      default:
        return 'neutral' as const;
    }
  };

  return (
    <motion.div
      className="mx-auto max-w-7xl space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          Admin Dashboard
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Overview of system status, alerts, and risk analysis
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card hoverable>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Active Alerts</p>
              {isLoading ? (
                <Skeleton width="48px" height="28px" className="mt-1" />
              ) : (
                <p className="mt-1 text-2xl font-bold text-accent-red">
                  {stats?.activeAlerts ?? 0}
                </p>
              )}
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-red/10 text-accent-red">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M10 2L2 17h16L10 2zM10 8v4M10 14h.01" />
              </svg>
            </div>
          </div>
        </Card>

        <Card hoverable>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Provinces Monitored</p>
              {isLoading ? (
                <Skeleton width="48px" height="28px" className="mt-1" />
              ) : (
                <p className="mt-1 text-2xl font-bold text-accent-blue">
                  {stats?.monitoredProvinces ?? 0}
                </p>
              )}
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-blue/10 text-accent-blue">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M3 6l5-3 4 3 5-3v11l-5 3-4-3-5 3V6z" />
                <path d="M8 3v11" />
                <path d="M12 6v11" />
              </svg>
            </div>
          </div>
        </Card>

        <Card hoverable>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Consultations</p>
              {isLoading ? (
                <Skeleton width="48px" height="28px" className="mt-1" />
              ) : (
                <p className="mt-1 text-2xl font-bold text-accent-green">
                  {stats?.totalConsultations ?? 0}
                </p>
              )}
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-green/10 text-accent-green">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <circle cx="10" cy="10" r="7" />
                <path d="M10 6v4l3 2" />
              </svg>
            </div>
          </div>
        </Card>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Weather overview */}
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-text-primary">
            Weather Overview
          </h2>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton height="20px" />
              <Skeleton height="20px" />
              <Skeleton height="20px" />
            </div>
          ) : weather ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-bg-primary p-3">
                <p className="text-xs text-text-muted">Temperature</p>
                <p className="text-lg font-semibold text-text-primary">
                  {weather.temperature.toFixed(1)}°C
                </p>
              </div>
              <div className="rounded-lg bg-bg-primary p-3">
                <p className="text-xs text-text-muted">Humidity</p>
                <p className="text-lg font-semibold text-text-primary">
                  {weather.humidity.toFixed(1)}%
                </p>
              </div>
              <div className="rounded-lg bg-bg-primary p-3">
                <p className="text-xs text-text-muted">Precipitation</p>
                <p className="text-lg font-semibold text-text-primary">
                  {weather.precipitation.toFixed(1)} mm
                </p>
              </div>
              <div className="rounded-lg bg-bg-primary p-3">
                <p className="text-xs text-text-muted">Wind Speed</p>
                <p className="text-lg font-semibold text-text-primary">
                  {weather.windSpeed?.toFixed(1) ?? 'N/A'} km/h
                </p>
              </div>
              {weather.pressure !== null && weather.pressure !== undefined && (
                <div className="col-span-2 rounded-lg bg-bg-primary p-3">
                  <p className="text-xs text-text-muted">Pressure</p>
                  <p className="text-lg font-semibold text-text-primary">
                    {weather.pressure.toFixed(1)} hPa
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-text-muted">
              Unable to load weather data
            </p>
          )}
        </Card>

        {/* Alert detection */}
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-text-primary">
            Alert Detection
          </h2>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton height="60px" />
              <Skeleton height="20px" />
            </div>
          ) : detection?.detected && detection.suggestion ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg border border-accent-red/30 bg-accent-red/10 p-4">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-red opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-accent-red" />
                </span>
                <div>
                  <p className="font-semibold text-accent-red">
                    Alert Suggested
                  </p>
                  <p className="text-sm text-text-secondary">
                    Risk score:{' '}
                    {detection.suggestion.riskScore.toFixed(1)}/100
                  </p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-text-secondary">
                  <span className="font-medium text-text-primary">Type:</span>{' '}
                  {detection.suggestion.type}
                </p>
                <p className="text-text-secondary">
                  <span className="font-medium text-text-primary">
                    Severity:
                  </span>{' '}
                  {detection.suggestion.severity}/5
                </p>
                <p className="text-text-secondary line-clamp-2">
                  {detection.suggestion.description}
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => setShowCreateForm(true)}
              >
                Create Alert
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-lg border border-accent-green/30 bg-accent-green/10 p-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-green/20 text-accent-green">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M13 4L6 11 3 8" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-accent-green">All Clear</p>
                <p className="text-sm text-text-secondary">
                  No significant risk detected
                </p>
              </div>
            </div>
          )}
        </Card>

        {/* Risk Score */}
        <Card className="lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-text-primary">
            Current Risk Assessment
          </h2>
          {isLoading ? (
            <div className="flex items-center gap-6">
              <Skeleton width="80px" height="80px" rounded="full" />
              <div className="flex-1 space-y-2">
                <Skeleton height="20px" />
                <Skeleton height="16px" />
              </div>
            </div>
          ) : risk ? (
            <div className="flex flex-col items-center gap-6 sm:flex-row">
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-border bg-bg-primary">
                <span className="text-3xl font-bold text-text-primary">
                  {risk.score.toFixed(0)}
                </span>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-text-secondary">
                    Severity:
                  </span>
                  <Badge variant={severityColor(risk.severity)}>
                    {risk.severity.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-text-secondary">
                    Emergency Type:
                  </span>
                  <span className="text-sm text-text-primary">
                    {risk.emergencyType.replace('_', ' ')}
                  </span>
                </div>
                {/* Risk bar */}
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-bg-primary">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(risk.score, 100)}%`,
                      backgroundColor:
                        risk.score > 80
                          ? 'var(--color-accent-red)'
                          : risk.score > 60
                            ? 'var(--color-accent-yellow)'
                            : risk.score > 40
                              ? 'var(--color-accent-blue)'
                              : 'var(--color-accent-green)',
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-text-muted">
              Unable to compute risk score
            </p>
          )}
        </Card>
      </div>

      {/* Create alert modal (pre-filled from detection) */}
      <Modal
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        title="Create Alert"
      >
        <CreateAlertForm
          defaultValues={
            detection?.suggestion
              ? {
                  severity: detection.suggestion.severity,
                  hazard_type: detection.suggestion.type,
                  title: detection.suggestion.title,
                  description: detection.suggestion.description,
                }
              : undefined
          }
          onSuccess={() => {
            setShowCreateForm(false);
            fetchDashboardData();
          }}
          onCancel={() => setShowCreateForm(false)}
        />
      </Modal>
    </motion.div>
  );
}
