/**
 * 3-Stage Recommendation Pipeline
 *
 * Stage 1: Local ML risk scoring + OpenAI enrichment (optional)
 * Stage 2: Severity-adaptive prompt construction with few-shot examples
 * Stage 3: Hackathon LLM generation with OpenAI fallback
 */

import type { UserProfile } from '@/types/user';
import type { ParsedWeather } from '@/types/weather';
import type { RiskScore } from '@/types/risk';
import { computeRiskScore } from '@/lib/ml/risk-engine';
import { analyzeWeatherStructured, generateRiskNarrative } from '@/lib/openai-client';
import { sendPrompt } from '@/lib/api-client';
import { getSystemPrompt, getUserPrompt } from '@/lib/prompts/templates';
import { FEW_SHOT_EXAMPLES } from '@/lib/prompts/few-shot-examples';
import { RESIDENCE_TYPES } from '@/lib/constants/residence-types';

// ── Public interface ────────────────────────────────────────────────────

export interface PipelineResult {
  recommendation: string;
  riskScore: RiskScore;
  systemPrompt: string;
  userPrompt: string;
  openaiAnalysis?: object;
  processingTime: number;
}

/**
 * Runs the full 3-stage recommendation pipeline.
 *
 * @param user - The user profile for personalization
 * @param weather - Current parsed weather data
 * @param history - Recent historical weather readings
 * @param isDisaster - Whether disaster mode is active (overrides severity)
 */
export async function runRecommendationPipeline(
  user: UserProfile,
  weather: ParsedWeather,
  history: ParsedWeather[],
  isDisaster?: boolean,
): Promise<PipelineResult> {
  const startTime = Date.now();

  // ── Stage 1: Local ML + OpenAI enrichment ───────────────────────────

  const riskScore = computeRiskScore({
    current: weather,
    history,
    province: user.province,
    residenceType: user.residenceType,
    specialNeeds: user.specialNeeds,
  });

  // If disaster mode is explicitly set, override severity to critical
  if (isDisaster && riskScore.severity !== 'critical') {
    riskScore.severity = 'critical';
    if (riskScore.score < 81) {
      riskScore.score = 81;
    }
  }

  // Attempt OpenAI enrichment (non-blocking -- proceed without it if it fails)
  let openaiAnalysis: object | undefined;
  try {
    const analysis = await analyzeWeatherStructured(weather, history);
    openaiAnalysis = analysis;
  } catch {
    // OpenAI enrichment failed -- continue with local-only results
  }

  // ── Stage 2: Prompt construction ────────────────────────────────────

  const promptContext = { user, weather, risk: riskScore };
  let systemPrompt = getSystemPrompt(promptContext);
  const userPrompt = getUserPrompt(promptContext);

  // Inject a relevant few-shot example if the emergency type has one
  const examples = FEW_SHOT_EXAMPLES[riskScore.emergencyType];
  if (examples && examples.length > 0) {
    const example = examples[0];
    systemPrompt +=
      '\n\n--- EJEMPLO DE RESPUESTA ---\n' +
      `Contexto del usuario: ${example.userContext}\n` +
      `Respuesta esperada:\n${example.response}\n` +
      '--- FIN DEL EJEMPLO ---\n\n' +
      'Genera una respuesta similar en tono y nivel de detalle, ' +
      'pero personalizada para la situacion actual del usuario.';
  }

  // If OpenAI analysis is available, append its insights to the system prompt
  if (openaiAnalysis && 'summary' in openaiAnalysis) {
    const analysis = openaiAnalysis as {
      summary: string;
      keyFactors: string[];
      confidence: number;
    };
    systemPrompt +=
      '\n\nAnalisis complementario de IA:\n' +
      `Resumen: ${analysis.summary}\n` +
      (analysis.keyFactors.length > 0
        ? `Factores clave: ${analysis.keyFactors.join(', ')}\n`
        : '') +
      `Confianza del analisis: ${(analysis.confidence * 100).toFixed(0)}%`;
  }

  // ── Stage 3: Hackathon LLM generation ───────────────────────────────

  let recommendation: string;
  try {
    recommendation = await sendPrompt(systemPrompt, userPrompt);
  } catch {
    // Hackathon API failed -- fall back to OpenAI narrative generation
    try {
      recommendation = await generateRiskNarrative(
        riskScore.score,
        riskScore.breakdown,
      );
    } catch {
      // Both LLM sources failed -- provide a minimal local response
      const residenceLabel =
        RESIDENCE_TYPES[user.residenceType]?.labelEs ?? user.residenceType;
      recommendation =
        `Alerta de ${riskScore.emergencyType} con nivel de riesgo ${riskScore.severity} ` +
        `(${riskScore.score}/100) para ${user.province}. ` +
        `Tipo de vivienda: ${residenceLabel}. ` +
        'Consulte los canales oficiales de Proteccion Civil para instrucciones. ' +
        'Telefono de emergencias: 112.';
    }
  }

  const processingTime = Date.now() - startTime;

  return {
    recommendation,
    riskScore,
    systemPrompt,
    userPrompt,
    openaiAnalysis,
    processingTime,
  };
}
