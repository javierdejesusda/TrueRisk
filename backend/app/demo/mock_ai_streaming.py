"""Mock AI streaming responses for demo mode."""
import asyncio


async def stream_mock_summary(province_code: str, locale: str = "es"):
    """Yield pre-written summary chunks mimicking AI streaming."""
    if province_code == "46":
        if locale == "es":
            chunks = [
                "## Situacion de Emergencia en Valencia\n\n",
                "La **DANA** (Depresion Aislada en Niveles Altos) ",
                "esta impactando con fuerza extraordinaria la provincia de Valencia. ",
                "Las precipitaciones acumuladas **superan los 300 mm** en las ultimas 6 horas, ",
                "una cantidad que normalmente cae en 4-5 meses.\n\n",
                "### Zonas mas afectadas\n",
                "- **Paiporta, Sedavi, Alfafar, Catarroja**: Inundaciones severas por desbordamiento del Barranco del Poyo\n",
                "- **Valencia centro**: Calles anegadas, sistema de drenaje colapsado\n",
                "- **L'Horta Sud**: Nivel del agua en algunas zonas supera los 1.5 metros\n\n",
                "### Recomendaciones urgentes\n",
                "1. **No cruce zonas inundadas** - 30 cm de agua pueden arrastrar un vehiculo\n",
                "2. **Suba a pisos altos** si el agua entra en su vivienda\n",
                "3. **Llame al 112** solo en emergencias vitales\n",
                "4. **No use el vehiculo** bajo ninguna circunstancia\n\n",
                "La situacion se espera que mejore en las proximas **12-18 horas** ",
                "a medida que la DANA se desplace hacia el suroeste.",
            ]
        else:
            chunks = [
                "## Emergency Situation in Valencia\n\n",
                "The **DANA** (Isolated Depression at Upper Levels) ",
                "is striking Valencia province with extraordinary force. ",
                "Accumulated rainfall **exceeds 300mm** in the last 6 hours — ",
                "an amount that normally falls over 4-5 months.\n\n",
                "### Most affected areas\n",
                "- **Paiporta, Sedavi, Alfafar, Catarroja**: Severe flooding from Barranco del Poyo overflow\n",
                "- **Valencia city center**: Streets flooded, drainage system collapsed\n",
                "- **L'Horta Sud**: Water levels exceeding 1.5 meters in some areas\n\n",
                "### Urgent recommendations\n",
                "1. **Do not cross flooded areas** — 30cm of water can sweep a vehicle\n",
                "2. **Move to upper floors** if water enters your building\n",
                "3. **Call 112** only for life-threatening emergencies\n",
                "4. **Do not drive** under any circumstances\n\n",
                "Conditions are expected to improve in the next **12-18 hours** ",
                "as the DANA system moves southwest.",
            ]
    else:
        if locale == "es":
            chunks = [
                f"## Resumen de Riesgo - Provincia {province_code}\n\n",
                "Las condiciones meteorologicas se mantienen dentro de parametros normales. ",
                "No hay alertas activas significativas para su zona.\n\n",
                "Mantenga su nivel habitual de preparacion y ",
                "consulte las actualizaciones si las condiciones cambian.",
            ]
        else:
            chunks = [
                f"## Risk Summary - Province {province_code}\n\n",
                "Weather conditions remain within normal parameters. ",
                "No significant active alerts for your area.\n\n",
                "Maintain your usual preparedness level and ",
                "check for updates if conditions change.",
            ]

    for chunk in chunks:
        yield chunk
        await asyncio.sleep(0.08)  # Simulate streaming delay


async def stream_mock_suggestions(province_code: str, locale: str = "es"):
    """Yield pre-written personalized suggestions mimicking AI streaming."""
    if province_code == "46":
        if locale == "es":
            chunks = [
                "### Acciones recomendadas ahora\n\n",
                "1. **Verifique su kit de emergencia** - Asegurese de tener agua, linterna y cargador de movil accesibles\n",
                "2. **Suba objetos de valor** a pisos superiores si vive en planta baja\n",
                "3. **Cargue todos los dispositivos** al maximo antes de posibles cortes de luz\n",
                "4. **Revise su plan de evacuacion** con todos los miembros del hogar\n",
                "5. **No baje al garaje** - Son las zonas mas peligrosas durante inundaciones\n\n",
                "### Para su mascota (Luna)\n",
                "- Prepare el transportin con agua y comida\n",
                "- Tenga la documentacion veterinaria a mano\n",
                "- Mantenga a Luna en una zona elevada y segura\n",
            ]
        else:
            chunks = [
                "### Recommended actions now\n\n",
                "1. **Check your emergency kit** — Ensure water, flashlight, and phone charger are accessible\n",
                "2. **Move valuables to upper floors** if you live on ground level\n",
                "3. **Charge all devices** to full before potential power cuts\n",
                "4. **Review your evacuation plan** with all household members\n",
                "5. **Do not go to the garage** — Most dangerous areas during floods\n",
            ]
    else:
        if locale == "es":
            chunks = [
                "### Sugerencias de preparacion\n\n",
                "1. Revise su kit de emergencia mensualmente\n",
                "2. Actualice sus contactos de emergencia\n",
                "3. Consulte el mapa de riesgo de su zona\n",
            ]
        else:
            chunks = [
                "### Preparedness suggestions\n\n",
                "1. Review your emergency kit monthly\n",
                "2. Update your emergency contacts\n",
                "3. Check the risk map for your area\n",
            ]

    for chunk in chunks:
        yield chunk
        await asyncio.sleep(0.08)
