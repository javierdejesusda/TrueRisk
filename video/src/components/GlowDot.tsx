import { useCurrentFrame, spring, interpolate } from "remotion";
import { COLORS, SPRINGS, VIDEO } from "../lib/constants";

type GlowDotProps = {
  pulseFrames?: number[];
  color?: string;
  baseSize?: number;
};

export const GlowDot: React.FC<GlowDotProps> = ({
  pulseFrames = [0, 30],
  color = COLORS.accent,
  baseSize = 8,
}) => {
  const frame = useCurrentFrame();

  let totalScale = 1;
  let glowOpacity = 0.1;
  let glowSize = 50;

  for (let i = 0; i < pulseFrames.length; i++) {
    const pulseStart = pulseFrames[i];
    if (frame >= pulseStart) {
      const pulseProgress = spring({
        frame: frame - pulseStart,
        fps: VIDEO.fps,
        config: SPRINGS.bouncy,
      });
      const targetScale = 1 + (i + 1) * 0.5;
      totalScale = interpolate(pulseProgress, [0, 1], [1, targetScale]);
      glowOpacity = interpolate(pulseProgress, [0, 0.5, 1], [0, 0.3 + i * 0.2, 0.1 + i * 0.1]);
      glowSize = interpolate(pulseProgress, [0, 1], [50, 100 + i * 75]);
    }
  }

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: glowSize,
          height: glowSize,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
          opacity: glowOpacity,
        }}
      />
      <div
        style={{
          width: baseSize,
          height: baseSize,
          borderRadius: "50%",
          backgroundColor: color,
          transform: `scale(${totalScale})`,
        }}
      />
    </div>
  );
};
