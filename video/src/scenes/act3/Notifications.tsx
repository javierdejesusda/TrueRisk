import {
  AbsoluteFill,
  useCurrentFrame,
  spring,
  interpolate,
} from "remotion";
import { COLORS, FONT_FAMILY, VIDEO } from "../../lib/constants";

const CHANNELS = [
  { name: "SMS", icon: "💬" },
  { name: "WhatsApp", icon: "📱" },
  { name: "Telegram", icon: "✈️" },
  { name: "Email", icon: "📧" },
];

export const Notifications: React.FC = () => {
  const frame = useCurrentFrame();

  const titleOpacity = interpolate(frame, [5, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 48,
      }}
    >
      <span
        style={{
          fontFamily: FONT_FAMILY.sans,
          fontSize: 44,
          fontWeight: 600,
          color: COLORS.text,
          opacity: titleOpacity,
        }}
      >
        Alerts on Every Channel
      </span>

      <div
        style={{
          display: "flex",
          gap: 60,
          alignItems: "center",
        }}
      >
        {CHANNELS.map((channel, i) => {
          const delay = 15 + i * 8;
          const entryProgress = spring({
            frame: frame - delay,
            fps: VIDEO.fps,
            config: { damping: 18, stiffness: 140 },
          });
          const translateY = interpolate(entryProgress, [0, 1], [40, 0]);
          const opacity = interpolate(entryProgress, [0, 1], [0, 1]);

          return (
            <div
              key={channel.name}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 16,
                transform: `translateY(${translateY}px)`,
                opacity,
              }}
            >
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 20,
                  backgroundColor: "#1C1C1E",
                  border: "1px solid #2A2A2E",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 36,
                }}
              >
                {channel.icon}
              </div>
              <span
                style={{
                  fontFamily: FONT_FAMILY.sans,
                  fontSize: 24,
                  fontWeight: 500,
                  color: COLORS.textSecondary,
                }}
              >
                {channel.name}
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
