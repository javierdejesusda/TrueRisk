import type { ParsedWeather } from '@/types/weather';
import type { HackathonAuthResponse } from '@/types/api';
import { parseWeatherData } from './weather-parser';

const getBaseUrl = () => process.env.HACKATON_API_BASE ?? '';
const getApiKey = () => process.env.HACKATON_API_KEY ?? '';
const isMock = () => process.env.USE_MOCK === 'true';

/** Realistic mock weather data for Valencia area */
const MOCK_WEATHER: Record<string, unknown> = {
  temperatura: '21,4',
  humedad: '62,5',
  precipitacion: '0,0',
  velocidad_viento: '14,3',
  presion: '1015,2',
  nubosidad: '35',
  visibilidad: '10,0',
  punto_rocio: '13,8',
  indice_uv: '5,2',
};

/**
 * Builds common headers for hackathon API requests.
 */
function buildHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getApiKey()}`,
  };
}

/**
 * Fetches current weather from the hackathon API.
 * When USE_MOCK=true, returns hardcoded realistic Spanish weather data instead.
 */
export async function fetchWeather(disaster?: boolean): Promise<ParsedWeather> {
  if (isMock() || !getBaseUrl()) {
    return parseWeatherData({ ...MOCK_WEATHER });
  }

  let url: URL;
  try {
    url = new URL('/weather', getBaseUrl());
  } catch {
    return parseWeatherData({ ...MOCK_WEATHER });
  }
  if (disaster !== undefined) {
    url.searchParams.set('disaster', String(disaster));
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: buildHeaders(),
    signal: AbortSignal.timeout(8_000),
  });

  if (!response.ok) {
    throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return parseWeatherData(data);
}

/**
 * Sends a prompt to the hackathon AI endpoint.
 * Returns the response text.
 */
export async function sendPrompt(
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  if (isMock() || !getBaseUrl()) {
    throw new Error('Hackathon API not configured');
  }

  const response = await fetch(`${getBaseUrl()}/prompt`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({
      system_prompt: systemPrompt,
      user_prompt: userPrompt,
    }),
  });

  if (!response.ok) {
    throw new Error(`Prompt API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.response ?? '';
}

/**
 * Registers a new team with the hackathon API.
 */
export async function registerTeam(
  nickName: string,
  teamName: string,
  password: string,
): Promise<HackathonAuthResponse> {
  const response = await fetch(`${getBaseUrl()}/register`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({
      nickName,
      teamName,
      password,
    }),
    signal: AbortSignal.timeout(8_000),
  });

  if (!response.ok) {
    throw new Error(`Register API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Logs in a team with the hackathon API.
 */
export async function loginTeam(
  nickName: string,
  password: string,
): Promise<HackathonAuthResponse> {
  const response = await fetch(`${getBaseUrl()}/login`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({
      nickName,
      password,
    }),
  });

  if (!response.ok) {
    throw new Error(`Login API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
