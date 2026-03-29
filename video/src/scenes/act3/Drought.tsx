import { AbsoluteFill, useCurrentFrame, spring, interpolate } from "remotion";
import { COLORS, FONT_FAMILY, VIDEO } from "../../lib/constants";

const METRICS = [
  { label: "SPI-3 Index", value: "0.62", status: "Normal" },
  { label: "SPI-12 Index", value: "1.37", status: "Normal" },
  { label: "Risk Score", value: "5", status: "Low" },
];

const RESERVOIRS = [
  { name: "Guadalquivir", level: 62 },
  { name: "Tajo", level: 54 },
  { name: "Ebro", level: 71 },
  { name: "Duero", level: 68 },
  { name: "Júcar", level: 45 },
];

export const Drought: React.FC = () => {
  const frame = useCurrentFrame();

  const titleOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, display: "flex", flexDirection: "column", padding: "70px 200px", gap: 24 }}>
      <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 48, fontWeight: 700, color: COLORS.text, opacity: titleOpacity }}>
        Drought Monitor
      </span>

      {/* Metrics row */}
      <div style={{ display: "flex", gap: 20 }}>
        {METRICS.map((m, i) => {
          const delay = 8 + i * 7;
          const progress = spring({ frame: frame - delay, fps: VIDEO.fps, config: { damping: 22, stiffness: 130 } });
          const opacity = interpolate(progress, [0, 1], [0, 1]);
          const scale = interpolate(progress, [0, 1], [0.9, 1]);
          return (
            <div key={i} style={{
              flex: 1, padding: "22px 24px", backgroundColor: "#111119", borderRadius: 12,
              display: "flex", flexDirection: "column", gap: 8, transform: `scale(${scale})`, opacity,
            }}>
              <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 15, fontWeight: 400, color: COLORS.textSecondary }}>{m.label}</span>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                <span style={{ fontFamily: FONT_FAMILY.mono, fontSize: 36, fontWeight: 700, color: COLORS.text }}>{m.value}</span>
                <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 16, fontWeight: 500, color: COLORS.textSecondary }}>{m.status}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reservoir levels */}
      <span style={{
        fontFamily: FONT_FAMILY.sans, fontSize: 20, fontWeight: 500, color: COLORS.textSecondary, marginTop: 8,
        opacity: interpolate(frame, [30, 42], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}>
        Reservoir Levels
      </span>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {RESERVOIRS.map((r, i) => {
          const delay = 35 + i * 6;
          const barProgress = spring({ frame: frame - delay, fps: VIDEO.fps, config: { damping: 30, stiffness: 80 } });
          const barWidth = interpolate(barProgress, [0, 1], [0, r.level]);
          const opacity = interpolate(barProgress, [0, 1], [0, 1]);
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, opacity }}>
              <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 18, fontWeight: 400, color: COLORS.textSecondary, width: 120, textAlign: "right" }}>{r.name}</span>
              <div style={{ flex: 1, height: 12, borderRadius: 6, backgroundColor: "#1C1C1E" }}>
                <div style={{ width: `${barWidth}%`, height: "100%", borderRadius: 6, backgroundColor: COLORS.text }} />
              </div>
              <span style={{ fontFamily: FONT_FAMILY.mono, fontSize: 16, fontWeight: 600, color: COLORS.text, width: 48 }}>{r.level}%</span>
            </div>
          );
        })}
      </div>

      <div style={{ position: "absolute", bottom: 50, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 36, fontWeight: 600, color: COLORS.text,
          opacity: interpolate(frame, [60, 75], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
          Multi-Hazard Drought Monitoring
        </span>
      </div>
    </AbsoluteFill>
  );
};
