import { AbsoluteFill, useCurrentFrame, spring, interpolate } from "remotion";
import { COLORS, FONT_FAMILY, VIDEO } from "../../lib/constants";

const METRICS = [
  { label: "SPI-3 Index", value: "0.62" },
  { label: "SPI-12 Index", value: "1.37" },
  { label: "Drought Risk", value: "5 / 100" },
];

const MODELS = [
  { hazard: "Flood / DANA", method: "XGBoost", accuracy: "89%" },
  { hazard: "Wildfire", method: "RF + LightGBM", accuracy: "91%" },
  { hazard: "Drought", method: "SPEI + LSTM", accuracy: "86%" },
  { hazard: "Heatwave", method: "XGBoost + WBGT", accuracy: "88%" },
  { hazard: "Seismic", method: "Rule-based", accuracy: "92%" },
  { hazard: "Cold Wave", method: "Rule-based", accuracy: "90%" },
  { hazard: "Windstorm", method: "Rule-based", accuracy: "91%" },
  { hazard: "Multi-Horizon", method: "TFT + GNN", accuracy: "87%" },
];

const RESERVOIRS = [
  { name: "Guadalquivir", level: 62 },
  { name: "Tajo", level: 54 },
  { name: "Ebro", level: 71 },
  { name: "Duero", level: 68 },
  { name: "Júcar", level: 45 },
];

export const DroughtAndPredictions: React.FC = () => {
  const frame = useCurrentFrame();
  const titleOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, display: "flex", flexDirection: "column", padding: "36px 60px", gap: 12 }}>
      {/* Title + Metrics row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 52, fontWeight: 700, color: COLORS.text, opacity: titleOpacity }}>Hazard Analysis</span>
        <div style={{ display: "flex", gap: 16, opacity: interpolate(frame, [5, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
          {METRICS.map((m, i) => (
            <div key={i} style={{ padding: "12px 20px", backgroundColor: "#111119", borderRadius: 10, display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 12, color: COLORS.textSecondary }}>{m.label}</span>
              <span style={{ fontFamily: FONT_FAMILY.mono, fontSize: 24, fontWeight: 700, color: COLORS.text }}>{m.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ML Models — full width table */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, opacity: interpolate(frame, [10, 24], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
        <div style={{ display: "flex", padding: "8px 20px", gap: 16 }}>
          <span style={{ flex: 3, fontFamily: FONT_FAMILY.sans, fontSize: 13, fontWeight: 600, color: COLORS.textSecondary, textTransform: "uppercase" as const, letterSpacing: 1 }}>Hazard</span>
          <span style={{ flex: 3, fontFamily: FONT_FAMILY.sans, fontSize: 13, fontWeight: 600, color: COLORS.textSecondary, textTransform: "uppercase" as const, letterSpacing: 1 }}>Method</span>
          <span style={{ flex: 1, fontFamily: FONT_FAMILY.sans, fontSize: 13, fontWeight: 600, color: COLORS.textSecondary, textTransform: "uppercase" as const, letterSpacing: 1, textAlign: "center" as const }}>Accuracy</span>
        </div>
        {MODELS.map((m, i) => {
          const delay = 12 + i * 3;
          const progress = spring({ frame: frame - delay, fps: VIDEO.fps, config: { damping: 22, stiffness: 140 } });
          const opacity = interpolate(progress, [0, 1], [0, 1]);
          return (
            <div key={i} style={{ display: "flex", padding: "14px 20px", gap: 16, backgroundColor: "#111119", borderRadius: 10, alignItems: "center", opacity }}>
              <span style={{ flex: 3, fontFamily: FONT_FAMILY.sans, fontSize: 20, fontWeight: 500, color: COLORS.text }}>{m.hazard}</span>
              <span style={{ flex: 3, fontFamily: FONT_FAMILY.mono, fontSize: 18, color: COLORS.textSecondary }}>{m.method}</span>
              <span style={{ flex: 1, fontFamily: FONT_FAMILY.mono, fontSize: 22, fontWeight: 700, color: COLORS.text, textAlign: "center" as const }}>{m.accuracy}</span>
            </div>
          );
        })}
      </div>

      {/* Reservoirs — compact row at bottom */}
      <div style={{ display: "flex", gap: 16, opacity: interpolate(frame, [35, 48], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
        <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 14, fontWeight: 600, color: COLORS.textSecondary, alignSelf: "center" }}>Reservoirs:</span>
        {RESERVOIRS.map((r, i) => {
          const barProgress = spring({ frame: frame - 38 - i * 3, fps: VIDEO.fps, config: { damping: 30, stiffness: 80 } });
          const barWidth = interpolate(barProgress, [0, 1], [0, r.level]);
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 13, color: COLORS.textSecondary }}>{r.name}</span>
                <span style={{ fontFamily: FONT_FAMILY.mono, fontSize: 13, fontWeight: 600, color: COLORS.text }}>{r.level}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, backgroundColor: "#1C1C1E" }}>
                <div style={{ width: `${barWidth}%`, height: "100%", borderRadius: 3, backgroundColor: COLORS.text }} />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ position: "absolute", bottom: 30, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 32, fontWeight: 600, color: COLORS.text, opacity: interpolate(frame, [55, 70], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), textShadow: "0 2px 20px rgba(0,0,0,0.9)" }}>
          Drought monitoring with reservoir levels and 8 ML prediction models
        </span>
      </div>
    </AbsoluteFill>
  );
};
