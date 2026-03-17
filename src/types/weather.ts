export interface RawWeatherData {
  // Fields from hackathon API - all strings with Spanish decimal format
  [key: string]: string | number | null;
}

export interface ParsedWeather {
  temperature: number;
  humidity: number;
  precipitation: number;
  windSpeed: number | null;
  pressure: number | null;
  cloudCover: number | null;
  visibility: number | null;
  dewPoint: number | null;
  uvIndex: number | null;
  timestamp: Date;
  raw: RawWeatherData;
}

export interface WeatherTrend {
  field: string;
  direction: 'rising' | 'falling' | 'stable';
  rateOfChange: number;
  values: number[];
}
