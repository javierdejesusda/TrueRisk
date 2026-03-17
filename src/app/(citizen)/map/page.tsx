'use client';

import dynamic from 'next/dynamic';
import { useAemetAlerts } from '@/hooks/use-aemet-alerts';
import { useMapAlerts } from '@/hooks/use-map-alerts';

const SpainAlertMap = dynamic(
  () =>
    import('@/components/map/spain-alert-map').then((m) => ({
      default: m.SpainAlertMap,
    })),
  { ssr: false }
);

export default function MapPage() {
  const { alerts: aemetAlerts, isLoading } = useAemetAlerts();
  const alertsByProvince = useMapAlerts(aemetAlerts);

  return (
    <div className="-m-4 lg:-m-6 h-[calc(100vh-3.5rem)]">
      <SpainAlertMap alertsByProvince={alertsByProvince} isLoading={isLoading} />
    </div>
  );
}
