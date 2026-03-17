/**
 * Few-shot examples for the recommendation pipeline.
 * Each example demonstrates the level of personalization expected from the LLM.
 * Keyed by emergency type; responses are written in Spanish.
 */

export interface FewShotExample {
  emergencyType: string;
  userContext: string;
  response: string;
}

export const FEW_SHOT_EXAMPLES: Record<string, FewShotExample[]> = {
  flood: [
    {
      emergencyType: 'flood',
      userContext:
        'Usuario en silla de ruedas, vive en planta baja en Valencia durante un episodio de DANA. ' +
        'Precipitacion: 120mm, viento: 60km/h, humedad: 95%.',
      response:
        'ALERTA URGENTE - INUNDACION EN VALENCIA\n\n' +
        'Dada su situacion como usuario de silla de ruedas en planta baja durante este episodio de DANA, ' +
        'su prioridad absoluta es trasladarse a un piso superior lo antes posible. Las plantas bajas en Valencia ' +
        'son las primeras en recibir el impacto del agua en eventos de DANA como los vividos en octubre de 2024. ' +
        'Contacte inmediatamente con vecinos de pisos superiores o llame al 112 para solicitar asistencia en la evacuacion.\n\n' +
        'Mientras espera ayuda, desconecte la electricidad desde el cuadro general de su vivienda. ' +
        'El agua y la electricidad son una combinacion letal. Prepare una bolsa impermeable con su documentacion, ' +
        'medicamentos, telefono movil y cargador. Si utiliza silla de ruedas electrica, tenga en cuenta que ' +
        'no funcionara en contacto con el agua; necesitara asistencia fisica para moverse.\n\n' +
        'NO intente salir a la calle. Las corrientes de agua de una DANA pueden arrastrar vehiculos, ' +
        'y para una persona con movilidad reducida el riesgo es extremo. Si el agua comienza a entrar en la vivienda ' +
        'y no ha podido evacuar, suba a la superficie mas alta disponible: mesa, encimera o armario resistente. ' +
        'Llame al 112 indicando su direccion exacta y que es una persona con movilidad reducida.\n\n' +
        'Numeros de emergencia: 112 (emergencias generales), 900 161 161 (Proteccion Civil Valencia). ' +
        'Mantengase informado por la app de la AEMET y las redes sociales oficiales de Proteccion Civil.',
    },
  ],

  heat_wave: [
    {
      emergencyType: 'heat_wave',
      userContext:
        'Persona mayor de 78 anos con problemas respiratorios cronicos, vive en un piso alto en Sevilla. ' +
        'Temperatura: 44°C, humedad: 15%, indice UV: 11.',
      response:
        'ALERTA POR OLA DE CALOR EXTREMO - SEVILLA\n\n' +
        'Con 44°C en Sevilla y sus problemas respiratorios cronicos, usted se encuentra en una situacion ' +
        'de alto riesgo. El calor extremo combinado con la baja humedad agrava significativamente ' +
        'las condiciones respiratorias y puede provocar un golpe de calor con mucha rapidez en personas mayores. ' +
        'Su cuerpo tiene menor capacidad de termorregulacion, por lo que debe actuar de forma preventiva.\n\n' +
        'Permanezca en casa con las persianas bajadas y, si tiene aire acondicionado, mantengalo entre 24-26°C. ' +
        'Si no tiene aire acondicionado, coloque toallas humedas en las ventanas y use un ventilador. ' +
        'Beba agua con frecuencia aunque no tenga sed: al menos un vaso cada 30 minutos. ' +
        'Evite bebidas con cafeina o alcohol. Coma frutas y ensaladas ligeras.\n\n' +
        'IMPORTANTE sobre su medicacion: Algunos medicamentos respiratorios pueden afectar la regulacion ' +
        'termica del cuerpo. Almacene sus inhaladores y medicamentos a menos de 25°C; ' +
        'si su vivienda supera esa temperatura, guardelos en la nevera envueltos en un pano. ' +
        'Tenga siempre a mano su inhalador de rescate. Si nota dificultad respiratoria inusual, ' +
        'mareos, confusion, nauseas o piel muy caliente y seca, llame al 112 inmediatamente.\n\n' +
        'Si su vivienda se vuelve insoportable, acuda a los centros climatizados habilitados por el ' +
        'Ayuntamiento de Sevilla (bibliotecas, centros civicos). Evite salir entre las 12:00 y las 20:00. ' +
        'Pida a un familiar o vecino que le llame cada pocas horas para comprobar su estado.',
    },
  ],

  wind_storm: [
    {
      emergencyType: 'wind_storm',
      userContext:
        'Persona con mascotas (perro y gato) en piso alto (8a planta) en Barcelona. ' +
        'Viento: 110km/h, precipitacion: 25mm, presion: 990hPa.',
      response:
        'ALERTA POR TORMENTA DE VIENTO SEVERA - BARCELONA\n\n' +
        'Con vientos de 110 km/h en su piso alto de Barcelona, su vivienda esta especialmente expuesta. ' +
        'Los pisos altos reciben el impacto del viento con mayor intensidad, y los objetos pueden convertirse ' +
        'en proyectiles peligrosos. Su primera accion debe ser retirar inmediatamente TODOS los objetos ' +
        'de balcones y terrazas: macetas, tendederos, sillas, toldos. Cualquier objeto suelto puede salir ' +
        'volando y causar danos graves a personas en la calle o edificios cercanos.\n\n' +
        'Cierre todas las ventanas y persianas. Alejese de cristaleras y ventanales, especialmente ' +
        'los orientados a la direccion del viento. Refugiese con sus mascotas en una habitacion interior, ' +
        'preferiblemente sin ventanas exteriores o con ventanas pequenas. Un pasillo interior o el bano ' +
        'suelen ser los lugares mas seguros.\n\n' +
        'Respecto a sus mascotas: Los animales perciben los cambios de presion atmosferica y pueden estar ' +
        'muy nerviosos. Mantenga al perro con correa incluso dentro de casa para controlar sus movimientos. ' +
        'El gato buscara esconderse; dejele hacerlo pero asegurese de que no se meta detras de electrodomesticos. ' +
        'Prepare transportines por si fuera necesaria una evacuacion. NO saque al perro a pasear bajo ninguna ' +
        'circunstancia; los objetos volantes y las ramas caidas representan un peligro mortal.\n\n' +
        'Tenga linternas y baterias preparadas ya que los cortes de luz son muy probables con estos vientos. ' +
        'Cargue todos los dispositivos moviles. Si escucha crujidos estructurales inusuales en el edificio, ' +
        'baje a las plantas intermedias (3a-4a planta) y avise al 112.',
    },
  ],

  cold_snap: [
    {
      emergencyType: 'cold_snap',
      userContext:
        'Familia con dos ninos pequenos (3 y 6 anos) en casa unifamiliar en las afueras de Madrid. ' +
        'Temperatura: -12°C, viento: 40km/h, precipitacion nieve: 45cm, similar a la borrasca Filomena.',
      response:
        'ALERTA POR OLA DE FRIO EXTREMO - MADRID (TIPO FILOMENA)\n\n' +
        'Con -12°C y acumulacion de nieve significativa en su casa unifamiliar de Madrid, deben prepararse ' +
        'para un posible aislamiento de varios dias, como ocurrio con Filomena en enero de 2021. ' +
        'Con dos ninos pequenos, la prioridad es mantener la vivienda calida y segura. ' +
        'Concentren la actividad familiar en una o dos habitaciones para conservar el calor de manera eficiente ' +
        'y cierren las puertas de las habitaciones que no utilicen.\n\n' +
        'SEGURIDAD EN LA CALEFACCION: Si usan estufas de gas o lena, aseguren ventilacion adecuada para ' +
        'evitar intoxicacion por monoxido de carbono. NUNCA usen el horno de la cocina para calentar la casa. ' +
        'Si tienen chimenea, asegurense de que el tiro esta limpio y abierto. Mantengan a los ninos ' +
        'alejados de cualquier fuente de calor directa. Revisen que el detector de humo funciona.\n\n' +
        'PROTECCION DE TUBERIAS: Las tuberias exteriores y las que pasan por zonas sin calefaccion pueden ' +
        'congelarse y reventar. Deje un hilo de agua corriendo en los grifos mas alejados de la caldera. ' +
        'Si tiene tuberias exteriores accesibles, envuelvalas con toallas o mantas. ' +
        'Cierre la llave de paso del agua exterior del jardin.\n\n' +
        'SUMINISTROS: Asegurense de tener agua embotellada (minimo 3 litros por persona al dia para 3 dias), ' +
        'alimentos no perecederos, leche y comida adecuada para los ninos, medicamentos basicos (paracetamol infantil, ' +
        'termometro), linternas con pilas, mantas extra, y el telefono movil cargado. ' +
        'Si los ninos necesitan salir, vistanlos en capas: camiseta termica, forro polar, abrigo impermeable, ' +
        'gorro, guantes y botas impermeables. Vigilen signos de hipotermia: temblores, labios azulados, somnolencia.\n\n' +
        'No intenten desplazarse en coche salvo emergencia medica. Las carreteras con hielo son extremadamente ' +
        'peligrosas. En caso de emergencia: 112. Proteccion Civil Madrid: 900 720 112.',
    },
  ],
};
