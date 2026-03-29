import {
  AbsoluteFill,
  Img,
  staticFile,
  useCurrentFrame,
  spring,
  interpolate,
} from "remotion";
import { COLORS, FONT_FAMILY, SPRINGS, VIDEO } from "../../lib/constants";

// Approximate pixel regions on the dashboard screenshot for highlight overlays
const HIGHLIGHTS = [
  { x: 140, y: 20, w: 340, h: 50, color: COLORS.danger, delayFrame: 15 },
  { x: 110, y: 80, w: 200, h: 100, color: COLORS.accent, delayFrame: 60 },
  { x: 320, y: 80, w: 200, h: 100, color: COLORS.accent, delayFrame: 105 },
];

export const Dashboard: React.FC = () => {
  const frame = useCurrentFrame();

  // Slow orbit: rotateY from 12 to 8 over scene
  const rotateY = interpolate(frame, [0, 210], [12, 8], {
    extrapolateRight: "clamp",
  });

  // Text fade in
  const textOpacity = spring({
    frame: frame - 30,
    fps: VIDEO.fps,
    config: SPRINGS.smooth,
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        perspective: 1000,
      }}
    >
      {/* Dashboard card container */}
      <div
        style={{
          position: "relative",
          transform: `rotateY(${rotateY}deg) rotateX(3deg)`,
          width: 1400,
        }}
      >
        {/* Main screenshot */}
        <Img
          src={staticFile("demo-dashboard-valencia.png")}
          style={{
            width: "100%",
            height: "auto",
            borderRadius: 12,
            boxShadow: `0 40px 80px rgba(132, 204, 22, 0.15)`,
          }}
        />

        {/* Highlight overlays */}
        {HIGHLIGHTS.map((h, i) => {
          const glowProgress = spring({
            frame: frame - h.delayFrame,
            fps: VIDEO.fps,
            config: SPRINGS.bouncy,
          });
          const glowOpacity = interpolate(glowProgress, [0, 0.5, 1], [0, 0.6, 0]);

          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: h.x,
                top: h.y,
                width: h.w,
                height: h.h,
                borderRadius: 8,
                boxShadow: `0 0 30px ${h.color}`,
                border: `2px solid ${h.color}`,
                opacity: glowOpacity,
                pointerEvents: "none",
              }}
            />
          );
        })}

        {/* Reflection */}
        <div
          style={{
            marginTop: -4,
            transform: "scaleY(-1)",
            opacity: 0.12,
            filter: "blur(4px)",
            maskImage:
              "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)",
            overflow: "hidden",
            borderRadius: 12,
          }}
        >
          <Img
            src={staticFile("demo-dashboard-valencia.png")}
            style={{ width: "100%", height: "auto" }}
          />
        </div>
      </div>

      {/* Typography */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          left: 80,
          opacity: textOpacity,
        }}
      >
        <span
          style={{
            fontFamily: FONT_FAMILY.sans,
            fontSize: 40,
            fontWeight: 700,
            color: COLORS.text,
            textShadow: "0 2px 20px rgba(0,0,0,0.8)",
          }}
        >
          AI-Powered Risk Intelligence
        </span>
      </div>
    </AbsoluteFill>
  );
};
