import { useCurrentFrame, interpolate, Easing } from "remotion";
import { COLORS } from "../lib/constants";

type RadarPingProps = {
  ringCount?: number;
  staggerFrames?: number;
  loopFrames?: number;
  maxScale?: number;
  color?: string;
  strokeWidth?: number;
  size?: number;
};

export const RadarPing: React.FC<RadarPingProps> = ({
  ringCount = 3,
  staggerFrames = 10,
  loopFrames = 30,
  maxScale = 3,
  color = COLORS.danger,
  strokeWidth = 2,
  size = 40,
}) => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        position: "relative",
        width: size * maxScale,
        height: size * maxScale,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {Array.from({ length: ringCount }).map((_, i) => {
        const ringFrame = (frame - i * staggerFrames) % loopFrames;
        const progress = Math.max(0, ringFrame) / loopFrames;

        const scale = interpolate(progress, [0, 1], [0, maxScale], {
          easing: Easing.out(Easing.quad),
        });
        const opacity = interpolate(progress, [0, 0.2, 1], [0, 0.8, 0], {
          extrapolateRight: "clamp",
        });

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              width: size,
              height: size,
              borderRadius: "50%",
              border: `${strokeWidth}px solid ${color}`,
              transform: `scale(${scale})`,
              opacity,
            }}
          />
        );
      })}
    </div>
  );
};
