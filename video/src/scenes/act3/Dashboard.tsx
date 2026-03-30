import { AbsoluteFill, useCurrentFrame, spring, interpolate } from "remotion";
import { COLORS, FONT_FAMILY, VIDEO } from "../../lib/constants";

const HAZARDS = [
  { name: "Flood / DANA", score: 3 },
  { name: "Wildfire", score: 17 },
  { name: "Drought", score: 5 },
  { name: "Heatwave", score: 4 },
  { name: "Seismic", score: 1 },
  { name: "Cold Wave", score: 4 },
  { name: "Windstorm", score: 12 },
];

const WEATHER = [
  { label: "Temp", value: "12.3°C" },
  { label: "Humidity", value: "24%" },
  { label: "Wind", value: "18.3 km/h" },
  { label: "Pressure", value: "1013 hPa" },
];

const ALERTS = [
  { level: "Naranja", color: "#F97316", text: "Vientos nivel naranja — Huesca" },
  { level: "Naranja", color: "#F97316", text: "Costeros nivel naranja — Girona" },
  { level: "Amarillo", color: "#FBBF24", text: "Vientos nivel amarillo — Madrid" },
];

const DATA_SOURCES = [
  { name: "AEMET", status: "Live" },
  { name: "NASA FIRMS", status: "Live" },
  { name: "Copernicus", status: "Live" },
  { name: "IGN Seismic", status: "Live" },
];

export const Dashboard: React.FC = () => {
  const frame = useCurrentFrame();

  const titleOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  // Risk score counter
  const scoreProgress = spring({ frame: frame - 5, fps: VIDEO.fps, config: { damping: 30, stiffness: 60 } });
  const riskScore = Math.round(interpolate(scoreProgress, [0, 1], [0, 15]));

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, display: "flex", flexDirection: "column", padding: "40px 80px", gap: 14 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 40, fontWeight: 700, color: COLORS.text, opacity: titleOpacity }}>
          Risk Dashboard
        </span>
        <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 16, fontWeight: 400, color: COLORS.textSecondary, opacity: titleOpacity }}>
          Province: Madrid · Updated: Now
        </span>
      </div>

      {/* Top row: Risk Score + Weather + Alerts */}
      <div style={{ display: "flex", gap: 14 }}>
        {/* Risk Score */}
        <div style={{
          flex: 1, padding: "22px 28px", backgroundColor: "#111119", borderRadius: 12,
          display: "flex", alignItems: "center", gap: 24,
          opacity: interpolate(frame, [5, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{ fontFamily: FONT_FAMILY.mono, fontSize: 64, fontWeight: 700, color: COLORS.text }}>{riskScore}</span>
            <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 13, fontWeight: 400, color: COLORS.textSecondary }}>Composite</span>
          </div>
          <div style={{ width: 1, height: 70, backgroundColor: "#2A2A2E" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 20, fontWeight: 600, color: COLORS.text }}>Low Risk</span>
            <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 12, fontWeight: 400, color: COLORS.textSecondary, lineHeight: 1.5 }}>
              Fire risk dominant. No immediate threats detected for your location.
            </span>
          </div>
        </div>

        {/* Weather */}
        <div style={{
          width: 320, padding: "22px 24px", backgroundColor: "#111119", borderRadius: 12,
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14,
          opacity: interpolate(frame, [10, 23], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}>
          {WEATHER.map((w, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 11, fontWeight: 400, color: COLORS.textSecondary }}>{w.label}</span>
              <span style={{ fontFamily: FONT_FAMILY.mono, fontSize: 20, fontWeight: 600, color: COLORS.text }}>{w.value}</span>
            </div>
          ))}
        </div>

        {/* Active Alerts */}
        <div style={{
          width: 380, padding: "16px 20px", backgroundColor: "#111119", borderRadius: 12,
          display: "flex", flexDirection: "column", gap: 8,
          opacity: interpolate(frame, [15, 28], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 14, fontWeight: 600, color: COLORS.text }}>Active Alerts</span>
            <span style={{ fontFamily: FONT_FAMILY.mono, fontSize: 12, fontWeight: 500, color: COLORS.textSecondary }}>145 total</span>
          </div>
          {ALERTS.map((a, i) => (
            <div key={i} style={{ padding: "6px 10px", borderRadius: 6, borderLeft: `3px solid ${a.color}`, backgroundColor: "#1C1C1E" }}>
              <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 11, fontWeight: 400, color: COLORS.text }}>{a.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Middle row: AI Narrative + Hazard Breakdown */}
      <div style={{ display: "flex", gap: 14 }}>
        {/* AI Morning Briefing */}
        <div style={{
          flex: 1, padding: "18px 24px", backgroundColor: "#111119", borderRadius: 12,
          display: "flex", flexDirection: "column", gap: 8,
          opacity: interpolate(frame, [22, 35], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>🤖</span>
            <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 14, fontWeight: 600, color: COLORS.text }}>AI Risk Narrative</span>
          </div>
          <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 13, fontWeight: 400, color: COLORS.textSecondary, lineHeight: 1.6 }}>
            Risk level for Madrid: general low with score 15/100. The main risk comes from wildfires. Stay informed and follow civil protection recommendations.
          </span>
        </div>

        {/* Hazard Breakdown */}
        <div style={{
          width: 440, padding: "18px 24px", backgroundColor: "#111119", borderRadius: 12,
          display: "flex", flexDirection: "column", gap: 10,
          opacity: interpolate(frame, [18, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}>
          <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 14, fontWeight: 600, color: COLORS.text }}>Hazard Breakdown</span>
          {HAZARDS.map((h, i) => {
            const barProgress = spring({ frame: frame - 25 - i * 3, fps: VIDEO.fps, config: { damping: 28, stiffness: 80 } });
            const barWidth = interpolate(barProgress, [0, 1], [0, h.score]);
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 12, fontWeight: 400, color: COLORS.textSecondary, width: 110, textAlign: "right" as const }}>{h.name}</span>
                <div style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: "#1C1C1E" }}>
                  <div style={{ width: `${barWidth}%`, height: "100%", borderRadius: 3, backgroundColor: COLORS.text }} />
                </div>
                <span style={{ fontFamily: FONT_FAMILY.mono, fontSize: 12, fontWeight: 600, color: COLORS.text, width: 24 }}>{h.score}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom row: Quick Actions + Data Sources + Preparedness */}
      <div style={{ display: "flex", gap: 14 }}>
        {/* Quick Actions */}
        <div style={{
          display: "flex", gap: 10, flex: 1,
          opacity: interpolate(frame, [35, 48], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}>
          {["🗺️ Risk Map", "📊 Predictions", "⚠️ Alerts", "🚨 Emergency", "📍 Evacuate", "📋 Report"].map((action, i) => (
            <div key={i} style={{ flex: 1, padding: "14px 8px", backgroundColor: "#111119", borderRadius: 10, textAlign: "center" as const }}>
              <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 13, fontWeight: 500, color: COLORS.text }}>{action}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bottom: Data Sources + Preparedness */}
      <div style={{ display: "flex", gap: 14 }}>
        {/* Data Sources */}
        <div style={{
          flex: 1, padding: "14px 20px", backgroundColor: "#111119", borderRadius: 12,
          display: "flex", alignItems: "center", gap: 20,
          opacity: interpolate(frame, [40, 52], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}>
          <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 13, fontWeight: 600, color: COLORS.text }}>Data Sources</span>
          {DATA_SOURCES.map((ds, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#4ade80" }} />
              <span style={{ fontFamily: FONT_FAMILY.mono, fontSize: 12, fontWeight: 400, color: COLORS.textSecondary }}>{ds.name}</span>
            </div>
          ))}
        </div>

        {/* Preparedness Score */}
        <div style={{
          width: 260, padding: "14px 20px", backgroundColor: "#111119", borderRadius: 12,
          display: "flex", alignItems: "center", gap: 16,
          opacity: interpolate(frame, [42, 55], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}>
          <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 13, fontWeight: 600, color: COLORS.text }}>Preparedness</span>
          <div style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: "#1C1C1E" }}>
            <div style={{ width: "67%", height: "100%", borderRadius: 3, backgroundColor: COLORS.text }} />
          </div>
          <span style={{ fontFamily: FONT_FAMILY.mono, fontSize: 14, fontWeight: 700, color: COLORS.text }}>67%</span>
        </div>
      </div>

      {/* Bottom caption */}
      <div style={{ position: "absolute", bottom: 30, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 34, fontWeight: 600, color: COLORS.text,
          opacity: interpolate(frame, [55, 70], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
          Real-time Risk Dashboard
        </span>
      </div>
    </AbsoluteFill>
  );
};
