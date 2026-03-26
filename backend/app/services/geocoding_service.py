"""Geocoding service -- converts Spanish addresses to coordinates.

Uses a cascade strategy: cache -> Nominatim (OSM) -> CartoCiudad (IGN)
to resolve addresses with high reliability.
"""

from __future__ import annotations

import asyncio
import hashlib
import json
import logging
import re
from dataclasses import dataclass

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.geocode_cache import GeocodeCache

logger = logging.getLogger(__name__)

_TIMEOUT = 30.0

# ---------------------------------------------------------------------------
# Result type
# ---------------------------------------------------------------------------


@dataclass
class GeocodingResult:
    """Standardised geocoding result returned by all strategies."""

    formatted_address: str
    latitude: float
    longitude: float
    province_code: str
    municipality_code: str | None
    confidence: float  # 0.0-1.0
    source: str  # "nominatim", "ign", "fallback"


# ---------------------------------------------------------------------------
# Spanish province name -> 2-digit INE code
# ---------------------------------------------------------------------------

PROVINCE_NAME_TO_CODE: dict[str, str] = {
    "a coruna": "15",
    "a coruña": "15",
    "alava": "01",
    "araba": "01",
    "albacete": "02",
    "alicante": "03",
    "alacant": "03",
    "almeria": "04",
    "almería": "04",
    "asturias": "33",
    "avila": "05",
    "ávila": "05",
    "badajoz": "06",
    "baleares": "07",
    "illes balears": "07",
    "islas baleares": "07",
    "barcelona": "08",
    "bizkaia": "48",
    "vizcaya": "48",
    "burgos": "09",
    "caceres": "10",
    "cáceres": "10",
    "cadiz": "11",
    "cádiz": "11",
    "cantabria": "39",
    "castellon": "12",
    "castellón": "12",
    "castello": "12",
    "ceuta": "51",
    "ciudad real": "13",
    "cordoba": "14",
    "córdoba": "14",
    "cuenca": "16",
    "gipuzkoa": "20",
    "guipuzcoa": "20",
    "girona": "17",
    "gerona": "17",
    "granada": "18",
    "guadalajara": "19",
    "huelva": "21",
    "huesca": "22",
    "jaen": "23",
    "jaén": "23",
    "la rioja": "26",
    "las palmas": "35",
    "leon": "24",
    "león": "24",
    "lleida": "25",
    "lerida": "25",
    "lérida": "25",
    "lugo": "27",
    "madrid": "28",
    "malaga": "29",
    "málaga": "29",
    "melilla": "52",
    "murcia": "30",
    "navarra": "31",
    "nafarroa": "31",
    "ourense": "32",
    "orense": "32",
    "palencia": "34",
    "pontevedra": "36",
    "salamanca": "37",
    "santa cruz de tenerife": "38",
    "tenerife": "38",
    "segovia": "40",
    "sevilla": "41",
    "soria": "42",
    "tarragona": "43",
    "teruel": "44",
    "toledo": "45",
    "valencia": "46",
    "valència": "46",
    "valladolid": "47",
    "zamora": "49",
    "zaragoza": "50",
}

# ---------------------------------------------------------------------------
# Address normalisation
# ---------------------------------------------------------------------------

_ABBREVIATIONS: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"\bC/\s*", re.IGNORECASE), "Calle "),
    (re.compile(r"\bAvda\.?\s*", re.IGNORECASE), "Avenida "),
    (re.compile(r"\bPza?\.?\s*", re.IGNORECASE), "Plaza "),
    (re.compile(r"\bPs\.?\s*", re.IGNORECASE), "Paseo "),
    (re.compile(r"\bCtra\.?\s*", re.IGNORECASE), "Carretera "),
]


def normalize_spanish_address(address: str) -> str:
    """Normalise a Spanish address for consistent geocoding lookups.

    Expands common abbreviations (C/, Avda., Pz., Pza., Ps., Ctra.),
    collapses redundant whitespace and strips leading/trailing spaces.
    """
    text = address.strip()
    for pattern, replacement in _ABBREVIATIONS:
        text = pattern.sub(replacement, text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


# ---------------------------------------------------------------------------
# Nominatim (OpenStreetMap)
# ---------------------------------------------------------------------------


def _province_code_from_state(state: str | None) -> str:
    """Map a Nominatim `state` value to a 2-digit INE province code."""
    if not state:
        return "00"
    key = state.lower().strip()
    # Some Nominatim responses include "Provincia de ..." or "Comunidad de ..."
    for prefix in ("provincia de ", "comunidad de ", "comunitat ", "comunidad foral de "):
        if key.startswith(prefix):
            key = key[len(prefix):]
    return PROVINCE_NAME_TO_CODE.get(key, "00")


async def nominatim_geocode(address: str) -> GeocodingResult | None:
    """Query the Nominatim API for a Spanish address.

    Respects the 1-request-per-second usage policy.
    Returns *None* when there are no usable results.
    """
    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            resp = await client.get(
                "https://nominatim.openstreetmap.org/search",
                params={
                    "q": address,
                    "countrycodes": "es",
                    "format": "json",
                    "addressdetails": 1,
                    "limit": 1,
                },
                headers={"User-Agent": "TrueRisk/2.0 (truerisk.cloud)"},
            )
            resp.raise_for_status()
            data = resp.json()

        # Respect Nominatim rate-limit policy
        await asyncio.sleep(1.0)

        if not data:
            logger.debug("Nominatim returned no results for: %s", address)
            return None

        hit = data[0]
        lat = float(hit["lat"])
        lon = float(hit["lon"])

        addr_details = hit.get("address", {})
        state = addr_details.get("state")
        province_code = _province_code_from_state(state)

        # Rough confidence based on Nominatim importance score
        importance = float(hit.get("importance", 0.5))
        confidence = min(importance, 1.0)

        display = hit.get("display_name", address)

        return GeocodingResult(
            formatted_address=display,
            latitude=lat,
            longitude=lon,
            province_code=province_code,
            municipality_code=None,
            confidence=confidence,
            source="nominatim",
        )
    except Exception:
        logger.exception("Nominatim geocode failed for: %s", address)
        return None


# ---------------------------------------------------------------------------
# CartoCiudad (IGN)
# ---------------------------------------------------------------------------


async def cartociudad_geocode(address: str) -> GeocodingResult | None:
    """Query the IGN CartoCiudad JSONP endpoint for a Spanish address.

    The endpoint returns JSONP; we strip the callback wrapper before parsing.
    Returns *None* when there are no usable results.
    """
    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            resp = await client.get(
                "https://www.cartociudad.es/geocoder/api/geocoder/findJsonp",
                params={"q": address},
            )
            resp.raise_for_status()
            text = resp.text

        # Strip JSONP callback wrapper
        text = text[text.index("(") + 1 : text.rindex(")")]
        data = json.loads(text)

        if not data:
            logger.debug("CartoCiudad returned no results for: %s", address)
            return None

        lat = float(data.get("lat", 0))
        lon = float(data.get("lng", 0))

        if lat == 0 and lon == 0:
            logger.debug("CartoCiudad returned zero coordinates for: %s", address)
            return None

        # CartoCiudad includes province and municipality codes
        province = data.get("province", "")
        province_code = PROVINCE_NAME_TO_CODE.get(province.lower().strip(), "00")

        muni_code = data.get("municipalityCode")
        if muni_code:
            muni_code = str(muni_code).zfill(5)

        state_msg = data.get("stateMsg", "")
        confidence = 0.7 if state_msg.lower() in ("", "ok") else 0.4

        tip = data.get("tip_via", "")
        address_text = data.get("address", address)
        portal_number = data.get("portalNumber", "")
        formatted = f"{tip} {address_text} {portal_number}".strip() or address

        return GeocodingResult(
            formatted_address=formatted,
            latitude=lat,
            longitude=lon,
            province_code=province_code,
            municipality_code=muni_code,
            confidence=confidence,
            source="ign",
        )
    except Exception:
        logger.exception("CartoCiudad geocode failed for: %s", address)
        return None


# ---------------------------------------------------------------------------
# Cache helpers
# ---------------------------------------------------------------------------


def _address_hash(normalized: str) -> str:
    """Compute a SHA-256 hex digest for a normalised address string."""
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


async def _cache_lookup(
    db: AsyncSession, addr_hash: str
) -> GeocodingResult | None:
    """Return a cached geocoding result if one exists."""
    try:
        result = await db.execute(
            select(GeocodeCache).where(GeocodeCache.address_hash == addr_hash)
        )
        row = result.scalar_one_or_none()
        if row is None:
            return None
        return GeocodingResult(
            formatted_address=row.formatted_address,
            latitude=row.latitude,
            longitude=row.longitude,
            province_code=row.province_code,
            municipality_code=row.municipality_code,
            confidence=row.confidence,
            source=row.source,
        )
    except Exception:
        logger.warning("Geocode cache lookup failed for hash=%s", addr_hash, exc_info=True)
        return None


async def _cache_store(
    db: AsyncSession,
    addr_hash: str,
    address_text: str,
    result: GeocodingResult,
) -> None:
    """Persist a geocoding result to the cache table."""
    try:
        entry = GeocodeCache(
            address_hash=addr_hash,
            address_text=address_text,
            formatted_address=result.formatted_address,
            latitude=result.latitude,
            longitude=result.longitude,
            province_code=result.province_code,
            municipality_code=result.municipality_code,
            confidence=result.confidence,
            source=result.source,
        )
        db.add(entry)
        await db.commit()
    except Exception:
        logger.warning("Geocode cache store failed for hash=%s", addr_hash, exc_info=True)
        try:
            await db.rollback()
        except Exception:
            pass


# ---------------------------------------------------------------------------
# Main cascade
# ---------------------------------------------------------------------------


async def geocode_address(
    address: str, db: AsyncSession
) -> GeocodingResult | None:
    """Geocode a Spanish address using a cache -> Nominatim -> CartoCiudad cascade.

    Returns *None* only when every strategy fails.
    """
    normalized = normalize_spanish_address(address)
    addr_hash = _address_hash(normalized)

    # 1. Cache check
    cached = await _cache_lookup(db, addr_hash)
    if cached is not None:
        logger.debug("Geocode cache hit for: %s", normalized)
        return cached

    # 2. Nominatim
    result = await nominatim_geocode(normalized)
    if result is not None:
        logger.info("Geocoded via Nominatim: %s", normalized)
        await _cache_store(db, addr_hash, normalized, result)
        return result

    # 3. CartoCiudad fallback
    result = await cartociudad_geocode(normalized)
    if result is not None:
        logger.info("Geocoded via CartoCiudad: %s", normalized)
        await _cache_store(db, addr_hash, normalized, result)
        return result

    logger.warning("All geocoding strategies failed for: %s", normalized)
    return None
