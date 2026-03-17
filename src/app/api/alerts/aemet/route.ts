import { NextResponse } from 'next/server';
import { fetchAemetAlerts } from '@/lib/aemet-alerts';
import type { AemetAlertResponse } from '@/types/aemet';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const area = searchParams.get('area') || 'esp';

    const alerts = await fetchAemetAlerts(area);

    const response: AemetAlertResponse = {
      alerts,
      fetchedAt: new Date().toISOString(),
      area,
    };

    return NextResponse.json(
      { success: true, data: response },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
        },
      }
    );
  } catch (err) {
    console.error('AEMET alerts GET error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch AEMET alerts' },
      { status: 502 }
    );
  }
}
