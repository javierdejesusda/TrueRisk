import { describe, it, expect } from 'vitest';

interface WeatherEntry {
  province_code: string;
  temperature: number | null;
}

interface WeatherMarker {
  province_code: string;
  temperature: number;
  latitude: number;
  longitude: number;
}

const SAMPLE_COORDS: Record<string, { lat: number; lng: number }> = {
  '28': { lat: 40.42, lng: -3.70 },
  '08': { lat: 41.39, lng: 2.17 },
};

function filterMarkers(data: WeatherEntry[]): WeatherMarker[] {
  return data
    .map((w) => {
      const coords = SAMPLE_COORDS[w.province_code];
      if (!coords || w.temperature == null) return null;
      return {
        province_code: w.province_code,
        temperature: w.temperature,
        latitude: coords.lat,
        longitude: coords.lng,
      };
    })
    .filter((m): m is WeatherMarker => m !== null);
}

describe('weather marker filtering', () => {
  it('includes entries with valid temperature and coords', () => {
    const result = filterMarkers([{ province_code: '28', temperature: 22 }]);
    expect(result).toHaveLength(1);
    expect(result[0].temperature).toBe(22);
  });

  it('excludes entries with null temperature', () => {
    const result = filterMarkers([{ province_code: '28', temperature: null }]);
    expect(result).toHaveLength(0);
  });

  it('excludes entries with unknown province code', () => {
    const result = filterMarkers([{ province_code: '99', temperature: 20 }]);
    expect(result).toHaveLength(0);
  });

  it('handles mixed valid and invalid entries', () => {
    const result = filterMarkers([
      { province_code: '28', temperature: 22 },
      { province_code: '08', temperature: null },
      { province_code: '99', temperature: 18 },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].province_code).toBe('28');
  });

  it('handles empty input', () => {
    expect(filterMarkers([])).toHaveLength(0);
  });
});
