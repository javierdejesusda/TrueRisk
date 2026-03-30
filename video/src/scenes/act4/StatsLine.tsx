import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { COLORS, FONT_FAMILY } from "../../lib/constants";

export const StatsLine: React.FC = () => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [10, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{
        fontFamily: FONT_FAMILY.sans,
        fontSize: 40,
        fontWeight: 300,
        color: COLORS.text,
        opacity,
        letterSpacing: 2,
      }}>
        52 provinces · 8 ML models · 15+ data sources · Real-time
      </span>
    </AbsoluteFill>
  );
};
