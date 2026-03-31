"""PDF report generation service using WeasyPrint."""
from __future__ import annotations

import logging
import math
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)
_TEMPLATE_DIR = Path(__file__).resolve().parent.parent / "templates"

_SEVERITY_COLORS = {
    "low": "#22c55e",
    "moderate": "#eab308",
    "high": "#f97316",
    "very_high": "#ef4444",
    "critical": "#991b1b",
}

_HAZARD_LABELS = {
    "flood": "Inundacion",
    "wildfire": "Incendio Forestal",
    "heatwave": "Ola de Calor",
    "drought": "Sequia",
    "coldwave": "Ola de Frio",
    "windstorm": "Vendaval",
    "seismic": "Sismico",
}


def _severity_class(severity: str) -> str:
    """Return the CSS class suffix for a severity level (e.g. 'low', 'very_high')."""
    return severity if severity in _SEVERITY_COLORS else "low"


def _score_pct(score: float) -> str:
    """Clamp a 0-100 score to a percentage string for CSS width."""
    return f"{max(0.0, min(100.0, score)):.1f}"


def generate_pdf(report_data: dict[str, Any]) -> bytes:
    """Generate a PDF report from report data dict.

    report_data should contain all fields from PropertyReportResponse.
    Returns PDF as bytes.
    Raises ImportError if WeasyPrint is not available.
    """
    try:
        from weasyprint import HTML
    except ImportError:
        raise ImportError(
            "WeasyPrint is not installed. Install it with: pip install weasyprint>=63. "
            "On Linux, also install: apt-get install libcairo2 libpango-1.0-0 "
            "libpangocairo-1.0-0 libgdk-pixbuf2.0-0"
        )

    template_path = _TEMPLATE_DIR / "report.html"
    html_content = template_path.read_text(encoding="utf-8")

    # Replace template variables
    html_content = _render_template(html_content, report_data)

    doc = HTML(string=html_content)
    return doc.write_pdf()


def _render_template(html: str, data: dict[str, Any]) -> str:
    """Simple template rendering - replace {{variable}} with values."""
    flat: dict[str, str] = {}

    # Top-level fields
    flat["report_id"] = str(data.get("report_id", ""))
    flat["formatted_address"] = str(data.get("formatted_address", ""))
    flat["address_text"] = str(data.get("address_text", ""))
    flat["latitude"] = f"{data.get('latitude', 0.0):.6f}"
    flat["longitude"] = f"{data.get('longitude', 0.0):.6f}"
    flat["province_code"] = str(data.get("province_code", ""))
    flat["province_name"] = str(data.get("province_name", "Desconocida"))

    composite = float(data.get("composite_score", 0.0))
    flat["composite_score"] = f"{composite:.1f}"
    flat["composite_score_int"] = str(int(round(composite)))

    flat["dominant_hazard"] = _HAZARD_LABELS.get(
        data.get("dominant_hazard", ""), str(data.get("dominant_hazard", "N/A"))
    )
    flat["dominant_hazard_raw"] = str(data.get("dominant_hazard", ""))

    severity = str(data.get("severity", "low"))
    flat["severity"] = severity
    flat["severity_label"] = severity.replace("_", " ").title()
    flat["severity_color"] = _SEVERITY_COLORS.get(severity, "#6b7280")

    # SVG score ring: circumference = 2 * pi * 48 ≈ 301.6
    circumference = 2 * math.pi * 48
    flat["score_dash"] = f"{(composite / 100.0) * circumference:.1f}"

    flat["computed_at"] = str(data.get("computed_at", ""))
    flat["expires_at"] = str(data.get("expires_at", "N/A"))
    flat["current_year"] = str(datetime.now(timezone.utc).year)

    # Per-hazard scores, bars, and explanations
    for hazard_key in ("flood", "wildfire", "heatwave", "drought", "coldwave", "windstorm", "seismic"):
        hazard = data.get(hazard_key, {})
        if isinstance(hazard, dict):
            score = float(hazard.get("score", 0.0))
            province_score = float(hazard.get("province_score", 0.0))
            h_severity = str(hazard.get("severity", "low"))

            flat[f"{hazard_key}_score"] = f"{score:.1f}"
            flat[f"{hazard_key}_province_score"] = f"{province_score:.1f}"
            flat[f"{hazard_key}_modifier"] = f"x{hazard.get('modifier', 1.0):.2f}"
            flat[f"{hazard_key}_severity"] = h_severity.replace("_", " ").title()
            flat[f"{hazard_key}_severity_color"] = _SEVERITY_COLORS.get(h_severity, "#6b7280")
            flat[f"{hazard_key}_severity_class"] = _severity_class(h_severity)
            flat[f"{hazard_key}_explanation"] = str(hazard.get("explanation", ""))

            # Bar percentages for visual bars
            flat[f"{hazard_key}_score_pct"] = _score_pct(score)
            flat[f"{hazard_key}_province_pct"] = _score_pct(province_score)
        else:
            flat[f"{hazard_key}_score"] = "0.0"
            flat[f"{hazard_key}_province_score"] = "0.0"
            flat[f"{hazard_key}_modifier"] = "x1.00"
            flat[f"{hazard_key}_severity"] = "Low"
            flat[f"{hazard_key}_severity_color"] = _SEVERITY_COLORS["low"]
            flat[f"{hazard_key}_severity_class"] = "low"
            flat[f"{hazard_key}_explanation"] = ""
            flat[f"{hazard_key}_score_pct"] = "0.0"
            flat[f"{hazard_key}_province_pct"] = "0.0"

    # Flood zone details
    fz = data.get("flood_zone", {})
    if isinstance(fz, dict):
        in_zone = bool(fz.get("in_arpsi_zone"))
        flat["flood_zone_in_arpsi"] = "Si" if in_zone else "No"
        flat["flood_zone_class"] = "arpsi-yes" if in_zone else "arpsi-no"
        flat["flood_zone_name"] = str(fz.get("zone_name") or "N/A")
        zone_type = str(fz.get("zone_type") or "N/A")
        flat["flood_zone_type"] = zone_type.capitalize() if zone_type != "N/A" else "N/A"
        flat["flood_zone_id"] = str(fz.get("zone_id") or "N/A")
        flat["flood_zone_return_period"] = str(fz.get("return_period") or "N/A")
        risk_lvl = str(fz.get("risk_level") or "N/A")
        flat["flood_zone_risk_level"] = risk_lvl.capitalize() if risk_lvl != "N/A" else "N/A"
        dist = fz.get("distance_to_nearest_zone_m")
        if dist is not None:
            if dist >= 1000:
                flat["flood_zone_distance_display"] = f"{dist / 1000:.1f} km"
            else:
                flat["flood_zone_distance_display"] = f"{dist:.0f} m"
            flat["flood_zone_distance_m"] = f"{dist:.0f}"
        else:
            flat["flood_zone_distance_display"] = "N/A"
            flat["flood_zone_distance_m"] = "N/A"
    else:
        flat["flood_zone_in_arpsi"] = "No"
        flat["flood_zone_class"] = "arpsi-no"
        flat["flood_zone_name"] = "N/A"
        flat["flood_zone_type"] = "N/A"
        flat["flood_zone_id"] = "N/A"
        flat["flood_zone_return_period"] = "N/A"
        flat["flood_zone_risk_level"] = "N/A"
        flat["flood_zone_distance_display"] = "N/A"
        flat["flood_zone_distance_m"] = "N/A"

    # Terrain details
    terrain = data.get("terrain", {})
    if isinstance(terrain, dict):
        flat["elevation_m"] = f"{terrain.get('elevation_m', 0.0):.0f}"
        flat["slope_pct"] = f"{terrain.get('slope_pct', 0.0):.1f}"
    else:
        flat["elevation_m"] = "0"
        flat["slope_pct"] = "0.0"

    # Wildfire proximity (extra aliases, already covered per-hazard above)
    wp = data.get("wildfire_proximity", {})
    if isinstance(wp, dict):
        flat["wildfire_modifier"] = f"x{wp.get('modifier', 1.0):.2f}"
        flat["wildfire_explanation"] = str(wp.get("explanation", ""))

    # Do the replacements
    for key, value in flat.items():
        html = html.replace("{{" + key + "}}", value)

    return html
