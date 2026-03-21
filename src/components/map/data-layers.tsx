'use client';

import { useMemo } from 'react';
import { Source, Layer, Marker } from 'react-map-gl/maplibre';
import type { FireHotspot } from '@/hooks/use-fire-hotspots';
import type { Earthquake } from '@/hooks/use-earthquakes';

interface DataLayersProps {
  fireHotspots: FireHotspot[] | null;
  earthquakes: Earthquake[] | null;
  visibleLayers: DataLayerVisibility;
}

export interface DataLayerVisibility {
  fires: boolean;
  earthquakes: boolean;
}

function FireMarker({ fire }: { fire: FireHotspot }) {
  const size = Math.max(8, Math.min(20, fire.frp / 3));
  return (
    <Marker longitude={fire.lon} latitude={fire.lat} anchor="center">
      <div
        className="rounded-full border border-orange-400/60"
        style={{
          width: size,
          height: size,
          backgroundColor: fire.confidence === 'high' || fire.confidence === 'nominal'
            ? 'rgba(249, 115, 22, 0.7)'
            : 'rgba(251, 191, 36, 0.5)',
          boxShadow: '0 0 6px rgba(249, 115, 22, 0.4)',
        }}
        title={`Fire: FRP ${fire.frp.toFixed(1)} MW, ${fire.confidence} confidence\n${fire.acq_date} ${fire.acq_time}`}
      />
    </Marker>
  );
}

function EarthquakeMarker({ quake }: { quake: Earthquake }) {
  const size = Math.max(10, quake.magnitude * 6);
  const opacity = quake.magnitude >= 4 ? 0.9 : quake.magnitude >= 3 ? 0.7 : 0.5;
  const color = quake.magnitude >= 4.5
    ? 'rgba(239, 68, 68, OPACITY)'
    : quake.magnitude >= 3.5
    ? 'rgba(249, 115, 22, OPACITY)'
    : 'rgba(251, 191, 36, OPACITY)';

  const dateStr = quake.timestamp
    ? new Date(quake.timestamp).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
    : '';

  return (
    <Marker longitude={quake.lon} latitude={quake.lat} anchor="center">
      <div
        className="rounded-full flex items-center justify-center"
        style={{
          width: size,
          height: size,
          backgroundColor: color.replace('OPACITY', String(opacity)),
          border: `1.5px solid ${color.replace('OPACITY', '1')}`,
          boxShadow: quake.magnitude >= 4 ? '0 0 10px rgba(239, 68, 68, 0.4)' : undefined,
        }}
        title={`M${quake.magnitude.toFixed(1)} — ${quake.place}\nDepth: ${quake.depth_km.toFixed(0)} km\n${dateStr}`}
      >
        {quake.magnitude >= 3.5 && (
          <span className="text-[8px] font-bold text-white font-[family-name:var(--font-mono)]">
            {quake.magnitude.toFixed(1)}
          </span>
        )}
      </div>
    </Marker>
  );
}

export function DataLayers({ fireHotspots, earthquakes, visibleLayers }: DataLayersProps) {
  // Limit fire markers for performance — show top 200 by FRP
  const topFires = useMemo(() => {
    if (!fireHotspots || !visibleLayers.fires) return [];
    return [...fireHotspots]
      .sort((a, b) => b.frp - a.frp)
      .slice(0, 200);
  }, [fireHotspots, visibleLayers.fires]);

  const visibleQuakes = useMemo(() => {
    if (!earthquakes || !visibleLayers.earthquakes) return [];
    return earthquakes.filter(q => q.magnitude >= 2.5);
  }, [earthquakes, visibleLayers.earthquakes]);

  return (
    <>
      {visibleLayers.fires && topFires.map((fire, i) => (
        <FireMarker key={`fire-${i}`} fire={fire} />
      ))}
      {visibleLayers.earthquakes && visibleQuakes.map((quake, i) => (
        <EarthquakeMarker key={`quake-${i}`} quake={quake} />
      ))}
    </>
  );
}
