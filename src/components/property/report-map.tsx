'use client';

import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface ReportMapProps {
  latitude: number;
  longitude: number;
  address: string;
}

export function ReportMap({ latitude, longitude, address }: ReportMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: [longitude, latitude],
      zoom: 14,
      attributionControl: false,
      interactive: true,
    });

    // Add marker
    new maplibregl.Marker({ color: '#FBBF24' })
      .setLngLat([longitude, latitude])
      .setPopup(
        new maplibregl.Popup({ offset: 25, closeButton: false }).setHTML(
          `<div style="font-family: sans-serif; font-size: 12px; color: #1a1a2e; padding: 2px 4px;">${address}</div>`
        )
      )
      .addTo(map);

    // Disable scroll zoom for a static-ish experience
    map.scrollZoom.disable();

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [latitude, longitude, address]);

  return (
    <motion.div
      className="rounded-2xl overflow-hidden border border-border"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
    >
      <div ref={mapContainer} className="w-full h-[300px]" />
    </motion.div>
  );
}
