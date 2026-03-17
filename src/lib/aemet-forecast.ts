export interface HourlyForecast {
  hour: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  precipitation: number;
  precipitationProb: number;
  windSpeed: number;
  windDirection: string;
  gustSpeed: number;
  skyDescription: string;
  skyCode: string;
}

export interface DailyForecast {
  date: string;
  tempMax: number;
  tempMin: number;
  precipitationProb: number;
  skyDescription: string;
  skyCode: string;
  windSpeed: number;
  windDirection: string;
  humidity: { max: number; min: number };
  uvMax: number;
}

export interface MunicipalityForecast {
  name: string;
  province: string;
  elaborated: string;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
}

interface AemetPeriodEntry {
  periodo?: string;
  value?: string;
  descripcion?: string;
  direccion?: string | string[];
  velocidad?: string | string[];
}

interface AemetHourlyDia {
  fecha?: string;
  temperatura?: AemetPeriodEntry[];
  sensTermica?: AemetPeriodEntry[];
  humedadRelativa?: AemetPeriodEntry[];
  precipitacion?: AemetPeriodEntry[];
  probPrecipitacion?: AemetPeriodEntry[];
  estadoCielo?: AemetPeriodEntry[];
  vientoAndRachaMax?: AemetPeriodEntry[];
  uvMax?: number;
}

interface AemetDailyDia {
  fecha?: string;
  temperatura?: { maxima?: number; minima?: number };
  humedadRelativa?: { maxima?: number; minima?: number };
  probPrecipitacion?: AemetPeriodEntry[];
  estadoCielo?: AemetPeriodEntry[];
  viento?: AemetPeriodEntry[];
  uvMax?: number;
}

interface AemetHourlyEntry {
  nombre?: string;
  provincia?: string;
  elaborado?: string;
  prediccion?: {
    dia?: AemetHourlyDia[];
  };
}

interface AemetDailyEntry {
  nombre?: string;
  provincia?: string;
  elaborado?: string;
  prediccion?: {
    dia?: AemetDailyDia[];
  };
}

type AemetHourlyResponse = AemetHourlyEntry[];
type AemetDailyResponse = AemetDailyEntry[];

async function fetchAemetData(url: string, apiKey: string): Promise<unknown> {
  const metaRes = await fetch(url, {
    headers: { 'api_key': apiKey },
    signal: AbortSignal.timeout(6_000),
  });
  if (!metaRes.ok) throw new Error(`AEMET meta failed: ${metaRes.status}`);
  const meta = await metaRes.json();
  if (!meta.datos) throw new Error('No datos URL');
  const dataRes = await fetch(meta.datos, {
    signal: AbortSignal.timeout(6_000),
  });
  if (!dataRes.ok) throw new Error(`AEMET data failed: ${dataRes.status}`);
  return dataRes.json();
}

function parseHourlyForecast(data: AemetHourlyResponse): HourlyForecast[] {
  const result: HourlyForecast[] = [];
  if (!data?.[0]?.prediccion?.dia) return result;

  for (const dia of data[0].prediccion.dia) {
    const temps = dia.temperatura || [];
    const feels = dia.sensTermica || [];
    const humidity = dia.humedadRelativa || [];
    const precip = dia.precipitacion || [];
    const precipProb = dia.probPrecipitacion || [];
    const sky = dia.estadoCielo || [];
    const wind = dia.vientoAndRachaMax || [];
    const fecha = dia.fecha?.split('T')[0] || '';

    // Build hourly entries from temperature periods (most granular)
    for (const t of temps) {
      const hour = t.periodo;
      if (!hour || t.value === '') continue;

      const entry: HourlyForecast = {
        hour: `${fecha}T${hour.padStart(2, '0')}:00`,
        temperature: parseInt(t.value) || 0,
        feelsLike: parseInt(feels.find((f: AemetPeriodEntry) => f.periodo === hour)?.value ?? t.value) || 0,
        humidity: parseInt(humidity.find((h: AemetPeriodEntry) => h.periodo === hour)?.value ?? '0') || 0,
        precipitation: parseFloat(precip.find((p: AemetPeriodEntry) => p.periodo === hour)?.value ?? '0') || 0,
        precipitationProb: parseInt(
          precipProb.find((p: AemetPeriodEntry) => {
            const per = p.periodo || '';
            const h = parseInt(hour);
            if (per.length === 4) {
              const start = parseInt(per.substring(0, 2));
              const end = parseInt(per.substring(2, 4));
              return h >= start && h < end;
            }
            return false;
          })?.value ?? '0'
        ) || 0,
        windSpeed: 0,
        windDirection: '',
        gustSpeed: 0,
        skyDescription: sky.find((s: AemetPeriodEntry) => s.periodo === hour)?.descripcion ?? '',
        skyCode: sky.find((s: AemetPeriodEntry) => s.periodo === hour)?.value ?? '',
      };

      // Wind data has mixed format: direction+velocity objects and gust values
      for (const w of wind) {
        if (w.periodo === hour) {
          if (w.direccion) entry.windDirection = Array.isArray(w.direccion) ? w.direccion[0] : w.direccion;
          if (w.velocidad) entry.windSpeed = parseInt(Array.isArray(w.velocidad) ? w.velocidad[0] : w.velocidad) || 0;
          if (w.value) entry.gustSpeed = parseInt(w.value) || 0;
        }
      }

      result.push(entry);
    }
  }

  return result;
}

function parseDailyForecast(data: AemetDailyResponse): DailyForecast[] {
  const result: DailyForecast[] = [];
  if (!data?.[0]?.prediccion?.dia) return result;

  for (const dia of data[0].prediccion.dia) {
    const fecha = dia.fecha?.split('T')[0] || '';
    const temp = dia.temperatura ?? { maxima: 0, minima: 0 };
    const hum = dia.humedadRelativa ?? { maxima: 0, minima: 0 };
    const precipProb = dia.probPrecipitacion || [];
    const sky = dia.estadoCielo || [];
    const wind = dia.viento || [];

    // Get the best sky description (prefer midday period)
    const skyEntry = sky.find((s: AemetPeriodEntry) => s.periodo === '12-24' || s.periodo === '00-24') || sky[0];
    const windEntry = wind.find((w: AemetPeriodEntry) => w.periodo === '12-24' || w.periodo === '00-24') || wind[0];

    // Get max precipitation probability
    const maxPrecipProb = Math.max(
      ...precipProb.map((p: AemetPeriodEntry) => parseInt(p.value ?? '0') || 0),
      0
    );

    result.push({
      date: fecha,
      tempMax: temp.maxima ?? 0,
      tempMin: temp.minima ?? 0,
      precipitationProb: maxPrecipProb,
      skyDescription: skyEntry?.descripcion ?? '',
      skyCode: skyEntry?.value ?? '',
      windSpeed: typeof windEntry?.velocidad === 'string' ? parseInt(windEntry.velocidad) || 0 : 0,
      windDirection: typeof windEntry?.direccion === 'string' ? windEntry.direccion : '',
      humidity: { max: hum.maxima ?? 0, min: hum.minima ?? 0 },
      uvMax: dia.uvMax ?? 0,
    });
  }

  return result;
}

export async function fetchMunicipalityForecast(municipioCode: string): Promise<MunicipalityForecast | null> {
  const apiKey = process.env.AEMET_API_KEY;
  if (!apiKey || apiKey === 'your_aemet_api_key_here') return null;

  try {
    const base = 'https://opendata.aemet.es/opendata/api/prediccion/especifica/municipio';

    const [hourlyResult, dailyResult] = await Promise.allSettled([
      fetchAemetData(`${base}/horaria/${municipioCode}`, apiKey),
      fetchAemetData(`${base}/diaria/${municipioCode}`, apiKey),
    ]);
    const hourlyData = hourlyResult.status === 'fulfilled' ? hourlyResult.value : null;
    const dailyData = dailyResult.status === 'fulfilled' ? dailyResult.value : null;

    const hourly = hourlyData as AemetHourlyResponse | null;
    const daily = dailyData as AemetDailyResponse | null;
    const name = hourly?.[0]?.nombre ?? daily?.[0]?.nombre ?? '';
    const province = hourly?.[0]?.provincia ?? daily?.[0]?.provincia ?? '';
    const elaborated = hourly?.[0]?.elaborado ?? new Date().toISOString();

    return {
      name,
      province,
      elaborated,
      hourly: hourly ? parseHourlyForecast(hourly) : [],
      daily: daily ? parseDailyForecast(daily) : [],
    };
  } catch (err) {
    console.error('AEMET forecast fetch error:', err);
    return null;
  }
}
