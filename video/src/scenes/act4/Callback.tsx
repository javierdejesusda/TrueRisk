import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { COLORS, FONT_FAMILY } from "../../lib/constants";

const WORDS = ["What", "if", "they", "had", "TrueRisk?"];

export const Callback: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
        {WORDS.map((word, i) => {
          // Each word appears after a delay — black pause first (30 frames), then words stagger
          const delay = 30 + i * 12;
          const opacity = interpolate(frame, [delay, delay + 10], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const translateY = interpolate(frame, [delay, delay + 10], [8, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          const isLast = i === WORDS.length - 1;

          return (
            <span
              key={i}
              style={{
                fontFamily: FONT_FAMILY.sans,
                fontSize: 56,
                fontWeight: isLast ? 700 : 400,
                color: isLast ? COLORS.text : COLORS.textSecondary,
                opacity,
                transform: `translateY(${translateY}px)`,
                display: "inline-block",
              }}
            >
              {word}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
