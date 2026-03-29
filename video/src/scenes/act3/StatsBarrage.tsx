import { AbsoluteFill, useCurrentFrame, spring, interpolate } from "remotion";
import { StatItem } from "../../components/StatItem";
import { COLORS, VIDEO } from "../../lib/constants";

const STATS = [
  { value: "15+", label: "Data Sources" },
  { value: "89%", label: "Accuracy" },
  { value: "7", label: "Hazard Models" },
  { value: "52", label: "Provinces" },
  { value: "Real-time", label: "Alerts" },
  { value: "PDF", label: "Reports" },
];

export const StatsBarrage: React.FC = () => {
  const frame = useCurrentFrame();

  // Unified pulse after all stats land (at frame ~50)
  const pulseProgress = spring({
    frame: frame - 55,
    fps: VIDEO.fps,
    config: { damping: 200 },
  });
  const groupScale = 1 + interpolate(pulseProgress, [0, 0.5, 1], [0, 0.01, 0]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 280px)",
          gap: "48px 120px",
          transform: `scale(${groupScale})`,
        }}
      >
        {STATS.map((stat, i) => (
          <StatItem
            key={stat.label}
            value={stat.value}
            label={stat.label}
            delay={10 + i * 5}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};
