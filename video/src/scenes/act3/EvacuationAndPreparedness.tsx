import { AbsoluteFill, useCurrentFrame, spring, interpolate } from "remotion";
import { COLORS, FONT_FAMILY, VIDEO } from "../../lib/constants";

const SAFE_POINTS = [
  { name: "Bomberos Madrid Centro", type: "🚒", distance: "1.4 km", time: "17 min" },
  { name: "Hospital La Paz", type: "🏥", distance: "7.2 km", time: "86 min" },
  { name: "Comisaría Policía Nacional", type: "🛡️", distance: "2.1 km", time: "25 min" },
  { name: "Centro Acogida Municipal", type: "🏛️", distance: "3.8 km", time: "46 min" },
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
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, display: "flex", flexDirection: "column", padding: "50px 100px", gap: 18 }}>
      <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 44, fontWeight: 700, color: COLORS.text, opacity: titleOpacity }}>
        Safety & Readiness
      </span>

      <div style={{ display: "flex", gap: 24, flex: 1 }}>
        {/* Left: Evacuation */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12,
          opacity: interpolate(frame, [5, 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}>
          <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 18, fontWeight: 600, color: COLORS.textSecondary }}>Nearest Safe Points</span>
          {SAFE_POINTS.map((p, i) => {
            const delay = 8 + i * 6;
            const progress = spring({ frame: frame - delay, fps: VIDEO.fps, config: { damping: 20, stiffness: 130 } });
            const translateY = interpolate(progress, [0, 1], [30, 0]);
            const opacity = interpolate(progress, [0, 1], [0, 1]);
            return (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 14, padding: "14px 18px",
                backgroundColor: "#111119", borderRadius: 10,
                transform: `translateY(${translateY}px)`, opacity,
              }}>
                <span style={{ fontSize: 22 }}>{p.type}</span>
                <div style={{ flex: 1 }}>
                  <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 16, fontWeight: 500, color: COLORS.text }}>{p.name}</span>
                </div>
                <span style={{ fontFamily: FONT_FAMILY.mono, fontSize: 20, fontWeight: 700, color: COLORS.text }}>{p.distance}</span>
                <span style={{ fontFamily: FONT_FAMILY.mono, fontSize: 13, color: COLORS.textSecondary }}>{p.time}</span>
              </div>
            );
          })}
        </div>

        <div style={{ width: 1, backgroundColor: "#1C1C1E" }} />

        {/* Right: Preparedness */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12,
          opacity: interpolate(frame, [10, 25], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 18, fontWeight: 600, color: COLORS.textSecondary }}>Preparedness</span>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontFamily: FONT_FAMILY.mono, fontSize: 36, fontWeight: 700, color: COLORS.text }}>{score}</span>
              <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 14, color: COLORS.textSecondary }}>/ 100</span>
            </div>
          </div>
          {CATEGORIES.map((cat, i) => {
            const delay = 14 + i * 5;
            const progress = spring({ frame: frame - delay, fps: VIDEO.fps, config: { damping: 22, stiffness: 120 } });
            const opacity = interpolate(progress, [0, 1], [0, 1]);
            const barFill = interpolate(progress, [0, 1], [0, (cat.completed / cat.items) * 100]);
            return (
              <div key={i} style={{
                padding: "12px 16px", backgroundColor: "#111119", borderRadius: 10,
                display: "flex", alignItems: "center", gap: 14, opacity,
              }}>
                <span style={{ fontSize: 20 }}>{cat.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 15, fontWeight: 500, color: COLORS.text }}>{cat.name}</span>
                    <span style={{ fontFamily: FONT_FAMILY.mono, fontSize: 13, color: COLORS.textSecondary }}>{cat.completed}/{cat.items}</span>
                  </div>
                  <div style={{ height: 5, borderRadius: 3, backgroundColor: "#1C1C1E" }}>
                    <div style={{ width: `${barFill}%`, height: "100%", borderRadius: 3, backgroundColor: COLORS.text }} />
                  </div>
                </div>
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
          Safety & Readiness
        </span>
      </div>
    </AbsoluteFill>
  );
};
