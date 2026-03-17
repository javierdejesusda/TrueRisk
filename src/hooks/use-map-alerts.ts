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

export function useMapAlerts(aemetAlerts: AemetCapAlert[]): Record<string, ProvinceAlertSummary> {
  const alerts = useAppStore((s) => s.alerts);

  return useMemo(() => {
    const result: Record<string, ProvinceAlertSummary> = {};

    // Helper to ensure a province entry exists
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

    // 1. Index internal AlertML alerts by province
    for (const alert of alerts) {
      if (!alert.province || !alert.isActive) continue;
      const code = alert.province;
      if (!PROVINCES[code]) continue;

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

    return result;
  }, [alerts, aemetAlerts]);
}
