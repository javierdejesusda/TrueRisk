import {
  AbsoluteFill,
  Img,
  staticFile,
  useCurrentFrame,
  spring,
  interpolate,
} from "remotion";
import { COLORS, FONT_FAMILY, SPRINGS, VIDEO } from "../../lib/constants";

export const Emergency: React.FC = () => {
  const frame = useCurrentFrame();

  // Button pulse twice
  const pulse1 = spring({ frame: frame - 15, fps: VIDEO.fps, config: SPRINGS.bouncy });
  const pulse2 = spring({ frame: frame - 45, fps: VIDEO.fps, config: SPRINGS.bouncy });
  const pulseScale = 1 + interpolate(pulse1, [0, 1], [0, 0.08]) + interpolate(pulse2, [0, 1], [0, 0.08]);

  // Text slide up
  const textProgress = spring({ frame: frame - 20, fps: VIDEO.fps, config: SPRINGS.snappy });
  const textY = interpolate(textProgress, [0, 1], [40, 0]);
  const textOpacity = interpolate(textProgress, [0, 1], [0, 1]);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      <Img
        src={staticFile("demo-emergency.png")}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      {/* Pulse overlay on 112 button area */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 175,
          transform: `translateX(-50%) scale(${pulseScale})`,
          width: 220,
          height: 60,
          borderRadius: 30,
          boxShadow: `0 0 40px rgba(239, 68, 68, ${0.3 * (pulseScale - 1) * 12})`,
          pointerEvents: "none",
        }}
      />
      {/* Typography */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          left: 0,
          right: 0,
          textAlign: "center",
          transform: `translateY(${textY}px)`,
          opacity: textOpacity,
        }}
      >
        <span
          style={{
            fontFamily: FONT_FAMILY.sans,
            fontSize: 44,
            fontWeight: 700,
            color: COLORS.text,
            textShadow: "0 2px 20px rgba(0,0,0,0.9)",
          }}
        >
          One tap to safety
        </span>
      </div>
    </AbsoluteFill>
  );
};
