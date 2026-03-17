/**
 * K-Nearest Neighbors (KNN) for historical weather pattern matching.
 *
 * Compares current conditions against a pre-seeded dataset of real
 * Spanish weather disasters using Euclidean distance on normalised
 * features. Returns the K closest historical events.
 *
 * Pure computation — no external dependencies beyond types.
 */

import type { ParsedWeather } from '@/types/weather';

export interface KNNResult {
  event: string;
  distance: number;
  outcome: string;
  year: number;
}

export interface HistoricalEvent {
  name: string;
  precipitation: number;  // mm
  temperature: number;    // °C
  humidity: number;        // %
  windSpeed: number;       // km/h
  outcome: string;
  year: number;
}

// ── Normalisation ranges ─────────────────────────────────────────────────
// Reasonable physical ranges for Spanish weather extremes.

const NORM = {
  precip: { min: 0, max: 300 },    // mm
  temp: { min: -15, max: 50 },      // °C
  humidity: { min: 0, max: 100 },   // %
  wind: { min: 0, max: 200 },       // km/h
} as const;

function normalise(value: number, min: number, max: number): number {
  const range = max - min;
  if (range === 0) return 0;
  return (value - min) / range;
}

// ── Historical Spanish weather disasters (pre-seeded) ────────────────────

export const HISTORICAL_EVENTS: HistoricalEvent[] = [
  // DANA / Gota Fría events
  {
    name: 'DANA Valencia Oct 2024',
    precipitation: 200,
    temperature: 20,
    humidity: 95,
    windSpeed: 70,
    outcome: 'Catastrophic flooding in Valencia province, multiple fatalities, severe infrastructure damage',
    year: 2024,
  },
  {
    name: 'DANA Alicante Sep 2019',
    precipitation: 150,
    temperature: 22,
    humidity: 92,
    windSpeed: 60,
    outcome: 'Severe flooding in Alicante and Murcia, road closures, evacuations',
    year: 2019,
  },
  {
    name: 'DANA Murcia Sep 2019',
    precipitation: 130,
    temperature: 23,
    humidity: 90,
    windSpeed: 55,
    outcome: 'Flash floods in Murcia, agricultural damage, river overflows',
    year: 2019,
  },
  {
    name: 'Floods Mallorca Oct 2018',
    precipitation: 180,
    temperature: 19,
    humidity: 93,
    windSpeed: 65,
    outcome: 'Devastating flash floods in Sant Llorenç, 13 fatalities',
    year: 2018,
  },
  {
    name: 'DANA Málaga Nov 2017',
    precipitation: 120,
    temperature: 16,
    humidity: 88,
    windSpeed: 50,
    outcome: 'Urban flooding in Málaga, transport disruption',
    year: 2017,
  },

  // Heat waves
  {
    name: 'Heat wave Jun 2023',
    precipitation: 0,
    temperature: 44,
    humidity: 15,
    windSpeed: 15,
    outcome: 'Extreme heat across southern Spain, temperature records broken, health alerts issued',
    year: 2023,
  },
  {
    name: 'Heat wave Jul 2022',
    precipitation: 0,
    temperature: 45,
    humidity: 12,
    windSpeed: 10,
    outcome: 'Prolonged heat wave, wildfires in Zamora and Cáceres, over 4,000 heat-related deaths in Spain',
    year: 2022,
  },
  {
    name: 'Heat wave Aug 2003',
    precipitation: 0,
    temperature: 44,
    humidity: 18,
    windSpeed: 12,
    outcome: 'Pan-European heat wave, severe impact on Spain, significant mortality increase',
    year: 2003,
  },
  {
    name: 'Heat wave Jun 2019',
    precipitation: 0,
    temperature: 43,
    humidity: 14,
    windSpeed: 8,
    outcome: 'Saharan air mass brought record June temperatures to Catalonia and Aragón',
    year: 2019,
  },

  // Cold snaps
  {
    name: 'Storm Filomena Jan 2021',
    precipitation: 60,
    temperature: -10,
    humidity: 85,
    windSpeed: 70,
    outcome: 'Historic snowfall in Madrid (50cm), transport collapse, 4 fatalities, week-long disruption',
    year: 2021,
  },
  {
    name: 'Cold snap Jan 2017',
    precipitation: 20,
    temperature: -8,
    humidity: 75,
    windSpeed: 40,
    outcome: 'Frost damage to crops in Castilla-La Mancha, icy roads',
    year: 2017,
  },
  {
    name: 'Cold snap Feb 2012',
    precipitation: 15,
    temperature: -12,
    humidity: 70,
    windSpeed: 35,
    outcome: 'Severe cold wave in interior Spain, record lows in Teruel (-25°C locally)',
    year: 2012,
  },

  // Wind storms
  {
    name: 'Storm Gloria Jan 2020',
    precipitation: 100,
    temperature: 8,
    humidity: 85,
    windSpeed: 120,
    outcome: 'Mediterranean storm with hurricane-force winds, 14 fatalities, massive wave damage',
    year: 2020,
  },
  {
    name: 'Storm Klaus Jan 2009',
    precipitation: 40,
    temperature: 5,
    humidity: 80,
    windSpeed: 150,
    outcome: 'Windstorm across northern Spain, widespread power outages, fallen trees',
    year: 2009,
  },
  {
    name: 'Storm Ciarán Nov 2023',
    precipitation: 50,
    temperature: 10,
    humidity: 82,
    windSpeed: 130,
    outcome: 'Strong winds in Galicia and Cantabria, coastal damage, flight cancellations',
    year: 2023,
  },

  // Thunderstorms / mixed events
  {
    name: 'Thunderstorms Madrid Aug 2023',
    precipitation: 45,
    temperature: 32,
    humidity: 72,
    windSpeed: 65,
    outcome: 'Severe thunderstorms with hail in Madrid region, urban flooding',
    year: 2023,
  },
  {
    name: 'Hailstorm Catalonia Aug 2022',
    precipitation: 35,
    temperature: 28,
    humidity: 78,
    windSpeed: 55,
    outcome: 'Large hail and strong winds, crop damage, vehicle damage',
    year: 2022,
  },
  {
    name: 'DANA Barcelona Oct 2020',
    precipitation: 90,
    temperature: 18,
    humidity: 91,
    windSpeed: 45,
    outcome: 'Heavy rain and flooding in Barcelona metropolitan area, river overflow',
    year: 2020,
  },
];

/**
 * Find the K historical weather events most similar to the current
 * weather observation, using Euclidean distance on normalised features.
 *
 * @param weather - Current weather observation
 * @param k       - Number of nearest neighbours to return (default 5)
 * @returns Array of K nearest events sorted by ascending distance
 */
export function findSimilar(weather: ParsedWeather, k: number = 5): KNNResult[] {
  const currentPrecip = normalise(weather.precipitation, NORM.precip.min, NORM.precip.max);
  const currentTemp = normalise(weather.temperature, NORM.temp.min, NORM.temp.max);
  const currentHumidity = normalise(weather.humidity, NORM.humidity.min, NORM.humidity.max);
  const currentWind = normalise(weather.windSpeed ?? 0, NORM.wind.min, NORM.wind.max);

  const distances: KNNResult[] = HISTORICAL_EVENTS.map((event) => {
    const ePrecip = normalise(event.precipitation, NORM.precip.min, NORM.precip.max);
    const eTemp = normalise(event.temperature, NORM.temp.min, NORM.temp.max);
    const eHumidity = normalise(event.humidity, NORM.humidity.min, NORM.humidity.max);
    const eWind = normalise(event.windSpeed, NORM.wind.min, NORM.wind.max);

    const distance = Math.sqrt(
      (currentPrecip - ePrecip) ** 2 +
      (currentTemp - eTemp) ** 2 +
      (currentHumidity - eHumidity) ** 2 +
      (currentWind - eWind) ** 2,
    );

    return {
      event: event.name,
      distance,
      outcome: event.outcome,
      year: event.year,
    };
  });

  // Sort by distance ascending, take top K
  distances.sort((a, b) => a.distance - b.distance);
  return distances.slice(0, Math.max(1, k));
}
