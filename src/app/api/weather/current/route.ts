import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSessionFromCookies } from '@/lib/auth';
import { fetchWeather } from '@/lib/api-client';
import { fetchMunicipalityForecast } from '@/lib/aemet-forecast';
import { prisma, initializeDatabase } from '@/lib/db';
import type { ParsedWeather } from '@/types/weather';

// Province name -> AEMET capital municipality code
const PROVINCE_CAPITAL_CODES: Record<string, string> = {
  'Madrid': '28079',
  'Valencia': '46250',
  'Alicante': '03014',
  'Murcia': '30030',
  'Malaga': '29067',
  'Castellon': '12040',
  'Almeria': '04013',
  'Barcelona': '08019',
  'Sevilla': '41091',
  'Cadiz': '11012',
  'Tarragona': '43148',
  'Girona': '17079',
  'Illes Balears': '07040',
  'Granada': '18087',
  'Huelva': '21041',
  'Cordoba': '14021',
  'Jaen': '23050',
  'Zaragoza': '50297',
  'Toledo': '45168',
  'Albacete': '02003',
  'Cuenca': '16078',
  'Ciudad Real': '13034',
  'Guadalajara': '19130',
  'Valladolid': '47186',
  'Salamanca': '37274',
  'Segovia': '40194',
  'Avila': '05019',
  'Burgos': '09059',
  'Leon': '24089',
  'Palencia': '34120',
  'Soria': '42173',
  'Zamora': '49275',
  'La Rioja': '26089',
  'Navarra': '31201',
  'Teruel': '44216',
  'Huesca': '22125',
  'Caceres': '10037',
  'Badajoz': '06015',
  'Lleida': '25120',
  'Gipuzkoa': '20069',
  'Bizkaia': '48020',
  'Araba': '01059',
  'Cantabria': '39075',
  'Asturias': '33044',
  'A Coruna': '15030',
  'Lugo': '27028',
  'Ourense': '32054',
  'Pontevedra': '36038',
  'Santa Cruz de Tenerife': '38038',
  'Las Palmas': '35016',
  'Ceuta': '51001',
  'Melilla': '52001',
};

/**
 * Try to get current weather from AEMET hourly forecast for the user's province.
 * Returns null if AEMET is unavailable or the province has no mapping.
 */
async function fetchAemetWeather(province: string): Promise<ParsedWeather | null> {
  const municipioCode = PROVINCE_CAPITAL_CODES[province];
  if (!municipioCode) return null;

  try {
    const forecast = await fetchMunicipalityForecast(municipioCode);
    if (!forecast || forecast.hourly.length === 0) return null;

    // Find the hourly entry closest to the current time
    const now = new Date();
    let best = forecast.hourly[0];
    let bestDiff = Infinity;

    for (const h of forecast.hourly) {
      const hourTime = new Date(h.hour);
      const diff = Math.abs(now.getTime() - hourTime.getTime());
      if (diff < bestDiff) {
        bestDiff = diff;
        best = h;
      }
    }

    return {
      temperature: best.temperature,
      humidity: best.humidity,
      precipitation: best.precipitation,
      windSpeed: best.windSpeed,
      pressure: null,
      cloudCover: null,
      visibility: null,
      dewPoint: null,
      uvIndex: null,
      timestamp: new Date(best.hour),
      raw: { source: 'aemet', municipality: municipioCode, province },
    };
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    await initializeDatabase();
    const { searchParams } = new URL(request.url);
    const disasterParam = searchParams.get('disaster');

    const disaster =
      disasterParam === 'true'
        ? true
        : disasterParam === 'false'
          ? false
          : undefined;

    // Try to get user's province from session
    let province: string | null = null;
    try {
      const cookieStore = await cookies();
      const session = await getSessionFromCookies(cookieStore);
      if (session) {
        const user = await prisma.user.findUnique({ where: { id: session.id } });
        if (user) province = user.province;
      }
    } catch {
      // Session reading failed -- continue without province
    }

    // Try AEMET first for province-specific weather
    let weather: ParsedWeather | null = null;
    if (province && !disaster) {
      weather = await fetchAemetWeather(province);
    }

    // Fall back to hackathon API
    if (!weather) {
      weather = await fetchWeather(disaster);
    }

    // Non-blocking DB write — don't delay the response
    prisma.weatherRecord.create({
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
    }).catch((err) => console.error('Weather record write failed:', err));

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
