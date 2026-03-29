import { AbsoluteFill } from "remotion";
import { GlowDot } from "../../components/GlowDot";
import { COLORS } from "../../lib/constants";

export const Heartbeat: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <GlowDot pulseFrames={[10, 40]} color={COLORS.accent} baseSize={8} />
    </AbsoluteFill>
  );
};
