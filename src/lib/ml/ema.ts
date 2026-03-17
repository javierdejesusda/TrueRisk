/**
 * Exponential Moving Average (EMA) for weather trend detection.
 *
 * Pure statistical computation — no external dependencies.
 * Used by the Risk Engine to detect accelerating weather patterns
 * (e.g., rapidly rising temperatures, increasing precipitation).
 */

export interface EMAResult {
  ema: number[];
  trend: 'rising' | 'falling' | 'stable';
  rateOfChange: number;
}

/**
 * Compute an Exponential Moving Average over an array of numeric values.
 *
 * @param values - Time-ordered numeric observations (oldest first)
 * @param alpha  - Smoothing factor in (0, 1]. Default 0.3.
 *                 Higher alpha = more weight on recent values.
 * @returns EMA series, overall trend classification, and rate of change
 */
export function computeEMA(values: number[], alpha: number = 0.3): EMAResult {
  // Edge case: empty or single-value input
  if (values.length === 0) {
    return { ema: [], trend: 'stable', rateOfChange: 0 };
  }

  if (values.length === 1) {
    return { ema: [values[0]], trend: 'stable', rateOfChange: 0 };
  }

  // Clamp alpha to valid range
  const a = Math.max(0.001, Math.min(1, alpha));

  // Compute EMA series: EMA_0 = value_0, EMA_t = a * value_t + (1 - a) * EMA_{t-1}
  const ema: number[] = [values[0]];
  for (let i = 1; i < values.length; i++) {
    ema.push(a * values[i] + (1 - a) * ema[i - 1]);
  }

  const first = ema[0];
  const last = ema[ema.length - 1];
  const diff = last - first;

  // Range of the EMA series for relative comparison
  let min = ema[0];
  let max = ema[0];
  for (let i = 1; i < ema.length; i++) {
    if (ema[i] < min) min = ema[i];
    if (ema[i] > max) max = ema[i];
  }
  const range = max - min;

  // Trend: rising if diff > 5% of range, falling if < -5%, otherwise stable
  let trend: 'rising' | 'falling' | 'stable';
  if (range === 0) {
    trend = 'stable';
  } else if (diff > 0.05 * range) {
    trend = 'rising';
  } else if (diff < -0.05 * range) {
    trend = 'falling';
  } else {
    trend = 'stable';
  }

  // Rate of change: average change per step
  const rateOfChange = diff / values.length;

  return { ema, trend, rateOfChange };
}
