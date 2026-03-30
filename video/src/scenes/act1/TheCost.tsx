import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { COLORS, FONT_FAMILY } from "../../lib/constants";

export const TheCost: React.FC = () => {
  const frame = useCurrentFrame();

  // Counter: 0 to 229 over first 40 frames (rapid climb)
  const count = Math.min(Math.round(interpolate(frame, [0, 40], [0, 229], {
    extrapolateRight: "clamp",
  })), 229);

  // "lives lost." fades in after counter reaches 229
  const livesLostOpacity = interpolate(frame, [45, 55], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // "In a single night." fades in after
  const singleNightOpacity = interpolate(frame, [65, 80], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
        <span style={{ fontFamily: FONT_FAMILY.mono, fontSize: 120, fontWeight: 700, color: "#EF4444", display: "inline-block" }}>{count}</span>
        <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 64, fontWeight: 300, color: COLORS.text, opacity: livesLostOpacity }}>lives lost.</span>
      </div>
      <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 64, fontWeight: 300, color: COLORS.text, opacity: singleNightOpacity }}>In a single night.</span>
    </AbsoluteFill>
  );
};
