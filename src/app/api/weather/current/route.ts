import { NextResponse } from 'next/server';
import { fetchWeather } from '@/lib/api-client';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const disasterParam = searchParams.get('disaster');

    const disaster =
      disasterParam === 'true'
        ? true
        : disasterParam === 'false'
          ? false
          : undefined;

    const weather = await fetchWeather(disaster);

    await prisma.weatherRecord.create({
      data: {
        rawData: JSON.stringify(weather.raw),
        temperature: weather.temperature,
        humidity: weather.humidity,
        precipitation: weather.precipitation,
        windSpeed: weather.windSpeed,
        pressure: weather.pressure,
        isDisaster: disaster === true,
        recordedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, data: weather });
  } catch (err) {
    console.error('Current weather error:', err);
    const message =
      err instanceof Error ? err.message : 'Failed to fetch weather';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
