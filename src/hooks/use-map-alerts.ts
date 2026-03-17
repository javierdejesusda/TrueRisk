'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/store/app-store';
import type { AemetCapAlert } from '@/types/aemet';
import { INE_TO_PROVINCE_CODE, aemetSeverityToNumeric } from '@/lib/geo-data';
import { PROVINCES } from '@/lib/constants/provinces';

export interface ProvinceAlertSummary {
  provinceCode: string;
  provinceName: string;
  maxSeverity: number;
  alertCount: number;
  alerts: { title: string; severity: number; type: string; source: 'alertml' | 'aemet' }[];
}

export interface MunicipalityAlertSummary {
  municipalityCode: string;
  municipalityName: string;
  maxSeverity: number;
  alertCount: number;
  alerts: { title: string; severity: number; type: string; source: 'alertml' | 'aemet' }[];
}

export interface MapAlertData {
  byProvince: Record<string, ProvinceAlertSummary>;
  byMunicipality: Record<string, MunicipalityAlertSummary>;
}

// Reverse lookup: province name -> province code
const NAME_TO_CODE: Record<string, string> = {};
for (const [code, info] of Object.entries(PROVINCES)) {
  NAME_TO_CODE[info.name.toLowerCase()] = code;
}

function resolveProvinceCode(province: string): string | null {
  if (PROVINCES[province]) return province;
  return NAME_TO_CODE[province.toLowerCase()] ?? null;
}

export function useMapAlerts(aemetAlerts: AemetCapAlert[]): MapAlertData {
  const alerts = useAppStore((s) => s.alerts);

  return useMemo(() => {
    const result: Record<string, ProvinceAlertSummary> = {};
    const byMunicipality: Record<string, MunicipalityAlertSummary> = {};

    const ensureProvince = (code: string) => {
      if (!result[code]) {
        const info = PROVINCES[code];
        result[code] = {
          provinceCode: code,
          provinceName: info?.name ?? code,
          maxSeverity: 0,
          alertCount: 0,
          alerts: [],
        };
      }
    };

    // 1. Index internal AlertML alerts by province (supports both codes and names)
    for (const alert of alerts) {
      if (!alert.province || !alert.isActive) continue;
      const code = resolveProvinceCode(alert.province);
      if (!code) continue;

      ensureProvince(code);
      result[code].alerts.push({
        title: alert.title,
        severity: alert.severity,
        type: alert.type,
        source: 'alertml',
      });
      result[code].alertCount++;
      if (alert.severity > result[code].maxSeverity) {
        result[code].maxSeverity = alert.severity;
      }
    }

    // 2. Index AEMET alerts by geocode -> province code
    for (const aemet of aemetAlerts) {
      // geocode may be comma-separated if multiple values
      const geocodes = aemet.geocode.split(',').map(g => g.trim());
      for (const gc of geocodes) {
        // Try direct INE mapping (2-digit codes)
        const code = INE_TO_PROVINCE_CODE[gc.padStart(2, '0')];
        if (!code || !PROVINCES[code]) continue;

        const numericSeverity = aemetSeverityToNumeric(aemet.severity);
        ensureProvince(code);
        result[code].alerts.push({
          title: aemet.headline || aemet.event,
          severity: numericSeverity,
          type: aemet.event,
          source: 'aemet',
        });
        result[code].alertCount++;
        if (numericSeverity > result[code].maxSeverity) {
          result[code].maxSeverity = numericSeverity;
        }
      }
    }

    // 3. Index internal AlertML alerts by municipality
    for (const alert of alerts) {
      if (!alert.municipality || !alert.isActive) continue;
      const muniCode = alert.municipality;
      if (!byMunicipality[muniCode]) {
        byMunicipality[muniCode] = {
          municipalityCode: muniCode,
          municipalityName: muniCode, // Name resolved later by map component
          maxSeverity: 0,
          alertCount: 0,
          alerts: [],
        };
      }
      byMunicipality[muniCode].alerts.push({
        title: alert.title,
        severity: alert.severity,
        type: alert.type,
        source: 'alertml',
      });
      byMunicipality[muniCode].alertCount++;
      if (alert.severity > byMunicipality[muniCode].maxSeverity) {
        byMunicipality[muniCode].maxSeverity = alert.severity;
      }
    }

    return { byProvince: result, byMunicipality };
  }, [alerts, aemetAlerts]);
}
