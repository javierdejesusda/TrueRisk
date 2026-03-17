import { NextResponse } from 'next/server';
import { fetchMunicipalityForecast } from '@/lib/aemet-forecast';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ municipio: string }> }
) {
  try {
    const { municipio } = await params;

    if (!/^\d{5}$/.test(municipio)) {
      return NextResponse.json(
        { success: false, error: 'Invalid municipality code (must be 5 digits)' },
        { status: 400 }
      );
    }

    const forecast = await fetchMunicipalityForecast(municipio);

    if (!forecast) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch forecast' },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { success: true, data: forecast },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=120',
        },
      }
    );
  } catch (err) {
    console.error('Forecast route error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
