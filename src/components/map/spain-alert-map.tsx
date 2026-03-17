'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Map, { Source, Layer, Popup, NavigationControl } from 'react-map-gl/maplibre';
import type { MapLayerMouseEvent, MapRef } from 'react-map-gl/maplibre';
import { loadProvinceGeoJSON, enrichGeoJSON } from '@/lib/geo-data';
import type { ProvinceAlertSummary } from '@/hooks/use-map-alerts';
import { MapLegend } from './map-legend';
import { MapPopup } from './map-popup';
import { MapControls } from './map-controls';

export interface SpainAlertMapProps {
  alertsByProvince: Record<string, ProvinceAlertSummary>;
  isLoading: boolean;
}

export function SpainAlertMap({ alertsByProvince, isLoading }: SpainAlertMapProps) {
  const mapRef = useRef<MapRef>(null);
  const [baseGeoJSON, setBaseGeoJSON] = useState<GeoJSON.FeatureCollection | null>(null);
  const [geoLoading, setGeoLoading] = useState(true);
  const [popupInfo, setPopupInfo] = useState<{
    longitude: number;
    latitude: number;
    provinceName: string;
    provinceCode: string;
  } | null>(null);
  const [hoveredFeatureId, setHoveredFeatureId] = useState<string | null>(null);

  // Load GeoJSON once
  useEffect(() => {
    loadProvinceGeoJSON()
      .then(setBaseGeoJSON)
      .catch((err) => console.error('Failed to load GeoJSON:', err))
      .finally(() => setGeoLoading(false));
  }, []);

  // Enrich GeoJSON with alert data (creates new object each time)
  const enrichedGeoJSON = useMemo(() => {
    if (!baseGeoJSON) return null;
    return enrichGeoJSON(baseGeoJSON, alertsByProvince);
  }, [baseGeoJSON, alertsByProvince]);

  // Total alert count for controls
  const totalAlerts = useMemo(() => {
    return Object.values(alertsByProvince).reduce((sum, p) => sum + p.alertCount, 0);
  }, [alertsByProvince]);

  // Hover handling
  const onMouseMove = useCallback((e: MapLayerMouseEvent) => {
    if (e.features && e.features.length > 0) {
      const feature = e.features[0];
      const id = feature.properties?.cod_prov;
      if (hoveredFeatureId !== id) {
        if (hoveredFeatureId) {
          mapRef.current?.setFeatureState(
            { source: 'provinces', id: hoveredFeatureId },
            { hover: false }
          );
        }
        setHoveredFeatureId(id);
        mapRef.current?.setFeatureState(
          { source: 'provinces', id },
          { hover: true }
        );
      }
    }
  }, [hoveredFeatureId]);

  const onMouseLeave = useCallback(() => {
    if (hoveredFeatureId) {
      mapRef.current?.setFeatureState(
        { source: 'provinces', id: hoveredFeatureId },
        { hover: false }
      );
      setHoveredFeatureId(null);
    }
  }, [hoveredFeatureId]);

  // Click handling
  const onClick = useCallback((e: MapLayerMouseEvent) => {
    if (e.features && e.features.length > 0) {
      const feature = e.features[0];
      const props = feature.properties;
      setPopupInfo({
        longitude: e.lngLat.lng,
        latitude: e.lngLat.lat,
        provinceName: props?.provinceName || props?.name || '',
        provinceCode: props?.provinceCode || '',
      });
    }
  }, []);

  // Reset view
  const handleResetView = useCallback(() => {
    mapRef.current?.flyTo({
      center: [-3.7, 40.4],
      zoom: 5.5,
      duration: 1000,
    });
  }, []);

  return (
    <div className="relative w-full h-full">
      {/* Loading overlay */}
      {geoLoading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-bg-primary/80">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent-green" />
            <span className="text-sm text-text-muted">Loading map...</span>
          </div>
        </div>
      )}

      <Map
        ref={mapRef}
        initialViewState={{
          longitude: -3.7,
          latitude: 40.4,
          zoom: 5.5,
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
        maxBounds={[[-20, 27], [6, 44]]}
        interactiveLayerIds={enrichedGeoJSON ? ['province-fill'] : []}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        onClick={onClick}
        cursor={hoveredFeatureId ? 'pointer' : 'grab'}
      >
        <NavigationControl position="bottom-right" />

        {enrichedGeoJSON && (
          <Source
            id="provinces"
            type="geojson"
            data={enrichedGeoJSON}
            promoteId="cod_prov"
          >
            {/* Province fill layer */}
            <Layer
              id="province-fill"
              type="fill"
              paint={{
                'fill-color': [
                  'match',
                  ['get', 'alertSeverity'],
                  5, '#dc2626',
                  4, '#ef4444',
                  3, '#f97316',
                  2, '#fbbf24',
                  1, '#34d399',
                  '#1a2b1e',
                ],
                'fill-opacity': [
                  'case',
                  ['boolean', ['feature-state', 'hover'], false],
                  0.8,
                  0.5,
                ],
              }}
            />
            {/* Province outline layer */}
            <Layer
              id="province-outline"
              type="line"
              paint={{
                'line-color': '#2a3f2e',
                'line-width': 1,
              }}
            />
          </Source>
        )}

        {/* Popup */}
        {popupInfo && (
          <Popup
            longitude={popupInfo.longitude}
            latitude={popupInfo.latitude}
            anchor="bottom"
            onClose={() => setPopupInfo(null)}
            maxWidth="300px"
            closeOnClick={false}
          >
            <MapPopup
              provinceName={popupInfo.provinceName}
              summary={
                alertsByProvince[popupInfo.provinceCode] ?? {
                  provinceCode: popupInfo.provinceCode,
                  provinceName: popupInfo.provinceName,
                  maxSeverity: 0,
                  alertCount: 0,
                  alerts: [],
                }
              }
            />
          </Popup>
        )}
      </Map>

      {/* Overlay controls */}
      <MapLegend />
      <MapControls
        alertCount={totalAlerts}
        lastUpdated={new Date().toISOString()}
        onResetView={handleResetView}
        onRefresh={() => {}} // Refresh handled by parent
      />
    </div>
  );
}
