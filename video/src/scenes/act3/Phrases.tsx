import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { BrowserFrame } from "../../components/BrowserFrame";
import { COLORS, FONT_FAMILY } from "../../lib/constants";

export const Phrases: React.FC = () => {
  const frame = useCurrentFrame();
  const textOpacity = interpolate(frame, [40, 55], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      <BrowserFrame src="prod-phrases.png" title="truerisk.cloud — Emergency Phrases" tiltX={10} tiltY={-2} oscillationSpeed={0.021} oscillationAmplitude={1.5} scaleFrom={0.91} />
      <div style={{ position: "absolute", bottom: 50, left: 0, right: 0, textAlign: "center", opacity: textOpacity }}>
        <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 36, fontWeight: 600, color: COLORS.text, textShadow: "0 2px 20px rgba(0,0,0,0.9)" }}>
          Emergency Phrases in 12 Languages
        </span>
      </div>
    </AbsoluteFill>
  );
};
