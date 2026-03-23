"""ARPSI flood zone data loader.

Loads ARPSI (Areas de Riesgo Potencial Significativo de Inundacion)
flood zone polygons from a local GeoJSON file into the database.

The GeoJSON must be in WGS84 (EPSG:4326).  If the source data is in
EPSG:25830 (ETRS89 / UTM zone 30N), convert it first -- for example::

    ogr2ogr -f GeoJSON -t_srs EPSG:4326 output.geojson input.shp
"""

from __future__ import annotations

import json
import logging
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.arpsi_flood_zone import ArpsiFloodZone

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Common GeoJSON property name mappings
# ---------------------------------------------------------------------------

# ARPSI data from MITECO may use different property keys depending on the
# download format.  We try several alternatives for each field.
_ZONE_ID_KEYS = ("zone_id", "COD_ARPSI", "cod_arpsi", "CODIGO", "codigo", "ID")
_ZONE_NAME_KEYS = ("zone_name", "NOM_ARPSI", "nom_arpsi", "NOMBRE", "nombre", "NAME")
_ZONE_TYPE_KEYS = ("zone_type", "TIPO", "tipo", "type", "FLOOD_TYPE", "flood_type")
_RETURN_PERIOD_KEYS = (
    "return_period",
    "PERIODO_RETORNO",
    "periodo_retorno",
    "T_RETURN",
    "t_return",
    "RETURN_PERIOD",
)
_PROVINCE_CODE_KEYS = (
    "province_code",
    "COD_PROV",
    "cod_prov",
    "PROVINCIA",
    "provincia",
)
_MUNICIPALITY_CODE_KEYS = (
    "municipality_code",
    "COD_MUN",
    "cod_mun",
    "MUNICIPIO",
    "municipio",
)
_RISK_LEVEL_KEYS = ("risk_level", "NIVEL_RIESGO", "nivel_riesgo", "RISK", "risk")
_AREA_KM2_KEYS = ("area_km2", "AREA_KM2", "area", "AREA")
_SOURCE_URL_KEYS = ("source_url", "SOURCE", "source", "URL", "url")


def _get_first(props: dict, keys: tuple[str, ...], default=None):
    """Return the first matching value from *props* for the given *keys*."""
    for key in keys:
        val = props.get(key)
        if val is not None:
            return val
    return default


# ---------------------------------------------------------------------------
# Bounding-box computation
# ---------------------------------------------------------------------------


def compute_bounding_box(geometry: dict) -> tuple[float, float, float, float]:
    """Return ``(min_lat, max_lat, min_lon, max_lon)`` from a GeoJSON geometry.

    Supports ``Polygon`` and ``MultiPolygon`` geometry types.  Coordinates
    are assumed to be in ``[longitude, latitude]`` order (WGS84).
    """
    coords_type = geometry.get("type", "")
    coordinates = geometry.get("coordinates", [])

    all_points: list[tuple[float, float]] = []

    if coords_type == "Polygon":
        for ring in coordinates:
            all_points.extend(ring)
    elif coords_type == "MultiPolygon":
        for polygon in coordinates:
            for ring in polygon:
                all_points.extend(ring)
    else:
        # Fallback: recursively flatten
        _flatten_coords(coordinates, all_points)

    if not all_points:
        raise ValueError(f"No coordinates found in geometry of type '{coords_type}'")

    lons = [p[0] for p in all_points]
    lats = [p[1] for p in all_points]

    return min(lats), max(lats), min(lons), max(lons)


def _flatten_coords(
    coords, out: list[tuple[float, float]]
) -> None:
    """Recursively flatten nested coordinate arrays into ``(lon, lat)`` tuples."""
    if not coords:
        return
    # Leaf: a single coordinate pair [lon, lat]
    if isinstance(coords[0], (int, float)):
        out.append((float(coords[0]), float(coords[1])))
        return
    for item in coords:
        _flatten_coords(item, out)


# ---------------------------------------------------------------------------
# Risk-level inference
# ---------------------------------------------------------------------------


def _infer_risk_level(return_period: str | None) -> str:
    """Derive a risk level from the return period when not explicitly set."""
    if not return_period:
        return "medium"
    rp = return_period.upper().strip()
    if rp in ("T10", "T25"):
        return "high"
    if rp in ("T50", "T100"):
        return "medium"
    return "low"


# ---------------------------------------------------------------------------
# Main loader
# ---------------------------------------------------------------------------


async def load_arpsi_from_geojson(file_path: str, db: AsyncSession) -> int:
    """Load ARPSI flood zones from a GeoJSON file into the database.

    The GeoJSON should be in WGS84 (EPSG:4326).  If source data is in
    EPSG:25830, it must be pre-converted (e.g., using ``ogr2ogr``).

    Duplicates (matching ``zone_id``) are silently skipped.

    Returns the number of zones loaded.
    """
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"GeoJSON file not found: {file_path}")

    with open(path, encoding="utf-8") as fh:
        data = json.load(fh)

    features = data.get("features", [])
    if not features:
        logger.warning("GeoJSON file contains no features: %s", file_path)
        return 0

    # Pre-fetch existing zone_ids to avoid duplicate inserts
    existing_result = await db.execute(select(ArpsiFloodZone.zone_id))
    existing_ids: set[str] = {row[0] for row in existing_result.all()}

    loaded = 0
    skipped = 0

    for idx, feature in enumerate(features):
        props = feature.get("properties", {})
        geometry = feature.get("geometry")

        if geometry is None:
            logger.warning("Feature %d has no geometry, skipping", idx)
            continue

        zone_id = _get_first(props, _ZONE_ID_KEYS)
        if zone_id is None:
            zone_id = f"ARPSI_AUTO_{idx:06d}"
            logger.debug("Feature %d has no zone_id, assigned: %s", idx, zone_id)

        zone_id = str(zone_id).strip()

        if zone_id in existing_ids:
            skipped += 1
            continue

        zone_name = str(_get_first(props, _ZONE_NAME_KEYS, "Unknown"))
        zone_type = str(_get_first(props, _ZONE_TYPE_KEYS, "fluvial"))
        return_period = _get_first(props, _RETURN_PERIOD_KEYS)
        if return_period is not None:
            return_period = str(return_period).strip()
        else:
            return_period = "T100"

        province_code = str(_get_first(props, _PROVINCE_CODE_KEYS, "00")).strip()
        # Ensure 2-digit code
        if len(province_code) == 1:
            province_code = province_code.zfill(2)

        municipality_code = _get_first(props, _MUNICIPALITY_CODE_KEYS)
        if municipality_code is not None:
            municipality_code = str(municipality_code).strip().zfill(5)

        risk_level = _get_first(props, _RISK_LEVEL_KEYS)
        if risk_level is None:
            risk_level = _infer_risk_level(return_period)
        else:
            risk_level = str(risk_level).strip().lower()

        area_km2 = _get_first(props, _AREA_KM2_KEYS)
        if area_km2 is not None:
            try:
                area_km2 = float(area_km2)
            except (ValueError, TypeError):
                area_km2 = None

        source_url = _get_first(props, _SOURCE_URL_KEYS)

        try:
            min_lat, max_lat, min_lon, max_lon = compute_bounding_box(geometry)
        except ValueError as exc:
            logger.warning("Feature %d (%s): %s -- skipping", idx, zone_id, exc)
            continue

        geometry_geojson = json.dumps(geometry, ensure_ascii=False)

        zone = ArpsiFloodZone(
            zone_id=zone_id,
            zone_name=zone_name,
            zone_type=zone_type,
            return_period=return_period,
            province_code=province_code,
            municipality_code=municipality_code,
            min_lat=min_lat,
            max_lat=max_lat,
            min_lon=min_lon,
            max_lon=max_lon,
            geometry_geojson=geometry_geojson,
            area_km2=area_km2,
            risk_level=risk_level,
            source_url=source_url,
        )
        db.add(zone)
        existing_ids.add(zone_id)
        loaded += 1

    if loaded > 0:
        await db.commit()

    logger.info(
        "ARPSI loader: %d zones loaded, %d duplicates skipped from %s",
        loaded,
        skipped,
        file_path,
    )
    return loaded
