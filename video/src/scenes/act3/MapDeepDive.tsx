import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { BrowserFrame } from "../../components/BrowserFrame";
import { COLORS, FONT_FAMILY } from "../../lib/constants";

export const MapDeepDive: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      <BrowserFrame
        src="prod-map.png"
        title="truerisk.cloud — Risk Map"
        tiltX={8}
        tiltY={3}
        oscillationSpeed={0.025}
        oscillationAmplitude={1.8}
        scaleFrom={0.93}
      />
      <div style={{ position: "absolute", bottom: 30, left: 0, right: 0, textAlign: "center" }}>
        <span style={{
          fontFamily: FONT_FAMILY.sans, fontSize: 32, fontWeight: 600, color: COLORS.text,
          opacity: interpolate(frame, [40, 55], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          textShadow: "0 2px 20px rgba(0,0,0,0.9)",
        }}>
          Interactive risk map covering all 52 Spanish provinces in real-time
        </span>
      </div>
    </AbsoluteFill>
  );
};
