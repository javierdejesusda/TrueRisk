'use client';

import { useMemo } from 'react';
import { Source, Layer } from 'react-map-gl/maplibre';
import type { CommunityReport } from '@/hooks/use-community-reports';

const HAZARD_COLORS: Record<string, string> = {
  flood: '#3B82F6',
  road_blocked: '#F97316',
  power_outage: '#FBBF24',
  structural_damage: '#EF4444',
  other: '#A855F7',
};

interface ReportMarkersProps {
  reports: CommunityReport[];
}

export function ReportMarkers({ reports }: ReportMarkersProps) {
  const geojson = useMemo((): GeoJSON.FeatureCollection => ({
    type: 'FeatureCollection',
    features: reports.map((r) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [r.longitude, r.latitude] },
      properties: {
        id: r.id,
        hazard_type: r.hazard_type,
        severity: r.severity,
        upvotes: r.upvotes,
        color: HAZARD_COLORS[r.hazard_type] || HAZARD_COLORS.other,
        created_at: r.created_at,
      },
    })),
  }), [reports]);

  if (reports.length === 0) return null;

  return (
    <Source id="community-reports" type="geojson" data={geojson}>
      <Layer
        id="community-reports-circle"
        type="circle"
        paint={{
          'circle-radius': ['interpolate', ['linear'], ['get', 'severity'], 1, 4, 5, 10],
          'circle-color': ['get', 'color'],
          'circle-opacity': 0.8,
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#EEEEF0',
          'circle-stroke-opacity': 0.6,
        }}
      />
    </Source>
  );
}
