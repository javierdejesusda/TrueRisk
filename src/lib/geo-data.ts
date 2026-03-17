import type { AemetSeverity } from '@/types/aemet';
import { PROVINCES } from '@/lib/constants/provinces';

// Maps 2-digit INE province codes (used in GeoJSON cod_prov) to the letter
// codes used as keys in the PROVINCES constant.
export const INE_TO_PROVINCE_CODE: Record<string, string> = {
  '01': 'VI', '02': 'AB', '03': 'A',  '04': 'AL', '05': 'AV',
  '06': 'BA', '07': 'PM', '08': 'B',  '09': 'BU', '10': 'CC',
  '11': 'CA', '12': 'CS', '13': 'CR', '14': 'CO', '15': 'C',
  '16': 'CU', '17': 'GI', '18': 'GR', '19': 'GU', '20': 'SS',
  '21': 'HU', '22': 'HU_AR', '23': 'J', '24': 'LE', '25': 'LL',
  '26': 'LO', '27': 'LU', '28': 'M',  '29': 'MA', '30': 'MU',
  '31': 'NA', '32': 'OR', '33': 'O',  '34': 'P',  '35': 'GC',
  '36': 'PO', '37': 'SA', '38': 'TF', '39': 'S',  '40': 'SG',
  '41': 'SE', '42': 'SO', '43': 'T',  '44': 'TE', '45': 'TO',
  '46': 'V',  '47': 'VA', '48': 'BI', '49': 'ZA', '50': 'Z',
  '51': 'CE', '52': 'ML',
};

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
 * - `provinceName`   – human-readable name from PROVINCES (or raw GeoJSON name)
 * - `provinceCode`   – letter code key used in PROVINCES (or empty string)
 *
 * The original `geojson` argument is never mutated.
 */
export function enrichGeoJSON(
  geojson: GeoJSON.FeatureCollection,
  alertsByProvince: Record<string, { maxSeverity: number; alertCount: number }>
): GeoJSON.FeatureCollection {
  // Deep-clone to avoid mutating the cached GeoJSON.
  const clone: GeoJSON.FeatureCollection = JSON.parse(JSON.stringify(geojson));

  for (const feature of clone.features) {
    const props = feature.properties ?? {};
    const codProv: string = props['cod_prov'] ?? '';
    const provinceCode = INE_TO_PROVINCE_CODE[codProv] ?? '';
    const provinceInfo = provinceCode ? PROVINCES[provinceCode] : undefined;
    const provinceName = provinceInfo?.name ?? (props['name'] as string | undefined) ?? '';

    const alertData = alertsByProvince[provinceCode];
    const alertSeverity = alertData?.maxSeverity ?? 0;
    const alertCount = alertData?.alertCount ?? 0;

    feature.properties = {
      ...props,
      alertSeverity,
      alertCount,
      provinceName,
      provinceCode,
    };
  }

  return clone;
}

/**
 * Maps a numeric severity level to a Tailwind-compatible hex colour string
 * suitable for filling province polygons on the map.
 *
 *  >= 5 → red (extreme)
 *  >= 4 → light-red (severe)
 *  >= 3 → orange (high)
 *  >= 2 → yellow (moderate)
 *  >= 1 → green (low)
 *     0 → dark background (no alert)
 */
export function severityToColor(severity: number): string {
  if (severity >= 5) return '#dc2626';
  if (severity >= 4) return '#ef4444';
  if (severity >= 3) return '#f97316';
  if (severity >= 2) return '#fbbf24';
  if (severity >= 1) return '#34d399';
  return '#1a2b1e';
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

// Reverse mapping: province letter code → 2-digit INE province code.
export const PROVINCE_CODE_TO_INE: Record<string, string> = {};
for (const [ine, code] of Object.entries(INE_TO_PROVINCE_CODE)) {
  PROVINCE_CODE_TO_INE[code] = ine;
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
 * - `provinceCode`       – letter code key used in PROVINCES
 */
export function enrichMunicipalityGeoJSON(
  geojson: GeoJSON.FeatureCollection,
  alertsByMunicipality: Record<string, { maxSeverity: number; alertCount: number }>,
  alertsByProvince: Record<string, { maxSeverity: number; alertCount: number }>
): GeoJSON.FeatureCollection {
  const clone: GeoJSON.FeatureCollection = JSON.parse(JSON.stringify(geojson));

  for (const feature of clone.features) {
    const props = feature.properties ?? {};
    const codMuni: string = props['cod_muni'] ?? '';
    const codProv: string = props['cod_prov'] ?? codMuni.substring(0, 2);
    const provinceCode = INE_TO_PROVINCE_CODE[codProv] ?? '';

    // Municipality-specific alert takes precedence, then province cascade.
    const muniAlert = alertsByMunicipality[codMuni];
    const provAlert = alertsByProvince[provinceCode];

    const alertSeverity = Math.max(muniAlert?.maxSeverity ?? 0, provAlert?.maxSeverity ?? 0);
    const alertCount = (muniAlert?.alertCount ?? 0) + (provAlert?.alertCount ?? 0);

    feature.properties = {
      ...props,
      alertSeverity,
      alertCount,
      municipalityName: props['name'] ?? '',
      municipalityCode: codMuni,
      provinceCode,
    };
  }

  return clone;
}
