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
  "46": 72, // Valencia
  "12": 68, // Castellón
  "03": 55, // Alicante
  "30": 45, // Murcia
  "02": 42, // Albacete
  "08": 42, // Barcelona
  "43": 51, // Tarragona
  "25": 38, // Lleida
  "17": 40, // Girona
  "22": 45, // Huesca
  "50": 38, // Zaragoza
  "44": 35, // Teruel
  "28": 15, // Madrid
  "45": 20, // Toledo
  "16": 18, // Cuenca
  "19": 22, // Guadalajara
  "13": 25, // Ciudad Real
  "06": 15, // Badajoz
  "10": 12, // Cáceres
  "41": 12, // Sevilla
  "14": 18, // Córdoba
  "23": 20, // Jaén
  "18": 22, // Granada
  "04": 18, // Almería
  "29": 15, // Málaga
  "11": 10, // Cádiz
  "21": 12, // Huelva
  "37": 10, // Salamanca
  "49": 8, // Zamora
  "47": 12, // Valladolid
  "40": 10, // Segovia
  "05": 10, // Ávila
  "42": 15, // Soria
  "09": 12, // Burgos
  "34": 8, // Palencia
  "24": 10, // León
  "33": 12, // Asturias
  "39": 10, // Cantabria
  "48": 8, // Bizkaia
  "20": 8, // Gipuzkoa
  "01": 8, // Álava
  "31": 15, // Navarra
  "26": 12, // La Rioja
  "36": 10, // Pontevedra
  "15": 8, // A Coruña
  "27": 8, // Lugo
  "32": 8, // Ourense
  "07": 10, // Illes Balears
  "38": 8, // Santa Cruz de Tenerife
  "35": 10, // Las Palmas
  "51": 5, // Ceuta
  "52": 5, // Melilla
};

function riskColor(score: number): string {
  if (score >= 60) return "#EF4444"; // Red - High
  if (score >= 40) return "#F97316"; // Orange - Medium-High
  if (score >= 20) return "#FBBF24"; // Yellow - Medium
  return "#84CC16"; // Green - Low
}

type ProvinceProperties = {
  cod_prov: string;
  name: string;
};

export const MapDeepDive: React.FC = () => {
  const frame = useCurrentFrame();
  const [geoData, setGeoData] =
    useState<FeatureCollection<Geometry, ProvinceProperties> | null>(null);
  const [handle] = useState(() => delayRender());

  useEffect(() => {
    fetch(staticFile("spain-provinces.geojson"))
      .then((res) => res.json())
      .then((data: FeatureCollection<Geometry, ProvinceProperties>) => {
        setGeoData(data);
        continueRender(handle);
      })
      .catch((err) => {
        console.error(err);
        continueRender(handle);
      });
  }, [handle]);

  if (!geoData) return null;

  const projection = geoMercator()
    .center([-3.5, 40])
    .scale(2800)
    .translate([960, 540]);

  const pathGenerator = geoPath().projection(projection);

  const mapOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a1628" }}>
      {/* Map SVG */}
      <svg width={1920} height={1080} style={{ opacity: mapOpacity }}>
        {geoData.features.map((feature, i) => {
          const code = feature.properties.cod_prov;
          const score = RISK_SCORES[code] ?? 10;
          const color = riskColor(score);
          const d = pathGenerator(feature);
          if (!d) return null;

          const delay = 5 + i * 0.5;
          const provinceOpacity = interpolate(
            frame,
            [delay, delay + 15],
            [0, 1],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          );

          return (
            <path
              key={code}
              d={d}
              fill={color}
              stroke="#0a1628"
              strokeWidth={1.5}
              opacity={provinceOpacity}
            />
          );
        })}
      </svg>

      {/* Left sidebar — alerts panel */}
      <div
        style={{
          position: "absolute",
          left: 40,
          top: 80,
          width: 300,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          opacity: interpolate(frame, [25, 40], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        <span
          style={{
            fontFamily: FONT_FAMILY.sans,
            fontSize: 16,
            fontWeight: 600,
            color: COLORS.text,
            textTransform: "uppercase" as const,
            letterSpacing: 1,
          }}
        >
          Active Alerts
        </span>
        {[
          "Vientos nivel naranja — Huesca",
          "Costeros nivel naranja — Girona",
          "Vientos nivel amarillo — Madrid",
          "Vientos nivel amarillo — Castellón",
        ].map((alert, i) => (
          <div
            key={i}
            style={{
              padding: "10px 14px",
              backgroundColor: "rgba(0,0,0,0.5)",
              borderRadius: 8,
              borderLeft: `3px solid ${i < 2 ? "#F97316" : "#FBBF24"}`,
            }}
          >
            <span
              style={{
                fontFamily: FONT_FAMILY.sans,
                fontSize: 13,
                fontWeight: 400,
                color: COLORS.text,
              }}
            >
              {alert}
            </span>
          </div>
        ))}
      </div>

      {/* Risk score legend */}
      <div
        style={{
          position: "absolute",
          left: 40,
          bottom: 80,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          opacity: interpolate(frame, [30, 45], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        <span
          style={{
            fontFamily: FONT_FAMILY.sans,
            fontSize: 14,
            fontWeight: 600,
            color: COLORS.text,
          }}
        >
          Risk Score
        </span>
        <div style={{ display: "flex", gap: 4 }}>
          {["#84CC16", "#FBBF24", "#F97316", "#EF4444"].map((c, i) => (
            <div
              key={i}
              style={{
                width: 40,
                height: 8,
                borderRadius: 2,
                backgroundColor: c,
              }}
            />
          ))}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: 172,
          }}
        >
          <span
            style={{
              fontFamily: FONT_FAMILY.mono,
              fontSize: 11,
              color: COLORS.textSecondary,
            }}
          >
            0
          </span>
          <span
            style={{
              fontFamily: FONT_FAMILY.mono,
              fontSize: 11,
              color: COLORS.textSecondary,
            }}
          >
            50
          </span>
          <span
            style={{
              fontFamily: FONT_FAMILY.mono,
              fontSize: 11,
              color: COLORS.textSecondary,
            }}
          >
            100
          </span>
        </div>
      </div>

      {/* Right sidebar — layers + weather */}
      <div
        style={{
          position: "absolute",
          right: 40,
          top: 80,
          width: 240,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          opacity: interpolate(frame, [25, 40], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        {[
          "\uD83D\uDD25 154 fires",
          "\u26A1 5 quakes",
          "\uD83D\uDCA7 374 reservoirs",
          "\uD83C\uDF0A 75 gauges",
        ].map((item, i) => (
          <div
            key={i}
            style={{
              padding: "10px 14px",
              backgroundColor: "rgba(0,0,0,0.5)",
              borderRadius: 8,
            }}
          >
            <span
              style={{
                fontFamily: FONT_FAMILY.mono,
                fontSize: 15,
                fontWeight: 500,
                color: COLORS.text,
              }}
            >
              {item}
            </span>
          </div>
        ))}
      </div>

      {/* Bottom caption */}
      <div
        style={{
          position: "absolute",
          bottom: 30,
          left: 0,
          right: 0,
          textAlign: "center",
        }}
      >
        <span
          style={{
            fontFamily: FONT_FAMILY.sans,
            fontSize: 34,
            fontWeight: 600,
            color: COLORS.text,
            opacity: interpolate(frame, [50, 65], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            textShadow: "0 2px 20px rgba(0,0,0,0.9)",
          }}
        >
          Every Province. Every Hazard. Every Hour.
        </span>
      </div>
    </AbsoluteFill>
  );
};
