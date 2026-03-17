import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSessionFromCookies } from '@/lib/auth';
import { fetchWeather } from '@/lib/api-client';
import { prisma } from '@/lib/db';
import { analyzeExtremes } from '@/lib/ml/gumbel';
import { projectTrend } from '@/lib/ml/regression';
import { estimateRisk } from '@/lib/ml/bayesian';
import { computeEMA } from '@/lib/ml/ema';
import { detectAnomalies } from '@/lib/ml/z-score';
import { classifyEmergency } from '@/lib/ml/decision-tree';
import { findSimilar } from '@/lib/ml/knn';
import type { ParsedWeather } from '@/types/weather';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = await getSessionFromCookies(cookieStore);
    let province = 'Valencia';

    if (session) {
      const user = await prisma.user.findUnique({ where: { id: session.id } });
      if (user) province = user.province;
    }

    let current: ParsedWeather;
    try {
      current = await fetchWeather();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch weather data' },
        { status: 502 },
      );
    }

    const records = await prisma.weatherRecord.findMany({
      orderBy: { recordedAt: 'desc' },
      take: 50,
    });

    const history: ParsedWeather[] = records.map((r) => ({
      temperature: r.temperature,
      humidity: r.humidity,
      precipitation: r.precipitation,
      windSpeed: r.windSpeed,
      pressure: r.pressure,
      cloudCover: null,
      visibility: null,
      dewPoint: null,
      uvIndex: null,
      timestamp: r.recordedAt,
      raw: {},
    }));

    // Time-ordered values (oldest first)
    const precipHistory = history.map((h) => h.precipitation).reverse();
    const tempHistory = history.map((h) => h.temperature).reverse();
    const windHistory = history.map((h) => (h.windSpeed ?? 0)).reverse();

    const precipWithCurrent = [...precipHistory, current.precipitation];

    // ── Gumbel extreme value analysis ─────────────────────────────
    const gumbel = {
      precipitation: analyzeExtremes(precipHistory, current.precipitation),
      temperature: analyzeExtremes(tempHistory, current.temperature),
      windSpeed: analyzeExtremes(windHistory, current.windSpeed ?? 0),
    };

    // ── Linear regression forecast ────────────────────────────────
    const regressionResult = projectTrend(precipWithCurrent);
    const fittedLine: Array<{ step: number; actual: number | null; fitted: number }> =
      precipWithCurrent.map((val, i) => ({
        step: i,
        actual: val,
        fitted: parseFloat((regressionResult.intercept + regressionResult.slope * i).toFixed(2)),
      }));

    const n = precipWithCurrent.length;
    fittedLine.push({
      step: n - 1 + 6,
      actual: null,
      fitted: parseFloat(regressionResult.projected6h.toFixed(2)),
    });
    fittedLine.push({
      step: n - 1 + 12,
      actual: null,
      fitted: parseFloat(regressionResult.projected12h.toFixed(2)),
    });

    const regression = {
      slope: parseFloat(regressionResult.slope.toFixed(4)),
      intercept: parseFloat(regressionResult.intercept.toFixed(2)),
      rSquared: parseFloat(regressionResult.rSquared.toFixed(4)),
      projected6h: parseFloat(regressionResult.projected6h.toFixed(2)),
      projected12h: parseFloat(regressionResult.projected12h.toFixed(2)),
      data: fittedLine,
    };

    // ── Bayesian risk estimation ──────────────────────────────────
    const bayesian = estimateRisk(current, province);

    // ── EMA trend detection ───────────────────────────────────────
    const emaResult = computeEMA(precipWithCurrent);
    const ema = {
      data: precipWithCurrent.map((v, i) => ({
        step: i,
        raw: parseFloat(v.toFixed(2)),
        smoothed: parseFloat(emaResult.ema[i].toFixed(2)),
      })),
      trend: emaResult.trend,
      rateOfChange: parseFloat(emaResult.rateOfChange.toFixed(4)),
    };

    // ── Z-score anomaly detection ─────────────────────────────────
    const zScore = detectAnomalies(current, history);

    // ── Decision tree classification ──────────────────────────────
    const decisionTree = classifyEmergency(current);

    // ── KNN historical pattern matching ───────────────────────────
    const knn = findSimilar(current, 5);

    // ── Current weather summary ───────────────────────────────────
    const currentSummary = {
      temperature: current.temperature,
      humidity: current.humidity,
      precipitation: current.precipitation,
      windSpeed: current.windSpeed ?? 0,
      pressure: current.pressure ?? 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        gumbel,
        regression,
        bayesian,
        ema,
        zScore,
        decisionTree,
        knn,
        current: currentSummary,
      },
    });
  } catch (err) {
    console.error('Predictions error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
