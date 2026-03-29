import { AbsoluteFill, useCurrentFrame, spring, interpolate } from "remotion";
import { BrowserFrame } from "../../components/BrowserFrame";
import { COLORS, FONT_FAMILY, VIDEO } from "../../lib/constants";

export const Dashboard: React.FC = () => {
  const frame = useCurrentFrame();
  const textOpacity = interpolate(frame, [40, 55], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      <BrowserFrame src="prod-dashboard.png" title="truerisk.cloud — Dashboard" tiltX={10} tiltY={-3} oscillationSpeed={0.018} oscillationAmplitude={1.2} scaleFrom={0.9} />
      <div style={{
        position: "absolute", bottom: 50, left: 0, right: 0, textAlign: "center",
        opacity: textOpacity,
      }}>
        <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 36, fontWeight: 600, color: COLORS.text, textShadow: "0 2px 20px rgba(0,0,0,0.9)" }}>
          Real-time Risk Dashboard
        </span>
      </div>
    </AbsoluteFill>
  );
};
