import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

interface Municipality {
  code: string;
  name: string;
  province: string;
}

let cachedIndex: Municipality[] | null = null;

function loadIndex(): Municipality[] {
  if (cachedIndex) return cachedIndex;
  const filePath = join(process.cwd(), 'public', 'geo', 'municipalities-index.json');
  cachedIndex = JSON.parse(readFileSync(filePath, 'utf8'));
  return cachedIndex!;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.toLowerCase() ?? '';
    const provinceFilter = searchParams.get('province') ?? '';

    const index = loadIndex();

    let results = index;

    // Filter by province INE code (2-digit)
    if (provinceFilter) {
      results = results.filter((m) => m.province === provinceFilter);
    }

    // Search by name
    if (query) {
      results = results.filter((m) => m.name.toLowerCase().includes(query));
    }

    // Limit results
    const limited = results.slice(0, 50);

    return NextResponse.json(
      { success: true, data: limited, total: results.length },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=300',
        },
      }
    );
  } catch (err) {
    console.error('Municipality search error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to search municipalities' },
      { status: 500 }
    );
  }
}
