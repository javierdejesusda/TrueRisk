import { AbsoluteFill, useCurrentFrame, spring, interpolate } from "remotion";
import { COLORS, FONT_FAMILY, VIDEO } from "../../lib/constants";

const MODELS = [
  { hazard: "Flood / DANA", method: "XGBoost", accuracy: "89%", features: 23 },
  { hazard: "Wildfire", method: "RF + LightGBM", accuracy: "91%", features: 20 },
  { hazard: "Drought", method: "SPEI + LSTM", accuracy: "86%", features: 6 },
  { hazard: "Heatwave", method: "XGBoost + WBGT", accuracy: "88%", features: 18 },
  { hazard: "Seismic", method: "Rule-based", accuracy: "92%", features: 8 },
  { hazard: "Cold Wave", method: "Rule-based", accuracy: "90%", features: 14 },
  { hazard: "Windstorm", method: "Rule-based", accuracy: "91%", features: 14 },
];

export const Predictions: React.FC = () => {
  const frame = useCurrentFrame();

  const titleOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, display: "flex", flexDirection: "column", padding: "60px 160px", gap: 16 }}>
      <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 48, fontWeight: 700, color: COLORS.text, opacity: titleOpacity, marginBottom: 8 }}>
        7 ML Models
      </span>

      {/* Table header */}
      <div style={{
        display: "flex", padding: "10px 24px", gap: 16,
        opacity: interpolate(frame, [8, 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}>
        <span style={{ flex: 2, fontFamily: FONT_FAMILY.sans, fontSize: 14, fontWeight: 600, color: COLORS.textSecondary, textTransform: "uppercase" as const, letterSpacing: 1 }}>Hazard</span>
        <span style={{ flex: 2, fontFamily: FONT_FAMILY.sans, fontSize: 14, fontWeight: 600, color: COLORS.textSecondary, textTransform: "uppercase" as const, letterSpacing: 1 }}>Method</span>
        <span style={{ flex: 1, fontFamily: FONT_FAMILY.sans, fontSize: 14, fontWeight: 600, color: COLORS.textSecondary, textTransform: "uppercase" as const, letterSpacing: 1, textAlign: "center" as const }}>Accuracy</span>
        <span style={{ flex: 1, fontFamily: FONT_FAMILY.sans, fontSize: 14, fontWeight: 600, color: COLORS.textSecondary, textTransform: "uppercase" as const, letterSpacing: 1, textAlign: "center" as const }}>Features</span>
      </div>

      {MODELS.map((m, i) => {
        const delay = 10 + i * 5;
        const progress = spring({ frame: frame - delay, fps: VIDEO.fps, config: { damping: 22, stiffness: 140 } });
        const translateX = interpolate(progress, [0, 1], [60, 0]);
        const opacity = interpolate(progress, [0, 1], [0, 1]);
        return (
          <div key={i} style={{
            display: "flex", padding: "16px 24px", gap: 16, backgroundColor: "#111119", borderRadius: 10,
            transform: `translateX(${translateX}px)`, opacity, alignItems: "center",
          }}>
            <span style={{ flex: 2, fontFamily: FONT_FAMILY.sans, fontSize: 20, fontWeight: 500, color: COLORS.text }}>{m.hazard}</span>
            <span style={{ flex: 2, fontFamily: FONT_FAMILY.mono, fontSize: 18, fontWeight: 400, color: COLORS.textSecondary }}>{m.method}</span>
            <span style={{ flex: 1, fontFamily: FONT_FAMILY.mono, fontSize: 22, fontWeight: 700, color: COLORS.text, textAlign: "center" as const }}>{m.accuracy}</span>
            <span style={{ flex: 1, fontFamily: FONT_FAMILY.mono, fontSize: 18, fontWeight: 400, color: COLORS.textSecondary, textAlign: "center" as const }}>{m.features}</span>
          </div>
        );
      })}

      <div style={{ position: "absolute", bottom: 50, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 36, fontWeight: 600, color: COLORS.text,
          opacity: interpolate(frame, [50, 65], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
          ML-Powered Risk Predictions
        </span>
      </div>
    </AbsoluteFill>
  );
};
