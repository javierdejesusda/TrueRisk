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
  { label: "Temperature", value: "12.3°C" },
  { label: "Humidity", value: "24%" },
  { label: "Wind Speed", value: "18.3 km/h" },
  { label: "Pressure", value: "1013 hPa" },
  { label: "Rainfall", value: "0 mm" },
  { label: "Visibility", value: "10 km" },
];

const ALERTS = [
  { level: "Naranja", color: "#F97316", text: "Vientos nivel naranja — Pirineo oscense" },
  { level: "Naranja", color: "#F97316", text: "Costeros nivel naranja — Costa Ampurdán" },
  { level: "Amarillo", color: "#FBBF24", text: "Vientos nivel amarillo — Sierra de Madrid" },
  { level: "Amarillo", color: "#FBBF24", text: "Polvo en suspensión — Gran Canaria" },
];

const QUICK_ACTIONS = [
  { icon: "🗺️", label: "Risk Map" },
  { icon: "📊", label: "Predictions" },
  { icon: "⚠️", label: "Alerts" },
  { icon: "🚨", label: "Emergency" },
  { icon: "📍", label: "Evacuate" },
  { icon: "📋", label: "Report" },
];

const DATA_SOURCES = [
  { name: "AEMET", live: true },
  { name: "NASA FIRMS", live: true },
  { name: "Copernicus", live: true },
  { name: "IGN Seismic", live: true },
  { name: "SAIH", live: true },
  { name: "Open-Meteo", live: true },
];

export const DashboardAndAlerts: React.FC = () => {
  const frame = useCurrentFrame();
  const titleOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  const scoreProgress = spring({ frame: frame - 5, fps: VIDEO.fps, config: { damping: 30, stiffness: 60 } });
  const riskScore = Math.round(interpolate(scoreProgress, [0, 1], [0, 15]));

  const prepProgress = spring({ frame: frame - 8, fps: VIDEO.fps, config: { damping: 30, stiffness: 60 } });
  const prepScore = Math.round(interpolate(prepProgress, [0, 1], [0, 67]));

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, display: "flex", flexDirection: "column", padding: "32px 60px", gap: 10 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 36, fontWeight: 700, color: COLORS.text, opacity: titleOpacity }}>
          Risk Dashboard
        </span>
        <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 14, fontWeight: 400, color: COLORS.textSecondary, opacity: titleOpacity }}>
          Province: Madrid · Updated: Now
        </span>
      </div>

      {/* ROW 1: Risk Score + Weather + Hazard Breakdown */}
      <div style={{
        display: "flex", gap: 12,
        opacity: interpolate(frame, [3, 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}>
        {/* Risk Score */}
        <div style={{ padding: "16px 22px", backgroundColor: "#111119", borderRadius: 12, display: "flex", alignItems: "center", gap: 18, width: 300 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{ fontFamily: FONT_FAMILY.mono, fontSize: 56, fontWeight: 700, color: COLORS.text }}>{riskScore}</span>
            <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 11, color: COLORS.textSecondary }}>Composite Risk</span>
          </div>
          <div style={{ width: 1, height: 55, backgroundColor: "#2A2A2E" }} />
          <div>
            <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 18, fontWeight: 600, color: COLORS.text, display: "block" }}>Low</span>
            <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 11, color: COLORS.textSecondary }}>Fire risk dominant</span>
          </div>
        </div>

        {/* Weather */}
        <div style={{ flex: 1, padding: "14px 18px", backgroundColor: "#111119", borderRadius: 12, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {WEATHER.map((w, i) => (
            <div key={i}>
              <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 10, color: COLORS.textSecondary, display: "block" }}>{w.label}</span>
              <span style={{ fontFamily: FONT_FAMILY.mono, fontSize: 18, fontWeight: 600, color: COLORS.text }}>{w.value}</span>
            </div>
          ))}
        </div>

        {/* Hazard Breakdown */}
        <div style={{ width: 400, padding: "12px 18px", backgroundColor: "#111119", borderRadius: 12, display: "flex", flexDirection: "column", gap: 5 }}>
          <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 12, fontWeight: 600, color: COLORS.text }}>Hazard Breakdown</span>
          {HAZARDS.map((h, i) => {
            const barProgress = spring({ frame: frame - 12 - i * 2, fps: VIDEO.fps, config: { damping: 28, stiffness: 80 } });
            const barWidth = interpolate(barProgress, [0, 1], [0, h.score]);
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 11, color: COLORS.textSecondary, width: 85, textAlign: "right" as const }}>{h.name}</span>
                <div style={{ flex: 1, height: 5, borderRadius: 3, backgroundColor: "#1C1C1E" }}>
                  <div style={{ width: `${barWidth}%`, height: "100%", borderRadius: 3, backgroundColor: COLORS.text }} />
                </div>
                <span style={{ fontFamily: FONT_FAMILY.mono, fontSize: 11, fontWeight: 600, color: COLORS.text, width: 20 }}>{h.score}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ROW 2: AI Narrative + Quick Actions + Preparedness + Data Sources */}
      <div style={{
        display: "flex", gap: 12,
        opacity: interpolate(frame, [12, 25], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}>
        {/* AI Narrative */}
        <div style={{ flex: 1, padding: "14px 18px", backgroundColor: "#111119", borderRadius: 12, display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 13 }}>🤖</span>
            <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 12, fontWeight: 600, color: COLORS.text }}>AI Risk Narrative</span>
          </div>
          <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 12, color: COLORS.textSecondary, lineHeight: 1.6 }}>
            Risk for Madrid: low (15/100). Wildfire is the dominant factor. No immediate threats detected. Stay informed and follow civil protection guidelines.
          </span>
        </div>

        {/* Quick Actions */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {QUICK_ACTIONS.map((a, i) => (
            <div key={i} style={{ padding: "10px 16px", backgroundColor: "#111119", borderRadius: 8, textAlign: "center" as const, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 16 }}>{a.icon}</span>
              <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 11, fontWeight: 500, color: COLORS.text }}>{a.label}</span>
            </div>
          ))}
        </div>

        {/* Preparedness */}
        <div style={{ width: 160, padding: "14px 18px", backgroundColor: "#111119", borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
          <span style={{ fontFamily: FONT_FAMILY.mono, fontSize: 36, fontWeight: 700, color: COLORS.text }}>{prepScore}%</span>
          <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 11, color: COLORS.textSecondary }}>Preparedness</span>
          <div style={{ width: "100%", height: 5, borderRadius: 3, backgroundColor: "#1C1C1E", marginTop: 4 }}>
            <div style={{ width: `${prepScore}%`, height: "100%", borderRadius: 3, backgroundColor: COLORS.text }} />
          </div>
        </div>

        {/* Data Sources */}
        <div style={{ width: 200, padding: "12px 16px", backgroundColor: "#111119", borderRadius: 12, display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 11, fontWeight: 600, color: COLORS.text }}>Data Sources</span>
          {DATA_SOURCES.map((ds, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: "#4ade80" }} />
              <span style={{ fontFamily: FONT_FAMILY.mono, fontSize: 11, color: COLORS.textSecondary }}>{ds.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ROW 3: Alerts */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column", gap: 7,
        opacity: interpolate(frame, [20, 33], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 16, fontWeight: 600, color: COLORS.text }}>Active Alerts</span>
          <span style={{ fontFamily: FONT_FAMILY.mono, fontSize: 13, color: COLORS.textSecondary }}>145 active</span>
        </div>
        {ALERTS.map((a, i) => {
          const delay = 22 + i * 4;
          const progress = spring({ frame: frame - delay, fps: VIDEO.fps, config: { damping: 22, stiffness: 120 } });
          const translateX = interpolate(progress, [0, 1], [40, 0]);
          const opacity = interpolate(progress, [0, 1], [0, 1]);
          return (
            <div key={i} style={{
              padding: "12px 16px", backgroundColor: "#111119", borderRadius: 10,
              borderLeft: `4px solid ${a.color}`, display: "flex", alignItems: "center", gap: 12,
              transform: `translateX(${translateX}px)`, opacity,
            }}>
              <div style={{ padding: "2px 10px", borderRadius: 5, backgroundColor: a.color }}>
                <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 11, fontWeight: 600, color: "#000" }}>{a.level}</span>
              </div>
              <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 14, color: COLORS.text }}>{a.text}</span>
            </div>
          );
        })}
      </div>

      {/* Bottom caption */}
      <div style={{ position: "absolute", bottom: 24, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 34, fontWeight: 600, color: COLORS.text,
          opacity: interpolate(frame, [55, 70], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          textShadow: "0 2px 20px rgba(0,0,0,0.9)",
        }}>
          Real-time Risk Intelligence
        </span>
      </div>
    </AbsoluteFill>
  );
};
