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
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, display: "flex", flexDirection: "column", padding: "40px 60px", gap: 20 }}>
      <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 52, fontWeight: 700, color: COLORS.text, opacity: titleOpacity }}>
        Platform Infrastructure
      </span>

      <div style={{ display: "flex", gap: 24, flex: 1 }}>
        {/* Left: Data Sources */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10,
          opacity: interpolate(frame, [5, 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 22, fontWeight: 600, color: COLORS.textSecondary }}>Data Sources</span>
            <span style={{ fontFamily: FONT_FAMILY.mono, fontSize: 24, fontWeight: 700, color: COLORS.text }}>15+</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {DATA_SOURCES.map((s, i) => {
              const delay = 8 + i * 3;
              const progress = spring({ frame: frame - delay, fps: VIDEO.fps, config: { damping: 24, stiffness: 140 } });
              const opacity = interpolate(progress, [0, 1], [0, 1]);
              return (
                <div key={i} style={{ padding: "10px 14px", backgroundColor: "#111119", borderRadius: 8, opacity }}>
                  <span style={{ fontFamily: FONT_FAMILY.mono, fontSize: 17, fontWeight: 600, color: COLORS.text, display: "block" }}>{s.name}</span>
                  <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 14, color: COLORS.textSecondary }}>{s.desc}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ width: 1, backgroundColor: "#1C1C1E" }} />

        {/* Right: Notifications */}
        <div style={{ width: 360, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 32,
          opacity: interpolate(frame, [15, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}>
          <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 22, fontWeight: 600, color: COLORS.textSecondary }}>Alerts on Every Channel</span>
          <div style={{ display: "flex", gap: 40 }}>
            {CHANNELS.map((ch, i) => {
              const delay = 20 + i * 8;
              const progress = spring({ frame: frame - delay, fps: VIDEO.fps, config: { damping: 18, stiffness: 140 } });
              const opacity = interpolate(progress, [0, 1], [0, 1]);
              const translateY = interpolate(progress, [0, 1], [30, 0]);
              return (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, transform: `translateY(${translateY}px)`, opacity }}>
                  <div style={{ width: 76, height: 76, borderRadius: 16, backgroundColor: "#111119", border: "1px solid #2A2A2E", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34 }}>
                    {ch.icon}
                  </div>
                  <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 20, fontWeight: 500, color: COLORS.textSecondary }}>{ch.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom caption */}
      <div style={{ position: "absolute", bottom: 30, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 32, fontWeight: 600, color: COLORS.text,
          opacity: interpolate(frame, [55, 70], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          textShadow: "0 2px 20px rgba(0,0,0,0.9)",
        }}>
          15+ real-time data sources with SMS, Telegram, and email alerts
        </span>
      </div>
    </AbsoluteFill>
  );
};
