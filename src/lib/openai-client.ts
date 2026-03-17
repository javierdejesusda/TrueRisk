import OpenAI from 'openai';
import type { ParsedWeather } from '@/types/weather';
import type { RiskFactor } from '@/types/risk';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const getModel = () => process.env.OPENAI_MODEL ?? 'gpt-4.1-nano';

/**
 * Analyzes current weather conditions against historical data using OpenAI.
 * Returns a structured risk assessment.
 */
export async function analyzeWeatherStructured(
  weather: ParsedWeather,
  history: ParsedWeather[],
): Promise<{
  summary: string;
  riskLevel: string;
  keyFactors: string[];
  emergencyType: string | null;
  confidence: number;
}> {
  const fallback = {
    summary: 'Unable to analyze weather conditions at this time.',
    riskLevel: 'unknown',
    keyFactors: [],
    emergencyType: null,
    confidence: 0,
  };

  try {
    const historySnapshot = history.slice(-5).map((h) => ({
      temperature: h.temperature,
      humidity: h.humidity,
      precipitation: h.precipitation,
      windSpeed: h.windSpeed,
      pressure: h.pressure,
    }));

    const response = await openai.chat.completions.create({
      model: getModel(),
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a meteorological risk analyst for a climate emergency system in Spain.
Analyze the current weather conditions and recent history to assess risk.
Respond in JSON with this exact structure:
{
  "summary": "Brief description of current conditions and risk",
  "riskLevel": "low|moderate|high|very_high|critical",
  "keyFactors": ["factor1", "factor2"],
  "emergencyType": "flood|heat_wave|cold_snap|wind_storm|thunderstorm|general" or null,
  "confidence": 0.0 to 1.0
}`,
        },
        {
          role: 'user',
          content: `Current weather:
Temperature: ${weather.temperature}C
Humidity: ${weather.humidity}%
Precipitation: ${weather.precipitation}mm
Wind Speed: ${weather.windSpeed ?? 'N/A'} km/h
Pressure: ${weather.pressure ?? 'N/A'} hPa
Cloud Cover: ${weather.cloudCover ?? 'N/A'}%
UV Index: ${weather.uvIndex ?? 'N/A'}

Recent history (last ${historySnapshot.length} readings):
${JSON.stringify(historySnapshot, null, 2)}`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return fallback;

    const parsed = JSON.parse(content);
    return {
      summary: parsed.summary ?? fallback.summary,
      riskLevel: parsed.riskLevel ?? fallback.riskLevel,
      keyFactors: Array.isArray(parsed.keyFactors) ? parsed.keyFactors : [],
      emergencyType: parsed.emergencyType ?? null,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0,
    };
  } catch {
    return fallback;
  }
}

/**
 * Generates a human-readable risk narrative using OpenAI.
 */
export async function generateRiskNarrative(
  riskScore: number,
  factors: RiskFactor[],
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: getModel(),
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a climate emergency communication specialist in Spain.
Generate a clear, actionable risk narrative for citizens based on the risk score and contributing factors.
Respond in JSON with this structure:
{ "narrative": "Your detailed risk narrative here" }`,
        },
        {
          role: 'user',
          content: `Risk Score: ${riskScore}/100
Contributing Factors:
${factors.map((f) => `- ${f.name}: ${f.score.toFixed(1)} (weight: ${f.weight}, ${f.details})`).join('\n')}`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return 'Unable to generate risk narrative.';

    const parsed = JSON.parse(content);
    return parsed.narrative ?? 'Unable to generate risk narrative.';
  } catch {
    return 'Unable to generate risk narrative at this time.';
  }
}

/**
 * Classifies the type of emergency based on current weather conditions.
 */
export async function classifyEmergency(
  weather: ParsedWeather,
): Promise<{
  type: string;
  confidence: number;
  reasoning: string;
}> {
  const fallback = {
    type: 'general',
    confidence: 0,
    reasoning: 'Unable to classify emergency conditions.',
  };

  try {
    const response = await openai.chat.completions.create({
      model: getModel(),
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are an emergency classification system for Spain.
Given weather data, classify the type of emergency (if any).
Types: flood, heat_wave, cold_snap, wind_storm, thunderstorm, general, none.
Respond in JSON with this structure:
{
  "type": "emergency_type",
  "confidence": 0.0 to 1.0,
  "reasoning": "Brief explanation of classification"
}`,
        },
        {
          role: 'user',
          content: `Weather conditions:
Temperature: ${weather.temperature}C
Humidity: ${weather.humidity}%
Precipitation: ${weather.precipitation}mm
Wind Speed: ${weather.windSpeed ?? 'N/A'} km/h
Pressure: ${weather.pressure ?? 'N/A'} hPa
Cloud Cover: ${weather.cloudCover ?? 'N/A'}%
Visibility: ${weather.visibility ?? 'N/A'} km
Dew Point: ${weather.dewPoint ?? 'N/A'}C
UV Index: ${weather.uvIndex ?? 'N/A'}`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return fallback;

    const parsed = JSON.parse(content);
    return {
      type: parsed.type ?? fallback.type,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0,
      reasoning: parsed.reasoning ?? fallback.reasoning,
    };
  } catch {
    return fallback;
  }
}
