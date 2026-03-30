import { useCurrentFrame, spring, interpolate } from "remotion";
import { COLORS, FONT_FAMILY, VIDEO } from "../lib/constants";

type StatItemProps = {
  value: string;
  label: string;
  delay?: number;
};

export const StatItem: React.FC<StatItemProps> = ({
  value,
  label,
  delay = 0,
}) => {
  const frame = useCurrentFrame();

  const entryProgress = spring({
    frame: frame - delay,
    fps: VIDEO.fps,
    config: { damping: 25, stiffness: 180 },
  });

  const translateY = interpolate(entryProgress, [0, 1], [60, 0]);
  const opacity = interpolate(entryProgress, [0, 1], [0, 1]);

  return (
    <div
      style={{
        transform: `translateY(${translateY}px)`,
        opacity,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
      }}
    >
      <span
        style={{
          fontFamily: FONT_FAMILY.mono,
          fontSize: 36,
          fontWeight: 700,
          color: COLORS.accent,
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontFamily: FONT_FAMILY.sans,
          fontSize: 28,
          fontWeight: 400,
          color: COLORS.textSecondary,
        }}
      >
        {label}
      </span>
    </div>
  );
};
