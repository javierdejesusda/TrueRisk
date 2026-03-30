import { AbsoluteFill, useCurrentFrame, spring, interpolate } from "remotion";
import { COLORS, FONT_FAMILY, VIDEO } from "../../lib/constants";

const DROUGHT_METRICS = [
  { label: "SPI-3", value: "0.62" },
  { label: "SPI-12", value: "1.37" },
  { label: "Risk", value: "5" },
];

const RESERVOIRS = [
  { name: "Guadalquivir", level: 62 },
  { name: "Tajo", level: 54 },
  { name: "Ebro", level: 71 },
  { name: "Duero", level: 68 },
];

const MODELS = [
  { hazard: "Flood / DANA", method: "XGBoost", accuracy: "89%" },
  { hazard: "Wildfire", method: "RF + LightGBM", accuracy: "91%" },
  { hazard: "Drought", method: "SPEI + LSTM", accuracy: "86%" },
  { hazard: "Heatwave", method: "XGBoost", accuracy: "88%" },
  { hazard: "Seismic", method: "Rule-based", accuracy: "92%" },
  { hazard: "Cold Wave", method: "Rule-based", accuracy: "90%" },
  { hazard: "Windstorm", method: "Rule-based", accuracy: "91%" },
  { hazard: "Multi-Horizon", method: "TFT + GNN", accuracy: "87%" },
];

export const DroughtAndPredictions: React.FC = () => {
  const frame = useCurrentFrame();
  const titleOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, display: "flex", flexDirection: "column", padding: "50px 100px", gap: 18 }}>
      <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 44, fontWeight: 700, color: COLORS.text, opacity: titleOpacity }}>
        Hazard Analysis
      </span>

      <div style={{ display: "flex", gap: 24, flex: 1 }}>
        {/* Left: Drought */}
        <div style={{ width: 420, display: "flex", flexDirection: "column", gap: 14,
          opacity: interpolate(frame, [5, 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}>
          <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 18, fontWeight: 600, color: COLORS.textSecondary }}>Drought Monitor</span>
          <div style={{ display: "flex", gap: 12 }}>
            {DROUGHT_METRICS.map((m, i) => (
              <div key={i} style={{ flex: 1, padding: "14px", backgroundColor: "#111119", borderRadius: 10 }}>
                <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 11, color: COLORS.textSecondary, display: "block" }}>{m.label}</span>
                <span style={{ fontFamily: FONT_FAMILY.mono, fontSize: 28, fontWeight: 700, color: COLORS.text }}>{m.value}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {RESERVOIRS.map((r, i) => {
              const barProgress = spring({ frame: frame - 20 - i * 5, fps: VIDEO.fps, config: { damping: 30, stiffness: 80 } });
              const barWidth = interpolate(barProgress, [0, 1], [0, r.level]);
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, opacity: interpolate(barProgress, [0, 1], [0, 1]) }}>
                  <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 14, color: COLORS.textSecondary, width: 100, textAlign: "right" as const }}>{r.name}</span>
                  <div style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: "#1C1C1E" }}>
                    <div style={{ width: `${barWidth}%`, height: "100%", borderRadius: 4, backgroundColor: COLORS.text }} />
                  </div>
                  <span style={{ fontFamily: FONT_FAMILY.mono, fontSize: 13, fontWeight: 600, color: COLORS.text, width: 40 }}>{r.level}%</span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ width: 1, backgroundColor: "#1C1C1E" }} />

        {/* Right: ML Models */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10,
          opacity: interpolate(frame, [10, 25], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}>
          <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 18, fontWeight: 600, color: COLORS.textSecondary }}>8 ML Models</span>
          <div style={{ display: "flex", padding: "6px 16px", gap: 12 }}>
            <span style={{ flex: 2, fontFamily: FONT_FAMILY.sans, fontSize: 11, fontWeight: 600, color: COLORS.textSecondary, textTransform: "uppercase" as const, letterSpacing: 1 }}>Hazard</span>
            <span style={{ flex: 2, fontFamily: FONT_FAMILY.sans, fontSize: 11, fontWeight: 600, color: COLORS.textSecondary, textTransform: "uppercase" as const, letterSpacing: 1 }}>Method</span>
            <span style={{ flex: 1, fontFamily: FONT_FAMILY.sans, fontSize: 11, fontWeight: 600, color: COLORS.textSecondary, textTransform: "uppercase" as const, letterSpacing: 1, textAlign: "center" as const }}>Acc.</span>
          </div>
          {MODELS.map((m, i) => {
            const delay = 12 + i * 4;
            const progress = spring({ frame: frame - delay, fps: VIDEO.fps, config: { damping: 22, stiffness: 140 } });
            const opacity = interpolate(progress, [0, 1], [0, 1]);
            return (
              <div key={i} style={{
                display: "flex", padding: "12px 16px", gap: 12, backgroundColor: "#111119", borderRadius: 8, alignItems: "center", opacity,
              }}>
                <span style={{ flex: 2, fontFamily: FONT_FAMILY.sans, fontSize: 16, fontWeight: 500, color: COLORS.text }}>{m.hazard}</span>
                <span style={{ flex: 2, fontFamily: FONT_FAMILY.mono, fontSize: 14, color: COLORS.textSecondary }}>{m.method}</span>
                <span style={{ flex: 1, fontFamily: FONT_FAMILY.mono, fontSize: 17, fontWeight: 700, color: COLORS.text, textAlign: "center" as const }}>{m.accuracy}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom caption */}
      <div style={{ position: "absolute", bottom: 30, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 34, fontWeight: 600, color: COLORS.text,
          opacity: interpolate(frame, [55, 70], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          textShadow: "0 2px 20px rgba(0,0,0,0.9)",
        }}>
          Hazard Analysis
        </span>
      </div>
    </AbsoluteFill>
  );
};
