import { AbsoluteFill, useCurrentFrame, spring, interpolate } from "remotion";
import { COLORS, FONT_FAMILY, VIDEO } from "../../lib/constants";

const HAZARDS = [
  { name: "Flood / DANA", score: 3 },
  { name: "Wildfire", score: 17 },
  { name: "Drought", score: 5 },
  { name: "Heatwave", score: 4 },
  { name: "Windstorm", score: 12 },
];

const WEATHER = [
  { label: "Temp", value: "12.3°C" },
  { label: "Humidity", value: "24%" },
  { label: "Wind", value: "18.3 km/h" },
  { label: "Pressure", value: "1013 hPa" },
];

const ALERTS = [
  { level: "Naranja", color: "#F97316", text: "Vientos nivel naranja — Pirineo oscense" },
  { level: "Naranja", color: "#F97316", text: "Costeros nivel naranja — Costa Ampurdán" },
  { level: "Amarillo", color: "#FBBF24", text: "Vientos nivel amarillo — Sierra de Madrid" },
  { level: "Amarillo", color: "#FBBF24", text: "Polvo en suspensión — Gran Canaria" },
  { level: "Naranja", color: "#F97316", text: "Vientos nivel naranja — Interior Castellón" },
];

export const DashboardAndAlerts: React.FC = () => {
  const frame = useCurrentFrame();
  const titleOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  const scoreProgress = spring({ frame: frame - 5, fps: VIDEO.fps, config: { damping: 30, stiffness: 60 } });
  const riskScore = Math.round(interpolate(scoreProgress, [0, 1], [0, 15]));

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, display: "flex", flexDirection: "column", padding: "36px 80px", gap: 12 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 40, fontWeight: 700, color: COLORS.text, opacity: titleOpacity }}>
          Risk Dashboard
        </span>
        <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 16, fontWeight: 400, color: COLORS.textSecondary, opacity: titleOpacity }}>
          Province: Madrid · Updated: Now
        </span>
      </div>

      {/* TOP: Dashboard row — Risk Score + Weather + Hazards + AI */}
      <div style={{
        display: "flex", gap: 14,
        opacity: interpolate(frame, [5, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}>
        {/* Risk Score */}
        <div style={{ padding: "18px 22px", backgroundColor: "#111119", borderRadius: 12, display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{ fontFamily: FONT_FAMILY.mono, fontSize: 52, fontWeight: 700, color: COLORS.text }}>{riskScore}</span>
            <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 11, color: COLORS.textSecondary }}>Composite</span>
          </div>
          <div style={{ width: 1, height: 55, backgroundColor: "#2A2A2E" }} />
          <div>
            <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 16, fontWeight: 600, color: COLORS.text, display: "block" }}>Low Risk</span>
            <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 11, color: COLORS.textSecondary }}>Fire risk dominant</span>
          </div>
        </div>

        {/* Weather */}
        <div style={{ width: 260, padding: "14px 18px", backgroundColor: "#111119", borderRadius: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {WEATHER.map((w, i) => (
            <div key={i}>
              <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 10, color: COLORS.textSecondary, display: "block" }}>{w.label}</span>
              <span style={{ fontFamily: FONT_FAMILY.mono, fontSize: 17, fontWeight: 600, color: COLORS.text }}>{w.value}</span>
            </div>
          ))}
        </div>

        {/* Hazard Breakdown */}
        <div style={{ flex: 1, padding: "14px 18px", backgroundColor: "#111119", borderRadius: 12, display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 12, fontWeight: 600, color: COLORS.text }}>Hazard Breakdown</span>
          {HAZARDS.map((h, i) => {
            const barProgress = spring({ frame: frame - 18 - i * 3, fps: VIDEO.fps, config: { damping: 28, stiffness: 80 } });
            const barWidth = interpolate(barProgress, [0, 1], [0, h.score]);
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 11, color: COLORS.textSecondary, width: 90, textAlign: "right" as const }}>{h.name}</span>
                <div style={{ flex: 1, height: 5, borderRadius: 3, backgroundColor: "#1C1C1E" }}>
                  <div style={{ width: `${barWidth}%`, height: "100%", borderRadius: 3, backgroundColor: COLORS.text }} />
                </div>
                <span style={{ fontFamily: FONT_FAMILY.mono, fontSize: 11, fontWeight: 600, color: COLORS.text, width: 20 }}>{h.score}</span>
              </div>
            );
          })}
        </div>

        {/* AI Narrative */}
        <div style={{ width: 280, padding: "14px 18px", backgroundColor: "#111119", borderRadius: 12, display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12 }}>🤖</span>
            <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 11, fontWeight: 600, color: COLORS.text }}>AI Risk Narrative</span>
          </div>
          <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 12, color: COLORS.textSecondary, lineHeight: 1.5 }}>
            Risk for Madrid: low (15/100). Wildfire dominant. No immediate threats. Stay informed and follow civil protection guidelines.
          </span>
        </div>
      </div>

      {/* BOTTOM: Alerts */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column", gap: 8,
        opacity: interpolate(frame, [15, 28], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 18, fontWeight: 600, color: COLORS.text }}>Active Alerts</span>
          <span style={{ fontFamily: FONT_FAMILY.mono, fontSize: 14, color: COLORS.textSecondary }}>145 active</span>
        </div>
        {ALERTS.map((a, i) => {
          const delay = 18 + i * 5;
          const progress = spring({ frame: frame - delay, fps: VIDEO.fps, config: { damping: 22, stiffness: 120 } });
          const translateX = interpolate(progress, [0, 1], [40, 0]);
          const opacity = interpolate(progress, [0, 1], [0, 1]);
          return (
            <div key={i} style={{
              padding: "14px 18px", backgroundColor: "#111119", borderRadius: 10,
              borderLeft: `4px solid ${a.color}`, display: "flex", alignItems: "center", gap: 14,
              transform: `translateX(${translateX}px)`, opacity,
            }}>
              <div style={{ padding: "3px 10px", borderRadius: 5, backgroundColor: a.color }}>
                <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 11, fontWeight: 600, color: "#000" }}>{a.level}</span>
              </div>
              <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 15, color: COLORS.text }}>{a.text}</span>
            </div>
          );
        })}
      </div>

      {/* Bottom caption */}
      <div style={{ position: "absolute", bottom: 30, left: 0, right: 0, textAlign: "center" }}>
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
