'use client';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { ParsedWeather } from '@/types/weather';

export interface WeatherCardProps {
  weather: ParsedWeather | null;
  isLoading: boolean;
}

function getWeatherIcon(weather: ParsedWeather): string {
  const { precipitation, cloudCover, windSpeed } = weather;

  if (precipitation > 20) return 'storm';
  if (precipitation > 5) return 'rain';
  if (windSpeed && windSpeed > 50) return 'wind';
  if (cloudCover !== null && cloudCover > 70) return 'cloudy';
  if (cloudCover !== null && cloudCover > 30) return 'partly-cloudy';
  return 'sun';
}

function WeatherIconDisplay({ type }: { type: string }) {
  const icons: Record<string, { symbol: string; label: string }> = {
    sun: { symbol: '\u2600', label: 'Sunny' },
    'partly-cloudy': { symbol: '\u26C5', label: 'Partly Cloudy' },
    cloudy: { symbol: '\u2601', label: 'Cloudy' },
    rain: { symbol: '\uD83C\uDF27', label: 'Rain' },
    storm: { symbol: '\u26C8', label: 'Storm' },
    wind: { symbol: '\uD83C\uDF2C', label: 'Windy' },
  };

  const icon = icons[type] ?? icons.sun;

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-4xl" role="img" aria-label={icon.label}>
        {icon.symbol}
      </span>
      <span className="text-xs text-text-muted">{icon.label}</span>
    </div>
  );
}

function getBorderColor(weather: ParsedWeather): string {
  const { precipitation, temperature, windSpeed } = weather;

  if (precipitation > 20 || (windSpeed && windSpeed > 60)) return 'border-l-severity-5';
  if (precipitation > 10 || temperature > 40) return 'border-l-severity-4';
  if (precipitation > 5 || temperature > 35) return 'border-l-severity-3';
  if (precipitation > 2 || temperature > 30) return 'border-l-severity-2';
  return 'border-l-severity-1';
}

function MetricItem({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-text-muted">{label}</span>
      <span className="text-sm font-medium text-text-secondary">
        {value}
        <span className="text-text-muted ml-0.5">{unit}</span>
      </span>
    </div>
  );
}

export function WeatherCard({ weather, isLoading }: WeatherCardProps) {
  if (isLoading) {
    return (
      <Card padding="md">
        <div className="flex flex-col gap-4">
          <Skeleton width="120px" height="16px" />
          <div className="flex items-center justify-between">
            <Skeleton width="100px" height="48px" rounded="lg" />
            <Skeleton width="48px" height="48px" rounded="full" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Skeleton height="36px" />
            <Skeleton height="36px" />
            <Skeleton height="36px" />
          </div>
        </div>
      </Card>
    );
  }

  if (!weather) {
    return (
      <Card padding="md">
        <p className="text-sm text-text-muted">Weather data unavailable</p>
      </Card>
    );
  }

  const iconType = getWeatherIcon(weather);
  const borderColor = getBorderColor(weather);

  return (
    <Card padding="md" className={`border-l-4 ${borderColor}`}>
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider">
          Current Weather
        </h3>

        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-5xl font-bold text-text-primary tabular-nums">
              {Math.round(weather.temperature)}
            </span>
            <span className="text-2xl text-text-secondary">&deg;C</span>
          </div>
          <WeatherIconDisplay type={iconType} />
        </div>

        <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border">
          <MetricItem
            label="Precipitation"
            value={weather.precipitation.toFixed(1)}
            unit="mm"
          />
          <MetricItem
            label="Humidity"
            value={weather.humidity.toFixed(0)}
            unit="%"
          />
          <MetricItem
            label="Wind"
            value={weather.windSpeed != null ? weather.windSpeed.toFixed(1) : '--'}
            unit="km/h"
          />
        </div>
      </div>
    </Card>
  );
}
