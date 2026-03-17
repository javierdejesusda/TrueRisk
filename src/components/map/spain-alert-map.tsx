'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Map, { Source, Layer, Popup, NavigationControl } from 'react-map-gl/maplibre';
import type { MapLayerMouseEvent, MapRef } from 'react-map-gl/maplibre';
import { loadProvinceGeoJSON, enrichGeoJSON, loadMunicipalitiesForProvinces, enrichMunicipalityGeoJSON } from '@/lib/geo-data';
import type { MapAlertData, ProvinceAlertSummary } from '@/hooks/use-map-alerts';
import { MapLegend } from './map-legend';
import { MapPopup } from './map-popup';
import { MapControls } from './map-controls';

export interface SpainAlertMapProps {
  alertData: MapAlertData;
  isLoading: boolean;
}

export function SpainAlertMap({ alertData, isLoading }: SpainAlertMapProps) {
  const mapRef = useRef<MapRef>(null);
  const [baseGeoJSON, setBaseGeoJSON] = useState<GeoJSON.FeatureCollection | null>(null);
  const [geoLoading, setGeoLoading] = useState(true);
  const [popupInfo, setPopupInfo] = useState<{
    longitude: number;
    latitude: number;
    provinceName: string;
    provinceCode: string;
    municipalityCode?: string;
  } | null>(null);
  const [hoveredFeatureId, setHoveredFeatureId] = useState<string | null>(null);
  const [municipalityGeoJSON, setMunicipalityGeoJSON] = useState<GeoJSON.FeatureCollection | null>(null);
  const [visibleProvinceINEs, setVisibleProvinceINEs] = useState<string[]>([]);
  const [zoomLevel, setZoomLevel] = useState(5.5);

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
    return enrichGeoJSON(baseGeoJSON, alertData.byProvince);
  }, [baseGeoJSON, alertData.byProvince]);

  // Enrich municipality GeoJSON with alert data
  const enrichedMunicipalityGeoJSON = useMemo(() => {
    if (!municipalityGeoJSON) return null;
    return enrichMunicipalityGeoJSON(
      municipalityGeoJSON,
      alertData.byMunicipality,
      alertData.byProvince
    );
  }, [municipalityGeoJSON, alertData]);

  // Total alert count for controls
  const totalAlerts = useMemo(() => {
    const provCount = Object.values(alertData.byProvince).reduce((sum, p) => sum + p.alertCount, 0);
    const muniCount = Object.values(alertData.byMunicipality).reduce((sum, m) => sum + m.alertCount, 0);
    return provCount + muniCount;
  }, [alertData]);

  // Track which source the hovered feature belongs to
  const hoveredSourceRef = useRef<string>('provinces');

  // Hover handling
  const onMouseMove = useCallback((e: MapLayerMouseEvent) => {
    if (e.features && e.features.length > 0) {
      const feature = e.features[0];
      const isMuni = feature.layer?.id === 'municipality-fill';
      const source = isMuni ? 'municipalities' : 'provinces';
      const id = isMuni ? feature.properties?.cod_muni : feature.properties?.cod_prov;
      if (hoveredFeatureId !== id || hoveredSourceRef.current !== source) {
        if (hoveredFeatureId) {
          mapRef.current?.setFeatureState(
            { source: hoveredSourceRef.current, id: hoveredFeatureId },
            { hover: false }
          );
        }
        hoveredSourceRef.current = source;
        setHoveredFeatureId(id);
        mapRef.current?.setFeatureState(
          { source, id },
          { hover: true }
        );
      }
    }
  }, [hoveredFeatureId]);

  const onMouseLeave = useCallback(() => {
    if (hoveredFeatureId) {
      mapRef.current?.setFeatureState(
        { source: hoveredSourceRef.current, id: hoveredFeatureId },
        { hover: false }
      );
      setHoveredFeatureId(null);
    }
  }, [hoveredFeatureId]);

  // Zoom / move handler – track zoom level and lazy-load municipality tiles
  const onMoveEnd = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const zoom = map.getZoom();
    setZoomLevel(zoom);

    if (zoom >= 7) {
      // Determine which provinces are currently visible
      const features = map.queryRenderedFeatures(undefined, { layers: ['province-fill'] });
      const ineSet = new Set<string>();
      for (const f of features) {
        const codProv = f.properties?.cod_prov;
        if (codProv) ineSet.add(codProv);
      }
      const ineCodes = Array.from(ineSet);

      // Only reload if visible provinces changed
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
      const isMunicipality = !!props?.municipalityCode;

      setPopupInfo({
        longitude: e.lngLat.lng,
        latitude: e.lngLat.lat,
        provinceName: isMunicipality
          ? (props?.municipalityName || props?.name || '')
          : (props?.provinceName || props?.name || ''),
        provinceCode: props?.provinceCode || '',
        municipalityCode: isMunicipality ? props?.municipalityCode : undefined,
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
        interactiveLayerIds={
          enrichedGeoJSON
            ? zoomLevel >= 7 && enrichedMunicipalityGeoJSON
              ? ['municipality-fill']
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
                'fill-color': [
                  'match',
                  ['get', 'alertSeverity'],
                  5, '#FF2D55',
                  4, '#FF453A',
                  3, '#FF9F0A',
                  2, '#FFD60A',
                  1, '#30D158',
                  '#1C1C1E',
                ],
                'fill-opacity': [
                  'interpolate', ['linear'], ['zoom'],
                  6, ['case', ['boolean', ['feature-state', 'hover'], false], 0.8, 0.5],
                  7, ['case', ['boolean', ['feature-state', 'hover'], false], 0.3, 0.15],
                ],
              }}
            />
            {/* Province outline layer */}
            <Layer
              id="province-outline"
              type="line"
              paint={{
                'line-color': '#38383A',
                'line-width': 1,
                'line-opacity': ['interpolate', ['linear'], ['zoom'], 6, 1, 7, 0.3],
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
                'text-padding': 4,
                'text-max-width': 7,
                'text-transform': 'uppercase',
                'text-letter-spacing': 0.08,
              }}
              paint={{
                'text-color': '#F5F5F7',
                'text-halo-color': 'rgba(0, 0, 0, 0.8)',
                'text-halo-width': 1.5,
                'text-opacity': ['interpolate', ['linear'], ['zoom'], 6.5, 1, 7.5, 0],
              }}
            />
          </Source>
        )}

        {/* Municipality layer – visible when zoomed in */}
        {enrichedMunicipalityGeoJSON && zoomLevel >= 7 && (
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
                'fill-color': [
                  'match',
                  ['get', 'alertSeverity'],
                  5, '#FF2D55',
                  4, '#FF453A',
                  3, '#FF9F0A',
                  2, '#FFD60A',
                  1, '#30D158',
                  '#1C1C1E',
                ],
                'fill-opacity': [
                  'case',
                  ['boolean', ['feature-state', 'hover'], false],
                  0.8,
                  0.55,
                ],
              }}
            />
            <Layer
              id="municipality-outline"
              type="line"
              paint={{
                'line-color': '#38383A',
                'line-width': 0.5,
              }}
            />
            <Layer
              id="municipality-labels"
              type="symbol"
              layout={{
                'text-field': ['coalesce', ['get', 'municipalityName'], ['get', 'name']],
                'text-size': ['interpolate', ['linear'], ['zoom'], 7, 9, 9, 12],
                'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
                'text-allow-overlap': false,
                'text-padding': 2,
                'text-max-width': 6,
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
              municipalityCode={popupInfo.municipalityCode}
              summary={
                popupInfo.municipalityCode
                  ? (alertData.byMunicipality[popupInfo.municipalityCode] as unknown as ProvinceAlertSummary) ?? {
                      provinceCode: popupInfo.provinceCode,
                      provinceName: popupInfo.provinceName,
                      maxSeverity: alertData.byProvince[popupInfo.provinceCode]?.maxSeverity ?? 0,
                      alertCount: alertData.byProvince[popupInfo.provinceCode]?.alertCount ?? 0,
                      alerts: alertData.byProvince[popupInfo.provinceCode]?.alerts ?? [],
                    }
                  : alertData.byProvince[popupInfo.provinceCode] ?? {
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
