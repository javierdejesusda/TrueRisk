import {
  AbsoluteFill,
  useCurrentFrame,
  spring,
  interpolate,
} from "remotion";
import { COLORS, FONT_FAMILY, SPRINGS, VIDEO } from "../../lib/constants";

export const LogoClose: React.FC = () => {
  const frame = useCurrentFrame();

  // Logo scale in
  const logoScale = spring({
    frame,
    fps: VIDEO.fps,
    config: SPRINGS.smooth,
  });
  const logoScaleFinal = interpolate(logoScale, [0, 1], [0.9, 1]);

  // Tagline fade
  const taglineOpacity = interpolate(frame, [20, 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // URL fade
  const urlOpacity = interpolate(frame, [35, 45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Final fade to black in last 15 frames
  const fadeToBlack = interpolate(frame, [135, 150], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      {/* Content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          gap: 20,
        }}
      >
        <span
          style={{
            fontFamily: FONT_FAMILY.sans,
            fontSize: 80,
            fontWeight: 700,
            color: COLORS.text,
            transform: `scale(${logoScaleFinal})`,
          }}
        >
          TrueRisk
        </span>
        <span
          style={{
            fontFamily: FONT_FAMILY.sans,
            fontSize: 24,
            fontWeight: 400,
            color: COLORS.textSecondary,
            opacity: taglineOpacity,
          }}
        >
          Climate Emergency Management Platform
        </span>
        <span
          style={{
            fontFamily: FONT_FAMILY.mono,
            fontSize: 20,
            fontWeight: 400,
            color: COLORS.accent,
            opacity: urlOpacity,
          }}
        >
          truerisk.cloud
        </span>
      </div>

      {/* Fade to black overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "black",
          opacity: fadeToBlack,
        }}
      />
    </AbsoluteFill>
  );
};
