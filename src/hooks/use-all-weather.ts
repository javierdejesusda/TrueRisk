'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { CurrentWeather } from '@/types/weather';

const REFRESH_INTERVAL = 300_000;

// Province capital coordinates (INE code -> lat/lng)
const PROVINCE_COORDS: Record<string, { lat: number; lng: number }> = {
  '01': { lat: 42.85, lng: -2.67 },  // Álava
  '02': { lat: 38.99, lng: -1.86 },  // Albacete
  '03': { lat: 38.35, lng: -0.48 },  // Alicante
  '04': { lat: 36.83, lng: -2.46 },  // Almería
  '05': { lat: 40.66, lng: -4.70 },  // Ávila
  '06': { lat: 38.88, lng: -6.97 },  // Badajoz
  '07': { lat: 39.57, lng: 2.65 },   // Illes Balears
  '08': { lat: 41.39, lng: 2.17 },   // Barcelona
  '09': { lat: 42.34, lng: -3.70 },  // Burgos
  '10': { lat: 39.47, lng: -6.37 },  // Cáceres
  '11': { lat: 36.53, lng: -6.29 },  // Cádiz
  '12': { lat: 39.99, lng: -0.03 },  // Castellón
  '13': { lat: 38.99, lng: -3.93 },  // Ciudad Real
  '14': { lat: 37.88, lng: -4.77 },  // Córdoba
  '15': { lat: 43.37, lng: -8.40 },  // A Coruña
  '16': { lat: 40.07, lng: -2.14 },  // Cuenca
  '17': { lat: 41.98, lng: 2.82 },   // Girona
  '18': { lat: 37.18, lng: -3.60 },  // Granada
  '19': { lat: 40.63, lng: -3.17 },  // Guadalajara
  '20': { lat: 43.32, lng: -1.98 },  // Gipuzkoa
  '21': { lat: 37.26, lng: -6.95 },  // Huelva
  '22': { lat: 42.14, lng: -0.41 },  // Huesca
  '23': { lat: 37.77, lng: -3.79 },  // Jaén
  '24': { lat: 42.60, lng: -5.57 },  // León
  '25': { lat: 41.62, lng: 0.62 },   // Lleida
  '26': { lat: 42.47, lng: -2.45 },  // La Rioja
  '27': { lat: 43.01, lng: -7.56 },  // Lugo
  '28': { lat: 40.42, lng: -3.70 },  // Madrid
  '29': { lat: 36.72, lng: -4.42 },  // Málaga
  '30': { lat: 37.98, lng: -1.13 },  // Murcia
  '31': { lat: 42.82, lng: -1.64 },  // Navarra
  '32': { lat: 42.34, lng: -7.86 },  // Ourense
  '33': { lat: 43.36, lng: -5.85 },  // Asturias
  '34': { lat: 42.01, lng: -4.53 },  // Palencia
  '35': { lat: 28.10, lng: -15.41 }, // Las Palmas
  '36': { lat: 42.43, lng: -8.64 },  // Pontevedra
  '37': { lat: 40.97, lng: -5.66 },  // Salamanca
  '38': { lat: 28.47, lng: -16.25 }, // S.C. Tenerife
  '39': { lat: 43.46, lng: -3.80 },  // Cantabria
  '40': { lat: 40.95, lng: -4.12 },  // Segovia
  '41': { lat: 37.39, lng: -5.98 },  // Sevilla
  '42': { lat: 41.76, lng: -2.46 },  // Soria
  '43': { lat: 41.12, lng: 1.25 },   // Tarragona
  '44': { lat: 40.35, lng: -1.11 },  // Teruel
  '45': { lat: 39.86, lng: -4.02 },  // Toledo
  '46': { lat: 39.47, lng: -0.38 },  // Valencia
  '47': { lat: 41.65, lng: -4.72 },  // Valladolid
  '48': { lat: 43.26, lng: -2.93 },  // Bizkaia
  '49': { lat: 41.50, lng: -5.75 },  // Zamora
  '50': { lat: 41.65, lng: -0.88 },  // Zaragoza
  '51': { lat: 35.89, lng: -5.32 },  // Ceuta
  '52': { lat: 35.29, lng: -2.94 },  // Melilla
};

export interface WeatherMarker {
  province_code: string;
  temperature: number;
  latitude: number;
  longitude: number;
}

export function useAllWeather() {
  const [data, setData] = useState<CurrentWeather[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/weather/all');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as CurrentWeather[];
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch all weather');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  const markers = useMemo<WeatherMarker[]>(() => {
    return data
      .map((w) => {
        const coords = PROVINCE_COORDS[w.province_code];
        if (!coords || w.temperature == null) return null;
        return {
          province_code: w.province_code,
          temperature: w.temperature,
          latitude: coords.lat,
          longitude: coords.lng,
        };
      })
      .filter((m): m is WeatherMarker => m !== null);
  }, [data]);

  return { data, markers, isLoading, error, refresh: fetchData };
}
