import { AbsoluteFill, useCurrentFrame, spring, interpolate } from "remotion";
import { COLORS, FONT_FAMILY, VIDEO } from "../../lib/constants";

const SAFE_POINTS = [
  { name: "Parque de Bomberos Madrid Centro", type: "\u{1F692}", distance: "1.4 km", time: "17 min" },
  { name: "Hospital Universitario La Paz", type: "\u{1F3E5}", distance: "7.2 km", time: "86 min" },
  { name: "Cerro del T\u00EDo P\u00EDo \u2014 Zona Alta", type: "\u26F0\uFE0F", distance: "5 km", time: "60 min" },
  { name: "Comisar\u00EDa de Polic\u00EDa Nacional", type: "\u{1F6E1}\uFE0F", distance: "2.1 km", time: "25 min" },
  { name: "Centro de Acogida Municipal", type: "\u{1F3DB}\uFE0F", distance: "3.8 km", time: "46 min" },
];

export const Evacuation: React.FC = () => {
  const frame = useCurrentFrame();

  const titleOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        display: "flex",
        flexDirection: "column",
        padding: "80px 200px",
        gap: 18,
      }}
    >
      <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 48, fontWeight: 700, color: COLORS.text, opacity: titleOpacity, marginBottom: 16 }}>
        Evacuation Routes
      </span>

      {SAFE_POINTS.map((point, i) => {
        const delay = 10 + i * 8;
        const progress = spring({ frame: frame - delay, fps: VIDEO.fps, config: { damping: 20, stiffness: 130 } });
        const translateY = interpolate(progress, [0, 1], [50, 0]);
        const opacity = interpolate(progress, [0, 1], [0, 1]);

        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 24,
              padding: "22px 28px",
              backgroundColor: "#111119",
              borderRadius: 12,
              transform: `translateY(${translateY}px)`,
              opacity,
            }}
          >
            <div style={{ fontSize: 32, width: 48, textAlign: "center" }}>
              {point.type}
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 22, fontWeight: 500, color: COLORS.text }}>
                {point.name}
              </span>
            </div>
            <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
              <span style={{ fontFamily: FONT_FAMILY.mono, fontSize: 28, fontWeight: 700, color: COLORS.text }}>
                {point.distance}
              </span>
              <span style={{ fontFamily: FONT_FAMILY.mono, fontSize: 18, fontWeight: 400, color: COLORS.textSecondary }}>
                {point.time} walking
              </span>
            </div>
          </div>
        );
      })}

      <div style={{ position: "absolute", bottom: 50, left: 0, right: 0, textAlign: "center" }}>
        <span style={{
          fontFamily: FONT_FAMILY.sans, fontSize: 36, fontWeight: 600, color: COLORS.text,
          opacity: interpolate(frame, [50, 65], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}>
          Nearest Safe Points & Routes
        </span>
      </div>
    </AbsoluteFill>
  );
};
