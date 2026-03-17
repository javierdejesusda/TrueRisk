import { NextResponse } from 'next/server';
import { fetchWeather } from '@/lib/api-client';
import { computeRiskScore } from '@/lib/ml/risk-engine';
import { classifyEmergency as classifyEmergencyAI } from '@/lib/openai-client';
import { classifyEmergency as classifyEmergencyLocal } from '@/lib/ml/decision-tree';
import { prisma, initializeDatabase } from '@/lib/db';
import type { ParsedWeather } from '@/types/weather';

function mapScoreToSeverity(score: number): number {
  if (score >= 86) return 5;
  if (score >= 71) return 4;
  return 3; // 61-70
}

export async function GET() {
  try {
    await initializeDatabase();
    // 1. Fetch current weather
    let current: ParsedWeather;
    try {
      current = await fetchWeather();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch weather data';
      return NextResponse.json(
        { success: false, error: message },
        { status: 502 },
      );
    }

    // 2. Fetch recent weather history for pattern analysis
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

    // 3. Compute risk score with moderate vulnerability defaults
    const riskScore = computeRiskScore({
      current,
      history,
      province: 'Valencia',
      residenceType: 'piso_bajo',
      specialNeeds: [],
    });

    // 4. If risk > 60, generate alert suggestion
    if (riskScore.score > 60) {
      // Try AI classification first, fall back to local decision tree
      let emergencyType = riskScore.emergencyType;
      let reasoning = '';

      try {
        const aiResult = await classifyEmergencyAI(current);
        if (aiResult.type !== 'general' || aiResult.confidence > 0.5) {
          emergencyType = aiResult.type as typeof emergencyType;
          reasoning = aiResult.reasoning;
        }
      } catch {
        // Fall back to local decision tree
        const localResult = classifyEmergencyLocal(current);
        emergencyType = localResult.type;
        reasoning = localResult.matchedRules.join('; ');
      }

      const severity = mapScoreToSeverity(riskScore.score);

      const typeLabels: Record<string, string> = {
        flood: 'Inundacion',
        heat_wave: 'Ola de calor',
        cold_snap: 'Ola de frio',
        wind_storm: 'Tormenta de viento',
        thunderstorm: 'Tormenta electrica',
        general: 'Alerta general',
      };

      const title = `${typeLabels[emergencyType] ?? 'Alerta'} - Riesgo detectado automaticamente`;
      const description = reasoning
        ? `Puntuacion de riesgo: ${riskScore.score.toFixed(1)}/100. ${reasoning}`
        : `Puntuacion de riesgo: ${riskScore.score.toFixed(1)}/100. Severidad: ${riskScore.severity}. Tipo detectado: ${emergencyType}.`;

      return NextResponse.json({
        success: true,
        data: {
          detected: true,
          suggestion: {
            severity,
            type: emergencyType,
            title,
            description,
            riskScore: riskScore.score,
          },
        },
      });
    }

    // No alert needed
    return NextResponse.json({
      success: true,
      data: { detected: false },
    });
  } catch (err) {
    console.error('Alert detection error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
