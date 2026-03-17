/**
 * Weather thresholds per severity level.
 * Used to classify weather conditions into risk categories.
 */
export const THRESHOLDS = {
  /** Precipitation thresholds in mm */
  precipitation: {
    low: 10,
    moderate: 30,
    high: 60,
    very_high: 100,
    critical: 150,
  },

  /** Temperature thresholds in degrees Celsius */
  temperature: {
    heat: {
      moderate: 35,
      high: 38,
      very_high: 40,
      critical: 44,
    },
    cold: {
      moderate: 0,
      high: -5,
      very_high: -10,
      critical: -15,
    },
  },

  /** Wind speed thresholds in km/h */
  wind: {
    low: 30,
    moderate: 50,
    high: 80,
    very_high: 100,
    critical: 130,
  },

  /** Humidity thresholds in % */
  humidity: {
    low: 30,
    high: 90,
  },
} as const;

export type ThresholdCategory = keyof typeof THRESHOLDS;
