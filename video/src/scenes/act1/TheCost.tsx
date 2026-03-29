import { AbsoluteFill, useCurrentFrame, spring, interpolate } from "remotion";
import { COLORS, FONT_FAMILY, VIDEO } from "../../lib/constants";

export const TheCost: React.FC = () => {
  const frame = useCurrentFrame();

  const numberScale = spring({ frame, fps: VIDEO.fps, config: { damping: 15, stiffness: 200 } });
  const livesLostOpacity = interpolate(frame, [20, 29], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const singleNightOpacity = interpolate(frame, [35, 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
        <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 120, fontWeight: 700, color: "#EF4444", transform: `scale(${numberScale})`, display: "inline-block" }}>229</span>
        <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 64, fontWeight: 300, color: COLORS.text, opacity: livesLostOpacity }}>lives lost.</span>
      </div>
      <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 64, fontWeight: 300, color: COLORS.text, opacity: singleNightOpacity }}>In a single night.</span>
    </AbsoluteFill>
  );
};
