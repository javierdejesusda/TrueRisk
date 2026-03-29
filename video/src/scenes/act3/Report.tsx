import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { BrowserFrame } from "../../components/BrowserFrame";
import { COLORS, FONT_FAMILY } from "../../lib/constants";

export const Report: React.FC = () => {
  const frame = useCurrentFrame();
  const textOpacity = interpolate(frame, [40, 55], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      <BrowserFrame src="prod-report.png" title="truerisk.cloud — Climate Risk Report" tiltX={5} tiltY={4} oscillationSpeed={0.026} oscillationAmplitude={1.9} scaleFrom={0.93} />
      <div style={{ position: "absolute", bottom: 50, left: 0, right: 0, textAlign: "center", opacity: textOpacity }}>
        <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 36, fontWeight: 600, color: COLORS.text, textShadow: "0 2px 20px rgba(0,0,0,0.9)" }}>
          Address-Specific Risk Reports
        </span>
      </div>
    </AbsoluteFill>
  );
};
