'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Map, { Source, Layer, Popup, NavigationControl } from 'react-map-gl/maplibre';
import type { MapLayerMouseEvent, MapRef } from 'react-map-gl/maplibre';
import { loadProvinceGeoJSON, enrichGeoJSON, loadMunicipalitiesForProvinces, enrichMunicipalityGeoJSON } from '@/lib/geo-data';
import type { MapAlertData } from '@/hooks/use-map-alerts';
import type { RiskMapEntry } from '@/types/risk';
import { MapLegend } from './map-legend';
import { MapPopup } from './map-popup';
import { MapControls } from './map-controls';
import { useAppStore } from '@/store/app-store';

export interface SpainAlertMapProps {
  alertData: MapAlertData;
  riskByProvince?: Record<string, RiskMapEntry>;
  allWeather?: Array<{ province_code: string; temperature: number; latitude: number; longitude: number }>;
}

export function SpainAlertMap({ alertData, riskByProvince, allWeather }: SpainAlertMapProps) {
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
  const [municipalityGeoJSON, setMunicipalityGeoJSON] = useState<GeoJSON.FeatureCollection | null>(null);
  const [visibleProvinceINEs, setVisibleProvinceINEs] = useState<string[]>([]);
  const [zoomLevel, setZoomLevel] = useState(5.5);

  const activeMapLayer = useAppStore((s) => s.activeMapLayer);

  // Load GeoJSON once
  useEffect(() => {
    loadProvinceGeoJSON()
      .then(setBaseGeoJSON)
      .catch((err) => console.error('Failed to load GeoJSON:', err))
      .finally(() => setGeoLoading(false));
  }, []);

  // Build risk lookup for enrichGeoJSON
  const riskLookup = useMemo(() => {
    if (!riskByProvince) return undefined;
    const lookup: Record<string, { compositeScore: number; severity: string; dominantHazard: string }> = {};
    for (const [code, entry] of Object.entries(riskByProvince)) {
      lookup[code] = {
        compositeScore: entry.composite_score,
        severity: entry.severity,
        dominantHazard: entry.dominant_hazard,
      };
    }
    return lookup;
  }, [riskByProvince]);

  // Enrich GeoJSON with alert + risk data
  const enrichedGeoJSON = useMemo(() => {
    if (!baseGeoJSON) return null;
    return enrichGeoJSON(baseGeoJSON, alertData.byProvince, riskLookup);
  }, [baseGeoJSON, alertData.byProvince, riskLookup]);

  // Enrich municipality GeoJSON with alert data
  const enrichedMunicipalityGeoJSON = useMemo(() => {
    if (!municipalityGeoJSON) return null;
    return enrichMunicipalityGeoJSON(
      municipalityGeoJSON,
      {},
      alertData.byProvince,
      riskLookup
    );
  }, [municipalityGeoJSON, alertData, riskLookup]);

  // Total alert count for controls
  const totalAlerts = useMemo(() => {
    return Object.values(alertData.byProvince).reduce((sum, p) => sum + p.alertCount, 0);
  }, [alertData]);

  // Track which source the hovered feature belongs to
  const hoveredSourceRef = useRef<string>('provinces');

  const safeSetFeatureState = useCallback(
    (source: string, id: string, state: Record<string, unknown>) => {
      try {
        if (mapRef.current?.getSource(source)) {
          mapRef.current.setFeatureState({ source, id }, state);
        }
      } catch {
        // Source not yet added to map — ignore
      }
    },
    []
  );

  // Pulse animation for alerted provinces (throttled to 100ms)
  useEffect(() => {
    const start = performance.now();
    const id = setInterval(() => {
      const elapsed = (performance.now() - start) % 3000;
      const opacity = 0.15 + 0.25 * Math.sin((elapsed / 3000) * Math.PI * 2);
      try {
        const map = mapRef.current?.getMap();
        if (map?.getLayer('province-alert-pulse')) {
          map.setPaintProperty('province-alert-pulse', 'fill-opacity', [
            'case',
            ['>', ['get', 'alertCount'], 0],
            opacity,
            0,
          ]);
        }
      } catch { /* Layer not ready */ }
    }, 100);
    return () => clearInterval(id);
  }, []);

  // Hover handling
  const onMouseMove = useCallback((e: MapLayerMouseEvent) => {
    if (e.features && e.features.length > 0) {
      const feature = e.features[0];
      const isMuni = feature.layer?.id === 'municipality-fill';
      const source = isMuni ? 'municipalities' : 'provinces';
      const id = isMuni ? feature.properties?.cod_muni : feature.properties?.cod_prov;
      if (hoveredFeatureId !== id || hoveredSourceRef.current !== source) {
        if (hoveredFeatureId) {
          safeSetFeatureState(hoveredSourceRef.current, hoveredFeatureId, { hover: false });
        }
        hoveredSourceRef.current = source;
        setHoveredFeatureId(id);
        safeSetFeatureState(source, id, { hover: true });
      }
    }
  }, [hoveredFeatureId, safeSetFeatureState]);

  const onMouseLeave = useCallback(() => {
    if (hoveredFeatureId) {
      safeSetFeatureState(hoveredSourceRef.current, hoveredFeatureId, { hover: false });
      setHoveredFeatureId(null);
    }
  }, [hoveredFeatureId, safeSetFeatureState]);

  // Zoom / move handler
  const onMoveEnd = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const zoom = map.getZoom();
    setZoomLevel(zoom);

    if (zoom >= 6.5) {
      // Query only the center region of the viewport to load municipalities
      // for the province being zoomed into, not all visible provinces
      const canvas = map.getCanvas();
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const pad = Math.min(canvas.width, canvas.height) * 0.25;
      const bbox: [maplibregl.PointLike, maplibregl.PointLike] = [
        [cx - pad, cy - pad],
        [cx + pad, cy + pad],
      ];
      const features = map.queryRenderedFeatures(bbox, { layers: ['province-fill'] });
      const ineSet = new Set<string>();
      for (const f of features) {
        const codProv = f.properties?.cod_prov;
        if (codProv) ineSet.add(codProv);
      }
      const ineCodes = Array.from(ineSet);

      const key = ineCodes.sort().join(',');
      const prevKey = [...visibleProvinceINEs].sort().join(',');
      if (key !== prevKey) {
        setVisibleProvinceINEs(ineCodes);
        loadMunicipalitiesForProvinces(ineCodes).then(setMunicipalityGeoJSON);
      }
    }
  }, [visibleProvinceINEs]);

  // Click handling
  const onClick = useCallback((e: MapLayerMouseEvent) => {
    if (e.features && e.features.length > 0) {
      const feature = e.features[0];
      const props = feature.properties;
      const isMuni = feature.layer?.id === 'municipality-fill';
      setPopupInfo({
        longitude: e.lngLat.lng,
        latitude: e.lngLat.lat,
        provinceName: props?.provinceName || props?.name || '',
        provinceCode: props?.provinceCode || (isMuni ? props?.cod_prov : props?.cod_prov) || '',
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

  // Fill color expression based on active layer
  const fillColorExpression = activeMapLayer === 'risk'
    ? [
        'interpolate', ['linear'],
        ['get', 'riskScore'],
        0,  '#16A34A',
        20, '#16A34A',
        40, '#FFD60A',
        60, '#FF9F0A',
        80, '#FF453A',
        100, '#FF2D55',
      ] as unknown as maplibregl.ExpressionSpecification
    : [
        'match',
        ['get', 'alertSeverity'],
        5, '#FF2D55',
        4, '#FF453A',
        3, '#FF9F0A',
        2, '#FFD60A',
        1, '#64D2FF',
        '#16A34A',
      ] as unknown as maplibregl.ExpressionSpecification;

  // Alert pulse fill color
  const alertPulseFillColor = [
    'match',
    ['get', 'alertSeverity'],
    5, '#FF2D55',
    4, '#FF453A',
    3, '#FF9F0A',
    2, '#FFD60A',
    1, '#64D2FF',
    'transparent',
  ] as unknown as maplibregl.ExpressionSpecification;

  // Weather lookup by province code for popup display
  const weatherByProvince = useMemo(() => {
    if (!allWeather) return {};
    const map: Record<string, { temperature: number }> = {};
    for (const w of allWeather) {
      if (w.temperature != null) map[w.province_code] = { temperature: w.temperature };
    }
    return map;
  }, [allWeather]);

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
        interactiveLayerIds={
          enrichedGeoJSON
            ? zoomLevel >= 6.5 && enrichedMunicipalityGeoJSON
              ? ['province-fill', 'municipality-fill']
              : ['province-fill']
            : []
        }
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        onClick={onClick}
        onMoveEnd={onMoveEnd}
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
                'fill-color': fillColorExpression,
                'fill-opacity': [
                  'interpolate', ['linear'], ['zoom'],
                  5, ['case', ['boolean', ['feature-state', 'hover'], false], 0.85, 0.7],
                  6, ['case', ['boolean', ['feature-state', 'hover'], false], 0.8, 0.65],
                  6.5, ['case', ['boolean', ['feature-state', 'hover'], false], 0.6, 0.35],
                ],
              }}
            />
            {/* Alert pulse overlay */}
            <Layer
              id="province-alert-pulse"
              type="fill"
              paint={{
                'fill-color': alertPulseFillColor,
                'fill-opacity': [
                  'case',
                  ['>', ['get', 'alertCount'], 0],
                  0.3,
                  0,
                ],
              }}
            />
            {/* Province outline layer */}
            <Layer
              id="province-outline"
              type="line"
              paint={{
                'line-color': [
                  'case',
                  ['boolean', ['feature-state', 'hover'], false],
                  '#FFFFFF',
                  'rgba(255, 255, 255, 0.5)',
                ] as unknown as maplibregl.ExpressionSpecification,
                'line-width': [
                  'case',
                  ['boolean', ['feature-state', 'hover'], false],
                  3,
                  1.5,
                ] as unknown as maplibregl.ExpressionSpecification,
              }}
            />
            <Layer
              id="province-labels"
              type="symbol"
              layout={{
                'text-field': ['get', 'provinceName'],
                'text-size': ['interpolate', ['linear'], ['zoom'], 5, 9, 6, 11, 7, 13],
                'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                'text-allow-overlap': false,
                'text-padding': 6,
                'text-max-width': 7,
                'text-transform': 'uppercase',
                'text-letter-spacing': 0.08,
                'text-variable-anchor': ['center', 'top', 'bottom', 'left', 'right'],
                'text-radial-offset': 0.5,
                'text-justify': 'auto',
              }}
              paint={{
                'text-color': '#F5F5F7',
                'text-halo-color': 'rgba(0, 0, 0, 0.8)',
                'text-halo-width': 1.5,
                'text-opacity': ['interpolate', ['linear'], ['zoom'], 6, 1, 7, 0],
              }}
            />
          </Source>
        )}

        {/* Municipality layer – visible when zoomed in */}
        {enrichedMunicipalityGeoJSON && zoomLevel >= 6.5 && (
          <Source
            id="municipalities"
            type="geojson"
            data={enrichedMunicipalityGeoJSON}
            promoteId="cod_muni"
          >
            <Layer
              id="municipality-fill"
              type="fill"
              paint={{
                'fill-color': fillColorExpression,
                'fill-opacity': [
                  'case',
                  ['boolean', ['feature-state', 'hover'], false],
                  0.95,
                  0.85,
                ],
              }}
            />
            <Layer
              id="municipality-outline"
              type="line"
              paint={{
                'line-color': [
                  'case',
                  ['boolean', ['feature-state', 'hover'], false],
                  '#FFFFFF',
                  'rgba(255, 255, 255, 0.5)',
                ] as unknown as maplibregl.ExpressionSpecification,
                'line-width': [
                  'case',
                  ['boolean', ['feature-state', 'hover'], false],
                  2.5,
                  1.5,
                ] as unknown as maplibregl.ExpressionSpecification,
              }}
            />
            <Layer
              id="municipality-labels"
              type="symbol"
              layout={{
                'text-field': ['coalesce', ['get', 'municipalityName'], ['get', 'name']],
                'text-size': ['interpolate', ['linear'], ['zoom'], 6.5, 9, 8, 12],
                'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
                'text-allow-overlap': false,
                'text-padding': 3,
                'text-max-width': 6,
                'text-variable-anchor': ['center', 'top', 'bottom', 'left', 'right'],
                'text-radial-offset': 0.4,
                'text-justify': 'auto',
              }}
              paint={{
                'text-color': '#F5F5F7',
                'text-halo-color': 'rgba(0, 0, 0, 0.8)',
                'text-halo-width': 1,
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
            maxWidth="340px"
            closeOnClick={false}
          >
            <MapPopup
              provinceName={popupInfo.provinceName}
              provinceCode={popupInfo.provinceCode}
              summary={
                alertData.byProvince[popupInfo.provinceCode] ?? {
                  provinceCode: popupInfo.provinceCode,
                  provinceName: popupInfo.provinceName,
                  maxSeverity: 0,
                  alertCount: 0,
                  alerts: [],
                }
              }
              riskData={riskByProvince?.[popupInfo.provinceCode]}
              currentTemperature={weatherByProvince[popupInfo.provinceCode]?.temperature}
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
        onRefresh={() => {}}
      />
    </div>
  );
}
