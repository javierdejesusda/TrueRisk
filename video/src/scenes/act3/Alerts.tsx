import { AbsoluteFill, useCurrentFrame, spring, interpolate } from "remotion";
import { COLORS, FONT_FAMILY, VIDEO } from "../../lib/constants";

const ALERTS = [
  { level: "Naranja", tag: "orange", text: "Aviso de vientos de nivel naranja. Pirineo oscense", source: "AEMET" },
  { level: "Naranja", tag: "orange", text: "Aviso de costeros de nivel naranja. Costa - Ampurdán", source: "AEMET" },
  { level: "Amarillo", tag: "yellow", text: "Aviso de vientos de nivel amarillo. Sierra de Madrid", source: "AEMET" },
  { level: "Amarillo", tag: "yellow", text: "Aviso de polvo en suspensión. Norte de Gran Canaria", source: "AEMET" },
  { level: "Naranja", tag: "orange", text: "Aviso de vientos de nivel naranja. Interior norte de Castellón", source: "AEMET" },
];

const TAG_COLORS: Record<string, string> = {
  orange: "#F97316",
  yellow: "#EAB308",
};

export const Alerts: React.FC = () => {
  const frame = useCurrentFrame();

  const titleOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const countOpacity = interpolate(frame, [10, 25], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        display: "flex",
        flexDirection: "column",
        padding: "80px 200px",
        gap: 20,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
        <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 48, fontWeight: 700, color: COLORS.text, opacity: titleOpacity }}>
          Active Alerts
        </span>
        <span style={{ fontFamily: FONT_FAMILY.mono, fontSize: 24, fontWeight: 400, color: COLORS.textSecondary, opacity: countOpacity }}>
          145 active
        </span>
      </div>

      {ALERTS.map((alert, i) => {
        const delay = 12 + i * 7;
        const progress = spring({ frame: frame - delay, fps: VIDEO.fps, config: { damping: 22, stiffness: 120 } });
        const translateX = interpolate(progress, [0, 1], [80, 0]);
        const opacity = interpolate(progress, [0, 1], [0, 1]);

        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              padding: "24px 28px",
              backgroundColor: "#111119",
              borderRadius: 12,
              borderLeft: `4px solid ${TAG_COLORS[alert.tag]}`,
              transform: `translateX(${translateX}px)`,
              opacity,
            }}
          >
            <div
              style={{
                padding: "4px 14px",
                borderRadius: 6,
                backgroundColor: TAG_COLORS[alert.tag],
                fontFamily: FONT_FAMILY.sans,
                fontSize: 14,
                fontWeight: 600,
                color: "#000",
                whiteSpace: "nowrap",
              }}
            >
              {alert.level}
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 22, fontWeight: 500, color: COLORS.text }}>
                {alert.text}
              </span>
            </div>
            <span style={{ fontFamily: FONT_FAMILY.mono, fontSize: 14, fontWeight: 400, color: COLORS.textSecondary }}>
              {alert.source}
            </span>
          </div>
        );
      })}

      <div style={{ position: "absolute", bottom: 50, left: 0, right: 0, textAlign: "center" }}>
        <span style={{
          fontFamily: FONT_FAMILY.sans, fontSize: 36, fontWeight: 600, color: COLORS.text,
          opacity: interpolate(frame, [50, 65], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}>
          Real-time AEMET Alerts
        </span>
      </div>
    </AbsoluteFill>
  );
};
