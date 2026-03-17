import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSessionFromCookies } from '@/lib/auth';
import { fetchWeather } from '@/lib/api-client';
import { prisma } from '@/lib/db';
import { computeRiskScore } from '@/lib/ml/risk-engine';
import type { ParsedWeather } from '@/types/weather';
import type { ResidenceType, SpecialNeed } from '@/types/user';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get('userId');

    // ── Resolve user profile ────────────────────────────────────────
    let province = 'Valencia';
    let residenceType: ResidenceType = 'piso_bajo';
    let specialNeeds: SpecialNeed[] = [];

    // Try session-based auth (non-blocking)
    const cookieStore = await cookies();
    const session = await getSessionFromCookies(cookieStore);

    if (userIdParam) {
      const userId = parseInt(userIdParam, 10);

      if (isNaN(userId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid userId parameter' },
          { status: 400 },
        );
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });

      if (user) {
        province = user.province;
        residenceType = user.residenceType as ResidenceType;
        try {
          specialNeeds = JSON.parse(user.specialNeeds) as SpecialNeed[];
        } catch {
          specialNeeds = [];
        }
      }
    } else if (session) {
      // Fall back to session user if no explicit userId
      const user = await prisma.user.findUnique({ where: { id: session.id } });

      if (user) {
        province = user.province;
        residenceType = user.residenceType as ResidenceType;
        try {
          specialNeeds = JSON.parse(user.specialNeeds) as SpecialNeed[];
        } catch {
          specialNeeds = [];
        }
      }
    }

    // ── Fetch current weather ───────────────────────────────────────
    let current: ParsedWeather;
    try {
      current = await fetchWeather();
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

    // ── Compute risk score ──────────────────────────────────────────
    const riskScore = computeRiskScore({
      current,
      history,
      province,
      residenceType,
      specialNeeds,
    });

    // ── Store weather record in DB ──────────────────────────────────
    await prisma.weatherRecord.create({
      data: {
        rawData: JSON.stringify(current.raw),
        temperature: current.temperature,
        humidity: current.humidity,
        precipitation: current.precipitation,
        windSpeed: current.windSpeed,
        pressure: current.pressure,
        riskScore: riskScore.score,
        analysis: JSON.stringify({
          severity: riskScore.severity,
          emergencyType: riskScore.emergencyType,
          anomalies: riskScore.anomalies,
        }),
        isDisaster: riskScore.severity === 'critical' || riskScore.severity === 'very_high',
        recordedAt: current.timestamp,
      },
    });

    // ── Return result ───────────────────────────────────────────────
    return NextResponse.json({ success: true, data: riskScore });
  } catch (err) {
    console.error('Risk analysis error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
