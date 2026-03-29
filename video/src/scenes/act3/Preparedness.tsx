import {
  AbsoluteFill,
  Img,
  staticFile,
  useCurrentFrame,
  spring,
  interpolate,
} from "remotion";
import { COLORS, FONT_FAMILY, SPRINGS, VIDEO } from "../../lib/constants";

export const Preparedness: React.FC = () => {
  const frame = useCurrentFrame();

  // 4 checkboxes appearing
  const checkboxes = [0, 1, 2, 3].map((i) => {
    const progress = spring({
      frame: frame - 15 - i * 10,
      fps: VIDEO.fps,
      config: SPRINGS.bouncy,
    });
    return progress;
  });

  // Text slide up
  const textProgress = spring({ frame: frame - 20, fps: VIDEO.fps, config: SPRINGS.snappy });
  const textY = interpolate(textProgress, [0, 1], [40, 0]);
  const textOpacity = interpolate(textProgress, [0, 1], [0, 1]);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      <Img
        src={staticFile("demo-preparedness.png")}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />

      {/* Animated checkboxes overlay */}
      <div
        style={{
          position: "absolute",
          left: 200,
          top: 280,
          display: "flex",
          gap: 30,
        }}
      >
        {checkboxes.map((progress, i) => (
          <div
            key={i}
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              border: `3px solid ${COLORS.accent}`,
              backgroundColor: `rgba(132, 204, 22, ${progress * 0.3})`,
              transform: `scale(${progress})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              style={{ opacity: progress }}
            >
              <path
                d="M4 10l4 4 8-8"
                stroke={COLORS.accent}
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        ))}
      </div>

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
          Gamified readiness
        </span>
      </div>
    </AbsoluteFill>
  );
};
