'use client';

import { useMemo } from 'react';
import { Marker } from 'react-map-gl/maplibre';
import type { FireHotspot } from '@/hooks/use-fire-hotspots';
import type { Earthquake } from '@/hooks/use-earthquakes';
import type { RiverGaugeFeature } from '@/hooks/use-river-gauges';

export interface ReservoirPoint {
  name: string;
  lat?: number;
  lon?: number;
  capacity_hm3: number;
  volume_hm3: number;
}

interface DataLayersProps {
  fireHotspots: FireHotspot[] | null;
  earthquakes: Earthquake[] | null;
  reservoirs?: ReservoirPoint[] | null;
  riverGauges?: RiverGaugeFeature[] | null;
  visibleLayers: DataLayerVisibility;
}

export interface DataLayerVisibility {
  fires: boolean;
  earthquakes: boolean;
  reservoirs: boolean;
  riverGauges: boolean;
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

function ReservoirMarker({ reservoir }: { reservoir: ReservoirPoint }) {
  const fillPct = reservoir.capacity_hm3 > 0
    ? (reservoir.volume_hm3 / reservoir.capacity_hm3) * 100
    : 0;
  const size = Math.max(10, Math.min(20, reservoir.capacity_hm3 / 50));
  const color = fillPct >= 70 ? 'rgba(59, 130, 246, 0.7)'
    : fillPct >= 40 ? 'rgba(251, 191, 36, 0.7)'
    : 'rgba(239, 68, 68, 0.7)';

  return (
    <Marker longitude={reservoir.lon ?? 0} latitude={reservoir.lat ?? 0} anchor="center">
      <div
        className="rounded-full border border-blue-400/60"
        style={{
          width: size,
          height: size,
          backgroundColor: color,
          boxShadow: '0 0 6px rgba(59, 130, 246, 0.3)',
        }}
        title={`${reservoir.name}\n${fillPct.toFixed(0)}% full (${reservoir.volume_hm3.toFixed(1)} / ${reservoir.capacity_hm3.toFixed(1)} hm\u00b3)`}
      />
    </Marker>
  );
}

function RiverGaugeMarker({ gauge }: { gauge: RiverGaugeFeature }) {
  const { properties: p, geometry: g } = gauge;
  const color = p.status === 'critical' ? 'rgba(239, 68, 68, 0.85)'
    : p.status === 'warning' ? 'rgba(249, 115, 22, 0.8)'
    : p.status === 'alert' ? 'rgba(251, 191, 36, 0.75)'
    : p.status === 'offline' ? 'rgba(107, 114, 128, 0.6)'
    : 'rgba(59, 130, 246, 0.7)';
  const flow = p.flow_m3s != null ? `${p.flow_m3s.toFixed(1)} m³/s` : 'No data';

  return (
    <Marker longitude={g.coordinates[0]} latitude={g.coordinates[1]} anchor="center">
      <div
        className="rounded-sm border border-cyan-400/40"
        style={{
          width: 10,
          height: 10,
          backgroundColor: color,
          boxShadow: p.status === 'critical' ? '0 0 8px rgba(239, 68, 68, 0.5)' : '0 0 4px rgba(59, 130, 246, 0.3)',
        }}
        title={`${p.name} (${p.river})\n${flow}\nBasin: ${p.basin}\nStatus: ${p.status}`}
      />
    </Marker>
  );
}

export function DataLayers({ fireHotspots, earthquakes, reservoirs, riverGauges, visibleLayers }: DataLayersProps) {
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

  const visibleReservoirs = useMemo(() => {
    if (!reservoirs || !visibleLayers.reservoirs) return [];
    return reservoirs.filter(r => r.lat != null && r.lon != null);
  }, [reservoirs, visibleLayers.reservoirs]);

  const visibleGauges = useMemo(() => {
    if (!riverGauges || !visibleLayers.riverGauges) return [];
    return riverGauges;
  }, [riverGauges, visibleLayers.riverGauges]);

  return (
    <>
      {visibleLayers.fires && topFires.map((fire, i) => (
        <FireMarker key={`fire-${i}`} fire={fire} />
      ))}
      {visibleLayers.earthquakes && visibleQuakes.map((quake, i) => (
        <EarthquakeMarker key={`quake-${i}`} quake={quake} />
      ))}
      {visibleLayers.reservoirs && visibleReservoirs.map((res, i) => (
        <ReservoirMarker key={`reservoir-${i}`} reservoir={res} />
      ))}
      {visibleLayers.riverGauges && visibleGauges.map((gauge, i) => (
        <RiverGaugeMarker key={`gauge-${i}`} gauge={gauge} />
      ))}
    </>
  );
}
