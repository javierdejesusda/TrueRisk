import {
  AbsoluteFill,
  Img,
  staticFile,
  useCurrentFrame,
  spring,
  interpolate,
} from "remotion";
import { COLORS, FONT_FAMILY, SPRINGS, VIDEO } from "../../lib/constants";

// Approximate Y positions of the 5 alert cards in the screenshot
const ALERT_CARD_TOPS = [115, 195, 245, 305, 365];

export const Alerts: React.FC = () => {
  const frame = useCurrentFrame();

  // Text entry
  const textScale = spring({
    frame: frame - 20,
    fps: VIDEO.fps,
    config: SPRINGS.snappy,
  });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      {/* Alerts screenshot */}
      <Img
        src={staticFile("demo-alerts.png")}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />

      {/* Red highlight overlays sliding in */}
      {ALERT_CARD_TOPS.map((top, i) => {
        const delay = 15 + i * 6;
        const slideProgress = spring({
          frame: frame - delay,
          fps: VIDEO.fps,
          config: SPRINGS.snappy,
        });
        const translateX = interpolate(slideProgress, [0, 1], [-600, 0]);
        const opacity = interpolate(slideProgress, [0, 1], [0, 0.5]);

        // Pulse once on arrival
        const pulseProgress = spring({
          frame: frame - delay - 15,
          fps: VIDEO.fps,
          config: SPRINGS.bouncy,
        });
        const borderGlow = interpolate(pulseProgress, [0, 0.5, 1], [0, 0.8, 0]);

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 100,
              top,
              width: 700,
              height: 60,
              borderRadius: 8,
              backgroundColor: `rgba(239, 68, 68, ${opacity * 0.15})`,
              borderLeft: `4px solid ${COLORS.danger}`,
              boxShadow: `0 0 ${20 + borderGlow * 20}px rgba(239, 68, 68, ${borderGlow * 0.5})`,
              transform: `translateX(${translateX}px)`,
              pointerEvents: "none",
            }}
          />
        );
      })}

      {/* Typography */}
      <div
        style={{
          position: "absolute",
          top: 40,
          right: 60,
          transform: `scale(${textScale})`,
          transformOrigin: "top right",
        }}
      >
        <span
          style={{
            fontFamily: FONT_FAMILY.sans,
            fontSize: 40,
            fontWeight: 600,
            color: COLORS.text,
            textShadow: "0 2px 20px rgba(0,0,0,0.9)",
          }}
        >
          Real-time AEMET + ML alerts
        </span>
      </div>
    </AbsoluteFill>
  );
};
