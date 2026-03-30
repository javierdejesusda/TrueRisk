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
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, display: "flex", flexDirection: "column", padding: "40px 80px", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 40, fontWeight: 700, color: COLORS.text, opacity: titleOpacity }}>
          Risk Dashboard
        </span>
        <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 16, fontWeight: 400, color: COLORS.textSecondary, opacity: titleOpacity }}>
          Province: Madrid · Updated: Now
        </span>
      </div>

      <div style={{ display: "flex", gap: 20, flex: 1 }}>
        {/* Left column: Risk + Weather + Hazards */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Risk score + weather row */}
          <div style={{ display: "flex", gap: 14 }}>
            <div style={{
              flex: 1, padding: "20px 24px", backgroundColor: "#111119", borderRadius: 12,
              display: "flex", alignItems: "center", gap: 20,
              opacity: interpolate(frame, [5, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <span style={{ fontFamily: FONT_FAMILY.mono, fontSize: 56, fontWeight: 700, color: COLORS.text }}>{riskScore}</span>
                <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 12, color: COLORS.textSecondary }}>Composite</span>
              </div>
              <div style={{ width: 1, height: 60, backgroundColor: "#2A2A2E" }} />
              <div>
                <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 18, fontWeight: 600, color: COLORS.text, display: "block" }}>Low Risk</span>
                <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 12, color: COLORS.textSecondary }}>Fire risk dominant</span>
              </div>
            </div>
            <div style={{
              width: 280, padding: "16px 20px", backgroundColor: "#111119", borderRadius: 12,
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10,
              opacity: interpolate(frame, [10, 23], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            }}>
              {WEATHER.map((w, i) => (
                <div key={i}>
                  <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 10, color: COLORS.textSecondary, display: "block" }}>{w.label}</span>
                  <span style={{ fontFamily: FONT_FAMILY.mono, fontSize: 18, fontWeight: 600, color: COLORS.text }}>{w.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Hazard bars */}
          <div style={{
            padding: "16px 22px", backgroundColor: "#111119", borderRadius: 12,
            display: "flex", flexDirection: "column", gap: 10,
            opacity: interpolate(frame, [15, 28], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          }}>
            <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 14, fontWeight: 600, color: COLORS.text }}>Hazard Breakdown</span>
            {HAZARDS.map((h, i) => {
              const barProgress = spring({ frame: frame - 22 - i * 3, fps: VIDEO.fps, config: { damping: 28, stiffness: 80 } });
              const barWidth = interpolate(barProgress, [0, 1], [0, h.score]);
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 13, color: COLORS.textSecondary, width: 100, textAlign: "right" as const }}>{h.name}</span>
                  <div style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: "#1C1C1E" }}>
                    <div style={{ width: `${barWidth}%`, height: "100%", borderRadius: 3, backgroundColor: COLORS.text }} />
                  </div>
                  <span style={{ fontFamily: FONT_FAMILY.mono, fontSize: 13, fontWeight: 600, color: COLORS.text, width: 24 }}>{h.score}</span>
                </div>
              );
            })}
          </div>

          {/* AI narrative */}
          <div style={{
            padding: "14px 20px", backgroundColor: "#111119", borderRadius: 12,
            display: "flex", alignItems: "flex-start", gap: 10,
            opacity: interpolate(frame, [30, 42], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          }}>
            <span style={{ fontSize: 14 }}>🤖</span>
            <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 13, color: COLORS.textSecondary, lineHeight: 1.5 }}>
              Risk for Madrid: low (15/100). Wildfire dominant. Stay informed.
            </span>
          </div>
        </div>

        {/* Right column: Alerts */}
        <div style={{
          width: 500, display: "flex", flexDirection: "column", gap: 10,
          opacity: interpolate(frame, [12, 25], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 18, fontWeight: 600, color: COLORS.text }}>Active Alerts</span>
            <span style={{ fontFamily: FONT_FAMILY.mono, fontSize: 14, color: COLORS.textSecondary }}>145 active</span>
          </div>
          {ALERTS.map((a, i) => {
            const delay = 15 + i * 5;
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
      </div>
    </AbsoluteFill>
  );
};
