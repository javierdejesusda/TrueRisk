/**
 * Rules-based Decision Tree for emergency classification.
 *
 * Evaluates current weather against a prioritised set of threshold rules
 * to classify the most likely emergency type and confidence level.
 *
 * All matching rules are collected, and the highest-confidence match
 * determines the returned emergency type.
 *
 * Pure computation — no external dependencies.
 */

import type { ParsedWeather } from '@/types/weather';
import type { EmergencyType } from '@/types/alert';

export interface ClassificationResult {
  type: EmergencyType;
  confidence: number;
  matchedRules: string[];
}

// ── Rule definition ──────────────────────────────────────────────────────

interface Rule {
  id: string;
  label: string;
  type: EmergencyType;
  confidence: number;
  test: (w: ParsedWeather) => boolean;
}

const RULES: Rule[] = [
  // FLOOD rules (precipitation + humidity)
  {
    id: 'FLOOD_EXTREME',
    label: 'precip > 100mm AND humidity > 90%',
    type: 'flood',
    confidence: 0.95,
    test: (w) => w.precipitation > 100 && w.humidity > 90,
  },
  {
    id: 'FLOOD_HIGH',
    label: 'precip > 60mm AND humidity > 80%',
    type: 'flood',
    confidence: 0.80,
    test: (w) => w.precipitation > 60 && w.humidity > 80,
  },
  {
    id: 'FLOOD_MODERATE',
    label: 'precip > 30mm AND humidity > 70%',
    type: 'flood',
    confidence: 0.60,
    test: (w) => w.precipitation > 30 && w.humidity > 70,
  },

  // HEAT_WAVE rules (temperature)
  {
    id: 'HEAT_EXTREME',
    label: 'temp > 42°C',
    type: 'heat_wave',
    confidence: 0.95,
    test: (w) => w.temperature > 42,
  },
  {
    id: 'HEAT_HIGH',
    label: 'temp > 38°C',
    type: 'heat_wave',
    confidence: 0.75,
    test: (w) => w.temperature > 38,
  },
  {
    id: 'HEAT_MODERATE',
    label: 'temp > 35°C',
    type: 'heat_wave',
    confidence: 0.55,
    test: (w) => w.temperature > 35,
  },

  // COLD_SNAP rules (temperature)
  {
    id: 'COLD_EXTREME',
    label: 'temp < -10°C',
    type: 'cold_snap',
    confidence: 0.90,
    test: (w) => w.temperature < -10,
  },
  {
    id: 'COLD_HIGH',
    label: 'temp < -5°C',
    type: 'cold_snap',
    confidence: 0.70,
    test: (w) => w.temperature < -5,
  },
  {
    id: 'COLD_MODERATE',
    label: 'temp < 0°C',
    type: 'cold_snap',
    confidence: 0.50,
    test: (w) => w.temperature < 0,
  },

  // WIND_STORM rules (wind speed)
  {
    id: 'WIND_EXTREME',
    label: 'windSpeed > 100km/h',
    type: 'wind_storm',
    confidence: 0.90,
    test: (w) => (w.windSpeed ?? 0) > 100,
  },
  {
    id: 'WIND_HIGH',
    label: 'windSpeed > 80km/h',
    type: 'wind_storm',
    confidence: 0.70,
    test: (w) => (w.windSpeed ?? 0) > 80,
  },
  {
    id: 'WIND_MODERATE',
    label: 'windSpeed > 50km/h',
    type: 'wind_storm',
    confidence: 0.50,
    test: (w) => (w.windSpeed ?? 0) > 50,
  },

  // THUNDERSTORM rule (precipitation + wind)
  {
    id: 'THUNDERSTORM',
    label: 'precip > 20mm AND windSpeed > 40km/h',
    type: 'thunderstorm',
    confidence: 0.60,
    test: (w) => w.precipitation > 20 && (w.windSpeed ?? 0) > 40,
  },
];

/**
 * Classify the current weather into an emergency type using a rules-based
 * decision tree.
 *
 * @param weather - Current weather observation
 * @returns The highest-confidence matching emergency type, along with
 *          a list of all rules that matched
 */
export function classifyEmergency(weather: ParsedWeather): ClassificationResult {
  const matchedRules: string[] = [];
  let bestType: EmergencyType = 'general';
  let bestConfidence = 0.10; // default confidence for 'general'

  for (const rule of RULES) {
    if (rule.test(weather)) {
      matchedRules.push(rule.label);

      if (rule.confidence > bestConfidence) {
        bestConfidence = rule.confidence;
        bestType = rule.type;
      }
    }
  }

  // If no rules matched, return default
  if (matchedRules.length === 0) {
    matchedRules.push('No specific threshold matched — general monitoring');
  }

  return {
    type: bestType,
    confidence: bestConfidence,
    matchedRules,
  };
}
