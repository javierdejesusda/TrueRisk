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
import { useAppStore } from '@/store/app-store';

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

  return (
    <div className="fixed inset-0">
      <SpainAlertMap
        alertData={alertData}
        riskByProvince={riskByProvince}
        allWeather={weatherMarkers}
        fireHotspots={fireHotspots}
        earthquakes={earthquakes}
        reservoirs={reservoirData}
      />

      {/* Left panels — stacked vertically */}
      <div className="absolute top-16 left-4 z-40 flex flex-col gap-3 max-h-[calc(100vh-6rem)] overflow-y-auto">
        {panelsVisible.risk && <RiskPanel />}
        {panelsVisible.weather && <WeatherPanel />}
        {panelsVisible.alerts && <AlertsPanel />}
      </div>
    </div>
  );
}
