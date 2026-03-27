"""Preparedness scoring service -- personalized checklists and gamified readiness."""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.preparedness import PreparednessItem, PreparednessSnapshot
from app.models.province import Province
from app.models.user import User
from app.schemas.preparedness import (
    CategoryProgress,
    ChecklistItem,
    ChecklistResponse,
    PreparednessHistoryEntry,
    PreparednessScoreResponse,
)

logger = logging.getLogger(__name__)

CATEGORY_WEIGHTS = {
    "kit": 0.25,
    "plan": 0.25,
    "alerts": 0.20,
    "community": 0.15,
    "knowledge": 0.15,
}

CATEGORY_LABELS = {
    "kit": "Emergency Kit",
    "plan": "Emergency Plan",
    "alerts": "Alert Configuration",
    "community": "Community Engagement",
    "knowledge": "Knowledge & Training",
}

CATEGORY_LABELS_ES = {
    "kit": "Kit de Emergencia",
    "plan": "Plan de Emergencia",
    "alerts": "Configuracion de Alertas",
    "community": "Participacion Comunitaria",
    "knowledge": "Conocimiento y Formacion",
}

# Base checklist catalog -- items that apply to all users
CHECKLIST_CATALOG: dict[str, list[dict]] = {
    "kit": [
        {"key": "water_supply", "label": "Water supply (3 days)", "label_es": "Suministro de agua (3 dias)", "desc": "Store at least 3 liters per person per day for 3 days", "desc_es": "Almacenar al menos 3 litros por persona al dia durante 3 dias", "priority": "high"},
        {"key": "non_perishable_food", "label": "Non-perishable food (3 days)", "label_es": "Comida no perecedera (3 dias)", "desc": "Canned goods, energy bars, dried fruit", "desc_es": "Conservas, barritas energeticas, fruta seca", "priority": "high"},
        {"key": "first_aid_kit", "label": "First aid kit", "label_es": "Botiquin de primeros auxilios", "desc": "Bandages, antiseptic, pain relievers, personal medications", "desc_es": "Vendas, antiseptico, analgesicos, medicamentos personales", "priority": "high"},
        {"key": "flashlight_batteries", "label": "Flashlight and batteries", "label_es": "Linterna y pilas", "desc": "LED flashlight with extra batteries or hand-crank flashlight", "desc_es": "Linterna LED con pilas extra o linterna de manivela", "priority": "normal"},
        {"key": "portable_radio", "label": "Portable radio", "label_es": "Radio portatil", "desc": "Battery-powered or hand-crank radio for emergency broadcasts", "desc_es": "Radio a pilas o de manivela para emisiones de emergencia", "priority": "normal"},
        {"key": "phone_charger", "label": "Phone charger / power bank", "label_es": "Cargador / bateria externa", "desc": "Keep a fully charged portable power bank ready", "desc_es": "Mantener una bateria externa completamente cargada", "priority": "high"},
        {"key": "important_documents", "label": "Document copies", "label_es": "Copias de documentos", "desc": "Copies of ID, insurance, medical records in waterproof bag", "desc_es": "Copias de DNI, seguro, historial medico en bolsa impermeable", "priority": "normal"},
        {"key": "cash_reserve", "label": "Cash reserve", "label_es": "Reserva de efectivo", "desc": "Small denomination bills and coins in case ATMs are down", "desc_es": "Billetes pequenos y monedas por si cajeros no funcionan", "priority": "normal"},
        {"key": "whistle", "label": "Emergency whistle", "label_es": "Silbato de emergencia", "desc": "To signal for help if trapped", "desc_es": "Para pedir ayuda si queda atrapado", "priority": "normal"},
        {"key": "multi_tool", "label": "Multi-tool / knife", "label_es": "Multiherramienta / cuchillo", "desc": "A basic multi-tool for various emergency needs", "desc_es": "Una multiherramienta basica para diversas necesidades", "priority": "normal"},
    ],
    "plan": [
        {"key": "emergency_contact", "label": "Emergency contact set", "label_es": "Contacto de emergencia configurado", "desc": "Set your emergency contact in your TrueRisk profile", "desc_es": "Configura tu contacto de emergencia en tu perfil", "priority": "high", "auto_check": "emergency_contact"},
        {"key": "meeting_point", "label": "Family meeting point", "label_es": "Punto de encuentro familiar", "desc": "Agree on a meeting point outside your home and neighbourhood", "desc_es": "Acordar un punto de encuentro fuera de casa y del barrio", "priority": "high"},
        {"key": "evacuation_route", "label": "Know evacuation routes", "label_es": "Conocer rutas de evacuacion", "desc": "Identify at least 2 evacuation routes from your home", "desc_es": "Identificar al menos 2 rutas de evacuacion desde casa", "priority": "high"},
        {"key": "household_plan", "label": "Household emergency plan", "label_es": "Plan de emergencia del hogar", "desc": "Create your emergency plan using the plan builder", "desc_es": "Crear tu plan de emergencia con el asistente", "priority": "high"},
        {"key": "utility_shutoff", "label": "Know utility shut-offs", "label_es": "Conocer llaves de corte", "desc": "Know where to turn off gas, water, and electricity", "desc_es": "Saber donde cortar gas, agua y electricidad", "priority": "normal"},
        {"key": "insurance_review", "label": "Review insurance coverage", "label_es": "Revisar cobertura del seguro", "desc": "Ensure your home insurance covers natural disaster damage", "desc_es": "Asegurar que tu seguro cubre danos por desastres naturales", "priority": "normal"},
    ],
    "alerts": [
        {"key": "severity_configured", "label": "Alert severity configured", "label_es": "Severidad de alertas configurada", "desc": "Set your preferred alert severity threshold", "desc_es": "Configura tu umbral de severidad de alertas", "priority": "high", "auto_check": "severity_configured"},
        {"key": "hazard_preferences", "label": "Hazard preferences set", "label_es": "Preferencias de peligros configuradas", "desc": "Choose which hazard types you want alerts for", "desc_es": "Elige para que tipos de peligro quieres alertas", "priority": "normal", "auto_check": "hazard_preferences"},
        {"key": "push_enabled", "label": "Push notifications enabled", "label_es": "Notificaciones push activadas", "desc": "Enable browser push notifications for real-time alerts", "desc_es": "Activar notificaciones push del navegador para alertas en tiempo real", "priority": "high"},
        {"key": "quiet_hours_set", "label": "Quiet hours configured", "label_es": "Horas de silencio configuradas", "desc": "Set quiet hours to avoid non-critical alerts at night", "desc_es": "Configurar horas de silencio para evitar alertas no criticas de noche", "priority": "normal"},
    ],
    "community": [
        {"key": "first_report", "label": "Submit first hazard report", "label_es": "Enviar primer reporte de peligro", "desc": "Report a local hazard observation to help your community", "desc_es": "Reporta una observacion de peligro local para ayudar a tu comunidad", "priority": "normal"},
        {"key": "upvote_report", "label": "Verify a community report", "label_es": "Verificar un reporte comunitario", "desc": "Upvote a community report to confirm the observation", "desc_es": "Vota un reporte comunitario para confirmar la observacion", "priority": "normal"},
    ],
    "knowledge": [
        {"key": "risk_dashboard_viewed", "label": "Explore your risk dashboard", "label_es": "Explorar tu panel de riesgos", "desc": "View your province risk scores and understand each hazard", "desc_es": "Ver las puntuaciones de riesgo de tu provincia y entender cada peligro", "priority": "normal"},
        {"key": "prediction_models_viewed", "label": "Review ML prediction models", "label_es": "Revisar modelos de prediccion ML", "desc": "Understand how TrueRisk predicts hazards for your province", "desc_es": "Entender como TrueRisk predice peligros para tu provincia", "priority": "normal"},
        {"key": "emergency_page_viewed", "label": "Read emergency guidance", "label_es": "Leer orientacion de emergencia", "desc": "Read the emergency page and first aid information", "desc_es": "Leer la pagina de emergencia e informacion de primeros auxilios", "priority": "normal"},
        {"key": "map_explored", "label": "Explore the risk map", "label_es": "Explorar el mapa de riesgos", "desc": "Navigate the interactive map and explore risk layers", "desc_es": "Navegar el mapa interactivo y explorar las capas de riesgo", "priority": "normal"},
    ],
}

# Conditional items added based on province hazard profile
HAZARD_CONDITIONAL_ITEMS: dict[str, list[dict]] = {
    "flood": [
        {"key": "waterproof_bag", "label": "Waterproof document bag", "label_es": "Bolsa impermeable para documentos", "desc": "Store important documents in a waterproof container", "desc_es": "Guardar documentos importantes en un contenedor impermeable", "category": "kit", "priority": "high"},
        {"key": "rubber_boots", "label": "Rubber boots", "label_es": "Botas de agua", "desc": "Waterproof boots for wading through floodwater", "desc_es": "Botas impermeables para vadear agua de inundacion", "category": "kit", "priority": "normal"},
        {"key": "flood_barriers", "label": "Flood barriers / sandbags", "label_es": "Barreras / sacos de arena", "desc": "If ground floor, keep sandbags or portable flood barriers", "desc_es": "Si planta baja, tener sacos de arena o barreras portatiles", "category": "kit", "priority": "normal"},
    ],
    "wildfire": [
        {"key": "fire_mask", "label": "N95 / smoke mask", "label_es": "Mascarilla N95 / anti-humo", "desc": "Protection against smoke inhalation during wildfires", "desc_es": "Proteccion contra inhalacion de humo durante incendios", "category": "kit", "priority": "high"},
        {"key": "defensible_space", "label": "Clear defensible space", "label_es": "Despejar zona defensiva", "desc": "Maintain 10m clear zone around your home if rural area", "desc_es": "Mantener zona despejada de 10m alrededor de casa si zona rural", "category": "plan", "priority": "high"},
    ],
    "heatwave": [
        {"key": "hydration_salts", "label": "Hydration salts", "label_es": "Sales de hidratacion", "desc": "Oral rehydration salts for extreme heat conditions", "desc_es": "Sales de rehidratacion oral para condiciones de calor extremo", "category": "kit", "priority": "normal"},
    ],
    "seismic": [
        {"key": "secure_furniture", "label": "Secure heavy furniture", "label_es": "Asegurar muebles pesados", "desc": "Anchor bookshelves, cabinets to walls to prevent tipping", "desc_es": "Anclar estanterias, armarios a paredes para evitar vuelcos", "category": "plan", "priority": "high"},
        {"key": "earthquake_kit", "label": "Under-desk earthquake kit", "label_es": "Kit de terremoto bajo escritorio", "desc": "Small kit with shoes, flashlight, whistle near your bed/desk", "desc_es": "Kit pequeno con zapatos, linterna, silbato cerca de cama/escritorio", "category": "kit", "priority": "normal"},
    ],
}

# Conditional items based on user profile
PROFILE_CONDITIONAL_ITEMS: list[dict] = [
    {"key": "vehicle_kit", "label": "Vehicle emergency kit", "label_es": "Kit de emergencia para vehiculo", "desc": "Blanket, flares, jumper cables, water in your car", "desc_es": "Manta, bengalas, cables de arranque, agua en tu vehiculo", "category": "kit", "priority": "normal", "condition": "has_vehicle"},
    {"key": "medication_supply", "label": "Extra medication supply", "label_es": "Suministro extra de medicamentos", "desc": "Keep a 7-day supply of essential medications ready", "desc_es": "Mantener un suministro de 7 dias de medicamentos esenciales", "category": "kit", "priority": "high", "condition": "has_medical"},
    {"key": "mobility_plan", "label": "Mobility assistance plan", "label_es": "Plan de asistencia de movilidad", "desc": "Plan for evacuation assistance if mobility is limited", "desc_es": "Plan de asistencia para evacuacion si movilidad limitada", "category": "plan", "priority": "high", "condition": "limited_mobility"},
]

HIGH_HAZARD_THRESHOLD = 0.5


def _build_personalized_checklist(
    user: User, province: Province | None
) -> dict[str, list[dict]]:
    """Build a personalized checklist based on user profile and province hazards."""
    checklist: dict[str, list[dict]] = {cat: list(items) for cat, items in CHECKLIST_CATALOG.items()}

    if province:
        hazard_weights = {
            "flood": province.flood_risk_weight,
            "wildfire": province.wildfire_risk_weight,
            "heatwave": province.heatwave_risk_weight,
            "seismic": province.seismic_risk_weight,
        }
        for hazard, weight in hazard_weights.items():
            if weight >= HIGH_HAZARD_THRESHOLD and hazard in HAZARD_CONDITIONAL_ITEMS:
                for item in HAZARD_CONDITIONAL_ITEMS[hazard]:
                    cat = item.get("category", "kit")
                    checklist.setdefault(cat, []).append(item)

    for item in PROFILE_CONDITIONAL_ITEMS:
        cond = item["condition"]
        add = False
        if cond == "has_vehicle" and user.has_vehicle:
            add = True
        elif cond == "has_medical" and user.medical_conditions:
            add = True
        elif cond == "limited_mobility" and user.mobility_level != "full":
            add = True
        if add:
            cat = item.get("category", "kit")
            checklist.setdefault(cat, []).append(item)

    return checklist


def _check_auto_items(user: User) -> set[str]:
    """Return item_keys that are auto-completed based on user profile."""
    auto = set()
    if user.emergency_contact_phone:
        auto.add("emergency_contact")
    if user.alert_severity_threshold != 3:
        auto.add("severity_configured")
    if isinstance(user.hazard_preferences, list) and len(user.hazard_preferences) > 0:
        auto.add("hazard_preferences")
    return auto


async def get_personalized_checklist(
    db: AsyncSession, user: User | None, locale: str = "es"
) -> ChecklistResponse:
    """Return the user's personalized checklist with completion state."""
    if user is None:
        # Return generic checklist without personalization for anonymous users
        use_es = locale == "es"
        anon_categories: dict[str, list[ChecklistItem]] = {}
        anon_total = 0
        for cat, items in CHECKLIST_CATALOG.items():
            cat_items = []
            for item_def in items:
                cat_items.append(ChecklistItem(
                    item_key=item_def["key"],
                    label=item_def.get("label_es", item_def["label"]) if use_es else item_def["label"],
                    description=item_def.get("desc_es", item_def["desc"]) if use_es else item_def["desc"],
                    category=cat,
                    completed=False,
                    completed_at=None,
                    priority=item_def.get("priority", "normal"),
                ))
                anon_total += 1
            anon_categories[cat] = cat_items
        return ChecklistResponse(categories=anon_categories, total_items=anon_total, completed_items=0)

    province = await db.get(Province, user.province_code) if user.province_code else None
    catalog = _build_personalized_checklist(user, province)

    result = await db.execute(
        select(PreparednessItem).where(PreparednessItem.user_id == user.id)
    )
    completed_items = {item.item_key: item for item in result.scalars().all()}
    auto_completed = _check_auto_items(user)

    use_es = locale == "es"
    categories: dict[str, list[ChecklistItem]] = {}
    total = 0
    done = 0

    for cat, items in catalog.items():
        cat_items = []
        for item_def in items:
            key = item_def["key"]
            is_completed = key in completed_items and completed_items[key].completed
            is_auto = key in auto_completed
            completed_at_val = None
            if is_completed and completed_items[key].completed_at:
                completed_at_val = completed_items[key].completed_at

            cat_items.append(ChecklistItem(
                item_key=key,
                label=item_def.get("label_es", item_def["label"]) if use_es else item_def["label"],
                description=item_def.get("desc_es", item_def["desc"]) if use_es else item_def["desc"],
                category=cat,
                completed=is_completed or is_auto,
                completed_at=completed_at_val,
                priority=item_def.get("priority", "normal"),
            ))
            total += 1
            if is_completed or is_auto:
                done += 1
        categories[cat] = cat_items

    return ChecklistResponse(categories=categories, total_items=total, completed_items=done)


async def toggle_item(
    db: AsyncSession, user_id: int, item_key: str, completed: bool, notes: str | None = None
) -> bool:
    """Toggle a checklist item's completion state. Returns the new state."""
    result = await db.execute(
        select(PreparednessItem).where(
            and_(PreparednessItem.user_id == user_id, PreparednessItem.item_key == item_key)
        )
    )
    item = result.scalar_one_or_none()

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    if item is None:
        item = PreparednessItem(
            user_id=user_id,
            category="",
            item_key=item_key,
            completed=completed,
            completed_at=now if completed else None,
            notes=notes,
        )
        db.add(item)
    else:
        item.completed = completed
        item.completed_at = now if completed else None
        if notes is not None:
            item.notes = notes

    await db.commit()

    try:
        await compute_score(db, user_id)
    except Exception:
        logger.exception("Failed to recompute preparedness score after toggle")

    if completed:
        try:
            from app.services.gamification_service import award_points
            await award_points(db, user_id, "checklist_item")
        except Exception:
            logger.exception("Failed to award gamification points for checklist item")

    return completed


async def compute_score(db: AsyncSession, user_id: int) -> float:
    """Recompute the user's preparedness score and store a snapshot."""
    user = await db.get(User, user_id)
    if user is None:
        return 0.0

    province = await db.get(Province, user.province_code) if user.province_code else None
    catalog = _build_personalized_checklist(user, province)
    auto_completed = _check_auto_items(user)

    result = await db.execute(
        select(PreparednessItem).where(
            and_(PreparednessItem.user_id == user_id, PreparednessItem.completed == True)  # noqa: E712
        )
    )
    manually_completed = {item.item_key for item in result.scalars().all()}
    all_completed = manually_completed | auto_completed

    cat_scores: dict[str, float] = {}
    for cat, items in catalog.items():
        total = len(items)
        if total == 0:
            cat_scores[cat] = 100.0
            continue
        done = sum(1 for item in items if item["key"] in all_completed)
        cat_scores[cat] = (done / total) * 100.0

    total_score = min(
        sum(cat_scores.get(cat, 0.0) * weight for cat, weight in CATEGORY_WEIGHTS.items()),
        100.0,
    )

    try:
        snapshot = PreparednessSnapshot(
            user_id=user_id,
            total_score=round(total_score, 1),
            kit_score=round(cat_scores.get("kit", 0.0), 1),
            plan_score=round(cat_scores.get("plan", 0.0), 1),
            alerts_score=round(cat_scores.get("alerts", 0.0), 1),
            community_score=round(cat_scores.get("community", 0.0), 1),
            knowledge_score=round(cat_scores.get("knowledge", 0.0), 1),
        )
        db.add(snapshot)
        user.preparedness_score = round(total_score, 1)
        await db.commit()
    except Exception:
        logger.exception("Failed to save preparedness snapshot")
        await db.rollback()

    return total_score


async def get_score(
    db: AsyncSession, user: User, locale: str = "es"
) -> PreparednessScoreResponse:
    """Return the current score with breakdown and next actions."""
    province = await db.get(Province, user.province_code) if user.province_code else None
    catalog = _build_personalized_checklist(user, province)
    auto_completed = _check_auto_items(user)

    result = await db.execute(
        select(PreparednessItem).where(PreparednessItem.user_id == user.id)
    )
    completed_map = {item.item_key: item for item in result.scalars().all()}
    completed_keys = {k for k, v in completed_map.items() if v.completed} | auto_completed

    use_es = locale == "es"
    cat_labels = CATEGORY_LABELS_ES if use_es else CATEGORY_LABELS
    categories: list[CategoryProgress] = []
    next_actions: list[ChecklistItem] = []

    for cat, items in catalog.items():
        total = len(items)
        done = sum(1 for item in items if item["key"] in completed_keys)
        score = (done / total) * 100.0 if total > 0 else 100.0
        categories.append(CategoryProgress(
            category=cat,
            label=cat_labels.get(cat, cat),
            total_items=total,
            completed_items=done,
            score=round(score, 1),
        ))

        for item_def in items:
            if item_def["key"] not in completed_keys:
                next_actions.append(ChecklistItem(
                    item_key=item_def["key"],
                    label=item_def.get("label_es", item_def["label"]) if use_es else item_def["label"],
                    description=item_def.get("desc_es", item_def["desc"]) if use_es else item_def["desc"],
                    category=cat,
                    completed=False,
                    priority=item_def.get("priority", "normal"),
                ))

    next_actions.sort(key=lambda x: (0 if x.priority == "high" else 1))
    next_actions = next_actions[:3]

    total_score = min(
        sum(cp.score * CATEGORY_WEIGHTS.get(cp.category, 0) for cp in categories),
        100.0,
    )
    total_score = round(total_score, 1)

    last_snap = await db.execute(
        select(PreparednessSnapshot)
        .where(PreparednessSnapshot.user_id == user.id)
        .order_by(PreparednessSnapshot.computed_at.desc())
        .limit(1)
    )
    snap = last_snap.scalar_one_or_none()

    return PreparednessScoreResponse(
        total_score=total_score,
        categories=categories,
        next_actions=next_actions,
        last_updated=snap.computed_at if snap else None,
    )


async def get_score_history(
    db: AsyncSession, user_id: int, days: int = 30
) -> list[PreparednessHistoryEntry]:
    """Return score snapshots for the last N days."""
    cutoff = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=days)
    result = await db.execute(
        select(PreparednessSnapshot)
        .where(
            and_(
                PreparednessSnapshot.user_id == user_id,
                PreparednessSnapshot.computed_at >= cutoff,
            )
        )
        .order_by(PreparednessSnapshot.computed_at.asc())
    )
    return [
        PreparednessHistoryEntry(total_score=s.total_score, computed_at=s.computed_at)
        for s in result.scalars().all()
    ]
