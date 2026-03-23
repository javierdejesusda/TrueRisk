'use client';

import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { usePropertyReport } from '@/hooks/use-property-report';
import { Skeleton } from '@/components/ui/skeleton';
import { PropertyRiskSummary } from '@/components/property/property-risk-summary';
import { HazardBreakdown } from '@/components/property/hazard-breakdown';
import { FloodZoneCard } from '@/components/property/flood-zone-card';
import { WildfireProximityCard } from '@/components/property/wildfire-proximity-card';
import { RiskComparison } from '@/components/property/risk-comparison';
import { ReportActions } from '@/components/property/report-actions';
import { ReportMap } from '@/components/property/report-map';
import { RegulatoryNotice } from '@/components/property/regulatory-notice';

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col items-center py-12">
        <Skeleton className="w-44 h-44" rounded="full" />
        <Skeleton className="w-48 h-4 mt-4" />
        <Skeleton className="w-64 h-4 mt-3" />
      </div>
      <Skeleton className="w-full h-64" rounded="lg" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Skeleton className="h-48" rounded="lg" />
        <Skeleton className="h-48" rounded="lg" />
      </div>
      <Skeleton className="w-full h-64" rounded="lg" />
      <Skeleton className="w-full h-[300px]" rounded="lg" />
    </div>
  );
}

export default function ReportViewPage() {
  const params = useParams();
  const reportId = params.reportId as string;
  const t = useTranslations('PropertyReport');
  const { report, isLoading, error } = usePropertyReport(reportId);

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] px-4 sm:px-6 lg:px-12 pb-16 max-w-4xl mx-auto pt-8">
        <p className="text-sm text-text-muted text-center mb-8 font-[family-name:var(--font-sans)]">
          {t('loading')}
        </p>
        <LoadingSkeleton />
      </div>
    );
  }

  if (error && !report) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-lg text-text-primary font-[family-name:var(--font-display)]">
            {t('notFound')}
          </p>
          <p className="text-sm text-text-muted mt-2 font-[family-name:var(--font-sans)]">
            {error}
          </p>
          <a
            href="/report"
            className="inline-block mt-6 px-6 py-2.5 rounded-xl bg-severity-2 text-bg-primary text-sm font-semibold hover:bg-severity-2/90 transition-colors"
          >
            {t('analyzeButton')}
          </a>
        </motion.div>
      </div>
    );
  }

  if (!report) return null;

  return (
    <motion.div
      className="min-h-[calc(100vh-4rem)] px-4 sm:px-6 lg:px-12 pb-16 max-w-4xl mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Title */}
      <div className="pt-6 sm:pt-8">
        <h1 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-extrabold text-text-primary text-center">
          {t('reportTitle')}
        </h1>
      </div>

      {/* Hero: Risk Summary */}
      <PropertyRiskSummary
        compositeScore={report.composite_score}
        dominantHazard={report.dominant_hazard}
        severity={report.severity}
        address={report.formatted_address}
      />

      {/* Actions */}
      <div className="mb-6">
        <ReportActions
          reportId={report.report_id}
          pdfAvailable={report.pdf_available}
        />
      </div>

      {/* Hazard Breakdown */}
      <div className="mb-6">
        <HazardBreakdown report={report} />
      </div>

      {/* Flood Zone + Wildfire Proximity - 2 column grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <FloodZoneCard floodZone={report.flood_zone} />
        <WildfireProximityCard
          wildfireProximity={report.wildfire_proximity}
          terrain={report.terrain}
        />
      </div>

      {/* Risk Comparison */}
      <div className="mb-6">
        <RiskComparison report={report} />
      </div>

      {/* Map */}
      <div className="mb-6">
        <ReportMap
          latitude={report.latitude}
          longitude={report.longitude}
          address={report.formatted_address}
        />
      </div>

      {/* Regulatory Notice */}
      <div className="mb-8">
        <RegulatoryNotice />
      </div>
    </motion.div>
  );
}
