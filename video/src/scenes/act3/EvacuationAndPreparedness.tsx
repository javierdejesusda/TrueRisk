import { AbsoluteFill, useCurrentFrame, spring, interpolate } from "remotion";
import { COLORS, FONT_FAMILY, VIDEO } from "../../lib/constants";

const SAFE_POINTS = [
  { name: "Bomberos Madrid Centro", type: "🚒", distance: "1.4 km", time: "17 min" },
  { name: "Hospital Universitario La Paz", type: "🏥", distance: "7.2 km", time: "86 min" },
  { name: "Comisaría Policía Nacional", type: "🛡️", distance: "2.1 km", time: "25 min" },
  { name: "Centro de Acogida Municipal", type: "🏛️", distance: "3.8 km", time: "46 min" },
];

const CATEGORIES = [
  { name: "Emergency Kit", items: 8, completed: 5, icon: "🎒" },
  { name: "Emergency Plan", items: 6, completed: 3, icon: "📋" },
  { name: "Alert Config", items: 5, completed: 4, icon: "🔔" },
  { name: "Community", items: 4, completed: 2, icon: "🤝" },
  { name: "Knowledge", items: 7, completed: 6, icon: "📚" },
];

export const EvacuationAndPreparedness: React.FC = () => {
  const frame = useCurrentFrame();
  const titleOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const scoreProgress = spring({ frame: frame - 5, fps: VIDEO.fps, config: { damping: 30, stiffness: 60 } });
  const score = Math.round(interpolate(scoreProgress, [0, 1], [0, 67]));

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, display: "flex", flexDirection: "column", padding: "36px 60px", gap: 14 }}>
      {/* Header with title and score */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 52, fontWeight: 700, color: COLORS.text, opacity: titleOpacity }}>Safety & Readiness</span>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, opacity: interpolate(frame, [5, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
          <span style={{ fontFamily: FONT_FAMILY.mono, fontSize: 48, fontWeight: 700, color: COLORS.text }}>{score}</span>
          <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 18, color: COLORS.textSecondary }}>/ 100 Preparedness</span>
        </div>
      </div>

      {/* Safe points — full width row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, opacity: interpolate(frame, [8, 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
        {SAFE_POINTS.map((p, i) => {
          const delay = 10 + i * 5;
          const progress = spring({ frame: frame - delay, fps: VIDEO.fps, config: { damping: 20, stiffness: 130 } });
          const opacity = interpolate(progress, [0, 1], [0, 1]);
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px 24px", backgroundColor: "#111119", borderRadius: 12, opacity }}>
              <span style={{ fontSize: 28 }}>{p.type}</span>
              <div style={{ flex: 1 }}>
                <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 20, fontWeight: 500, color: COLORS.text }}>{p.name}</span>
              </div>
              <span style={{ fontFamily: FONT_FAMILY.mono, fontSize: 26, fontWeight: 700, color: COLORS.text }}>{p.distance}</span>
              <span style={{ fontFamily: FONT_FAMILY.mono, fontSize: 15, color: COLORS.textSecondary }}>{p.time}</span>
            </div>
          );
        })}
      </div>

      {/* Preparedness categories — full width */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1, opacity: interpolate(frame, [18, 32], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
        {CATEGORIES.map((cat, i) => {
          const delay = 20 + i * 4;
          const progress = spring({ frame: frame - delay, fps: VIDEO.fps, config: { damping: 22, stiffness: 120 } });
          const opacity = interpolate(progress, [0, 1], [0, 1]);
          const barFill = interpolate(progress, [0, 1], [0, (cat.completed / cat.items) * 100]);
          return (
            <div key={i} style={{ padding: "16px 24px", backgroundColor: "#111119", borderRadius: 12, display: "flex", alignItems: "center", gap: 18, opacity }}>
              <span style={{ fontSize: 26 }}>{cat.icon}</span>
              <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 20, fontWeight: 500, color: COLORS.text, width: 200 }}>{cat.name}</span>
              <div style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: "#1C1C1E" }}>
                <div style={{ width: `${barFill}%`, height: "100%", borderRadius: 4, backgroundColor: COLORS.text }} />
              </div>
              <span style={{ fontFamily: FONT_FAMILY.mono, fontSize: 18, fontWeight: 600, color: COLORS.text, width: 50, textAlign: "right" as const }}>{cat.completed}/{cat.items}</span>
            </div>
          );
        })}
      </div>

      <div style={{ position: "absolute", bottom: 30, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 32, fontWeight: 600, color: COLORS.text, opacity: interpolate(frame, [55, 70], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), textShadow: "0 2px 20px rgba(0,0,0,0.9)" }}>
          Nearest safe points with walking times and gamified emergency checklists
        </span>
      </div>
    </AbsoluteFill>
  );
};
