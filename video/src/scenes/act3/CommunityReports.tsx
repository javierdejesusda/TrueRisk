import { AbsoluteFill, useCurrentFrame, spring, interpolate } from "remotion";
import { COLORS, FONT_FAMILY, VIDEO } from "../../lib/constants";

const REPORTS = [
  { type: "🌊 Flood", location: "Calle Mayor, Valencia", time: "2 min ago", severity: "High" },
  { type: "🌳 Fallen tree", location: "Av. de la Constitución, Sevilla", time: "8 min ago", severity: "Medium" },
  { type: "💨 Strong winds", location: "Pº de Gracia, Barcelona", time: "15 min ago", severity: "High" },
  { type: "🔥 Smoke", location: "Sierra de Guadarrama, Madrid", time: "23 min ago", severity: "Medium" },
  { type: "🌊 Road flooded", location: "CV-35, Paterna", time: "31 min ago", severity: "High" },
];

export const CommunityReports: React.FC = () => {
  const frame = useCurrentFrame();

  const titleOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, display: "flex", flexDirection: "column", padding: "60px 200px", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 48, fontWeight: 700, color: COLORS.text, opacity: titleOpacity }}>
          Community Reports
        </span>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          opacity: interpolate(frame, [8, 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#22C55E" }} />
          <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 16, fontWeight: 500, color: COLORS.textSecondary }}>Live</span>
        </div>
      </div>

      {REPORTS.map((r, i) => {
        const delay = 10 + i * 7;
        const progress = spring({ frame: frame - delay, fps: VIDEO.fps, config: { damping: 20, stiffness: 130 } });
        const translateY = interpolate(progress, [0, 1], [40, 0]);
        const opacity = interpolate(progress, [0, 1], [0, 1]);
        return (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 20, padding: "20px 24px",
            backgroundColor: "#111119", borderRadius: 12,
            transform: `translateY(${translateY}px)`, opacity,
          }}>
            <span style={{ fontSize: 24, width: 120, fontFamily: FONT_FAMILY.sans, fontWeight: 500, color: COLORS.text }}>{r.type}</span>
            <div style={{ flex: 1 }}>
              <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 18, fontWeight: 400, color: COLORS.textSecondary }}>{r.location}</span>
            </div>
            <span style={{ fontFamily: FONT_FAMILY.mono, fontSize: 14, fontWeight: 400, color: COLORS.textSecondary, width: 80, textAlign: "right" as const }}>{r.time}</span>
            <div style={{
              padding: "4px 14px", borderRadius: 6,
              backgroundColor: r.severity === "High" ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.08)",
              border: `1px solid ${r.severity === "High" ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.12)"}`,
            }}>
              <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 13, fontWeight: 600, color: COLORS.text }}>{r.severity}</span>
            </div>
          </div>
        );
      })}

      <div style={{ position: "absolute", bottom: 50, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 36, fontWeight: 600, color: COLORS.text,
          opacity: interpolate(frame, [55, 70], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
          Citizen-Powered Hazard Reports
        </span>
      </div>
    </AbsoluteFill>
  );
};
