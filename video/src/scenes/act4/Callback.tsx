import {
  AbsoluteFill,
  useCurrentFrame,
  spring,
  interpolate,
} from "remotion";
import { COLORS, FONT_FAMILY, VIDEO } from "../../lib/constants";

export const Callback: React.FC = () => {
  const frame = useCurrentFrame();

  // "What if they had" fades in
  const prefixOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  // "TrueRisk?" springs in after
  const nameProgress = spring({
    frame: frame - 25,
    fps: VIDEO.fps,
    config: { damping: 15 },
  });

  // "?" pulse 1 second after appearing
  const questionPulse = spring({
    frame: frame - 55,
    fps: VIDEO.fps,
    config: { damping: 8 },
  });
  const questionScale = 1 + interpolate(questionPulse, [0, 0.5, 1], [0, 0.15, 0]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
        <span
          style={{
            fontFamily: FONT_FAMILY.sans,
            fontSize: 56,
            fontWeight: 400,
            color: COLORS.textSecondary,
            opacity: prefixOpacity,
          }}
        >
          What if they had{" "}
        </span>
        <span
          style={{
            fontFamily: FONT_FAMILY.sans,
            fontSize: 56,
            fontWeight: 700,
            color: COLORS.text,
            opacity: nameProgress,
            transform: `scale(${nameProgress})`,
            display: "inline-block",
          }}
        >
          TrueRisk
        </span>
        <span
          style={{
            fontFamily: FONT_FAMILY.sans,
            fontSize: 56,
            fontWeight: 700,
            color: COLORS.text,
            opacity: nameProgress,
            transform: `scale(${questionScale})`,
            display: "inline-block",
            transformOrigin: "bottom center",
          }}
        >
          ?
        </span>
      </div>
    </AbsoluteFill>
  );
};
