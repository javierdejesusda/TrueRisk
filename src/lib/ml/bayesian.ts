/**
 * Bayesian Risk Estimation for weather emergencies.
 *
 * Applies Bayes' theorem to estimate the posterior probability of each
 * disaster type given current weather conditions and province-specific
 * priors calibrated for Spain.
 *
 * P(disaster | weather) = P(weather | disaster) * P(disaster) / P(weather)
 *
 * Pure statistical computation — no external dependencies.
 */

import type { ParsedWeather } from '@/types/weather';

export interface BayesianResult {
  type: string;
  probability: number;
  prior: number;
  likelihood: number;
}

// ── Provinces on Spain's Mediterranean coast with elevated flood risk ────
const MEDITERRANEAN_PROVINCES = [
  'valencia',
  'alicante',
  'murcia',
  'castellón',
  'castellon',
  'tarragona',
  'barcelona',
  'girona',
  'málaga',
  'malaga',
  'almería',
  'almeria',
];

// ── Season helpers ───────────────────────────────────────────────────────

type Season = 'spring' | 'summer' | 'autumn' | 'winter';

function getSeason(month: number): Season {
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

// ── Prior probabilities ──────────────────────────────────────────────────

function getFloodPrior(province: string): number {
  const normalized = province.toLowerCase().trim();
  return MEDITERRANEAN_PROVINCES.some((p) => normalized.includes(p)) ? 0.15 : 0.05;
}

function getHeatWavePrior(season: Season): number {
  if (season === 'summer') return 0.10;
  if (season === 'winter') return 0.01;
  return 0.04; // spring / autumn — moderate
}

function getColdSnapPrior(season: Season): number {
  if (season === 'winter') return 0.08;
  if (season === 'summer') return 0.01;
  return 0.03;
}

const WIND_STORM_PRIOR = 0.05;

// ── Likelihood functions ─────────────────────────────────────────────────
// Each returns P(weather | disaster) in [0, 1].
// They use sigmoid-style ramps so the output is smooth rather than binary.

function floodLikelihood(weather: ParsedWeather): number {
  const precip = weather.precipitation;
  const humidity = weather.humidity;

  // Both conditions must be present
  if (precip <= 5 || humidity <= 50) return 0.01;

  // Ramp from ~0 at 5mm/50% up to 1.0 at 100mm/95%
  const precipFactor = clamp((precip - 5) / 95, 0, 1);
  const humidityFactor = clamp((humidity - 50) / 45, 0, 1);

  return clamp(precipFactor * humidityFactor, 0.01, 1);
}

function heatWaveLikelihood(weather: ParsedWeather): number {
  const temp = weather.temperature;
  if (temp <= 30) return 0.01;
  // Ramp: 30°C -> 0, 45°C -> 1
  return clamp((temp - 30) / 15, 0.01, 1);
}

function coldSnapLikelihood(weather: ParsedWeather): number {
  const temp = weather.temperature;
  if (temp >= 5) return 0.01;
  // Ramp: 5°C -> 0, -15°C -> 1
  return clamp((5 - temp) / 20, 0.01, 1);
}

function windStormLikelihood(weather: ParsedWeather): number {
  const wind = weather.windSpeed ?? 0;
  if (wind <= 20) return 0.01;
  // Ramp: 20 -> 0, 120 -> 1
  return clamp((wind - 20) / 100, 0.01, 1);
}

// ── Main estimator ───────────────────────────────────────────────────────

/**
 * Estimate the Bayesian posterior probability of each disaster type
 * given the current weather observation and province.
 *
 * @param weather  - Current weather observation
 * @param province - Spanish province name (used for geographic priors)
 * @returns Array of BayesianResult sorted by descending probability
 */
export function estimateRisk(
  weather: ParsedWeather,
  province: string,
): BayesianResult[] {
  const month = new Date().getMonth() + 1; // 1-12
  const season = getSeason(month);

  const models: { type: string; prior: number; likelihood: number }[] = [
    {
      type: 'flood',
      prior: getFloodPrior(province),
      likelihood: floodLikelihood(weather),
    },
    {
      type: 'heat_wave',
      prior: getHeatWavePrior(season),
      likelihood: heatWaveLikelihood(weather),
    },
    {
      type: 'cold_snap',
      prior: getColdSnapPrior(season),
      likelihood: coldSnapLikelihood(weather),
    },
    {
      type: 'wind_storm',
      prior: WIND_STORM_PRIOR,
      likelihood: windStormLikelihood(weather),
    },
  ];

  // Compute un-normalized posteriors
  const unnormalized = models.map((m) => ({
    ...m,
    unnorm: m.prior * m.likelihood,
  }));

  // P(weather) ≈ sum of all P(weather|d)*P(d) — evidence normalization
  const evidence = unnormalized.reduce((sum, m) => sum + m.unnorm, 0);

  const results: BayesianResult[] = unnormalized.map((m) => ({
    type: m.type,
    probability: evidence > 0 ? m.unnorm / evidence : 0,
    prior: m.prior,
    likelihood: m.likelihood,
  }));

  // Sort by highest probability first
  results.sort((a, b) => b.probability - a.probability);

  return results;
}

// ── Utility ──────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
