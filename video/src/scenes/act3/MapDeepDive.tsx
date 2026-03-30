import React, { useEffect, useState } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  staticFile,
  delayRender,
  continueRender,
} from "remotion";
import { geoMercator, geoPath } from "d3-geo";
import type { FeatureCollection, Geometry } from "geojson";
import { COLORS, FONT_FAMILY } from "../../lib/constants";

const RISK_SCORES: Record<string, number> = {
  "46": 72, "12": 68, "03": 55, "30": 45, "02": 42, "08": 42,
  "43": 51, "25": 38, "17": 40, "22": 45, "50": 38, "44": 35,
  "28": 15, "45": 20, "16": 18, "19": 22, "13": 25, "06": 15,
  "10": 12, "41": 12, "14": 18, "23": 20, "18": 22, "04": 18,
  "29": 15, "11": 10, "21": 12, "37": 10, "49": 8, "47": 12,
  "40": 10, "05": 10, "42": 15, "09": 12, "34": 8, "24": 10,
  "33": 12, "39": 10, "48": 8, "20": 8, "01": 8, "31": 15,
  "26": 12, "36": 10, "15": 8, "27": 8, "32": 8, "07": 10,
  "38": 8, "35": 10, "51": 5, "52": 5,
};

// Province labels for key provinces (shown on map)
const LABELS: Record<string, { name: string; dx?: number; dy?: number }> = {
  "46": { name: "Valencia" },
  "28": { name: "Madrid" },
  "08": { name: "Barcelona" },
  "41": { name: "Sevilla" },
  "48": { name: "Bilbao", dy: -5 },
  "15": { name: "A Coruña" },
  "30": { name: "Murcia" },
  "50": { name: "Zaragoza" },
  "29": { name: "Málaga" },
};

function riskColor(score: number): string {
  if (score >= 60) return "#EF4444";
  if (score >= 40) return "#F97316";
  if (score >= 20) return "#FBBF24";
  return "#4ade80"; // Brighter green for visibility
}

type Props = { cod_prov: string; name: string };

export const MapDeepDive: React.FC = () => {
  const frame = useCurrentFrame();
  const [geoData, setGeoData] = useState<FeatureCollection<Geometry, Props> | null>(null);
  const [handle] = useState(() => delayRender());

  useEffect(() => {
    fetch(staticFile("spain-provinces.geojson"))
      .then((res) => res.json())
      .then((data: FeatureCollection<Geometry, Props>) => {
        setGeoData(data);
        continueRender(handle);
      })
      .catch(() => continueRender(handle));
  }, [handle]);

  if (!geoData) return null;

  // Projection: center on mainland Spain, exclude Canary Islands from view
  const projection = geoMercator()
    .center([-3.5, 39.5])
    .scale(3200)
    .translate([960, 560]);

  const pathGenerator = geoPath().projection(projection);

  const mapOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: "#080E1A" }}>
      <svg width={1920} height={1080} style={{ opacity: mapOpacity }}>
        {/* Dark ocean/sea background behind land */}
        <rect width={1920} height={1080} fill="#0C1424" />

        {/* Province paths */}
        {geoData.features.map((feature, i) => {
          const code = feature.properties.cod_prov;
          const score = RISK_SCORES[code] ?? 10;
          const color = riskColor(score);
          const d = pathGenerator(feature);
          if (!d) return null;

          const delay = 3 + i * 0.4;
          const provinceOpacity = interpolate(frame, [delay, delay + 12], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          return (
            <path
              key={`${code}-${i}`}
              d={d}
              fill={color}
              stroke="#1E293B"
              strokeWidth={2}
              opacity={provinceOpacity}
            />
          );
        })}

        {/* Province name labels */}
        {geoData.features.map((feature, i) => {
          const code = feature.properties.cod_prov;
          const labelInfo = LABELS[code];
          if (!labelInfo) return null;

          const centroid = pathGenerator.centroid(feature);
          if (!centroid || isNaN(centroid[0])) return null;

          const labelOpacity = interpolate(frame, [30, 45], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          return (
            <text
              key={`label-${code}`}
              x={centroid[0] + (labelInfo.dx ?? 0)}
              y={centroid[1] + (labelInfo.dy ?? 0)}
              fill="white"
              fontSize={14}
              fontFamily="Geist Sans"
              fontWeight={600}
              textAnchor="middle"
              opacity={labelOpacity}
              style={{ textShadow: "0 1px 4px rgba(0,0,0,0.9)" } as React.CSSProperties}
            >
              {labelInfo.name}
            </text>
          );
        })}
      </svg>

      {/* Left sidebar — alerts */}
      <div style={{
        position: "absolute", left: 30, top: 60, width: 280,
        display: "flex", flexDirection: "column", gap: 10,
        opacity: interpolate(frame, [20, 35], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}>
        <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 14, fontWeight: 600, color: COLORS.text, textTransform: "uppercase" as const, letterSpacing: 1 }}>
          Active Alerts
        </span>
        {[
          { text: "Vientos naranja — Huesca", color: "#F97316" },
          { text: "Costeros naranja — Girona", color: "#F97316" },
          { text: "Vientos amarillo — Madrid", color: "#FBBF24" },
          { text: "Vientos amarillo — Castellón", color: "#FBBF24" },
        ].map((alert, i) => (
          <div key={i} style={{
            padding: "8px 12px", backgroundColor: "rgba(8,14,26,0.8)", borderRadius: 6,
            borderLeft: `3px solid ${alert.color}`, backdropFilter: "blur(4px)",
          }}>
            <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 12, fontWeight: 400, color: COLORS.text }}>{alert.text}</span>
          </div>
        ))}

        {/* Risk score panel */}
        <div style={{
          marginTop: 12, padding: "12px 14px", backgroundColor: "rgba(8,14,26,0.8)", borderRadius: 8,
        }}>
          <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 12, fontWeight: 600, color: COLORS.textSecondary }}>RISK SCORE</span>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 6 }}>
            <span style={{ fontFamily: FONT_FAMILY.mono, fontSize: 36, fontWeight: 700, color: COLORS.text }}>15</span>
            <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 14, fontWeight: 400, color: COLORS.textSecondary }}>Low</span>
          </div>
        </div>

        {/* Weather */}
        <div style={{
          padding: "12px 14px", backgroundColor: "rgba(8,14,26,0.8)", borderRadius: 8,
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8,
        }}>
          {[
            { label: "Temp", value: "12.3°C" },
            { label: "Humidity", value: "24%" },
            { label: "Wind", value: "18.3 km/h" },
            { label: "Rain", value: "0 mm" },
          ].map((w, i) => (
            <div key={i}>
              <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 10, color: COLORS.textSecondary, display: "block" }}>{w.label}</span>
              <span style={{ fontFamily: FONT_FAMILY.mono, fontSize: 14, fontWeight: 600, color: COLORS.text }}>{w.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right sidebar — layers */}
      <div style={{
        position: "absolute", right: 30, top: 60, width: 200,
        display: "flex", flexDirection: "column", gap: 8,
        opacity: interpolate(frame, [20, 35], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}>
        {[
          { label: "145 alerts", active: true },
          { label: "154 fires", active: true },
          { label: "5 quakes", active: false },
          { label: "374 reservoirs", active: false },
          { label: "75 gauges", active: false },
        ].map((layer, i) => (
          <div key={i} style={{
            padding: "8px 12px", backgroundColor: "rgba(8,14,26,0.8)", borderRadius: 6,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: layer.active ? "#4ade80" : "#374151" }} />
            <span style={{ fontFamily: FONT_FAMILY.mono, fontSize: 13, fontWeight: 500, color: layer.active ? COLORS.text : COLORS.textSecondary }}>{layer.label}</span>
          </div>
        ))}
      </div>

      {/* Legend bottom-left */}
      <div style={{
        position: "absolute", left: 30, bottom: 60,
        display: "flex", flexDirection: "column", gap: 6,
        opacity: interpolate(frame, [25, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}>
        <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 12, fontWeight: 600, color: COLORS.textSecondary }}>Risk Level</span>
        <div style={{ display: "flex", gap: 3 }}>
          {["#4ade80", "#FBBF24", "#F97316", "#EF4444"].map((c, i) => (
            <div key={i} style={{ width: 36, height: 6, borderRadius: 2, backgroundColor: c }} />
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", width: 156 }}>
          <span style={{ fontFamily: FONT_FAMILY.mono, fontSize: 10, color: COLORS.textSecondary }}>Low</span>
          <span style={{ fontFamily: FONT_FAMILY.mono, fontSize: 10, color: COLORS.textSecondary }}>Medium</span>
          <span style={{ fontFamily: FONT_FAMILY.mono, fontSize: 10, color: COLORS.textSecondary }}>High</span>
        </div>
      </div>

      {/* Bottom caption */}
      <div style={{ position: "absolute", bottom: 20, left: 0, right: 0, textAlign: "center" }}>
        <span style={{
          fontFamily: FONT_FAMILY.sans, fontSize: 34, fontWeight: 600, color: COLORS.text,
          opacity: interpolate(frame, [45, 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          textShadow: "0 2px 20px rgba(0,0,0,0.9)",
        }}>
          Every Province. Every Hazard. Every Hour.
        </span>
      </div>
    </AbsoluteFill>
  );
};
