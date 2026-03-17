/**
 * Risk Engine -- Orchestrates all 6 ML models into a composite 0-100 risk score.
 *
 * CompositeRisk(0-100) =
 *   0.40 * WeatherSeverity    (precip, temp, humidity, wind)
 * + 0.25 * UserVulnerability  (residenceType, specialNeeds)
 * + 0.20 * GeographicRisk     (province, historical flood zones)
 * + 0.15 * PatternAnalysis    (EMA trend, z-score anomalies, KNN similarity)
 */

import { computeEMA } from './ema';
import { detectAnomalies } from './z-score';
import { estimateRisk } from './bayesian';
import { projectTrend } from './regression';
import { classifyEmergency } from './decision-tree';
import { findSimilar } from './knn';
import type { ParsedWeather } from '@/types/weather';
import type { RiskScore, RiskFactor, RiskSeverity } from '@/types/risk';
import { PROVINCES } from '@/lib/constants/provinces';
import { RESIDENCE_TYPES } from '@/lib/constants/residence-types';
import { THRESHOLDS } from '@/lib/constants/thresholds';
import type { ResidenceType, SpecialNeed } from '@/types/user';

// ── Public interface ────────────────────────────────────────────────────

export interface RiskEngineInput {
  current: ParsedWeather;
  history: ParsedWeather[];
  province: string;
  residenceType: ResidenceType;
  specialNeeds: SpecialNeed[];
}

// ── Helpers ─────────────────────────────────────────────────────────────

/** Clamp a number to [min, max]. */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Map a value linearly from 0 at `floor` to 100 at `ceiling`. */
function linearScore(value: number, floor: number, ceiling: number): number {
  if (ceiling === floor) return 0;
  return clamp(((value - floor) / (ceiling - floor)) * 100, 0, 100);
}

// ── Sub-scores ──────────────────────────────────────────────────────────

/**
 * WeatherSeverity (40% weight)
 *
 * Scores each weather parameter against THRESHOLDS and returns a
 * weighted average (precip 40%, temp 25%, wind 25%, humidity 10%).
 */
function computeWeatherSeverity(weather: ParsedWeather): { score: number; details: string } {
  // Precipitation: 0 at 0mm, linearly to 100 at critical (150mm)
  const precipScore = linearScore(weather.precipitation, 0, THRESHOLDS.precipitation.critical);

  // Temperature: distance from comfort zone (15-25 C)
  let tempScore: number;
  const temp = weather.temperature;
  if (temp >= 15 && temp <= 25) {
    tempScore = 0;
  } else if (temp > 25) {
    // Heat side: 25 -> 0, critical (44) -> 100
    tempScore = linearScore(temp, 25, THRESHOLDS.temperature.heat.critical);
  } else {
    // Cold side: 15 -> 0, critical (-15) -> 100
    tempScore = linearScore(15 - temp, 0, 15 - THRESHOLDS.temperature.cold.critical);
  }

  // Wind: 0 at 0km/h, linearly to 100 at critical (130km/h)
  const windSpeed = weather.windSpeed ?? 0;
  const windScore = linearScore(windSpeed, 0, THRESHOLDS.wind.critical);

  // Humidity: penalty when > 90% (flood risk) or < 30% (fire risk)
  let humidityScore: number;
  const humidity = weather.humidity;
  if (humidity > THRESHOLDS.humidity.high) {
    // 90 -> 0, 100 -> 100
    humidityScore = linearScore(humidity, THRESHOLDS.humidity.high, 100);
  } else if (humidity < THRESHOLDS.humidity.low) {
    // 30 -> 0, 0 -> 100
    humidityScore = linearScore(THRESHOLDS.humidity.low - humidity, 0, THRESHOLDS.humidity.low);
  } else {
    humidityScore = 0;
  }

  // Weighted average
  const score = clamp(
    precipScore * 0.4 + tempScore * 0.25 + windScore * 0.25 + humidityScore * 0.1,
    0,
    100,
  );

  const details =
    `precip=${precipScore.toFixed(0)}, temp=${tempScore.toFixed(0)}, ` +
    `wind=${windScore.toFixed(0)}, humidity=${humidityScore.toFixed(0)}`;

  return { score, details };
}

/**
 * UserVulnerability (25% weight)
 *
 * Base from residenceType vulnerability score * 100, plus 10 points per
 * special need, capped at 100.
 */
function computeUserVulnerability(
  residenceType: ResidenceType,
  specialNeeds: SpecialNeed[],
): { score: number; details: string } {
  const info = RESIDENCE_TYPES[residenceType];
  const base = (info?.vulnerabilityScore ?? 0.4) * 100;
  const needsBonus = specialNeeds.length * 10;
  const score = clamp(base + needsBonus, 0, 100);

  const details = `residence=${residenceType} (${base.toFixed(0)}), specialNeeds=${specialNeeds.length} (+${needsBonus})`;
  return { score, details };
}

/**
 * GeographicRisk (20% weight)
 *
 * Province riskWeight * 100.
 */
function computeGeographicRisk(province: string): { score: number; details: string } {
  // Try to find the province by code first, then by name match
  let riskWeight = 0.3; // default
  let matchedName = province;

  const normalised = province.toLowerCase().trim();

  // Check by code
  if (PROVINCES[province]) {
    riskWeight = PROVINCES[province].riskWeight;
    matchedName = PROVINCES[province].name;
  } else {
    // Check by name
    for (const [, info] of Object.entries(PROVINCES)) {
      if (info.name.toLowerCase() === normalised) {
        riskWeight = info.riskWeight;
        matchedName = info.name;
        break;
      }
    }
  }

  const score = clamp(riskWeight * 100, 0, 100);
  const details = `province=${matchedName} (weight=${riskWeight})`;
  return { score, details };
}

/**
 * PatternAnalysis (15% weight)
 *
 * EMA: if trend is 'rising' for precip, add 30 points
 * Z-score: add 15 points per anomaly detected (cap at 60)
 * KNN: if closest historical event distance < 0.3, add 40 points
 * Capped at 100.
 */
function computePatternAnalysis(
  current: ParsedWeather,
  history: ParsedWeather[],
): {
  score: number;
  details: string;
  anomalies: string[];
  trend: string;
  historicalSimilarity: string;
} {
  let score = 0;
  const parts: string[] = [];

  // EMA on precipitation history
  const precipValues = history.map((w) => w.precipitation);
  if (precipValues.length > 0) {
    precipValues.push(current.precipitation);
  }
  const emaResult = precipValues.length > 0 ? computeEMA(precipValues) : computeEMA([current.precipitation]);

  if (emaResult.trend === 'rising') {
    score += 30;
    parts.push('EMA rising (+30)');
  }

  // Also run regression for supplementary trend info
  const regressionValues = precipValues.length > 0 ? precipValues : [current.precipitation];
  const regression = projectTrend(regressionValues);

  const trendDescription =
    `precip EMA ${emaResult.trend} (rate=${emaResult.rateOfChange.toFixed(2)}), ` +
    `regression slope=${regression.slope.toFixed(2)}, R2=${regression.rSquared.toFixed(2)}`;

  // Z-score anomalies
  const anomalyResults = detectAnomalies(current, history);
  const anomalies = anomalyResults.filter((a) => a.isAnomaly).map((a) => a.field);
  const anomalyPoints = clamp(anomalies.length * 15, 0, 60);
  score += anomalyPoints;
  if (anomalies.length > 0) {
    parts.push(`Z-score anomalies: ${anomalies.join(', ')} (+${anomalyPoints})`);
  }

  // KNN similarity
  const knnResults = findSimilar(current, 3);
  const closest = knnResults[0];
  let historicalSimilarity = 'none';
  if (closest && closest.distance < 0.3) {
    score += 40;
    historicalSimilarity = closest.event;
    parts.push(`KNN similar to ${closest.event} (d=${closest.distance.toFixed(3)}, +40)`);
  } else if (closest) {
    historicalSimilarity = closest.event;
    parts.push(`KNN closest: ${closest.event} (d=${closest.distance.toFixed(3)})`);
  }

  score = clamp(score, 0, 100);

  const details = parts.length > 0 ? parts.join('; ') : 'No significant patterns detected';

  return { score, details, anomalies, trend: trendDescription, historicalSimilarity };
}

// ── Severity mapping ────────────────────────────────────────────────────

function mapSeverity(score: number): RiskSeverity {
  if (score <= 20) return 'low';
  if (score <= 40) return 'moderate';
  if (score <= 60) return 'high';
  if (score <= 80) return 'very_high';
  return 'critical';
}

// ── Main entry point ────────────────────────────────────────────────────

/**
 * Compute a composite 0-100 risk score by orchestrating all 6 ML models.
 */
export function computeRiskScore(input: RiskEngineInput): RiskScore {
  const { current, history, province, residenceType, specialNeeds } = input;

  // 1. Weather Severity (40%)
  const weatherSeverity = computeWeatherSeverity(current);

  // 2. User Vulnerability (25%)
  const userVulnerability = computeUserVulnerability(residenceType, specialNeeds);

  // 3. Geographic Risk (20%)
  const geographicRisk = computeGeographicRisk(province);

  // 4. Pattern Analysis (15%)
  const patternAnalysis = computePatternAnalysis(current, history);

  // Composite score
  const compositeScore = clamp(
    weatherSeverity.score * 0.40 +
    userVulnerability.score * 0.25 +
    geographicRisk.score * 0.20 +
    patternAnalysis.score * 0.15,
    0,
    100,
  );

  // Severity
  const severity = mapSeverity(compositeScore);

  // Breakdown
  const breakdown: RiskFactor[] = [
    { name: 'Weather Severity', score: weatherSeverity.score, weight: 0.40, details: weatherSeverity.details },
    { name: 'User Vulnerability', score: userVulnerability.score, weight: 0.25, details: userVulnerability.details },
    { name: 'Geographic Risk', score: geographicRisk.score, weight: 0.20, details: geographicRisk.details },
    { name: 'Pattern Analysis', score: patternAnalysis.score, weight: 0.15, details: patternAnalysis.details },
  ];

  // Decision tree classification
  const classification = classifyEmergency(current);

  // Bayesian probabilities
  const bayesianResults = estimateRisk(current, province);
  const bayesianProbabilities: Record<string, number> = {};
  for (const result of bayesianResults) {
    bayesianProbabilities[result.type] = result.probability;
  }

  return {
    score: Math.round(compositeScore * 100) / 100,
    severity,
    breakdown,
    emergencyType: classification.type,
    anomalies: patternAnalysis.anomalies,
    trend: patternAnalysis.trend,
    historicalSimilarity: patternAnalysis.historicalSimilarity,
    bayesianProbabilities,
  };
}
