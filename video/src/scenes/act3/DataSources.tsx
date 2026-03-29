import { AbsoluteFill, useCurrentFrame, spring, interpolate } from "remotion";
import { COLORS, FONT_FAMILY, VIDEO } from "../../lib/constants";

const SOURCES = [
  { name: "AEMET", desc: "Spanish Met Agency", category: "Weather" },
  { name: "NASA FIRMS", desc: "Satellite Fire Detection", category: "Fires" },
  { name: "Copernicus EFAS", desc: "Flood Awareness", category: "Hydrology" },
  { name: "Copernicus CAMS", desc: "Air Quality", category: "Atmosphere" },
  { name: "IGN", desc: "Seismic Catalog", category: "Earthquakes" },
  { name: "SAIH", desc: "River Gauges & Dams", category: "Hydrology" },
  { name: "Open-Meteo", desc: "Global Weather Data", category: "Weather" },
  { name: "NASA POWER", desc: "Solar Radiation", category: "Climate" },
  { name: "ECMWF", desc: "Seasonal Forecasts", category: "Climate" },
  { name: "Copernicus Land", desc: "Soil & Vegetation", category: "Land" },
];

export const DataSources: React.FC = () => {
  const frame = useCurrentFrame();

  const titleOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const countOpacity = interpolate(frame, [8, 22], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, display: "flex", flexDirection: "column", padding: "60px 160px", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 48, fontWeight: 700, color: COLORS.text, opacity: titleOpacity }}>
          Data Sources
        </span>
        <span style={{ fontFamily: FONT_FAMILY.mono, fontSize: 28, fontWeight: 700, color: COLORS.text, opacity: countOpacity }}>
          15+
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {SOURCES.map((s, i) => {
          const delay = 10 + i * 4;
          const progress = spring({ frame: frame - delay, fps: VIDEO.fps, config: { damping: 22, stiffness: 140 } });
          const opacity = interpolate(progress, [0, 1], [0, 1]);
          const scale = interpolate(progress, [0, 1], [0.92, 1]);
          return (
            <div key={i} style={{
              padding: "16px 22px", backgroundColor: "#111119", borderRadius: 10,
              display: "flex", justifyContent: "space-between", alignItems: "center",
              transform: `scale(${scale})`, opacity,
            }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontFamily: FONT_FAMILY.mono, fontSize: 18, fontWeight: 600, color: COLORS.text }}>{s.name}</span>
                <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 14, fontWeight: 400, color: COLORS.textSecondary }}>{s.desc}</span>
              </div>
              <div style={{ padding: "4px 12px", borderRadius: 6, backgroundColor: "#1C1C1E", border: "1px solid #2A2A2E" }}>
                <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 12, fontWeight: 500, color: COLORS.textSecondary }}>{s.category}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ position: "absolute", bottom: 50, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 36, fontWeight: 600, color: COLORS.text,
          opacity: interpolate(frame, [55, 70], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
          Real-time Multi-Source Intelligence
        </span>
      </div>
    </AbsoluteFill>
  );
};
