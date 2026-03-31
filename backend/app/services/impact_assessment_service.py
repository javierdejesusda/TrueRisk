"""Impact Assessment Service.

Translates abstract risk scores into human-interpretable impact categories,
following the UK Met Office approach of communicating weather severity in terms
of societal impact rather than raw index values.

Spanish emergency management context: Protección Civil warnings are often
abstract. This service provides specific, actionable guidance aligned with
Spain's DANA, flood, wildfire and heatwave risk profiles.
"""

from __future__ import annotations

# Province population (INE 2023 census, thousands; derived from pop_density_km2 * province area km2)

# Maps province INE code -> approximate total population
_PROVINCE_POPULATION: dict[str, int] = {
    "01": 333_000,   # Álava
    "02": 388_000,   # Albacete
    "03": 1_881_000, # Alicante/Alacant
    "04": 730_000,   # Almería
    "05": 157_000,   # Ávila
    "06": 685_000,   # Badajoz
    "07": 1_186_000, # Illes Balears
    "08": 5_856_000, # Barcelona
    "09": 349_000,   # Burgos
    "10": 395_000,   # Cáceres
    "11": 1_244_000, # Cádiz
    "12": 580_000,   # Castellón/Castelló
    "13": 497_000,   # Ciudad Real
    "14": 783_000,   # Córdoba
    "15": 1_124_000, # A Coruña
    "16": 196_000,   # Cuenca
    "17": 790_000,   # Girona
    "18": 929_000,   # Granada
    "19": 214_000,   # Guadalajara
    "20": 726_000,   # Gipuzkoa
    "21": 528_000,   # Huelva
    "22": 223_000,   # Huesca
    "23": 625_000,   # Jaén
    "24": 455_000,   # León
    "25": 444_000,   # Lleida
    "26": 321_000,   # La Rioja
    "27": 328_000,   # Lugo
    "28": 6_751_000, # Madrid
    "29": 1_685_000, # Málaga
    "30": 1_518_000, # Murcia
    "31": 661_000,   # Navarra
    "32": 306_000,   # Ourense
    "33": 1_011_000, # Asturias
    "34": 158_000,   # Palencia
    "35": 1_128_000, # Las Palmas
    "36": 958_000,   # Pontevedra
    "37": 327_000,   # Salamanca
    "38": 1_044_000, # S/C de Tenerife
    "39": 584_000,   # Cantabria
    "40": 149_000,   # Segovia
    "41": 1_950_000, # Sevilla
    "42": 87_000,    # Soria
    "43": 822_000,   # Tarragona
    "44": 133_000,   # Teruel
    "45": 700_000,   # Toledo
    "46": 2_589_000, # Valencia/València
    "47": 525_000,   # Valladolid
    "48": 1_162_000, # Bizkaia
    "49": 173_000,   # Zamora
    "50": 974_000,   # Zaragoza
    "51": 83_000,    # Ceuta
    "52": 87_000,    # Melilla
}

_DEFAULT_POPULATION = 300_000  # fallback for unknown province codes


def _score_to_impact_level(score: float) -> str:
    """Map a 0-100 risk score to one of four impact levels."""
    if score <= 20:
        return "minor"
    elif score <= 50:
        return "significant"
    elif score <= 75:
        return "severe"
    else:
        return "extreme"


def _population_affected(score: float, province_code: str) -> int:
    """Estimate number of people directly impacted.

    Scaling logic:
      score 0  → 0% affected
      score 50 → 10% affected
      score 75 → 30% affected
      score 100 → 50% affected

    Uses piecewise linear interpolation.
    """
    total = _PROVINCE_POPULATION.get(province_code, _DEFAULT_POPULATION)

    if score <= 0:
        pct = 0.0
    elif score <= 50:
        # 0-50 maps to 0%-10%
        pct = (score / 50.0) * 0.10
    elif score <= 75:
        # 50-75 maps to 10%-30%
        pct = 0.10 + ((score - 50) / 25.0) * 0.20
    else:
        # 75-100 maps to 30%-50%
        pct = 0.30 + ((score - 75) / 25.0) * 0.20

    return int(total * pct)


# Structure: {hazard_type: {impact_level: {"citizens": [...], "authorities": [...]}}}
_ACTIONS: dict[str, dict[str, dict[str, list[str]]]] = {
    "flood": {
        "minor": {
            "citizens": [
                "Siga los avisos de la AEMET y Protección Civil.",
                "Evite aparcar en zonas propensas a inundaciones.",
            ],
            "authorities": [
                "Revise planes de emergencia de inundación.",
                "Compruebe el estado de los sistemas de drenaje.",
            ],
        },
        "significant": {
            "citizens": [
                "Manténgase alejado de ríos, arroyos y zonas bajas.",
                "Prepare kit de emergencia con documentos, agua y linterna.",
                "Evite conducir por zonas inundadas o con agua en calzada.",
            ],
            "authorities": [
                "Active el plan de emergencia de inundación de nivel 1.",
                "Incremente la vigilancia de cauces y embalses.",
                "Informe a la población mediante avisos de emergencia.",
            ],
        },
        "severe": {
            "citizens": [
                "No cruce cauces ni zonas bajas inundables bajo ningún concepto.",
                "Mueva vehículos a zonas elevadas inmediatamente.",
                "Permanezca en pisos superiores si su vivienda está en zona inundable.",
                "Desconecte los aparatos eléctricos si entra agua.",
                "Llame al 112 solo en caso de emergencia real.",
            ],
            "authorities": [
                "Active el plan de emergencia de inundación de nivel 2.",
                "Ordene evacuación preventiva de zonas de riesgo alto.",
                "Cierre vías de comunicación en zonas inundadas.",
                "Despliegue equipos de rescate en zonas de riesgo.",
                "Coordine con CHJ/CHE/CHG la apertura controlada de embalses.",
            ],
        },
        "extreme": {
            "citizens": [
                "EVACÚE INMEDIATAMENTE si las autoridades lo ordenan.",
                "No intente cruzar ninguna calle o camino con agua en movimiento.",
                "Suba a la parte más alta de su edificio si no puede evacuar.",
                "Aléjese de ventanas y puertas en caso de crecida súbita.",
                "Siga únicamente las instrucciones de Protección Civil y 112.",
            ],
            "authorities": [
                "Active el plan de emergencia de inundación de nivel 3 (máximo).",
                "Ordene evacuación obligatoria de todos los municipios en zona de riesgo.",
                "Solicite apoyo de la UME (Unidad Militar de Emergencias).",
                "Corte toda circulación en vías afectadas.",
                "Establezca centros de acogida para evacuados.",
            ],
        },
    },
    "wildfire": {
        "minor": {
            "citizens": [
                "No haga fuego en el campo ni en zonas forestales.",
                "Extreme las precauciones al desechar colillas o materiales inflamables.",
            ],
            "authorities": [
                "Aumente la vigilancia en zonas forestales.",
                "Revise equipos de extinción.",
            ],
        },
        "significant": {
            "citizens": [
                "Evite encender fuego o realizar actividades que generen chispas en el campo.",
                "Mantenga limpio el perímetro de su vivienda de vegetación seca.",
                "Siga los avisos del Plan Infoca/Infomur/BRIF de su comunidad.",
            ],
            "authorities": [
                "Active el plan de incendios forestales de nivel 1.",
                "Incremente los medios aéreos y terrestres de vigilancia.",
                "Informe a la población sobre restricciones de acceso forestal.",
            ],
        },
        "severe": {
            "citizens": [
                "Prepare evacuación si se encuentra en zona forestal o periurbana.",
                "Cierre puertas y ventanas para evitar la entrada de humo.",
                "Tenga preparado el vehículo con depósito lleno para evacuar.",
                "Siga las instrucciones de los agentes forestales y Protección Civil.",
                "No regrese a zonas afectadas hasta recibir autorización oficial.",
            ],
            "authorities": [
                "Active el plan de incendios forestales de nivel 2.",
                "Evacúe preventivamente urbanizaciones en zona de interfaz urbano-forestal.",
                "Coordine con el CECOP el despliegue de medios de extinción.",
                "Cierre accesos forestales al público.",
                "Establezca cortafuegos de emergencia si es necesario.",
            ],
        },
        "extreme": {
            "citizens": [
                "EVACÚE INMEDIATAMENTE las zonas forestales y periurbanas.",
                "Si el humo le rodea, permanezca en el suelo y cúbrase la boca.",
                "No conduzca hacia el fuego bajo ninguna circunstancia.",
                "Siga únicamente las instrucciones de los servicios de emergencia.",
            ],
            "authorities": [
                "Active el plan de incendios forestales de nivel máximo (3).",
                "Solicite apoyo urgente de la UME.",
                "Establezca perímetro de exclusión en torno al incendio.",
                "Evacúe todos los núcleos en riesgo inminente.",
                "Corte suministro eléctrico en zonas afectadas para prevenir reavivamientos.",
            ],
        },
    },
    "heatwave": {
        "minor": {
            "citizens": [
                "Manténgase bien hidratado bebiendo agua con frecuencia.",
                "Evite el sol directo en las horas centrales del día.",
            ],
            "authorities": [
                "Active protocolos básicos de calor para centros de mayores.",
                "Revise disponibilidad de salas de refrigeración.",
            ],
        },
        "significant": {
            "citizens": [
                "Evite la exposición al sol entre las 12:00 y las 18:00.",
                "Hidratese con agua frecuentemente aunque no sienta sed.",
                "Compruebe el estado de personas mayores, niños y enfermos crónicos.",
                "Refrésquese regularmente con duchas frías o visita a lugares con aire acondicionado.",
            ],
            "authorities": [
                "Active el Plan Nacional de Actuaciones Preventivas por Calor.",
                "Habilite espacios climatizados de acceso público.",
                "Refuerce la vigilancia en residencias de mayores y hospitales.",
            ],
        },
        "severe": {
            "citizens": [
                "Evite la exposición al sol entre las 12:00 y las 18:00 horas.",
                "Hidratese con abundante agua aunque no sienta sed.",
                "Permanezca en lugares frescos o con aire acondicionado.",
                "Evite el ejercicio físico intenso al aire libre.",
                "Ante síntomas de golpe de calor (confusión, piel seca y roja), llame al 112.",
            ],
            "authorities": [
                "Active el Plan de Calor en nivel de alerta.",
                "Habilite centros de refrigeración de emergencia.",
                "Suspenda actividades laborales al aire libre en horas de máxima temperatura.",
                "Refuerce vigilancia en colectivos vulnerables (mayores, sin hogar).",
                "Incremente la dotación de los servicios de urgencias sanitarias.",
            ],
        },
        "extreme": {
            "citizens": [
                "Permanezca en interior con aire acondicionado siempre que sea posible.",
                "No deje nunca niños ni animales en vehículos.",
                "Hidratese continuamente y evite bebidas alcohólicas.",
                "Ante cualquier síntoma de golpe de calor, llame al 112 inmediatamente.",
                "Ayude a vecinos mayores o con movilidad reducida a acceder a zonas frescas.",
            ],
            "authorities": [
                "Declare estado de emergencia por calor extremo.",
                "Activa todos los centros de refugio climático.",
                "Suspende clases y actividades al aire libre.",
                "Refuerza urgencias hospitalarias y servicios de emergencia.",
                "Coordina con servicios sociales la atención a colectivos sin hogar.",
            ],
        },
    },
    "dana": {
        "minor": {
            "citizens": [
                "Siga los avisos meteorológicos de la AEMET.",
                "Evite zonas bajas y cauces en caso de lluvia intensa.",
            ],
            "authorities": [
                "Revise planes de actuación ante DANA.",
                "Compruebe el estado de los sistemas de drenaje urbano.",
            ],
        },
        "significant": {
            "citizens": [
                "Extreme la precaución al conducir; reduzca la velocidad.",
                "Evite acercarse a ramblas, barrancos y zonas bajas.",
                "Siga los avisos de nivel amarillo o naranja de la AEMET.",
            ],
            "authorities": [
                "Active el Plan de Inundaciones de nivel 1.",
                "Incremente la vigilancia de cauces, ramblas y embalses.",
                "Prepare los medios de emergencia para posibles intervenciones.",
            ],
        },
        "severe": {
            "citizens": [
                "Aléjese de barrancos y ramblas inmediatamente.",
                "No cruce zonas inundadas ni caudales en movimiento.",
                "Permanezca en casa y en plantas superiores si hay riesgo de inundación.",
                "Evite los pasos subterráneos (subterráneo) y las zonas bajas.",
                "Siga las instrucciones de Protección Civil en tiempo real.",
            ],
            "authorities": [
                "Active el Plan de Emergencias por DANA en nivel 2.",
                "Ordene cierre de pasos subterráneos y zonas inundables.",
                "Despliegue equipos de rescate en zonas de riesgo.",
                "Coordine con la CHJ/CHE la gestión de caudales y embalses.",
                "Emita alertas de emergencia a la población vía ES-Alert.",
            ],
        },
        "extreme": {
            "citizens": [
                "EVITE cualquier desplazamiento salvo emergencia vital.",
                "Aléjese INMEDIATAMENTE de ramblas, barrancos y zonas bajas.",
                "No entre nunca en pasos subterráneos o zonas inundadas.",
                "Suba a las plantas más altas de su edificio si hay riesgo de avenida.",
                "Siga únicamente las instrucciones del 112 y Protección Civil.",
            ],
            "authorities": [
                "Active el Plan de Emergencias por DANA en nivel 3 (máximo).",
                "Solicite el apoyo urgente de la UME.",
                "Ordene evacuación obligatoria de municipios en zona de inundación grave.",
                "Emita alerta nacional ES-Alert a toda la población afectada.",
                "Establezca centros de acogida y coordine con Cruz Roja.",
            ],
        },
    },
    "drought": {
        "minor": {
            "citizens": [
                "Reduzca el consumo de agua en el hogar.",
                "Evite riegos no esenciales en jardines y zonas deportivas.",
            ],
            "authorities": [
                "Monitorice los niveles de los embalses de su demarcación.",
                "Revise el Plan de Sequía de la Confederación Hidrográfica.",
            ],
        },
        "significant": {
            "citizens": [
                "Reduzca el consumo de agua: dúchese en lugar de bañarse.",
                "Repare fugas en el hogar.",
                "Evite el riego de jardines en horas de máxima evaporación.",
            ],
            "authorities": [
                "Active la Fase de Alerta del Plan de Sequía.",
                "Restrinja el riego agrícola no esencial.",
                "Comunique la situación de los embalses a la población.",
            ],
        },
        "severe": {
            "citizens": [
                "Minimice el uso de agua a los usos esenciales (beber, higiene básica).",
                "Evite lavar el coche o rellenar piscinas.",
                "Informe al ayuntamiento de cualquier fuga o desperdicio de agua.",
                "Almacene agua potable por si hubiera restricciones.",
            ],
            "authorities": [
                "Active la Fase de Emergencia del Plan de Sequía.",
                "Aplique restricciones al riego agrícola y uso recreativo del agua.",
                "Estudie la posibilidad de trasvases o desaladoras de emergencia.",
                "Establezca cortes rotativos si los embalses caen por debajo del 20%.",
            ],
        },
        "extreme": {
            "citizens": [
                "Restrinja el consumo al mínimo vital.",
                "Siga las instrucciones del ayuntamiento sobre horarios de suministro.",
                "No malgaste agua bajo ninguna circunstancia.",
            ],
            "authorities": [
                "Declara situación de emergencia hídrica.",
                "Activa suministro por camiones cisterna en municipios afectados.",
                "Prohíbe todos los usos no esenciales del agua.",
                "Solicita apoyo estatal y de la UE para gestión hídrica.",
            ],
        },
    },
    "seismic": {
        "minor": {
            "citizens": [
                "Asegure muebles y objetos pesados a las paredes.",
                "Conozca las salidas de emergencia de su edificio.",
            ],
            "authorities": [
                "Revise los planes de emergencia sísmica.",
                "Compruebe el estado de edificios singulares en zona sísmica.",
            ],
        },
        "significant": {
            "citizens": [
                "Prepare una mochila de emergencia con agua, documentos y medicamentos.",
                "Localice los puntos de reunión más cercanos.",
                "Fije anclajes de muebles pesados a paredes.",
            ],
            "authorities": [
                "Active el Plan de Emergencia Sísmica de nivel 1.",
                "Revise el estado estructural de edificios públicos y escuelas.",
                "Refuerce la vigilancia sísmica en tiempo real.",
            ],
        },
        "severe": {
            "citizens": [
                "Si nota un sismo, protéjase bajo una mesa resistente o en el umbral de una puerta.",
                "Aléjese de ventanas y estanterías durante el temblor.",
                "Tras el sismo, compruebe daños estructurales antes de volver a entrar.",
                "Espere réplicas y siga las instrucciones de emergencia.",
            ],
            "authorities": [
                "Active el Plan de Emergencia Sísmica de nivel 2.",
                "Inspeccione edificios en busca de daños estructurales.",
                "Prepare equipos de rescate urbano (GROS/USAR).",
                "Evalúe la necesidad de evacuación de edificios dañados.",
            ],
        },
        "extreme": {
            "citizens": [
                "EVACÚE su edificio si hay daños visibles en la estructura.",
                "No use ascensores tras el sismo.",
                "Cierre las llaves de gas y corte la luz si hay daños.",
                "Dirígase a zonas abiertas lejos de edificios y cables.",
                "Llame al 112 solo para emergencias que pongan en peligro vidas.",
            ],
            "authorities": [
                "Active el Plan de Emergencia Sísmica de nivel 3.",
                "Despliegue los equipos USAR (Urban Search and Rescue).",
                "Solicite apoyo de la UME y el Gobierno Central.",
                "Establezca perímetros de seguridad en edificios derrumbados.",
                "Habilite hospitales de campaña y centros de acogida.",
            ],
        },
    },
    "coldwave": {
        "minor": {
            "citizens": [
                "Abríguese adecuadamente al salir al exterior.",
                "Revise el sistema de calefacción de su hogar.",
            ],
            "authorities": [
                "Active protocolos básicos de frío para personas sin hogar.",
                "Compruebe el estado de las redes de agua potable.",
            ],
        },
        "significant": {
            "citizens": [
                "Vista ropa de abrigo en capas.",
                "Evite la exposición prolongada al frío extremo.",
                "Compruebe que personas mayores y vulnerables tengan calefacción.",
            ],
            "authorities": [
                "Active el Plan de Frío.",
                "Habilite albergues de emergencia para personas sin hogar.",
                "Emita comunicados de prevención a colectivos vulnerables.",
            ],
        },
        "severe": {
            "citizens": [
                "Evite desplazamientos innecesarios en condiciones de nieve o hielo.",
                "Proteja las tuberías del exterior para evitar que revienten.",
                "Tenga calefacción de emergencia (mantas eléctricas, leña) disponible.",
                "Compruebe el estado de vecinos mayores o con movilidad reducida.",
                "Si usa calefacción de gas o leña, ventile el espacio para evitar intoxicaciones.",
            ],
            "authorities": [
                "Active el Plan de Frío Extremo.",
                "Despliegue equipos de limpieza vial (salado, quitanieves).",
                "Refuerce albergues y servicios de emergencia social.",
                "Alerte a la DGT sobre condiciones de circulación peligrosas.",
            ],
        },
        "extreme": {
            "citizens": [
                "No salga del hogar salvo emergencia vital.",
                "Almacene provisiones para varios días.",
                "Llame al 112 si detecta síntomas de hipotermia en personas.",
                "No use braseros o calefactores sin ventilación; riesgo mortal de intoxicación.",
            ],
            "authorities": [
                "Declara emergencia por frío extremo.",
                "Cierra colegios y centros no esenciales.",
                "Activa todos los recursos de emergencia social.",
                "Coordina con REE posibles restricciones eléctricas.",
            ],
        },
    },
    "windstorm": {
        "minor": {
            "citizens": [
                "Asegure los objetos en terrazas y balcones que puedan volar.",
                "Evite actividades al aire libre en zonas boscosas o con riesgo de caída de árboles.",
            ],
            "authorities": [
                "Revise el estado de señalización y alumbrado público.",
                "Alerte a servicios de emergencia del riesgo.",
            ],
        },
        "significant": {
            "citizens": [
                "Retire o asegure toldos, macetas y muebles de jardín.",
                "Extreme la precaución al conducir, especialmente en viaductos y zonas expuestas.",
                "Evite aparcamiento bajo árboles o zonas con riesgo de desprendimientos.",
            ],
            "authorities": [
                "Active el Plan de Emergencia por Viento.",
                "Coordine con DGT restricciones de circulación en vías expuestas.",
                "Alerte a los municipios sobre posibles cortes de suministro eléctrico.",
            ],
        },
        "severe": {
            "citizens": [
                "No salga al exterior durante las ráfagas más intensas.",
                "Aléjese de ventanas; el viento puede romper vidrios.",
                "Evite conducir en zonas expuestas, túneles y puentes.",
                "Prepare kit de emergencia por posibles cortes de luz.",
            ],
            "authorities": [
                "Active el Plan de Emergencia por Viento de nivel 2.",
                "Corte el tráfico en puentes, viaductos y zonas de alto riesgo.",
                "Coordine con REE y distribuidoras eléctricas el riesgo de cortes.",
                "Despliegue equipos de gestión de emergencias.",
            ],
        },
        "extreme": {
            "citizens": [
                "Permanezca en el interior de edificios sólidos.",
                "Aléjese de ventanas y evite las zonas sin protección.",
                "Ante cortes de luz prolongados, priorice la conservación de calor y agua.",
                "Siga únicamente las instrucciones de los servicios de emergencia.",
            ],
            "authorities": [
                "Declara emergencia por temporal de viento extremo.",
                "Suspende todos los servicios de transporte público expuestos.",
                "Coordina con REE la gestión de cortes eléctricos masivos.",
                "Solicita apoyo de la UME para operaciones de rescate.",
            ],
        },
    },
}

_DISRUPTIONS: dict[str, dict[str, list[str]]] = {
    "flood": {
        "minor": ["Posibles anegaciones puntuales en zonas bajas."],
        "significant": [
            "Corte de tráfico en vías inundadas.",
            "Posibles interrupciones en el suministro de agua potable.",
        ],
        "severe": [
            "Carreteras principales cortadas por inundación.",
            "Posibles cortes de suministro eléctrico en zonas inundadas.",
            "Interrupción del servicio ferroviario en tramos afectados.",
            "Cierre de colegios y centros públicos en zonas inundables.",
        ],
        "extreme": [
            "Colapso de vías de comunicación en la zona afectada.",
            "Cortes masivos de electricidad, agua y comunicaciones.",
            "Evacuación de hospitales y centros sanitarios en riesgo.",
            "Interrupción total del transporte público.",
            "Daños estructurales en edificios e infraestructuras.",
        ],
    },
    "wildfire": {
        "minor": ["Posible humo visible en zonas forestales. Sin impacto en servicios."],
        "significant": [
            "Cierre de accesos forestales y rutas de senderismo.",
            "Posible humo con afección a la calidad del aire.",
        ],
        "severe": [
            "Cierre de carreteras en la zona del incendio.",
            "Cortes de suministro eléctrico por afección a líneas aéreas.",
            "Evacuación de urbanizaciones en interfaz forestal.",
            "Degradación importante de la calidad del aire.",
        ],
        "extreme": [
            "Destrucción de infraestructuras en la zona afectada.",
            "Cortes masivos de electricidad.",
            "Evacuación masiva de municipios.",
            "Cierre total de accesos a la zona.",
            "Contaminación severa del aire en un radio amplio.",
        ],
    },
    "heatwave": {
        "minor": ["Mayor demanda de agua y electricidad. Sin disrupciones significativas."],
        "significant": [
            "Aumento de demanda eléctrica con posibles tensiones en la red.",
            "Mayor presión sobre los servicios sanitarios de urgencias.",
        ],
        "severe": [
            "Posibles restricciones en el suministro eléctrico por alta demanda.",
            "Incremento significativo de llamadas al 112.",
            "Cancelación de eventos al aire libre.",
            "Mayor riesgo de avería en infraestructuras sensibles al calor.",
        ],
        "extreme": [
            "Posibles apagones por sobrecarga de la red eléctrica.",
            "Colapso parcial de los servicios de urgencias sanitarias.",
            "Cierre de colegios y centros de trabajo no esenciales.",
            "Restricciones al transporte en horas de mayor calor.",
            "Riesgo de daños en infraestructuras viales (asfalto).",
        ],
    },
    "dana": {
        "minor": ["Posibles acumulaciones de agua en zonas bajas."],
        "significant": [
            "Cortes de tráfico en vías inundadas.",
            "Posibles retrasos en transporte público.",
        ],
        "severe": [
            "Avenidas súbitas en barrancos y ramblas.",
            "Carreteras cortadas por inundaciones o deslizamientos.",
            "Cortes de luz y comunicaciones en zonas afectadas.",
            "Posible interrupción del servicio ferroviario.",
        ],
        "extreme": [
            "Inundaciones catastróficas en zonas bajas y cauces.",
            "Destrucción de infraestructuras de comunicación.",
            "Cortes masivos de suministros básicos.",
            "Posibles pérdidas de vidas si no se toman medidas de evacuación.",
            "Daños graves en viviendas e instalaciones públicas.",
        ],
    },
    "drought": {
        "minor": ["Leve descenso en los niveles de embalses. Sin afección al suministro."],
        "significant": [
            "Restricciones al riego agrícola.",
            "Posibles reducciones en caudales fluviales.",
        ],
        "severe": [
            "Restricciones severas al uso del agua.",
            "Impacto en la producción agrícola de secano.",
            "Posibles cortes rotativos de suministro.",
            "Deterioro de ecosistemas fluviales.",
        ],
        "extreme": [
            "Crisis hídrica: restricciones de abastecimiento a hogares.",
            "Pérdidas masivas en el sector agrícola.",
            "Desaparición de ríos y humedales.",
            "Suministro por camiones cisterna en municipios afectados.",
        ],
    },
    "seismic": {
        "minor": ["Temblores perceptibles pero sin daños materiales esperados."],
        "significant": [
            "Posibles daños menores en edificios más antiguos.",
            "Posibles cortes breves de suministros.",
        ],
        "severe": [
            "Daños estructurales en edificios vulnerables.",
            "Cortes de gas, electricidad y agua potable.",
            "Interrupciones en el transporte ferroviario.",
            "Posibles deslizamientos de ladera.",
        ],
        "extreme": [
            "Derrumbamientos de edificios.",
            "Cortes masivos de todos los suministros.",
            "Destrucción de infraestructuras viarias.",
            "Posibles tsunamis si el epicentro es marino.",
            "Colapso de servicios de emergencia por saturación.",
        ],
    },
    "coldwave": {
        "minor": ["Posible formación de hielo en calzadas por la noche."],
        "significant": [
            "Formación de hielo en carreteras y riesgo de accidentes.",
            "Mayor demanda de gas y electricidad para calefacción.",
        ],
        "severe": [
            "Cierre de carreteras de montaña por nieve o hielo.",
            "Rotura de tuberías y cortes de agua.",
            "Restricciones a la circulación de vehículos pesados.",
            "Mayor presión sobre servicios sanitarios.",
        ],
        "extreme": [
            "Colapso de redes de agua por rotura masiva de tuberías.",
            "Cortes eléctricos por sobrecarga y daños en la red.",
            "Cierre total de vías de comunicación.",
            "Crisis de salud pública por hipotermia.",
        ],
    },
    "windstorm": {
        "minor": ["Posible caída de ramas y objetos ligeros. Sin disrupciones relevantes."],
        "significant": [
            "Daños en señalización y mobiliario urbano.",
            "Posibles cortes breves de suministro eléctrico.",
        ],
        "severe": [
            "Caída de árboles y postes en vías públicas.",
            "Cortes de electricidad en zonas expuestas.",
            "Cierre de puentes, viaductos y tramos de autovía.",
            "Cancelación de vuelos y servicios marítimos.",
        ],
        "extreme": [
            "Cortes masivos de electricidad y comunicaciones.",
            "Daños estructurales en edificios y tejados.",
            "Cierre total de aeropuertos y puertos.",
            "Interrupción del transporte ferroviario.",
            "Riesgo de accidentes graves por objetos en movimiento.",
        ],
    },
}

_GENERIC_ACTIONS: dict[str, dict[str, list[str]]] = {
    "minor": {
        "citizens": ["Siga los avisos de las autoridades competentes."],
        "authorities": ["Monitorice la situación y mantenga los protocolos de alerta."],
    },
    "significant": {
        "citizens": [
            "Prepare un kit de emergencia básico.",
            "Siga los avisos de Protección Civil.",
        ],
        "authorities": [
            "Active el plan de emergencia de nivel 1.",
            "Informe a la población mediante canales oficiales.",
        ],
    },
    "severe": {
        "citizens": [
            "Siga estrictamente las instrucciones de las autoridades.",
            "Prepárese para una posible evacuación.",
        ],
        "authorities": [
            "Active el plan de emergencia de nivel 2.",
            "Despliegue los medios de respuesta necesarios.",
        ],
    },
    "extreme": {
        "citizens": [
            "Siga ÚNICAMENTE las instrucciones de los servicios de emergencia.",
            "No ponga en riesgo su vida ni la de los demás.",
        ],
        "authorities": [
            "Active el plan de emergencia de nivel máximo.",
            "Solicite apoyo de la UME y recursos estatales.",
        ],
    },
}

_GENERIC_DISRUPTIONS: dict[str, list[str]] = {
    "minor": ["Sin disrupciones significativas previstas."],
    "significant": ["Posibles interrupciones menores en servicios."],
    "severe": ["Interrupciones en servicios e infraestructuras en la zona afectada."],
    "extreme": ["Disrupciones graves en servicios esenciales e infraestructuras críticas."],
}



def assess_impact(
    hazard_type: str,
    score: float,
    province_code: str,
) -> dict:
    """Translate a raw risk score into a human-interpretable impact assessment.

    Args:
        hazard_type: One of "flood", "wildfire", "heatwave", "drought",
                     "dana", "seismic", "coldwave", "windstorm".
        score:       Risk score on a 0-100 scale.
        province_code: INE 2-digit province code (e.g. "28" for Madrid).

    Returns:
        dict with keys:
          - impact_level: "minor" | "significant" | "severe" | "extreme"
          - population_affected: int, estimated number of people impacted
          - recommended_actions: {"citizens": [...], "authorities": [...]}
          - expected_disruptions: [str, ...]
    """
    level = _score_to_impact_level(score)
    population = _population_affected(score, province_code)

    # Look up hazard-specific actions, falling back to generic
    hazard_actions = _ACTIONS.get(hazard_type, {})
    actions = hazard_actions.get(level) or _GENERIC_ACTIONS[level]

    hazard_disruptions = _DISRUPTIONS.get(hazard_type, {})
    disruptions = hazard_disruptions.get(level) or _GENERIC_DISRUPTIONS[level]

    return {
        "impact_level": level,
        "population_affected": population,
        "recommended_actions": {
            "citizens": list(actions["citizens"]),
            "authorities": list(actions["authorities"]),
        },
        "expected_disruptions": list(disruptions),
    }
