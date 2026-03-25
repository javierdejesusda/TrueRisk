'use client';

import { useMemo } from 'react';
import { Marker } from 'react-map-gl/maplibre';
import type { SafePointData } from '@/hooks/use-evacuation';

const TYPE_COLORS: Record<string, string> = {
  hospital: 'rgba(239, 68, 68, 0.85)',
  shelter: 'rgba(59, 130, 246, 0.85)',
  fire_station: 'rgba(249, 115, 22, 0.85)',
  high_ground: 'rgba(34, 197, 94, 0.85)',
  police: 'rgba(168, 85, 247, 0.85)',
};

const TYPE_LABELS: Record<string, string> = {
  hospital: 'H',
  shelter: 'S',
  fire_station: 'F',
  high_ground: '\u25B2',
  police: 'P',
};

function SafePointMarker({ point }: { point: SafePointData }) {
  const color = TYPE_COLORS[point.type] || 'rgba(107, 114, 128, 0.8)';
  const label = TYPE_LABELS[point.type] || '?';

  return (
    <Marker longitude={point.longitude} latitude={point.latitude} anchor="center">
      <div
        className="rounded-full flex items-center justify-center border-2 border-white/40"
        style={{
          width: 22,
          height: 22,
          backgroundColor: color,
          boxShadow: `0 0 8px ${color}`,
        }}
        title={`${point.name}\n${point.type}${point.address ? `\n${point.address}` : ''}${point.phone ? `\n${point.phone}` : ''}`}
      >
        <span className="text-[9px] font-bold text-white font-[family-name:var(--font-mono)]">
          {label}
        </span>
      </div>
    </Marker>
  );
}

interface EvacuationLayerProps {
  safePoints: SafePointData[] | null;
  visible: boolean;
}

export function EvacuationLayer({ safePoints, visible }: EvacuationLayerProps) {
  const visiblePoints = useMemo(() => {
    if (!safePoints || !visible) return [];
    return safePoints;
  }, [safePoints, visible]);

  return (
    <>
      {visiblePoints.map((point) => (
        <SafePointMarker key={`sp-${point.id}`} point={point} />
      ))}
    </>
  );
}
