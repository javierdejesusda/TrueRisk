import { AbsoluteFill, useCurrentFrame, spring, interpolate } from "remotion";
import { COLORS, FONT_FAMILY, VIDEO } from "../../lib/constants";

const CATEGORIES = [
  { name: "Emergency Kit", items: 8, completed: 5, icon: "🎒" },
  { name: "Emergency Plan", items: 6, completed: 3, icon: "📋" },
  { name: "Alert Configuration", items: 5, completed: 4, icon: "🔔" },
  { name: "Community", items: 4, completed: 2, icon: "🤝" },
  { name: "Knowledge", items: 7, completed: 6, icon: "📚" },
];

export const Preparedness: React.FC = () => {
  const frame = useCurrentFrame();

  const titleOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  // Overall score counter
  const scoreProgress = spring({ frame: frame - 5, fps: VIDEO.fps, config: { damping: 30, stiffness: 60 } });
  const score = Math.round(interpolate(scoreProgress, [0, 1], [0, 67]));

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, display: "flex", flexDirection: "column", padding: "60px 200px", gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 48, fontWeight: 700, color: COLORS.text, opacity: titleOpacity }}>
          Preparedness
        </span>
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          opacity: interpolate(frame, [5, 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}>
          <span style={{ fontFamily: FONT_FAMILY.mono, fontSize: 56, fontWeight: 700, color: COLORS.text }}>{score}</span>
          <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 16, fontWeight: 400, color: COLORS.textSecondary }}>/ 100 Score</span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {CATEGORIES.map((cat, i) => {
          const delay = 12 + i * 7;
          const progress = spring({ frame: frame - delay, fps: VIDEO.fps, config: { damping: 22, stiffness: 120 } });
          const opacity = interpolate(progress, [0, 1], [0, 1]);
          const translateX = interpolate(progress, [0, 1], [50, 0]);
          const barFill = interpolate(progress, [0, 1], [0, (cat.completed / cat.items) * 100]);

          return (
            <div key={i} style={{
              padding: "20px 28px", backgroundColor: "#111119", borderRadius: 12,
              display: "flex", alignItems: "center", gap: 20,
              transform: `translateX(${translateX}px)`, opacity,
            }}>
              <span style={{ fontSize: 28, width: 40, textAlign: "center" as const }}>{cat.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 20, fontWeight: 500, color: COLORS.text }}>{cat.name}</span>
                  <span style={{ fontFamily: FONT_FAMILY.mono, fontSize: 16, fontWeight: 400, color: COLORS.textSecondary }}>{cat.completed}/{cat.items}</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, backgroundColor: "#1C1C1E" }}>
                  <div style={{ width: `${barFill}%`, height: "100%", borderRadius: 3, backgroundColor: COLORS.text }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ position: "absolute", bottom: 50, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 36, fontWeight: 600, color: COLORS.text,
          opacity: interpolate(frame, [55, 70], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
          Gamified Emergency Readiness
        </span>
      </div>
    </AbsoluteFill>
  );
};
