import { Img, staticFile, useCurrentFrame, spring, interpolate } from "remotion";
import { VIDEO } from "../lib/constants";

type BrowserFrameProps = {
  src: string;
  title?: string;
  /** Initial rotateX tilt in degrees (default 12) */
  tiltX?: number;
  /** Initial rotateY tilt in degrees (default 0) */
  tiltY?: number;
  /** Oscillation speed multiplier (default 0.02) */
  oscillationSpeed?: number;
  /** Oscillation amplitude in degrees (default 1.5) */
  oscillationAmplitude?: number;
  /** Scale start value (default 0.92) */
  scaleFrom?: number;
};

export const BrowserFrame: React.FC<BrowserFrameProps> = ({
  src,
  title = "TrueRisk",
  tiltX = 12,
  tiltY = 0,
  oscillationSpeed = 0.02,
  oscillationAmplitude = 1.5,
  scaleFrom = 0.92,
}) => {
  const frame = useCurrentFrame();

  // Entry: scale up + tilt settles to 0
  const entryProgress = spring({
    frame,
    fps: VIDEO.fps,
    config: { damping: 22, stiffness: 100 },
  });

  const scale = interpolate(entryProgress, [0, 1], [scaleFrom, 1]);
  const rotateX = interpolate(entryProgress, [0, 1], [tiltX, 0]);
  const rotateY = interpolate(entryProgress, [0, 1], [tiltY, 0]);

  // Subtle continuous oscillation after entry settles
  const osc = frame > 20
    ? Math.sin((frame - 20) * oscillationSpeed) * oscillationAmplitude
    : 0;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        perspective: 1400,
      }}
    >
      <div
        style={{
          width: 1600,
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 40px 100px rgba(0, 0, 0, 0.6), 0 0 1px rgba(255, 255, 255, 0.1)",
          transform: `scale(${scale}) rotateX(${rotateX}deg) rotateY(${rotateY + osc}deg)`,
        }}
      >
        {/* Mac-style title bar */}
        <div
          style={{
            backgroundColor: "#1C1C1E",
            height: 40,
            display: "flex",
            alignItems: "center",
            paddingLeft: 16,
            paddingRight: 16,
            gap: 8,
            borderBottom: "1px solid #2A2A2E",
          }}
        >
          <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#FF5F57" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#FEBC2E" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#28C840" }} />
          <div
            style={{
              flex: 1,
              textAlign: "center",
              fontFamily: "Geist Sans",
              fontSize: 13,
              fontWeight: 400,
              color: "#888888",
              letterSpacing: 0.3,
            }}
          >
            {title}
          </div>
          <div style={{ width: 52 }} />
        </div>

        {/* Screenshot content */}
        <Img
          src={staticFile(src)}
          style={{
            width: "100%",
            height: "auto",
            display: "block",
          }}
        />
      </div>
    </div>
  );
};
