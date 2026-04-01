'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useAppStore } from '@/store/app-store';
import { Select } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { PROVINCES } from '@/lib/provinces';
import { useWeatherHistory } from '@/hooks/use-weather-history';
import { DateRangeBar, type DateRange } from '@/components/history/date-range-bar';
import { HistoryChart } from '@/components/history/history-chart';
import { Skeleton } from '@/components/ui/skeleton';

const provinceOptions = PROVINCES
  .map((p) => ({ value: p.code, label: p.name }))
  .sort((a, b) => a.label.localeCompare(b.label));

export default function HistoryPage() {
  const t = useTranslations('History');
  const provinceCode = useAppStore((s) => s.provinceCode);
  const setProvinceCode = useAppStore((s) => s.setProvinceCode);
  const [range, setRange] = useState<DateRange>(7);

  const { data, isLoading, error } = useWeatherHistory(provinceCode, range);

  const stats = useMemo(() => {
    if (!data.length) return null;

    const temps = data.map((r) => r.temperature);
    const precips = data.map((r) => r.precipitation);
    const winds = data.map((r) => r.wind_speed).filter((w): w is number => w !== null);

    return {
      avgTemp: temps.reduce((a, b) => a + b, 0) / temps.length,
      totalPrecip: precips.reduce((a, b) => a + b, 0),
      maxWind: winds.length > 0 ? Math.max(...winds) : null,
    };
  }, [data]);

  const provinceName = PROVINCES.find(p => p.code === provinceCode)?.name ?? provinceCode;

  return (
    <motion.div
      className="h-full pt-20 px-6 overflow-y-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="max-w-5xl mx-auto pb-12">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold text-text-primary">
              {t('title')}
            </h1>
            <p className="font-[family-name:var(--font-sans)] mt-1 text-sm text-text-muted">
              {t('subtitle', { province: provinceName })}
            </p>
          </div>
          <div className="flex items-end gap-3">
            <DateRangeBar selectedRange={range} onRangeChange={setRange} />
            <div className="w-48">
              <Select
                label={t('province')}
                options={provinceOptions}
                value={provinceCode}
                onChange={(e) => setProvinceCode(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Chart */}
        <Card variant="glass" className="mb-6">
          <h2 className="font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-wider text-text-secondary mb-4">
            {t('chartTitle')}
          </h2>
          {isLoading ? (
            <Skeleton width="100%" height="280px" rounded="lg" />
          ) : error ? (
            <div className="flex items-center justify-center h-[280px]">
              <p className="text-sm text-accent-red">{error}</p>
            </div>
          ) : data.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[280px] gap-2">
              <p className="text-sm text-text-muted">{t('noData')}</p>
            </div>
          ) : (
            <HistoryChart data={data} />
          )}
        </Card>

        {/* Summary stats */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} variant="glass">
                <Skeleton width="60%" height="12px" className="mb-2" />
                <Skeleton width="40%" height="24px" />
              </Card>
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card variant="glass">
              <p className="font-[family-name:var(--font-sans)] text-[10px] uppercase tracking-wider text-text-muted mb-1">
                {t('avgTemp')}
              </p>
              <p className="font-[family-name:var(--font-mono)] text-2xl font-bold text-accent-blue">
                {stats.avgTemp.toFixed(1)}°C
              </p>
            </Card>
            <Card variant="glass">
              <p className="font-[family-name:var(--font-sans)] text-[10px] uppercase tracking-wider text-text-muted mb-1">
                {t('totalPrecip')}
              </p>
              <p className="font-[family-name:var(--font-mono)] text-2xl font-bold text-[#14B8A6]">
                {stats.totalPrecip.toFixed(1)} mm
              </p>
            </Card>
            <Card variant="glass">
              <p className="font-[family-name:var(--font-sans)] text-[10px] uppercase tracking-wider text-text-muted mb-1">
                {t('maxWind')}
              </p>
              <p className="font-[family-name:var(--font-mono)] text-2xl font-bold text-text-primary">
                {stats.maxWind !== null ? `${stats.maxWind.toFixed(1)} km/h` : '—'}
              </p>
            </Card>
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}
