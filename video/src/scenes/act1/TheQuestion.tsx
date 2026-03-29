import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import { COLORS, FONT_FAMILY } from "../../lib/constants";

export const TheQuestion: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.quad) });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 56, fontWeight: 400, color: COLORS.textSecondary, opacity }}>
        What if they had warning?
      </span>
    </AbsoluteFill>
  );
};
