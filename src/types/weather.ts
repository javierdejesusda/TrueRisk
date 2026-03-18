export interface CurrentWeather {
  province_code: string;
  temperature: number;
  humidity: number;
  precipitation: number;
  wind_speed: number | null;
  wind_direction: number | null;
  wind_gusts: number | null;
  pressure: number | null;
  soil_moisture: number | null;
  uv_index: number | null;
  dew_point: number | null;
  cloud_cover: number | null;
  recorded_at: string;
}

export interface HourlyForecast {
  time: string;
  temperature: number;
  humidity: number;
  precipitation: number;
  wind_speed: number;
  wind_direction: number | null;
  pressure: number | null;
  cloud_cover: number | null;
}

export interface DailyForecast {
  date: string;
  temperature_max: number;
  temperature_min: number;
  precipitation_sum: number;
  wind_speed_max: number;
  uv_index_max: number | null;
  et0_evapotranspiration: number | null;
}

export interface ForecastResponse {
  province_code: string;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
}
