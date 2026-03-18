'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/store/app-store';
import type { AemetCapAlert } from '@/types/aemet';
import { aemetSeverityToNumeric } from '@/lib/geo-data';

export interface ProvinceAlertSummary {
  provinceCode: string;
  provinceName: string;
  maxSeverity: number;
  alertCount: number;
  alerts: { title: string; severity: number; hazardType: string; source: 'truerisk' | 'aemet' }[];
}

export interface MapAlertData {
  byProvince: Record<string, ProvinceAlertSummary>;
}

export function useMapAlerts(aemetAlerts: AemetCapAlert[]): MapAlertData {
  const alerts = useAppStore((s) => s.alerts);

  return useMemo(() => {
    const result: Record<string, ProvinceAlertSummary> = {};

    const ensureProvince = (code: string) => {
      if (!result[code]) {
        result[code] = {
          provinceCode: code,
          provinceName: code,
          maxSeverity: 0,
          alertCount: 0,
          alerts: [],
        };
      }
    };

    // 1. Internal TrueRisk alerts (now use province_code INE 2-digit)
    for (const alert of alerts) {
      if (!alert.province_code || !alert.is_active) continue;
      const code = alert.province_code;
      ensureProvince(code);
      result[code].alerts.push({
        title: alert.title,
        severity: alert.severity,
        hazardType: alert.hazard_type,
        source: 'truerisk',
      });
      result[code].alertCount++;
      if (alert.severity > result[code].maxSeverity) {
        result[code].maxSeverity = alert.severity;
      }
    }

    // 2. AEMET alerts by geocode (already INE 2-digit)
    for (const aemet of aemetAlerts) {
      const geocodes = aemet.geocode.split(',').map((g) => g.trim().padStart(2, '0'));
      for (const gc of geocodes) {
        const numericSeverity = aemetSeverityToNumeric(aemet.severity);
        ensureProvince(gc);
        result[gc].alerts.push({
          title: aemet.headline || aemet.event,
          severity: numericSeverity,
          hazardType: aemet.event,
          source: 'aemet',
        });
        result[gc].alertCount++;
        if (numericSeverity > result[gc].maxSeverity) {
          result[gc].maxSeverity = numericSeverity;
        }
      }
    }

    return { byProvince: result };
  }, [alerts, aemetAlerts]);
}
