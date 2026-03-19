import type { AemetSeverity } from '@/types/aemet';

// Module-level cache for the GeoJSON data (client-side only).
let cachedGeoJSON: GeoJSON.FeatureCollection | null = null;

/**
 * Fetches the Spain provinces GeoJSON from the public directory and caches it
 * in memory. Subsequent calls return the cached value without a network request.
 * Must only be called in client-side contexts.
 */
export async function loadProvinceGeoJSON(): Promise<GeoJSON.FeatureCollection> {
  if (cachedGeoJSON) return cachedGeoJSON;
  const res = await fetch('/geo/spain-provinces.geojson');
  cachedGeoJSON = await res.json();
  return cachedGeoJSON!;
}

/**
 * Returns a deep-cloned copy of `geojson` with four extra properties merged
 * into each feature's `properties` object:
 *
 * - `alertSeverity`  – numeric max severity for the province (0 if no alert)
 * - `alertCount`     – number of alerts for the province (0 if none)
 * - `provinceName`   – human-readable name from the GeoJSON `name` property
 * - `provinceCode`   – 2-digit INE province code from `cod_prov`
 *
 * The original `geojson` argument is never mutated.
 */
export function enrichGeoJSON(
  geojson: GeoJSON.FeatureCollection,
  alertsByProvince: Record<string, { maxSeverity: number; alertCount: number }>,
  riskByProvince?: Record<string, { compositeScore: number; severity: string; dominantHazard: string }>
): GeoJSON.FeatureCollection {
  const clone: GeoJSON.FeatureCollection = structuredClone(geojson);

  for (const feature of clone.features) {
    const props = feature.properties ?? {};
    const codProv: string = props['cod_prov'] ?? '';
    const provinceName = (props['name'] as string | undefined) ?? '';

    // Use the INE code directly as the key into alertsByProvince
    const alertData = alertsByProvince[codProv];
    const alertSeverity = alertData?.maxSeverity ?? 0;
    const alertCount = alertData?.alertCount ?? 0;

    // Risk data (optional)
    const riskData = riskByProvince?.[codProv];
    const riskScore = riskData?.compositeScore ?? 0;
    const riskSeverity = riskData?.severity ?? 'low';
    const dominantHazard = riskData?.dominantHazard ?? '';

    feature.properties = {
      ...props,
      alertSeverity,
      alertCount,
      provinceName,
      provinceCode: codProv,
      riskScore,
      riskSeverity,
      dominantHazard,
    };
  }

  return clone;
}

/**
 * Maps a numeric severity level to a Tailwind-compatible hex colour string
 * suitable for filling province polygons on the map.
 *
 *  >= 5 -> red (extreme)
 *  >= 4 -> light-red (severe)
 *  >= 3 -> orange (high)
 *  >= 2 -> yellow (moderate)
 *  >= 1 -> green (low)
 *     0 -> dark background (no alert)
 */
export function severityToColor(severity: number): string {
  if (severity >= 5) return '#dc2626';
  if (severity >= 4) return '#ef4444';
  if (severity >= 3) return '#f97316';
  if (severity >= 2) return '#fbbf24';
  if (severity >= 1) return '#64D2FF';
  return '#16A34A';
}

/**
 * Converts an AEMET textual severity label to its numeric equivalent used
 * throughout the application for comparison and colour mapping.
 */
export function aemetSeverityToNumeric(sev: AemetSeverity): number {
  const map: Record<AemetSeverity, number> = {
    green: 0,
    yellow: 2,
    orange: 3,
    red: 5,
  };
  return map[sev];
}

// Per-province cache for municipality GeoJSON (client-side only).
const municipalityCache: Record<string, GeoJSON.FeatureCollection> = {};

/**
 * Fetches the municipality GeoJSON for a single province (identified by its
 * 2-digit INE code, e.g. "46") and caches it in memory.
 * Subsequent calls for the same code are served from the cache.
 */
export async function loadMunicipalityGeoJSON(
  ineProvinceCode: string
): Promise<GeoJSON.FeatureCollection> {
  if (municipalityCache[ineProvinceCode]) return municipalityCache[ineProvinceCode];
  const res = await fetch(`/geo/municipalities/${ineProvinceCode}.geojson`);
  if (!res.ok) throw new Error(`Failed to load municipalities for province ${ineProvinceCode}`);
  const data = await res.json();
  municipalityCache[ineProvinceCode] = data;
  return data;
}

/**
 * Fetches municipality GeoJSON for multiple provinces in parallel and merges
 * all features into a single FeatureCollection. Provinces that fail to load
 * are silently skipped.
 */
export async function loadMunicipalitiesForProvinces(
  ineProvinceCodes: string[]
): Promise<GeoJSON.FeatureCollection> {
  const collections = await Promise.all(
    ineProvinceCodes.map((code) => loadMunicipalityGeoJSON(code).catch(() => null))
  );

  const features: GeoJSON.Feature[] = [];
  for (const col of collections) {
    if (col) features.push(...col.features);
  }

  return { type: 'FeatureCollection', features };
}

/**
 * Returns a deep-cloned copy of `geojson` with alert data merged into each
 * municipality feature. Municipality-level alerts take precedence; province-level
 * alerts cascade down so municipalities inherit their province's severity.
 * `Math.max()` ensures the highest severity from either source wins.
 *
 * Added properties per feature:
 * - `alertSeverity`      – numeric max severity (municipality or province)
 * - `alertCount`         – combined alert count from both sources
 * - `municipalityName`   – human-readable name from the GeoJSON `name` field
 * - `municipalityCode`   – 5-digit INE municipality code (`cod_muni`)
 * - `provinceCode`       – 2-digit INE province code from `cod_prov`
 */
export function enrichMunicipalityGeoJSON(
  geojson: GeoJSON.FeatureCollection,
  alertsByMunicipality: Record<string, { maxSeverity: number; alertCount: number }>,
  alertsByProvince: Record<string, { maxSeverity: number; alertCount: number }>,
  riskByProvince?: Record<string, { compositeScore: number; severity: string; dominantHazard: string }>
): GeoJSON.FeatureCollection {
  const clone: GeoJSON.FeatureCollection = structuredClone(geojson);

  for (const feature of clone.features) {
    const props = feature.properties ?? {};
    const codMuni: string = props['cod_muni'] ?? '';
    const codProv: string = props['cod_prov'] ?? codMuni.substring(0, 2);

    // Municipality-specific alert takes precedence, then province cascade.
    // Use INE codes directly as keys.
    const muniAlert = alertsByMunicipality[codMuni];
    const provAlert = alertsByProvince[codProv];

    const alertSeverity = Math.max(muniAlert?.maxSeverity ?? 0, provAlert?.maxSeverity ?? 0);
    const alertCount = (muniAlert?.alertCount ?? 0) + (provAlert?.alertCount ?? 0);

    const riskData = riskByProvince?.[codProv];

    feature.properties = {
      ...props,
      alertSeverity,
      alertCount,
      municipalityName: props['name'] ?? '',
      municipalityCode: codMuni,
      provinceCode: codProv,
      riskScore: riskData?.compositeScore ?? 0,
      provinceName: props['name'] ?? '',
    };
  }

  return clone;
}
