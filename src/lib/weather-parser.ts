import type { ParsedWeather, RawWeatherData } from '@/types/weather';

/**
 * Parses a Spanish-format decimal string (comma as decimal separator) into a number.
 *
 * @example
 * parseSpanishDecimal("998,1") // => 998.1
 * parseSpanishDecimal("23")    // => 23
 * parseSpanishDecimal(null)    // => null
 * parseSpanishDecimal("")      // => null
 */
export function parseSpanishDecimal(value: string | null | undefined): number | null {
  if (value === null || value === undefined) return null;

  // Handle already-numeric values
  if (typeof value === 'number') return isNaN(value) ? null : value;

  const trimmed = String(value).trim();
  if (trimmed === '') return null;

  // Replace Spanish comma decimal separator with period
  const normalized = trimmed.replace(',', '.');
  const parsed = parseFloat(normalized);

  return isNaN(parsed) ? null : parsed;
}

/**
 * Takes a raw API response and returns a typed ParsedWeather object
 * with all numeric fields properly parsed from Spanish decimal format.
 * Handles both original field names (temperatura, humedad) and the
 * actual hackathon API format (tmed/tmax/tmin, hrMedia, prec, etc.).
 */
export function parseWeatherData(raw: Record<string, unknown>): ParsedWeather {
  const rawData = raw as RawWeatherData;

  const get = (...keys: string[]): number | null => {
    for (const key of keys) {
      const value = rawData[key];
      if (value === undefined || value === null) continue;
      if (typeof value === 'number') return isNaN(value) ? null : value;
      const parsed = parseSpanishDecimal(value as string);
      if (parsed !== null) return parsed;
    }
    return null;
  };

  return {
    temperature: get('temperatura', 'tmed', 'tmax', 'temp_actual') ?? 0,
    humidity: get('humedad', 'hrMedia', 'hrMax', 'hr') ?? 0,
    precipitation: get('precipitacion', 'prec', 'precipitación') ?? 0,
    windSpeed: get('velocidad_viento', 'velmedia', 'vv', 'racha'),
    pressure: get('presion', 'presMax', 'presMin', 'pres'),
    cloudCover: get('nubosidad'),
    visibility: get('visibilidad', 'vis'),
    dewPoint: get('punto_rocio', 'tpr'),
    uvIndex: get('indice_uv', 'uvMax'),
    timestamp: new Date(),
    raw: rawData,
  };
}
