import { AbsoluteFill, useCurrentFrame, spring, interpolate } from "remotion";
import { COLORS, FONT_FAMILY, VIDEO } from "../../lib/constants";

const DATA_SOURCES = [
  { name: "AEMET", desc: "Spanish Met Agency" },
  { name: "NASA FIRMS", desc: "Fire Detection" },
  { name: "Copernicus EFAS", desc: "Flood Awareness" },
  { name: "Copernicus CAMS", desc: "Air Quality" },
  { name: "IGN", desc: "Seismic Catalog" },
  { name: "SAIH", desc: "River Gauges" },
  { name: "Open-Meteo", desc: "Weather Data" },
  { name: "NASA POWER", desc: "Solar Radiation" },
  { name: "ECMWF", desc: "Seasonal Forecasts" },
  { name: "Copernicus Land", desc: "Soil & Vegetation" },
];

const CHANNELS = [
  { name: "SMS", icon: "💬" },
  { name: "Telegram", icon: "✈️" },
  { name: "Email", icon: "📧" },
];

export const PlatformFeatures: React.FC = () => {
  const frame = useCurrentFrame();
  const titleOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, display: "flex", flexDirection: "column", padding: "36px 60px", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 52, fontWeight: 700, color: COLORS.text, opacity: titleOpacity }}>Platform Infrastructure</span>
        <span style={{ fontFamily: FONT_FAMILY.mono, fontSize: 32, fontWeight: 700, color: COLORS.text, opacity: interpolate(frame, [5, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>15+ Sources</span>
      </div>

      {/* Data sources — 5-column grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 12, opacity: interpolate(frame, [8, 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
        {DATA_SOURCES.map((s, i) => {
          const delay = 10 + i * 3;
          const progress = spring({ frame: frame - delay, fps: VIDEO.fps, config: { damping: 24, stiffness: 140 } });
          const opacity = interpolate(progress, [0, 1], [0, 1]);
          return (
            <div key={i} style={{ padding: "18px 20px", backgroundColor: "#111119", borderRadius: 12, display: "flex", flexDirection: "column", gap: 6, opacity }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#4ade80" }} />
                <span style={{ fontFamily: FONT_FAMILY.mono, fontSize: 18, fontWeight: 600, color: COLORS.text }}>{s.name}</span>
              </div>
              <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 14, color: COLORS.textSecondary }}>{s.desc}</span>
            </div>
          );
        })}
      </div>

      {/* Notification channels — centered row */}
      <div style={{
        display: "flex", justifyContent: "center", alignItems: "center", gap: 60, padding: "28px 0",
        opacity: interpolate(frame, [30, 45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}>
        <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 22, fontWeight: 600, color: COLORS.textSecondary }}>Alerts on Every Channel</span>
        {CHANNELS.map((ch, i) => {
          const delay = 35 + i * 6;
          const progress = spring({ frame: frame - delay, fps: VIDEO.fps, config: { damping: 18, stiffness: 140 } });
          const opacity = interpolate(progress, [0, 1], [0, 1]);
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, opacity }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, backgroundColor: "#111119", border: "1px solid #2A2A2E", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>{ch.icon}</div>
              <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 20, fontWeight: 500, color: COLORS.text }}>{ch.name}</span>
            </div>
          );
        })}
      </div>

      <div style={{ position: "absolute", bottom: 30, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 32, fontWeight: 600, color: COLORS.text, opacity: interpolate(frame, [55, 70], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), textShadow: "0 2px 20px rgba(0,0,0,0.9)" }}>
          15+ real-time data sources with SMS, Telegram, and email alerts
        </span>
      </div>
    </AbsoluteFill>
  );
};
