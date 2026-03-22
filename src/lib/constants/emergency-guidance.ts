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

interface LocalizedGuidance {
  es: EmergencyGuidance;
  en: EmergencyGuidance;
}

const EMERGENCY_GUIDANCE: Record<string, LocalizedGuidance> = {
  flood: {
    es: {
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
    en: {
      hazardType: 'flood',
      title: 'Flood Risk',
      severity: 'critical',
      sections: {
        situation: 'Current weather conditions indicate a high risk of flooding in your province. Heavy rainfall or snowmelt can cause rapid rises in rivers and streams.',
        immediateActions: [
          'Avoid low-lying areas, river banks, ravines, and basements',
          'Do not cross flooded roads — 30 cm of water can sweep away a vehicle',
          'Move to upper floors if water is rising in your area',
          'Disconnect electricity if water reaches your home',
          'Keep documents, essential medication, and a charged phone at hand',
        ],
        preparation: [
          'Prepare an emergency backpack with water, non-perishable food, and a flashlight',
          'Identify the evacuation routes for your area',
          'Store important documents in waterproof bags',
          'Charge all electronic devices',
          'Fill the bathtub and containers with drinking water in case supply is cut',
        ],
        evacuation: [
          'If authorities order evacuation, do so immediately',
          'Follow official routes — do not take shortcuts',
          'Bring your emergency backpack and documents',
          'Turn off gas, water, and electricity before leaving',
          'Go to the meeting point designated by Civil Protection',
        ],
      },
    },
  },
  wildfire: {
    es: {
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
    en: {
      hazardType: 'wildfire',
      title: 'Wildfire Risk',
      severity: 'critical',
      sections: {
        situation: 'High temperatures, low humidity, and wind create conditions favorable for wildfires. The risk of rapid spread is high.',
        immediateActions: [
          'Move combustible materials away from your home (firewood, garden furniture, trash)',
          'Close windows and shutters if you detect nearby smoke',
          'Have cotton clothing, closed shoes, and a mask ready',
          'Do not barbecue or use machinery that creates sparks',
          'Call 112 if you detect smoke or fire',
        ],
        preparation: [
          'Clear dry vegetation within 30 meters around your home',
          'Check that the garden hose works properly',
          'Prepare an emergency backpack with water and documents',
          'Know the escape routes from your neighborhood or town',
          'Ensure firefighter access routes are clear',
        ],
        evacuation: [
          'Evacuate as soon as authorities instruct — do not wait to see flames',
          'Drive with windows closed and lights on',
          'If surrounded by fire on a road, stay in the car with the engine running',
          'Never flee uphill on a slope — fire advances faster uphill',
          'Go to the meeting point indicated by Civil Protection',
        ],
      },
    },
  },
  drought: {
    es: {
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
    en: {
      hazardType: 'drought',
      title: 'Drought Alert',
      severity: 'high',
      sections: {
        situation: 'Precipitation levels are significantly below the historical average. Water reserves may be affected and responsible water use is recommended.',
        immediateActions: [
          'Reduce water consumption to the minimum necessary',
          'Do not water gardens or wash cars with a hose',
          'Reuse kitchen water for watering plants',
          'Report water leaks to the municipal service',
          'Follow the water restrictions set by your municipality',
        ],
        preparation: [
          'Install flow reducers on taps and showers',
          'Store drinking water for several days',
          'Check pipes and cisterns for leaks',
          'Plan your weekly water consumption',
          'Check the status of reservoirs in your river basin',
        ],
      },
    },
  },
  heatwave: {
    es: {
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
    en: {
      hazardType: 'heatwave',
      title: 'Heat Wave',
      severity: 'critical',
      sections: {
        situation: 'Extremely high temperatures are expected that can pose a serious health risk, especially for elderly people, children, and those with chronic conditions.',
        immediateActions: [
          'Avoid going outside between 12:00 and 18:00',
          'Stay continuously hydrated — drink water even if not thirsty',
          'Stay in cool, ventilated spaces',
          'Wear light, loose-fitting, light-colored clothing',
          'Pay special attention to elderly people and children',
        ],
        preparation: [
          'Prepare water and isotonic drink supplies',
          'Install awnings or blinds on sun-facing windows',
          'Identify nearby air-conditioned shelters (shopping centers, libraries)',
          'Keep a fan or humidifier at hand',
          'Check that the air conditioning works properly',
        ],
        evacuation: [
          'If someone shows signs of heat stroke (confusion, red and dry skin, high body temperature), call 112 immediately',
          'Move the person to shade and apply wet cloths',
          'Do not administer aspirin or paracetamol',
        ],
      },
    },
  },
  seismic: {
    es: {
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
    en: {
      hazardType: 'seismic',
      title: 'Seismic Risk',
      severity: 'high',
      sections: {
        situation: 'Seismic activity has been detected in the area. Although most earthquakes in Spain are low intensity, knowing the action protocols is important.',
        immediateActions: [
          'During an earthquake: DROP, take COVER under a sturdy table, and HOLD ON',
          'Stay away from windows, mirrors, and objects that could fall',
          'If outside, move away from buildings, streetlights, and power lines',
          'Do not use elevators under any circumstances',
          'If driving, stop in a safe place away from bridges and structures',
        ],
        preparation: [
          'Secure heavy furniture to the wall (bookshelves, cabinets)',
          'Identify safe spots in each room (door frames, sturdy tables)',
          'Keep a flashlight, battery-powered radio, and first aid kit',
          'Know where the gas, water, and electricity shutoffs are',
          'Practice the protocol with your family',
        ],
      },
    },
  },
  coldwave: {
    es: {
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
    en: {
      hazardType: 'coldwave',
      title: 'Cold Wave',
      severity: 'high',
      sections: {
        situation: 'Very low temperatures are expected that can cause frost, road ice, and health risks from hypothermia.',
        immediateActions: [
          'Dress in multiple layers and cover head, hands, and feet',
          'Limit outdoor trips to the minimum necessary',
          'Check the heating and ensure you have enough fuel',
          'Protect exterior pipes against freezing (insulation, constant drip)',
          'Check on elderly and vulnerable people',
        ],
        preparation: [
          'Store extra blankets, warm clothing, and hot food',
          'Check tire condition and carry chains if traveling to mountain areas',
          'Charge your phone and keep spare batteries',
          'Stay informed about weather developments',
          'If you have a fireplace, check the flue and keep dry firewood',
        ],
      },
    },
  },
  windstorm: {
    es: {
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
    en: {
      hazardType: 'windstorm',
      title: 'Strong Wind Alert',
      severity: 'high',
      sections: {
        situation: 'Very strong wind gusts are expected that can cause falling trees, structural damage, and power outages.',
        immediateActions: [
          'Collect awnings, flower pots, and any loose objects on terraces and gardens',
          'Close and secure windows and shutters',
          'Avoid going outside unless absolutely necessary',
          'Do not shelter under trees, billboards, or scaffolding',
          'If driving, reduce speed and hold the steering wheel firmly',
        ],
        preparation: [
          'Keep a flashlight and battery-powered radio in case of power cuts',
          'Identify the most sheltered rooms in your home (interior, no windows)',
          'Park your vehicle away from trees and facades at risk',
          'Secure garage doors and storage units',
          'Check the condition of the roof and antennas',
        ],
      },
    },
  },
};

export function getGuidanceForRisk(
  dominantHazard: string | undefined,
  compositeScore: number | undefined,
  locale: string = 'es',
): EmergencyGuidance | null {
  if (!dominantHazard || !compositeScore || compositeScore < 60) return null;
  const localized = EMERGENCY_GUIDANCE[dominantHazard];
  if (!localized) return null;
  return locale === 'en' ? localized.en : localized.es;
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
