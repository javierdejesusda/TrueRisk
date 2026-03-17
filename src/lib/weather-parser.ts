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
 * Maps raw hackathon API field names to ParsedWeather property names.
 */
const FIELD_MAP: Record<string, keyof Omit<ParsedWeather, 'timestamp' | 'raw'>> = {
  temperatura: 'temperature',
  humedad: 'humidity',
  precipitacion: 'precipitation',
  velocidad_viento: 'windSpeed',
  presion: 'pressure',
  nubosidad: 'cloudCover',
  visibilidad: 'visibility',
  punto_rocio: 'dewPoint',
  indice_uv: 'uvIndex',
};

/**
 * Takes a raw API response and returns a typed ParsedWeather object
 * with all numeric fields properly parsed from Spanish decimal format.
 */
export function parseWeatherData(raw: Record<string, unknown>): ParsedWeather {
  const rawData = raw as RawWeatherData;

  const getField = (spanishKey: string): number | null => {
    const value = rawData[spanishKey];
    if (typeof value === 'number') return isNaN(value) ? null : value;
    return parseSpanishDecimal(value as string | null | undefined);
  };

  return {
    temperature: getField('temperatura') ?? 0,
    humidity: getField('humedad') ?? 0,
    precipitation: getField('precipitacion') ?? 0,
    windSpeed: getField('velocidad_viento'),
    pressure: getField('presion'),
    cloudCover: getField('nubosidad'),
    visibility: getField('visibilidad'),
    dewPoint: getField('punto_rocio'),
    uvIndex: getField('indice_uv'),
    timestamp: new Date(),
    raw: rawData,
  };
}
