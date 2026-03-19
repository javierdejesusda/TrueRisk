'use client';

import { useCallback, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useAemetAlerts } from '@/hooks/use-aemet-alerts';
import { useMapAlerts } from '@/hooks/use-map-alerts';
import { useRiskMap } from '@/hooks/use-risk-map';
import { useAllWeather } from '@/hooks/use-all-weather';
import { RiskPanel } from '@/components/map/panels/risk-panel';
import { WeatherPanel } from '@/components/map/panels/weather-panel';
import { AlertsPanel } from '@/components/map/panels/alerts-panel';
import { MapErrorBoundary } from '@/components/map/map-error-boundary';
import { ProvinceSearch } from '@/components/map/province-search';
import { useAppStore } from '@/store/app-store';
import type { ProvinceInfo } from '@/lib/provinces';
import type { SpainAlertMapHandle } from '@/components/map/spain-alert-map';

const SpainAlertMap = dynamic(
  () => import('@/components/map/spain-alert-map').then((m) => ({ default: m.SpainAlertMap })),
  { ssr: false }
);

export default function MapHomePage() {
  const { alerts: aemetAlerts, isLoading: aemetLoading, refresh: aemetRefresh } = useAemetAlerts();
  const alertData = useMapAlerts(aemetAlerts);
  const { byProvince: riskByProvince, isLoading: riskLoading, riskMap, refresh: riskRefresh } = useRiskMap();
  const { markers: weatherMarkers, refresh: weatherRefresh } = useAllWeather();
  const panelsVisible = useAppStore((s) => s.panelsVisible);
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const mapRef = useRef<SpainAlertMapHandle>(null);

  const handleRefresh = useCallback(() => {
    aemetRefresh(); riskRefresh(); weatherRefresh();
  }, [aemetRefresh, riskRefresh, weatherRefresh]);

  const handleProvinceSelect = useCallback((province: ProvinceInfo) => {
    mapRef.current?.flyToProvince(province.code, province.lat, province.lng);
  }, []);

  const lastUpdated = riskMap?.computed_at ?? null;

  return (
    <div className="fixed inset-0">
      <MapErrorBoundary>
        <SpainAlertMap
          ref={mapRef}
          alertData={alertData}
          isLoading={aemetLoading || riskLoading}
          riskByProvince={riskByProvince}
          allWeather={weatherMarkers}
          onRefresh={handleRefresh}
          lastUpdated={lastUpdated}
        />
      </MapErrorBoundary>
      <ProvinceSearch onSelect={handleProvinceSelect} />

      {isDesktop ? (
        <>
          {/* Left panels — stacked vertically */}
          <div className="absolute top-16 left-4 z-40 flex flex-col gap-3 max-h-[calc(100vh-6rem)] overflow-y-auto">
            {panelsVisible.risk && <RiskPanel />}
            {panelsVisible.weather && <WeatherPanel />}
          </div>
          {/* Right panel */}
          {panelsVisible.alerts && <AlertsPanel />}
        </>
      ) : (
        <div
          className={`absolute bottom-0 left-0 right-0 z-40 glass-heavy rounded-t-2xl transition-all duration-300 ${
            sheetExpanded ? 'max-h-[70vh]' : 'max-h-16'
          }`}
        >
          <button
            onClick={() => setSheetExpanded(!sheetExpanded)}
            className="w-full flex flex-col items-center pt-2 pb-3 px-4 cursor-pointer"
          >
            <div className="w-8 h-1 rounded-full bg-text-muted/50 mb-2" />
            <div className="flex items-center gap-3 text-xs text-text-secondary">
              <span>Panels</span>
              <span className="text-text-muted">{sheetExpanded ? 'Tap to collapse' : 'Tap to expand'}</span>
            </div>
          </button>
          {sheetExpanded && (
            <div className="overflow-y-auto px-4 pb-4 flex flex-col gap-3 max-h-[calc(70vh-4rem)]">
              {panelsVisible.risk && <RiskPanel />}
              {panelsVisible.weather && <WeatherPanel />}
              {panelsVisible.alerts && <AlertsPanel />}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
