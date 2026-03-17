/**
 * Linear Regression for weather trend projection.
 *
 * Ordinary least-squares regression on a time-ordered series of weather
 * values, with 6-hour and 12-hour ahead projections.
 *
 * Pure statistical computation — no external dependencies.
 */

export interface RegressionResult {
  slope: number;
  intercept: number;
  rSquared: number;
  projected6h: number;
  projected12h: number;
}

/**
 * Fit a least-squares linear regression to `values` and project forward.
 *
 * The x-axis is the step index (0, 1, 2, ..., n-1). Projections assume
 * the same step spacing continues into the future.
 *
 * @param values - Time-ordered numeric observations (oldest first)
 * @returns Regression parameters and 6- and 12-step projections
 */
export function projectTrend(values: number[]): RegressionResult {
  const n = values.length;

  // Edge cases
  if (n === 0) {
    return { slope: 0, intercept: 0, rSquared: 0, projected6h: 0, projected12h: 0 };
  }

  if (n === 1) {
    return {
      slope: 0,
      intercept: values[0],
      rSquared: 1,
      projected6h: values[0],
      projected12h: values[0],
    };
  }

  // ── Summations ──────────────────────────────────────────────────────
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumXX += i * i;
  }

  // ── Slope & intercept ──────────────────────────────────────────────
  // slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX^2)
  const denominator = n * sumXX - sumX * sumX;
  const slope = denominator !== 0 ? (n * sumXY - sumX * sumY) / denominator : 0;
  const intercept = (sumY - slope * sumX) / n;

  // ── R-squared (coefficient of determination) ───────────────────────
  const yMean = sumY / n;
  let ssRes = 0;
  let ssTot = 0;

  for (let i = 0; i < n; i++) {
    const predicted = intercept + slope * i;
    ssRes += (values[i] - predicted) ** 2;
    ssTot += (values[i] - yMean) ** 2;
  }

  const rSquared = ssTot !== 0 ? 1 - ssRes / ssTot : 1;

  // ── Projections ────────────────────────────────────────────────────
  // Project from the end of the series (last index = n-1)
  const projected6h = intercept + slope * (n - 1 + 6);
  const projected12h = intercept + slope * (n - 1 + 12);

  return { slope, intercept, rSquared, projected6h, projected12h };
}
