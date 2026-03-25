'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useAppStore } from '@/store/app-store';
import { Select } from '@/components/ui/select';
import { PROVINCES } from '@/lib/provinces';
import { RiskOverview } from '@/components/dashboard/risk-overview';
import { WeatherCard } from '@/components/dashboard/weather-card';
import { AlertFeed } from '@/components/dashboard/alert-feed';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { Walkthrough } from '@/components/ui/walkthrough';
import { PersonalizedSuggestions } from '@/components/dashboard/personalized-suggestions';
import { PreparednessWidget } from '@/components/dashboard/preparedness-widget';
import { DataQualityPanel } from '@/components/dashboard/data-quality-panel';
import { RiskNarrative } from '@/components/dashboard/risk-narrative';
import { DanaWarningBanner } from '@/components/alerts/dana-warning-banner';

const provinceOptions = PROVINCES
  .map((p) => ({ value: p.code, label: p.name }))
  .sort((a, b) => a.label.localeCompare(b.label));

export default function DashboardPage() {
  const t = useTranslations('Dashboard');
  const provinceCode = useAppStore((s) => s.provinceCode);
  const setProvinceCode = useAppStore((s) => s.setProvinceCode);

  return (
    <motion.div
      className="h-screen pt-20 px-6 lg:px-12 pb-12 max-w-6xl mx-auto overflow-y-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold text-text-primary">
            {t('title')}
          </h1>
          <p className="font-[family-name:var(--font-sans)] mt-1 text-sm text-text-muted">
            {t('subtitle')}
          </p>
        </div>
        <div className="w-full sm:w-56" data-tour="province-select">
          <Select
            label={t('province')}
            options={provinceOptions}
            value={provinceCode}
            onChange={(e) => setProvinceCode(e.target.value)}
          />
        </div>
      </div>

      {/* DANA early warning banner (shows when DANA score >= 60) */}
      <div className="mb-4">
        <DanaWarningBanner />
      </div>

      {/* AI morning briefing */}
      <div className="mb-4">
        <RiskNarrative />
      </div>

      {/* Bento grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pb-8">
        {/* Left column: Risk overview (spans 2 rows on desktop) */}
        <div className="lg:row-span-2" data-tour="risk-overview">
          <RiskOverview />
        </div>

        {/* Top right: Weather */}
        <div data-tour="weather-card">
          <WeatherCard />
        </div>

        {/* Top far right: Alerts */}
        <div data-tour="alert-feed">
          <AlertFeed />
        </div>

        {/* Bottom spanning 1 column: Quick actions + data quality */}
        <div>
          <QuickActions />
        </div>
        <div>
          <DataQualityPanel />
        </div>

        {/* Full width: Preparedness widget */}
        <div className="lg:col-span-3">
          <PreparednessWidget />
        </div>

        {/* Full width: Personalized suggestions */}
        <div className="lg:col-span-3">
          <PersonalizedSuggestions />
        </div>
      </div>
      <Walkthrough />
    </motion.div>
  );
}
