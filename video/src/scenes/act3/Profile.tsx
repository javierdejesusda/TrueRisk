import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { BrowserFrame } from "../../components/BrowserFrame";
import { COLORS, FONT_FAMILY } from "../../lib/constants";

export const Profile: React.FC = () => {
  const frame = useCurrentFrame();
  const textOpacity = interpolate(frame, [40, 55], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      <BrowserFrame src="prod-profile.png" title="truerisk.cloud — Profile" tiltX={13} tiltY={-3} oscillationSpeed={0.019} oscillationAmplitude={1.1} scaleFrom={0.87} />
      <div style={{ position: "absolute", bottom: 50, left: 0, right: 0, textAlign: "center", opacity: textOpacity }}>
        <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 36, fontWeight: 600, color: COLORS.text, textShadow: "0 2px 20px rgba(0,0,0,0.9)" }}>
          Risk Score Based on Your Profile
        </span>
      </div>
    </AbsoluteFill>
  );
};
