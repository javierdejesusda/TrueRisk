"""Fetch municipality-level demographics from INE (Instituto Nacional de Estadistica).

Uses the INE JSON API to retrieve population data by age group,
allowing computation of elderly_pct per municipality.
"""
from __future__ import annotations

import logging
from typing import Any

import httpx

logger = logging.getLogger(__name__)

INE_BASE = "https://servicios.ine.es/wstempus/js/ES"


async def fetch_municipality_demographics(
    province_code: str,
) -> list[dict[str, Any]]:
    """Fetch population data for municipalities in a province.

    Returns list of {ine_code, name, population, elderly_pct}.
    """
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(
                f"{INE_BASE}/DATOS_TABLA/2903",
                params={"tip": "AM"},
            )
            if resp.status_code != 200:
                logger.warning("INE API returned %d", resp.status_code)
                return []

            data = resp.json()
            if not isinstance(data, list):
                return []

            municipalities: dict[str, dict[str, Any]] = {}
            for item in data:
                code = item.get("COD")
                if not code or not code.startswith(province_code):
                    continue
                name = item.get("Nombre", "")
                value = item.get("Valor")
                age_group = item.get("T3A", "")

                if code not in municipalities:
                    municipalities[code] = {
                        "ine_code": code[:5],
                        "name": name,
                        "total": 0,
                        "elderly": 0,
                    }

                if value:
                    try:
                        val = int(float(value))
                    except (ValueError, TypeError):
                        continue
                    municipalities[code]["total"] += val
                    if "65" in age_group or "70" in age_group or "75" in age_group or "80" in age_group or "85" in age_group:
                        municipalities[code]["elderly"] += val

            result = []
            for m in municipalities.values():
                total = m["total"]
                elderly_pct = round((m["elderly"] / total) * 100, 1) if total > 0 else 0.0
                result.append({
                    "ine_code": m["ine_code"],
                    "name": m["name"],
                    "population": total,
                    "elderly_pct": elderly_pct,
                })
            return result

    except Exception:
        logger.exception("Failed to fetch INE demographics for province %s", province_code)
        return []
