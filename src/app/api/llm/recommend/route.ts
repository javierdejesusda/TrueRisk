import { NextResponse } from 'next/server';
import { prisma, initializeDatabase } from '@/lib/db';
import { fetchWeather } from '@/lib/api-client';
import { runRecommendationPipeline } from '@/lib/prompts/pipeline';
import type { UserProfile, ResidenceType, SpecialNeed } from '@/types/user';
import type { ParsedWeather } from '@/types/weather';

/**
 * POST /api/llm/recommend
 *
 * Runs the full 3-stage recommendation pipeline and stores the consultation.
 *
 * Body: { userId?: number, disaster?: boolean }
 * Returns: { success, data: { recommendation, riskScore, processingTime } }
 */
export async function POST(request: Request) {
  try {
    await initializeDatabase();
    // ── Parse request body ──────────────────────────────────────────
    const body = await request.json() as {
      userId?: number;
      disaster?: boolean;
    };

    const { userId, disaster } = body;

    // ── Resolve user profile ────────────────────────────────────────
    let user: UserProfile;

    if (userId !== undefined) {
      const dbUser = await prisma.user.findUnique({ where: { id: userId } });

      if (!dbUser) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 },
        );
      }

      let specialNeeds: SpecialNeed[] = [];
      try {
        specialNeeds = JSON.parse(dbUser.specialNeeds) as SpecialNeed[];
      } catch {
        specialNeeds = [];
      }

      user = {
        id: dbUser.id,
        nickName: dbUser.nickName,
        role: dbUser.role as UserProfile['role'],
        province: dbUser.province,
        residenceType: dbUser.residenceType as ResidenceType,
        specialNeeds,
      };
    } else {
      // Default profile when no userId is provided
      user = {
        id: 0,
        nickName: 'anonymous',
        role: 'citizen',
        province: 'Valencia',
        residenceType: 'piso_bajo',
        specialNeeds: [],
      };
    }

    // ── Fetch current weather ───────────────────────────────────────
    let weather: ParsedWeather;
    try {
      weather = await fetchWeather(disaster);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch weather data';
      return NextResponse.json(
        { success: false, error: message },
        { status: 502 },
      );
    }

    // ── Fetch recent weather history from DB ────────────────────────
    const recentRecords = await prisma.weatherRecord.findMany({
      orderBy: { recordedAt: 'desc' },
      take: 20,
    });

    const history: ParsedWeather[] = recentRecords.map((record) => ({
      temperature: record.temperature,
      humidity: record.humidity,
      precipitation: record.precipitation,
      windSpeed: record.windSpeed,
      pressure: record.pressure,
      cloudCover: null,
      visibility: null,
      dewPoint: null,
      uvIndex: null,
      timestamp: record.recordedAt,
      raw: {},
    }));

    // ── Run pipeline ────────────────────────────────────────────────
    const result = await runRecommendationPipeline(
      user,
      weather,
      history,
      disaster,
    );

    // ── Store consultation in DB ────────────────────────────────────
    if (user.id > 0) {
      await prisma.consultation.create({
        data: {
          userId: user.id,
          systemPrompt: result.systemPrompt,
          userPrompt: result.userPrompt,
          llmResponse: result.recommendation,
          weatherSnapshot: JSON.stringify({
            temperature: weather.temperature,
            humidity: weather.humidity,
            precipitation: weather.precipitation,
            windSpeed: weather.windSpeed,
            pressure: weather.pressure,
            timestamp: weather.timestamp,
          }),
          riskScore: result.riskScore.score,
        },
      });
    }

    // ── Return result ───────────────────────────────────────────────
    return NextResponse.json({
      success: true,
      data: {
        recommendation: result.recommendation,
        riskScore: result.riskScore,
        processingTime: result.processingTime,
      },
    });
  } catch (err) {
    console.error('Recommend pipeline error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
