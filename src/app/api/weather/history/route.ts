import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import type { PaginatedResponse } from '@/types/api';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get('pageSize') ?? '20', 10)),
    );

    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      prisma.weatherRecord.findMany({
        orderBy: { recordedAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.weatherRecord.count(),
    ]);

    const response: PaginatedResponse<typeof items[number]> = {
      items,
      total,
      page,
      pageSize,
    };

    return NextResponse.json({ success: true, data: response });
  } catch (err) {
    console.error('Weather history error:', err);
    const message =
      err instanceof Error ? err.message : 'Failed to fetch weather history';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
