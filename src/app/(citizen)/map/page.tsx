'use client';

import dynamic from 'next/dynamic';
import { useAemetAlerts } from '@/hooks/use-aemet-alerts';
import { useMapAlerts } from '@/hooks/use-map-alerts';
import { useRiskMap } from '@/hooks/use-risk-map';
import { useAllWeather } from '@/hooks/use-all-weather';
import { useFireHotspots } from '@/hooks/use-fire-hotspots';
import { useEarthquakes } from '@/hooks/use-earthquakes';
import { useReservoirs } from '@/hooks/use-reservoirs';
import { RiskPanel } from '@/components/map/panels/risk-panel';
import { WeatherPanel } from '@/components/map/panels/weather-panel';
import { AlertsPanel } from '@/components/map/panels/alerts-panel';
import { MobileBottomSheet } from '@/components/map/mobile/mobile-bottom-sheet';
import { useAppStore } from '@/store/app-store';
import { useMediaQuery } from '@/hooks/use-media-query';

const SpainAlertMap = dynamic(
  () => import('@/components/map/spain-alert-map').then((m) => ({ default: m.SpainAlertMap })),
  { ssr: false }
);

export default function MapHomePage() {
  const { alerts: aemetAlerts } = useAemetAlerts();
  const alertData = useMapAlerts(aemetAlerts);
  const { byProvince: riskByProvince } = useRiskMap();
  const { markers: weatherMarkers } = useAllWeather();
  const { data: fireHotspots } = useFireHotspots();
  const { data: earthquakes } = useEarthquakes();
  const { data: reservoirData } = useReservoirs();
  const panelsVisible = useAppStore((s) => s.panelsVisible);
  const isMobile = useMediaQuery('(max-width: 767px)');

  return (
    <div className="fixed inset-0">
      <SpainAlertMap
        alertData={alertData}
        riskByProvince={riskByProvince}
        allWeather={weatherMarkers}
        fireHotspots={fireHotspots}
        earthquakes={earthquakes}
        reservoirs={reservoirData}
        isMobile={isMobile}
      />

      {/* Desktop: left panel stack */}
      {!isMobile && (
        <div className="absolute top-20 left-3 sm:left-5 z-40 flex flex-col gap-2 max-h-[calc(100vh-7rem)] overflow-y-auto pr-1 scrollbar-hide w-[200px] sm:w-[250px] lg:w-[300px]">
          {panelsVisible.alerts && <AlertsPanel />}
          {panelsVisible.risk && <RiskPanel />}
          {panelsVisible.weather && <WeatherPanel />}
        </div>
      )}

      {/* Mobile: bottom sheet with tabbed panels */}
      {isMobile && <MobileBottomSheet />}
    </div>
  );
}
