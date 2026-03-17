/**
 * Gumbel (Type I) Extreme Value Distribution for extreme weather prediction.
 *
 * Models the distribution of maximum weather values to estimate the
 * probability and return periods of extreme events (heavy rainfall,
 * extreme temperatures, high winds).
 *
 * Parameters estimated via method of moments:
 *   beta = (sqrt(6) / pi) * sigma
 *   mu   = mean - gamma * beta   (gamma ~ 0.5772 is Euler-Mascheroni)
 *
 * Pure statistical computation -- no external dependencies.
 */

const EULER_MASCHERONI = 0.5772156649015329;

export interface GumbelParams {
  mu: number;
  beta: number;
}

export interface GumbelAnalysis {
  params: GumbelParams;
  currentValue: number;
  exceedanceProbability: number;
  returnPeriod: number;
  pdfCurve: Array<{ x: number; y: number }>;
  returnLevels: Array<{ period: number; value: number }>;
}

/**
 * Fit a Gumbel distribution to a sample via method of moments.
 */
export function fitGumbel(values: number[]): GumbelParams {
  if (values.length < 2) {
    return { mu: values[0] ?? 0, beta: 1 };
  }

  const n = values.length;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((a, v) => a + (v - mean) ** 2, 0) / n;
  const stdDev = Math.sqrt(variance);

  const beta = Math.max((Math.sqrt(6) / Math.PI) * stdDev, 0.01);
  const mu = mean - EULER_MASCHERONI * beta;

  return { mu, beta };
}

/**
 * Gumbel probability density function.
 * f(x) = (1/beta) * exp(-(z + exp(-z)))  where z = (x - mu) / beta
 */
export function gumbelPDF(x: number, mu: number, beta: number): number {
  const z = (x - mu) / beta;
  return (1 / beta) * Math.exp(-(z + Math.exp(-z)));
}

/**
 * Gumbel cumulative distribution function.
 * F(x) = exp(-exp(-z))  where z = (x - mu) / beta
 */
export function gumbelCDF(x: number, mu: number, beta: number): number {
  const z = (x - mu) / beta;
  return Math.exp(-Math.exp(-z));
}

/**
 * Return level for a given return period T.
 * x_T = mu - beta * ln(-ln(1 - 1/T))
 */
export function computeReturnLevel(period: number, mu: number, beta: number): number {
  if (period <= 1) return mu;
  return mu - beta * Math.log(-Math.log(1 - 1 / period));
}

/**
 * Full extreme value analysis for a weather variable.
 *
 * @param values       - Historical observations (oldest first)
 * @param currentValue - Current observation to evaluate
 * @returns Gumbel analysis with PDF curve, exceedance probability, and return levels
 */
export function analyzeExtremes(values: number[], currentValue: number): GumbelAnalysis {
  const params = fitGumbel(values);
  const { mu, beta } = params;

  const cdf = gumbelCDF(currentValue, mu, beta);
  const exceedanceProbability = Math.max(1 - cdf, 0.0001);
  const returnPeriod = Math.min(1 / exceedanceProbability, 9999);

  // Generate smooth PDF curve for visualisation
  const xMin = Math.max(0, mu - 3 * beta);
  const xMax = Math.max(currentValue * 1.5, mu + 7 * beta);
  const numPoints = 80;
  const step = (xMax - xMin) / numPoints;
  const pdfCurve: Array<{ x: number; y: number }> = [];

  for (let i = 0; i <= numPoints; i++) {
    const x = xMin + step * i;
    pdfCurve.push({
      x: parseFloat(x.toFixed(2)),
      y: parseFloat(gumbelPDF(x, mu, beta).toFixed(6)),
    });
  }

  // Return levels for standard periods
  const periods = [2, 5, 10, 25, 50, 100];
  const returnLevels = periods.map((p) => ({
    period: p,
    value: parseFloat(computeReturnLevel(p, mu, beta).toFixed(1)),
  }));

  return {
    params,
    currentValue,
    exceedanceProbability: parseFloat(exceedanceProbability.toFixed(4)),
    returnPeriod: parseFloat(returnPeriod.toFixed(1)),
    pdfCurve,
    returnLevels,
  };
}
