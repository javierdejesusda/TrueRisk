/**
 * Severity-adaptive prompt templates for the recommendation pipeline.
 * All prompts are generated in Spanish since the platform targets Spain.
 */

import type { RiskScore, RiskSeverity } from '@/types/risk';
import type { UserProfile, SpecialNeed } from '@/types/user';
import type { ParsedWeather } from '@/types/weather';
import { RESIDENCE_TYPES } from '@/lib/constants/residence-types';

// ── Public interface ────────────────────────────────────────────────────

export interface PromptContext {
  user: UserProfile;
  weather: ParsedWeather;
  risk: RiskScore;
}

/**
 * Returns a severity-adaptive system prompt in Spanish.
 * The tone escalates from calm/informational (low) to life-saving (critical).
 */
export function getSystemPrompt(context: PromptContext): string {
  const { user, weather, risk } = context;
  const residenceLabel = RESIDENCE_TYPES[user.residenceType]?.labelEs ?? user.residenceType;
  const needsDescription = formatSpecialNeeds(user.specialNeeds);

  switch (risk.severity) {
    case 'low':
      return buildLowPrompt(user.province, residenceLabel);

    case 'moderate':
      return buildModeratePrompt(user.province, residenceLabel, weather, risk.emergencyType);

    case 'high':
      return buildHighPrompt(user.province, residenceLabel, weather, risk, needsDescription);

    case 'very_high':
      return buildVeryHighPrompt(user.province, residenceLabel, weather, risk, user, needsDescription);

    case 'critical':
      return buildCriticalPrompt(user.province, residenceLabel, risk, needsDescription);
  }
}

/**
 * Returns a user prompt describing the current weather conditions
 * and asking for personalized recommendations in Spanish.
 */
export function getUserPrompt(context: PromptContext): string {
  const { user, weather, risk } = context;
  const residenceLabel = RESIDENCE_TYPES[user.residenceType]?.labelEs ?? user.residenceType;

  const weatherSummary = [
    `Temperatura: ${weather.temperature}°C`,
    `Humedad: ${weather.humidity}%`,
    `Precipitacion: ${weather.precipitation} mm`,
    weather.windSpeed !== null ? `Viento: ${weather.windSpeed} km/h` : null,
    weather.pressure !== null ? `Presion: ${weather.pressure} hPa` : null,
    weather.cloudCover !== null ? `Nubosidad: ${weather.cloudCover}%` : null,
    weather.visibility !== null ? `Visibilidad: ${weather.visibility} km` : null,
    weather.uvIndex !== null ? `Indice UV: ${weather.uvIndex}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const needsList = user.specialNeeds.length > 0
    ? `\nNecesidades especiales: ${formatSpecialNeeds(user.specialNeeds)}`
    : '';

  const anomaliesInfo = risk.anomalies.length > 0
    ? `\nAnomalias detectadas: ${risk.anomalies.join(', ')}`
    : '';

  const trendInfo = risk.trend
    ? `\nTendencia: ${risk.trend}`
    : '';

  return (
    `Condiciones meteorologicas actuales:\n${weatherSummary}\n\n` +
    `Puntuacion de riesgo: ${risk.score}/100 (${translateSeverity(risk.severity)})\n` +
    `Tipo de emergencia detectada: ${translateEmergencyType(risk.emergencyType)}\n` +
    `Provincia: ${user.province}\n` +
    `Tipo de vivienda: ${residenceLabel}` +
    `${needsList}${anomaliesInfo}${trendInfo}\n\n` +
    `Por favor, proporciona recomendaciones personalizadas para mi situacion especifica. ` +
    `Ten en cuenta mi tipo de vivienda, ubicacion y necesidades particulares.`
  );
}

// ── Severity-level prompt builders ──────────────────────────────────────

// Low severity (0-20): Calm, informational tone
function buildLowPrompt(province: string, residenceLabel: string): string {
  return (
    `Eres un asesor meteorologico amigable. ` +
    `Proporciona consejos generales de preparacion para ${province}. ` +
    `El usuario vive en una vivienda tipo ${residenceLabel}. ` +
    `Las condiciones meteorologicas son actualmente suaves y no hay alertas significativas. ` +
    `Ofrece consejos practicos para el dia a dia y preparacion general ante posibles cambios del tiempo. ` +
    `Mantiene un tono relajado e informativo.`
  );
}

// Moderate severity (21-40): Advisory tone
function buildModeratePrompt(
  province: string,
  residenceLabel: string,
  weather: ParsedWeather,
  emergencyType: string,
): string {
  return (
    `Eres un asesor de seguridad meteorologica. ` +
    `Las condiciones actuales muestran: temperatura ${weather.temperature}°C, ` +
    `precipitacion ${weather.precipitation}mm, humedad ${weather.humidity}%. ` +
    `El usuario en ${province}, que vive en una vivienda tipo ${residenceLabel}, ` +
    `debe estar atento a condiciones de tipo ${translateEmergencyType(emergencyType)}. ` +
    `Proporciona precauciones especificas y medidas preventivas. ` +
    `Usa un tono de aviso moderado pero claro.`
  );
}

// High severity (41-60): Urgent advisory with step-by-step reasoning
function buildHighPrompt(
  province: string,
  residenceLabel: string,
  weather: ParsedWeather,
  risk: RiskScore,
  needsDescription: string,
): string {
  const needsClause = needsDescription
    ? ` El usuario tiene las siguientes necesidades: ${needsDescription}.`
    : '';

  return (
    `Eres un asesor de emergencias meteorologicas. ` +
    `AVISO: Se han detectado condiciones de ${translateEmergencyType(risk.emergencyType)} en ${province}. ` +
    `Puntuacion de riesgo: ${risk.score}/100. ` +
    `Datos actuales: temperatura ${weather.temperature}°C, precipitacion ${weather.precipitation}mm, ` +
    `viento ${weather.windSpeed ?? 'N/D'} km/h. ` +
    `El usuario vive en una vivienda tipo ${residenceLabel}.${needsClause} ` +
    `Proporciona instrucciones de seguridad detalladas. ` +
    `Piensa paso a paso sobre la situacion exacta de esta persona. ` +
    `Usa un tono urgente pero controlado.`
  );
}

// Very High severity (61-80): Emergency instructions with specific guidance
function buildVeryHighPrompt(
  province: string,
  residenceLabel: string,
  weather: ParsedWeather,
  risk: RiskScore,
  user: UserProfile,
  needsDescription: string,
): string {
  // Build residence-specific instructions
  const residenceGuidance = getResidenceSpecificGuidance(user.residenceType, risk.emergencyType);

  // Build needs-specific instructions
  const needsGuidance = getSpecialNeedsGuidance(user.specialNeeds, risk.emergencyType);

  const needsClause = needsDescription
    ? ` Necesidades especiales: ${needsDescription}.`
    : '';

  return (
    `Eres un coordinador de emergencias meteorologicas. ` +
    `EMERGENCIA: Condiciones de ${translateEmergencyType(risk.emergencyType)} detectadas en ${province}. ` +
    `Puntuacion de riesgo: ${risk.score}/100. ` +
    `Datos: temperatura ${weather.temperature}°C, precipitacion ${weather.precipitation}mm, ` +
    `viento ${weather.windSpeed ?? 'N/D'} km/h, humedad ${weather.humidity}%. ` +
    `El usuario vive en ${residenceLabel}.${needsClause}\n\n` +
    `Instrucciones especificas para este tipo de vivienda:\n${residenceGuidance}\n\n` +
    `${needsGuidance ? `Consideraciones especiales:\n${needsGuidance}\n\n` : ''}` +
    `Proporciona instrucciones de evacuacion o refugio paso a paso, ` +
    `adaptadas a la situacion exacta del usuario. Se muy especifico y directo.`
  );
}

// Critical severity (81-100): Life-saving mode
function buildCriticalPrompt(
  province: string,
  residenceLabel: string,
  risk: RiskScore,
  needsDescription: string,
): string {
  const needsClause = needsDescription
    ? ` con ${needsDescription}`
    : '';

  return (
    `EMERGENCIA CRITICA. ${translateEmergencyType(risk.emergencyType).toUpperCase()} en ${province}. ` +
    `Esta persona vive en ${residenceLabel}${needsClause}. ` +
    `Puntuacion de riesgo: ${risk.score}/100. ` +
    `Proporciona instrucciones INMEDIATAS de supervivencia paso a paso. ` +
    `Se especifico para su situacion exacta. El tiempo es critico. ` +
    `Incluye: 1) Accion inmediata en los proximos 5 minutos, ` +
    `2) Preparacion de evacuacion si es necesario, ` +
    `3) Numeros de emergencia y recursos, ` +
    `4) Que llevar y que dejar atras. ` +
    `Usa un tono directo, claro y de maxima urgencia. No pierdas tiempo con introducciones.`
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────

/** Translates special needs enum values into readable Spanish. */
function formatSpecialNeeds(needs: SpecialNeed[]): string {
  if (needs.length === 0) return '';

  const translations: Record<SpecialNeed, string> = {
    wheelchair: 'usuario de silla de ruedas',
    elderly: 'persona mayor',
    children: 'familia con ninos',
    pets: 'tiene mascotas',
    medical_equipment: 'depende de equipamiento medico',
    hearing_impaired: 'discapacidad auditiva',
    visual_impaired: 'discapacidad visual',
    respiratory: 'problemas respiratorios',
  };

  return needs.map((n) => translations[n] ?? n).join(', ');
}

/** Translates severity enum values into Spanish labels. */
function translateSeverity(severity: RiskSeverity): string {
  const map: Record<RiskSeverity, string> = {
    low: 'bajo',
    moderate: 'moderado',
    high: 'alto',
    very_high: 'muy alto',
    critical: 'critico',
  };
  return map[severity];
}

/** Translates emergency type identifiers into Spanish labels. */
function translateEmergencyType(type: string): string {
  const map: Record<string, string> = {
    flood: 'inundacion',
    heat_wave: 'ola de calor',
    cold_snap: 'ola de frio',
    wind_storm: 'tormenta de viento',
    thunderstorm: 'tormenta electrica',
    general: 'alerta general',
  };
  return map[type] ?? type;
}

/** Returns residence-specific emergency guidance in Spanish. */
function getResidenceSpecificGuidance(
  residenceType: string,
  emergencyType: string,
): string {
  if (emergencyType === 'flood') {
    switch (residenceType) {
      case 'sotano':
        return (
          '- PELIGRO EXTREMO: Los sotanos se inundan primero. Evacue INMEDIATAMENTE a pisos superiores.\n' +
          '- No intente salvar pertenencias del sotano.\n' +
          '- Corte la electricidad antes de abandonar el sotano.'
        );
      case 'planta_baja':
        return (
          '- Alto riesgo de inundacion en planta baja. Suba a pisos superiores si es posible.\n' +
          '- Coloque barreras improvisadas en puertas (toallas, sacos).\n' +
          '- Desenchufe aparatos electricos y suba objetos de valor.'
        );
      case 'caravana':
        return (
          '- Las caravanas son extremadamente vulnerables a inundaciones.\n' +
          '- Evacue a un edificio solido en terreno elevado.\n' +
          '- No intente conducir la caravana a traves de agua.'
        );
      default:
        return '- Mantengase en pisos superiores y alejado de ventanas.\n- Tenga preparada una mochila de emergencia.';
    }
  }

  if (emergencyType === 'wind_storm') {
    switch (residenceType) {
      case 'atico':
      case 'piso_alto':
        return (
          '- Los pisos altos sufren mayor impacto del viento.\n' +
          '- Alejese de ventanas y balcones.\n' +
          '- Asegure o retire objetos de terrazas y balcones.'
        );
      case 'caravana':
        return (
          '- Las caravanas son extremadamente vulnerables al viento.\n' +
          '- Evacue a un edificio solido inmediatamente.\n' +
          '- No permanezca dentro de la caravana.'
        );
      case 'casa_unifamiliar':
        return (
          '- Cierre persianas y asegure puertas exteriores.\n' +
          '- Refugiese en una habitacion interior sin ventanas.\n' +
          '- Retire objetos sueltos del jardin y terraza.'
        );
      default:
        return '- Cierre ventanas y persianas.\n- Alejese de cristales.\n- Tenga una linterna a mano.';
    }
  }

  // General guidance for other emergency types
  return (
    '- Mantengase informado a traves de los canales oficiales de Proteccion Civil.\n' +
    '- Tenga preparado un kit de emergencia basico.\n' +
    '- Siga las instrucciones de las autoridades locales.'
  );
}

/** Returns special-needs-specific guidance in Spanish. */
function getSpecialNeedsGuidance(
  needs: SpecialNeed[],
  emergencyType: string,
): string {
  const parts: string[] = [];

  if (needs.includes('wheelchair')) {
    parts.push(
      '- MOVILIDAD REDUCIDA: Identifique rutas de evacuacion accesibles. ' +
      'Si hay ascensor, NO lo use durante la emergencia. ' +
      'Pida ayuda a vecinos o servicios de emergencia para evacuacion por escaleras.',
    );
  }

  if (needs.includes('elderly')) {
    parts.push(
      '- PERSONA MAYOR: Tome medicamentos esenciales consigo. ' +
      'Muevase con cuidado para evitar caidas. ' +
      'Tenga a mano los numeros de contacto de familiares y servicios medicos.',
    );
  }

  if (needs.includes('children')) {
    parts.push(
      '- FAMILIA CON NINOS: Mantenga a los ninos cerca en todo momento. ' +
      'Prepare una mochila con documentos, agua y comida para los ninos. ' +
      'Expliqueles la situacion de forma calmada.',
    );
  }

  if (needs.includes('pets')) {
    parts.push(
      '- MASCOTAS: Prepare un transportin y correa. ' +
      'Lleve comida, agua y medicamentos del animal. ' +
      'No abandone a las mascotas pero priorice la seguridad humana.',
    );
  }

  if (needs.includes('medical_equipment')) {
    parts.push(
      '- EQUIPAMIENTO MEDICO: Asegure baterias de respaldo para equipos electricos. ' +
      'Tenga un plan alternativo en caso de corte de electricidad. ' +
      'Informe a los servicios de emergencia de su dependencia de equipos.',
    );
  }

  if (needs.includes('hearing_impaired')) {
    parts.push(
      '- DISCAPACIDAD AUDITIVA: Active alertas visuales y vibratorias en su telefono. ' +
      'Informe a vecinos para que le avisen de alertas sonoras. ' +
      'Tenga una linterna para comunicarse visualmente.',
    );
  }

  if (needs.includes('visual_impaired')) {
    parts.push(
      '- DISCAPACIDAD VISUAL: Familiaricese con las rutas de evacuacion tactilmente. ' +
      'Pida asistencia a vecinos o servicios de emergencia. ' +
      'Tenga un baston o guia siempre accesible.',
    );
  }

  if (needs.includes('respiratory')) {
    if (emergencyType === 'heat_wave') {
      parts.push(
        '- PROBLEMAS RESPIRATORIOS: El calor extremo agrava las condiciones respiratorias. ' +
        'Mantengase en un ambiente fresco y con aire filtrado. ' +
        'Tenga inhaladores y medicacion accesibles. ' +
        'Busque atencion medica si nota dificultad para respirar.',
      );
    } else {
      parts.push(
        '- PROBLEMAS RESPIRATORIOS: Tenga inhaladores y medicacion accesibles. ' +
        'Evite la exposicion al aire frio o con polvo. ' +
        'Busque atencion medica si nota dificultad para respirar.',
      );
    }
  }

  return parts.join('\n');
}
