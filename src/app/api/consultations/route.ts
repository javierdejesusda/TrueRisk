import { NextResponse } from 'next/server';
import { prisma, initializeDatabase } from '@/lib/db';
import type { PaginatedResponse } from '@/types/api';

/**
 * GET /api/consultations?userId=X&page=1&pageSize=10
 *
 * Fetches paginated consultations for a user, ordered by most recent first.
 */
export async function GET(request: Request) {
  try {
    await initializeDatabase();
    const { searchParams } = new URL(request.url);

    const userIdParam = searchParams.get('userId');
    const pageParam = searchParams.get('page');
    const pageSizeParam = searchParams.get('pageSize');

    // ── Validate userId ───────────────────────────────────────────────
    if (!userIdParam) {
      return NextResponse.json(
        { success: false, error: 'userId query parameter is required' },
        { status: 400 },
      );
    }

    const userId = parseInt(userIdParam, 10);
    if (isNaN(userId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid userId parameter' },
        { status: 400 },
      );
    }

    // ── Pagination defaults ───────────────────────────────────────────
    const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(pageSizeParam ?? '10', 10) || 10));
    const skip = (page - 1) * pageSize;

    // ── Fetch consultations with count ────────────────────────────────
    const [items, total] = await Promise.all([
      prisma.consultation.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.consultation.count({
        where: { userId },
      }),
    ]);

    const response: PaginatedResponse<typeof items[number]> = {
      items,
      total,
      page,
      pageSize,
    };

    return NextResponse.json({ success: true, data: response });
  } catch (err) {
    console.error('Consultations GET error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/consultations
 *
 * Stores an external consultation record.
 * Body: { userId, systemPrompt, userPrompt, llmResponse, riskScore? }
 */
export async function POST(request: Request) {
  try {
    await initializeDatabase();
    const body = await request.json() as {
      userId: number;
      systemPrompt: string;
      userPrompt: string;
      llmResponse: string;
      riskScore?: number;
    };

    const { userId, systemPrompt, userPrompt, llmResponse, riskScore } = body;

    // ── Validate required fields ──────────────────────────────────────
    if (!userId || !systemPrompt || !userPrompt || !llmResponse) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: userId, systemPrompt, userPrompt, llmResponse',
        },
        { status: 400 },
      );
    }

    if (typeof userId !== 'number' || isNaN(userId)) {
      return NextResponse.json(
        { success: false, error: 'userId must be a valid number' },
        { status: 400 },
      );
    }

    // ── Verify user exists ────────────────────────────────────────────
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 },
      );
    }

    // ── Create consultation ───────────────────────────────────────────
    const consultation = await prisma.consultation.create({
      data: {
        userId,
        systemPrompt,
        userPrompt,
        llmResponse,
        riskScore: riskScore ?? null,
      },
    });

    return NextResponse.json(
      { success: true, data: consultation },
      { status: 201 },
    );
  } catch (err) {
    console.error('Consultations POST error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
