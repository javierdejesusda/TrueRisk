/**
 * Z-Score Anomaly Detection for weather observations.
 *
 * Compares a current weather reading against historical observations
 * to flag statistically unusual values (|z| > 2.0 standard deviations).
 *
 * Pure statistical computation — no external dependencies.
 */

import type { ParsedWeather } from '@/types/weather';

export interface AnomalyResult {
  field: string;
  value: number;
  mean: number;
  stdDev: number;
  zScore: number;
  isAnomaly: boolean;
}

/** Fields to check for anomalies and their accessor on ParsedWeather */
const CHECKED_FIELDS: { name: string; get: (w: ParsedWeather) => number | null }[] = [
  { name: 'temperature', get: (w) => w.temperature },
  { name: 'humidity', get: (w) => w.humidity },
  { name: 'precipitation', get: (w) => w.precipitation },
  { name: 'windSpeed', get: (w) => w.windSpeed },
  { name: 'pressure', get: (w) => w.pressure },
];

/**
 * Detect anomalous weather readings by computing z-scores against a
 * historical baseline.
 *
 * @param current - The most recent weather observation to evaluate
 * @param history - Array of past observations forming the baseline
 * @returns One AnomalyResult per numeric field that is non-null in `current`
 */
export function detectAnomalies(
  current: ParsedWeather,
  history: ParsedWeather[],
): AnomalyResult[] {
  // Cannot compute statistics without history
  if (history.length === 0) {
    return CHECKED_FIELDS
      .map((f) => {
        const value = f.get(current);
        if (value === null) return null;
        return {
          field: f.name,
          value,
          mean: value,
          stdDev: 0,
          zScore: 0,
          isAnomaly: false,
        };
      })
      .filter((r): r is AnomalyResult => r !== null);
  }

  const results: AnomalyResult[] = [];

  for (const field of CHECKED_FIELDS) {
    const currentValue = field.get(current);
    // Skip fields that are null on the current reading
    if (currentValue === null) continue;

    // Collect non-null historical values for this field
    const historicalValues: number[] = [];
    for (const obs of history) {
      const v = field.get(obs);
      if (v !== null) historicalValues.push(v);
    }

    // Need at least 1 historical value to compute a mean
    if (historicalValues.length === 0) {
      results.push({
        field: field.name,
        value: currentValue,
        mean: currentValue,
        stdDev: 0,
        zScore: 0,
        isAnomaly: false,
      });
      continue;
    }

    // Mean
    const sum = historicalValues.reduce((a, b) => a + b, 0);
    const mean = sum / historicalValues.length;

    // Population standard deviation
    const sqDiffSum = historicalValues.reduce((a, v) => a + (v - mean) ** 2, 0);
    const stdDev = Math.sqrt(sqDiffSum / historicalValues.length);

    // Z-score (guard against zero stdDev — all historical values identical)
    let zScore: number;
    if (stdDev === 0) {
      zScore = currentValue === mean ? 0 : currentValue > mean ? Infinity : -Infinity;
    } else {
      zScore = (currentValue - mean) / stdDev;
    }

    results.push({
      field: field.name,
      value: currentValue,
      mean,
      stdDev,
      zScore,
      isAnomaly: Math.abs(zScore) > 2.0,
    });
  }

  return results;
}
