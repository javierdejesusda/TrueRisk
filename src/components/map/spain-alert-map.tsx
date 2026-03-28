'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Map, { Source, Layer, Popup, Marker, NavigationControl } from 'react-map-gl/maplibre';
import type { MapLayerMouseEvent, MapRef } from 'react-map-gl/maplibre';
import { loadProvinceGeoJSON, enrichGeoJSON, loadMunicipalitiesForProvinces, enrichMunicipalityGeoJSON } from '@/lib/geo-data';
import { PROVINCES } from '@/lib/provinces';
import type { MapAlertData } from '@/hooks/use-map-alerts';
import type { RiskMapEntry } from '@/types/risk';
import { useTranslations } from 'next-intl';
import { MapLegend } from './map-legend';
import { MapPopup } from './map-popup';
import { MapControls } from './map-controls';
import { useAppStore } from '@/store/app-store';
import { useCommunityReports } from '@/hooks/use-community-reports';
import { ReportMarkers } from '@/components/community/report-markers';
import { ReportForm } from '@/components/community/report-form';
import { useGeolocation, isInSpain } from '@/hooks/use-geolocation';
import { DataLayers } from './data-layers';
import type { DataLayerVisibility, ReservoirPoint } from './data-layers';
import type { FireHotspot } from '@/hooks/use-fire-hotspots';
import type { Earthquake } from '@/hooks/use-earthquakes';
import { useRiverGauges } from '@/hooks/use-river-gauges';

type PopupAnchor = 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface SpainAlertMapProps {
  alertData: MapAlertData;
  riskByProvince?: Record<string, RiskMapEntry>;
  allWeather?: Array<{ province_code: string; temperature: number; latitude: number; longitude: number }>;
  fireHotspots?: FireHotspot[] | null;
  earthquakes?: Earthquake[] | null;
  reservoirs?: ReservoirPoint[] | null;
}

export function SpainAlertMap({ alertData, riskByProvince, allWeather, fireHotspots, earthquakes, reservoirs }: SpainAlertMapProps) {
  const mapRef = useRef<MapRef>(null);
  const [baseGeoJSON, setBaseGeoJSON] = useState<GeoJSON.FeatureCollection | null>(null);
  const [geoLoading, setGeoLoading] = useState(true);
  const [popupInfo, setPopupInfo] = useState<{
    longitude: number;
    latitude: number;
    provinceName: string;
    provinceCode: string;
    anchor: PopupAnchor;
  } | null>(null);
  const [hoveredFeatureId, setHoveredFeatureId] = useState<string | null>(null);
  const [municipalityGeoJSON, setMunicipalityGeoJSON] = useState<GeoJSON.FeatureCollection | null>(null);
  const [visibleProvinceINEs, setVisibleProvinceINEs] = useState<string[]>([]);
  const [zoomLevel, setZoomLevel] = useState(5.5);

  const activeMapLayer = useAppStore((s) => s.activeMapLayer);
  const setProvinceCode = useAppStore((s) => s.setProvinceCode);
  const t = useTranslations('Map');
  const { reports, submitReport } = useCommunityReports();
  const { data: riverGauges } = useRiverGauges();
  const [showReportForm, setShowReportForm] = useState(false);
  const geo = useGeolocation();
  const [hasGeolocated, setHasGeolocated] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lng: number; lat: number } | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [dataLayerVisibility, setDataLayerVisibility] = useState<DataLayerVisibility>({
    fires: false,
    earthquakes: false,
    reservoirs: false,
    riverGauges: false,
  });

  const toggleDataLayer = useCallback((layer: keyof DataLayerVisibility) => {
    setDataLayerVisibility(prev => ({ ...prev, [layer]: !prev[layer] }));
  }, []);

  // Load GeoJSON once
  useEffect(() => {
    loadProvinceGeoJSON()
      .then(setBaseGeoJSON)
      .catch((err) => console.error('Failed to load GeoJSON:', err))
      .finally(() => setGeoLoading(false));
  }, []);

  // Fly to user's location and set their province once map + geo + GeoJSON are all ready
  const geolocateUser = useCallback(() => {
    if (!geo.latitude || !geo.longitude || !baseGeoJSON || !mapRef.current) return;
    if (!isInSpain(geo.latitude, geo.longitude)) return;

    const userLng = geo.longitude;
    const userLat = geo.latitude;

    function pointInRing(ring: number[][], px: number, py: number): boolean {
      let inside = false;
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const xi = ring[i][0], yi = ring[i][1];
        const xj = ring[j][0], yj = ring[j][1];
        if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) {
          inside = !inside;
        }
      }
      return inside;
    }

    let matchedCode: string | null = null;
    for (const feature of baseGeoJSON.features) {
      const geom = feature.geometry;
      if (geom.type === 'Polygon') {
        if (pointInRing(geom.coordinates[0] as number[][], userLng, userLat)) {
          matchedCode = feature.properties?.['cod_prov'] ?? null;
          break;
        }
      } else if (geom.type === 'MultiPolygon') {
        for (const polygon of geom.coordinates) {
          if (pointInRing(polygon[0] as number[][], userLng, userLat)) {
            matchedCode = feature.properties?.['cod_prov'] ?? null;
            break;
          }
        }
        if (matchedCode) break;
      }
    }

    if (matchedCode) {
      setProvinceCode(matchedCode);
    }

    setUserLocation({ lng: userLng, lat: userLat });

    mapRef.current.flyTo({
      center: [userLng, userLat],
      zoom: 9,
      duration: 2500,
    });
  }, [geo.latitude, geo.longitude, baseGeoJSON, setProvinceCode]);

  // Trigger geolocation when all conditions are met (geo done + GeoJSON loaded + map ready)
  useEffect(() => {
    if (hasGeolocated || geo.isLoading) return;
    if (!geo.latitude || !geo.longitude) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time flag on geo failure
      setHasGeolocated(true);
      return;
    }
    if (!baseGeoJSON || !mapReady) return;

    geolocateUser();
    setHasGeolocated(true);
  }, [hasGeolocated, geo.isLoading, geo.latitude, geo.longitude, baseGeoJSON, mapReady, geolocateUser]);

  // Fallback: fly to user's stored province if geolocation didn't work
  useEffect(() => {
    if (!hasGeolocated || !mapReady || userLocation) return;
    const provinceCode = useAppStore.getState().provinceCode;
    if (!provinceCode) return;
    const province = PROVINCES.find(p => p.code === provinceCode);
    if (!province || !mapRef.current) return;
    const map = mapRef.current;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time fallback on geo failure
    setUserLocation({ lng: province.lng, lat: province.lat });
    map.flyTo({
      center: [province.lng, province.lat],
      zoom: 8,
      duration: 2000,
    });
  }, [hasGeolocated, mapReady, userLocation]);

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
      const elapsed = (performance.now() - start) % 5000;
      const opacity = 0.15 + 0.25 * Math.sin((elapsed / 5000) * Math.PI * 2);
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

  // Risk pulse — brightens the risk color on a slow cycle
  useEffect(() => {
    if (activeMapLayer !== 'risk') {
      try {
        const map = mapRef.current?.getMap();
        if (map?.getLayer('province-risk-pulse')) {
          map.setPaintProperty('province-risk-pulse', 'fill-opacity', 0);
        }
      } catch { /* */ }
      return;
    }
    const start = performance.now();
    const id = setInterval(() => {
      const elapsed = (performance.now() - start) % 5000;
      const opacity = Math.max(0, 0.2 * Math.sin((elapsed / 5000) * Math.PI * 2));
      try {
        const map = mapRef.current?.getMap();
        if (map?.getLayer('province-risk-pulse')) {
          map.setPaintProperty('province-risk-pulse', 'fill-opacity', [
            'case',
            ['>', ['coalesce', ['get', 'riskScore'], 0], 0],
            opacity,
            0,
          ]);
        }
      } catch { /* Layer not ready */ }
    }, 100);
    return () => clearInterval(id);
  }, [activeMapLayer]);

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
      const features = map.queryRenderedFeatures({ layers: ['province-fill'] });
      const ineSet = new Set<string>();
      for (const f of features) {
        const codProv = f.properties?.cod_prov;
        if (codProv) ineSet.add(codProv);
      }
      // Always include communal territories (province 53) — they have no
      // province-fill polygon so queryRenderedFeatures never detects them
      ineSet.add('53');
      const ineCodes = Array.from(ineSet);

      const key = ineCodes.sort().join(',');
      const prevKey = [...visibleProvinceINEs].sort().join(',');
      if (key !== prevKey) {
        setVisibleProvinceINEs(ineCodes);
        loadMunicipalitiesForProvinces(ineCodes).then(setMunicipalityGeoJSON);
      }
    }
  }, [visibleProvinceINEs]);

  // Compute best popup anchor based on click position relative to viewport edges
  const computeAnchor = useCallback((point: { x: number; y: number }, container: HTMLElement): PopupAnchor => {
    const POPUP_W = 360;
    const POPUP_H = 440;
    const PAD = 16;

    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const halfW = POPUP_W / 2;

    const nearTop = point.y < POPUP_H + PAD;
    const nearBottom = point.y > ch - POPUP_H - PAD;
    const nearLeft = point.x < halfW + PAD;
    const nearRight = point.x > cw - halfW - PAD;

    if (nearTop && nearLeft) return 'top-left';
    if (nearTop && nearRight) return 'top-right';
    if (nearBottom && nearLeft) return 'bottom-left';
    if (nearBottom && nearRight) return 'bottom-right';
    if (nearTop) return 'top';
    if (nearBottom) return 'bottom';
    if (nearLeft) return 'left';
    if (nearRight) return 'right';
    return 'bottom';
  }, []);

  // Click handling
  const onClick = useCallback((e: MapLayerMouseEvent) => {
    if (e.features && e.features.length > 0) {
      const feature = e.features[0];
      const props = feature.properties;
      const isMuni = feature.layer?.id === 'municipality-fill';

      let anchor: PopupAnchor = 'bottom';
      if (mapRef.current) {
        const point = mapRef.current.project([e.lngLat.lng, e.lngLat.lat]);
        const container = mapRef.current.getContainer();
        anchor = computeAnchor(point, container);
      }

      setPopupInfo({
        longitude: e.lngLat.lng,
        latitude: e.lngLat.lat,
        provinceName: props?.provinceName || props?.name || '',
        provinceCode: props?.provinceCode || (isMuni ? props?.cod_prov : props?.cod_prov) || '',
        anchor,
      });
    }
  }, [computeAnchor]);

  // Auto-pan map to keep popup fully visible after it renders
  useEffect(() => {
    if (!popupInfo || !mapRef.current) return;

    const timer = setTimeout(() => {
      const map = mapRef.current;
      const container = map?.getContainer();
      if (!map || !container) return;

      const popupEl = container.querySelector('.maplibregl-popup') as HTMLElement | null;
      if (!popupEl) return;

      const popupRect = popupEl.getBoundingClientRect();
      const mapRect = container.getBoundingClientRect();
      const pad = 16;

      let dx = 0;
      let dy = 0;

      if (popupRect.right > mapRect.right - pad) {
        dx = popupRect.right - (mapRect.right - pad);
      } else if (popupRect.left < mapRect.left + pad) {
        dx = popupRect.left - (mapRect.left + pad);
      }

      if (popupRect.bottom > mapRect.bottom - pad) {
        dy = popupRect.bottom - (mapRect.bottom - pad);
      } else if (popupRect.top < mapRect.top + pad) {
        dy = popupRect.top - (mapRect.top + pad);
      }

      if (dx !== 0 || dy !== 0) {
        map.panBy([dx, dy], { duration: 300 });
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [popupInfo]);

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
        ['coalesce', ['get', 'riskScore'], 0],
        0,   '#44ce1b',
        25,  '#bbdb44',
        50,  '#FFFF00',
        75,  '#f2a134',
        100, '#e51f1f',
      ] as unknown as maplibregl.ExpressionSpecification
    : [
        'match',
        ['coalesce', ['get', 'alertSeverity'], 0],
        5, '#e51f1f',
        4, '#EF4444',
        3, '#F97316',
        2, '#FBBF24',
        1, '#84CC16',
        '#008000',
      ] as unknown as maplibregl.ExpressionSpecification;

  // Alert pulse fill color
  const alertPulseFillColor = [
    'match',
    ['get', 'alertSeverity'],
    5, '#e51f1f',
    4, '#EF4444',
    3, '#F97316',
    2, '#FBBF24',
    1, '#84CC16',
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
            <span className="text-sm text-text-muted">{t('loadingMap')}</span>
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
        maxBounds={[[-25, 22], [10, 48]]}
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
        onLoad={() => setMapReady(true)}
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
                  6.5, ['case', ['boolean', ['feature-state', 'hover'], false], 0.6, 0.45],
                  7.5, ['case', ['boolean', ['feature-state', 'hover'], false], 0.3, 0.15],
                ],
              }}
            />
            {/* Risk pulse — same risk colors layered on top to brighten */}
            <Layer
              id="province-risk-pulse"
              type="fill"
              paint={{
                'fill-color': fillColorExpression,
                'fill-opacity': 0,
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
                  'interpolate', ['linear'], ['zoom'],
                  5, ['case', ['boolean', ['feature-state', 'hover'], false], '#EEEEF0', 'rgba(255, 255, 255, 0.5)'],
                  7, ['case', ['boolean', ['feature-state', 'hover'], false], '#FBBF24', 'rgba(251, 191, 36, 0.8)'],
                  9, ['case', ['boolean', ['feature-state', 'hover'], false], '#FBBF24', 'rgba(251, 191, 36, 0.6)'],
                ] as unknown as maplibregl.ExpressionSpecification,
                'line-width': [
                  'interpolate', ['linear'], ['zoom'],
                  5, ['case', ['boolean', ['feature-state', 'hover'], false], 3, 1.5],
                  7, ['case', ['boolean', ['feature-state', 'hover'], false], 4, 3],
                  9, ['case', ['boolean', ['feature-state', 'hover'], false], 4.5, 3.5],
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
                'text-color': '#EEEEF0',
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
              beforeId="province-outline"
              paint={{
                'fill-color': fillColorExpression,
                'fill-opacity': [
                  'interpolate', ['linear'], ['zoom'],
                  6.5, ['case', ['boolean', ['feature-state', 'hover'], false], 0.4, 0.25],
                  7.5, ['case', ['boolean', ['feature-state', 'hover'], false], 0.95, 0.85],
                ],
              }}
            />
            <Layer
              id="municipality-outline"
              type="line"
              beforeId="province-outline"
              paint={{
                'line-color': [
                  'case',
                  ['boolean', ['feature-state', 'hover'], false],
                  '#EEEEF0',
                  'rgba(255, 255, 255, 0.2)',
                ] as unknown as maplibregl.ExpressionSpecification,
                'line-width': [
                  'interpolate', ['linear'], ['zoom'],
                  6.5, ['case', ['boolean', ['feature-state', 'hover'], false], 1, 0.3],
                  7.5, ['case', ['boolean', ['feature-state', 'hover'], false], 2, 0.8],
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
                'text-color': '#EEEEF0',
                'text-halo-color': 'rgba(0, 0, 0, 0.8)',
                'text-halo-width': 1,
              }}
            />
          </Source>
        )}

        {/* Data overlay layers (fires, earthquakes) */}
        <DataLayers
          fireHotspots={fireHotspots ?? null}
          earthquakes={earthquakes ?? null}
          reservoirs={reservoirs ?? null}
          riverGauges={riverGauges ?? null}
          visibleLayers={dataLayerVisibility}
        />

        {/* Popup */}
        {popupInfo && (
          <Popup
            longitude={popupInfo.longitude}
            latitude={popupInfo.latitude}
            anchor={popupInfo.anchor}
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

        {/* Community report markers */}
        <ReportMarkers reports={reports} />

        {/* User location marker */}
        {userLocation && (
          <Marker longitude={userLocation.lng} latitude={userLocation.lat} anchor="center">
            <div className="relative flex items-center justify-center">
              <span className="absolute h-8 w-8 animate-ping rounded-full bg-accent-blue/30" />
              <span className="relative h-4 w-4 rounded-full border-2 border-white bg-accent-blue shadow-[0_0_12px_rgba(59,130,246,0.6)]" />
            </div>
          </Marker>
        )}

      </Map>

      {/* Overlay controls */}
      <MapLegend />
      <MapControls
        alertCount={totalAlerts}
        lastUpdated={new Date().toISOString()}
        onResetView={handleResetView}
        onRefresh={() => {}}
        dataLayers={dataLayerVisibility}
        onToggleDataLayer={toggleDataLayer}
        fireCount={fireHotspots?.length}
        quakeCount={earthquakes?.length}
        reservoirCount={reservoirs?.length}
        gaugeCount={riverGauges?.length}
      />

      {/* Report hazard button — positioned above legend */}
      <button
        onClick={() => setShowReportForm(true)}
        className="absolute bottom-4 right-4 z-10 flex items-center gap-2 rounded-xl border border-white/[0.18] bg-white/[0.14] backdrop-blur-[24px] px-4 py-2.5 text-xs font-medium text-text-primary shadow-[0_2px_12px_rgba(255,255,255,0.04),inset_0_1px_0_rgba(255,255,255,0.06)] hover:bg-white/[0.24] hover:border-white/[0.35] hover:shadow-[0_8px_32px_rgba(255,255,255,0.12),inset_0_1px_0_rgba(255,255,255,0.15)] hover:-translate-y-0.5 transition-all duration-250 cursor-pointer"
      >
        <span className="text-orange-400">!</span>
        {t('reportHazard')}
      </button>

      {showReportForm && (
        <ReportForm
          onSubmit={submitReport}
          onClose={() => setShowReportForm(false)}
        />
      )}
    </div>
  );
}
