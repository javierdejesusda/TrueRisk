export interface EmergencyGuidance {
  hazardType: string;
  title: string;
  severity: 'high' | 'critical';
  sections: {
    situation: string;
    immediateActions: string[];
    preparation: string[];
    evacuation?: string[];
  };
}

export const EMERGENCY_GUIDANCE: Record<string, EmergencyGuidance> = {
  flood: {
    hazardType: 'flood',
    title: 'Riesgo de Inundacion',
    severity: 'critical',
    sections: {
      situation: 'Las condiciones meteorologicas actuales indican un riesgo elevado de inundacion en tu provincia. Las lluvias intensas o el deshielo pueden provocar crecidas rapidas en rios y barrancos.',
      immediateActions: [
        'Evita zonas bajas, cauces de rios, barrancos y sotanos',
        'No cruces vados ni carreteras inundadas — 30 cm de agua pueden arrastrar un vehiculo',
        'Sube a plantas altas si el agua sube en tu zona',
        'Desconecta la electricidad si el agua alcanza tu vivienda',
        'Ten a mano documentacion, medicamentos esenciales y telefono cargado',
      ],
      preparation: [
        'Prepara una mochila de emergencia con agua, comida no perecedera y linterna',
        'Identifica las rutas de evacuacion de tu zona',
        'Guarda documentos importantes en bolsas impermeables',
        'Carga todos los dispositivos electronicos',
        'Llena la banera y recipientes con agua potable por si se corta el suministro',
      ],
      evacuation: [
        'Si las autoridades ordenan evacuar, hazlo de inmediato',
        'Sigue las rutas oficiales — no tomes atajos',
        'Lleva tu mochila de emergencia y documentacion',
        'Cierra gas, agua y electricidad antes de salir',
        'Acude al punto de encuentro designado por Proteccion Civil',
      ],
    },
  },
  wildfire: {
    hazardType: 'wildfire',
    title: 'Riesgo de Incendio Forestal',
    severity: 'critical',
    sections: {
      situation: 'Las altas temperaturas, baja humedad y viento crean condiciones propicias para incendios forestales. El riesgo de propagacion rapida es elevado.',
      immediateActions: [
        'Aleja los materiales combustibles de tu vivienda (lena, muebles de jardin, basura)',
        'Cierra ventanas y persianas si detectas humo cercano',
        'Ten preparada ropa de algodon, calzado cerrado y mascarilla',
        'No hagas barbacoas ni uses maquinaria que genere chispas',
        'Llama al 112 si detectas humo o fuego',
      ],
      preparation: [
        'Limpia la vegetacion seca en un radio de 30 metros alrededor de tu vivienda',
        'Revisa que la manguera del jardin funciona correctamente',
        'Prepara una mochila de emergencia con agua y documentos',
        'Conoce las vias de escape de tu urbanizacion o pueblo',
        'Asegurate de que los accesos para bomberos estan despejados',
      ],
      evacuation: [
        'Evacua en cuanto lo indiquen las autoridades — no esperes a ver las llamas',
        'Conduce con las ventanillas cerradas y luces encendidas',
        'Si te rodea el fuego en carretera, quedate en el coche con el motor encendido',
        'Nunca huyas cuesta arriba por una ladera — el fuego avanza mas rapido pendiente arriba',
        'Acude al punto de encuentro indicado por Proteccion Civil',
      ],
    },
  },
  drought: {
    hazardType: 'drought',
    title: 'Alerta por Sequia',
    severity: 'high',
    sections: {
      situation: 'Los niveles de precipitacion estan significativamente por debajo de la media historica. Las reservas hidricas pueden verse afectadas y se recomienda un uso responsable del agua.',
      immediateActions: [
        'Reduce el consumo de agua al minimo imprescindible',
        'No riegues jardines ni laves coches con manguera',
        'Reutiliza el agua de cocina para regar plantas',
        'Reporta fugas de agua al servicio municipal',
        'Sigue las restricciones de agua de tu ayuntamiento',
      ],
      preparation: [
        'Instala reductores de caudal en grifos y duchas',
        'Almacena agua potable para varios dias',
        'Revisa tuberias y cisternas para evitar perdidas',
        'Planifica tu consumo de agua semanal',
        'Consulta el estado de los embalses de tu cuenca hidrografica',
      ],
    },
  },
  heatwave: {
    hazardType: 'heatwave',
    title: 'Ola de Calor',
    severity: 'critical',
    sections: {
      situation: 'Se esperan temperaturas extremadamente altas que pueden suponer un riesgo grave para la salud, especialmente para personas mayores, ninos y personas con enfermedades cronicas.',
      immediateActions: [
        'Evita salir a la calle entre las 12:00 y las 18:00',
        'Hidratate continuamente — bebe agua aunque no tengas sed',
        'Permanece en espacios frescos y ventilados',
        'Usa ropa ligera, holgada y de colores claros',
        'Vigila especialmente a personas mayores y ninos',
      ],
      preparation: [
        'Prepara provisiones de agua y bebidas isotoncias',
        'Instala toldos o persianas en ventanas con sol directo',
        'Identifica refugios climatizados cercanos (centros comerciales, bibliotecas)',
        'Ten un ventilador o humidificador a mano',
        'Revisa que el aire acondicionado funciona correctamente',
      ],
      evacuation: [
        'Si una persona muestra sintomas de golpe de calor (confusion, piel roja y seca, temperatura corporal alta), llama al 112 inmediatamente',
        'Traslada a la persona a la sombra y aplica panos humedos',
        'No administres aspirina ni paracetamol',
      ],
    },
  },
  seismic: {
    hazardType: 'seismic',
    title: 'Riesgo Sismico',
    severity: 'high',
    sections: {
      situation: 'Se ha detectado actividad sismica en la zona. Aunque la mayoria de los terremotos en Espana son de baja intensidad, es importante conocer los protocolos de actuacion.',
      immediateActions: [
        'Durante un terremoto: AGACHATE, CUBRETE bajo una mesa resistente y AGARRATE',
        'Alejate de ventanas, espejos y objetos que puedan caer',
        'Si estas fuera, alejate de edificios, farolas y tendidos electricos',
        'No uses ascensores bajo ningun concepto',
        'Si estas conduciendo, para en un lugar seguro lejos de puentes y estructuras',
      ],
      preparation: [
        'Fija muebles pesados a la pared (estanterias, armarios)',
        'Identifica los puntos seguros de cada habitacion (marcos de puertas, mesas resistentes)',
        'Ten una linterna, radio a pilas y botin de primeros auxilios',
        'Conoce donde estan las llaves de gas, agua y electricidad',
        'Practica el protocolo con tu familia',
      ],
    },
  },
  coldwave: {
    hazardType: 'coldwave',
    title: 'Ola de Frio',
    severity: 'high',
    sections: {
      situation: 'Se esperan temperaturas muy bajas que pueden provocar heladas, hielo en carreteras y riesgos para la salud por hipotermia.',
      immediateActions: [
        'Abrigate con varias capas de ropa y cubre cabeza, manos y pies',
        'Limita las salidas al exterior al minimo necesario',
        'Revisa la calefaccion y asegurate de tener combustible suficiente',
        'Protege las tuberias exteriores contra heladas (aislamiento, goteo constante)',
        'Vigila a personas mayores y vulnerables',
      ],
      preparation: [
        'Almacena mantas extra, ropa de abrigo y alimentos calientes',
        'Revisa el estado de los neumaticos y lleva cadenas si viajas a zonas de montana',
        'Carga el telefono y ten baterias de repuesto',
        'Mantente informado de la evolucion meteorologica',
        'Si tienes chimenea, revisa el tiro y ten lena seca',
      ],
    },
  },
  windstorm: {
    hazardType: 'windstorm',
    title: 'Alerta por Vientos Fuertes',
    severity: 'high',
    sections: {
      situation: 'Se preveen rachas de viento muy fuertes que pueden provocar caida de arboles, danos en estructuras y cortes de suministro electrico.',
      immediateActions: [
        'Recoge toldos, macetas y cualquier objeto suelto en terrazas y jardines',
        'Cierra y asegura ventanas y contraventanas',
        'Evita salir a la calle si no es imprescindible',
        'No te refugies bajo arboles, vallas publicitarias o andamios',
        'Si conduces, reduce la velocidad y sujeta el volante con firmeza',
      ],
      preparation: [
        'Ten una linterna y radio a pilas por si hay cortes de luz',
        'Identifica las estancias mas resguardadas de tu vivienda (interior, sin ventanas)',
        'Aparca el vehiculo alejado de arboles y fachadas con riesgo',
        'Asegura puertas de garaje y almacenes',
        'Revisa el estado del tejado y antenas',
      ],
    },
  },
};

export function getGuidanceForRisk(
  dominantHazard: string | undefined,
  compositeScore: number | undefined,
): EmergencyGuidance | null {
  if (!dominantHazard || !compositeScore || compositeScore < 60) return null;
  return EMERGENCY_GUIDANCE[dominantHazard] ?? null;
}

/* ── Personalized guidance based on user profile ─────────────── */

export interface UserProfileForGuidance {
  special_needs?: string[];
  mobility_level?: string;
  has_vehicle?: boolean;
  medical_conditions?: string;
}

export interface PersonalizedTip {
  key: string;
  category: string;
}

/**
 * Returns a list of personalized guidance tip keys based on the user's
 * profile. Consumers should use the key with `t(key)` from the
 * Emergency i18n namespace to render the translated string.
 */
export function getPersonalizedGuidance(
  userProfile: UserProfileForGuidance | null | undefined,
): PersonalizedTip[] {
  if (!userProfile) return [];

  const tips: PersonalizedTip[] = [];
  const needs = userProfile.special_needs ?? [];

  if (needs.includes('elderly')) {
    tips.push({ key: 'guidanceElderly', category: 'elderly' });
  }

  if (needs.includes('children')) {
    tips.push({ key: 'guidanceChildren', category: 'children' });
  }

  if (needs.includes('pets')) {
    tips.push({ key: 'guidancePets', category: 'pets' });
  }

  if (
    needs.includes('disability') ||
    (userProfile.mobility_level && userProfile.mobility_level !== 'full')
  ) {
    tips.push({ key: 'guidanceDisability', category: 'disability' });
  }

  if (needs.includes('medical') || userProfile.medical_conditions) {
    tips.push({ key: 'guidanceMedical', category: 'medical' });
  }

  if (userProfile.has_vehicle === true) {
    tips.push({ key: 'guidanceVehicle', category: 'vehicle' });
  } else if (userProfile.has_vehicle === false) {
    tips.push({ key: 'guidanceNoVehicle', category: 'vehicle' });
  }

  return tips;
}
