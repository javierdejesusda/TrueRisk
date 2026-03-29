import { AbsoluteFill, useCurrentFrame, spring, interpolate } from "remotion";
import { COLORS, FONT_FAMILY, VIDEO } from "../../lib/constants";

const FIELDS = [
  { label: "Construction Year", value: "1975" },
  { label: "Materials", value: "Concrete + Brick" },
  { label: "Floors", value: "7" },
  { label: "Has Basement", value: "Yes" },
  { label: "Has Elevator", value: "Yes" },
  { label: "Medical Dependencies", value: "Electricity-dependent" },
];

const CONDITIONS = ["Poor", "Fair", "Average", "Good", "Excellent"];

export const Profile: React.FC = () => {
  const frame = useCurrentFrame();

  const titleOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const subtitleOpacity = interpolate(frame, [10, 25], [0, 1], { extrapolateRight: "clamp" });

  // Building condition bar fills in
  const conditionProgress = spring({ frame: frame - 30, fps: VIDEO.fps, config: { damping: 30, stiffness: 80 } });
  const conditionFill = interpolate(conditionProgress, [0, 1], [0, 60]); // 60% = "Average-Good"

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        display: "flex",
        flexDirection: "column",
        padding: "80px 240px",
        gap: 24,
      }}
    >
      <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 48, fontWeight: 700, color: COLORS.text, opacity: titleOpacity }}>
        Building Profile
      </span>
      <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 22, fontWeight: 400, color: COLORS.textSecondary, opacity: subtitleOpacity, marginBottom: 8 }}>
        Your risk score adapts to your specific situation
      </span>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {FIELDS.map((field, i) => {
          const delay = 15 + i * 6;
          const progress = spring({ frame: frame - delay, fps: VIDEO.fps, config: { damping: 22, stiffness: 140 } });
          const opacity = interpolate(progress, [0, 1], [0, 1]);
          const translateY = interpolate(progress, [0, 1], [30, 0]);

          return (
            <div
              key={i}
              style={{
                padding: "18px 24px",
                backgroundColor: "#111119",
                borderRadius: 10,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                transform: `translateY(${translateY}px)`,
                opacity,
              }}
            >
              <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 18, fontWeight: 400, color: COLORS.textSecondary }}>
                {field.label}
              </span>
              <span style={{ fontFamily: FONT_FAMILY.mono, fontSize: 20, fontWeight: 600, color: COLORS.text }}>
                {field.value}
              </span>
            </div>
          );
        })}
      </div>

      {/* Building condition bar */}
      <div style={{
        marginTop: 12,
        opacity: interpolate(frame, [45, 55], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}>
        <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 18, fontWeight: 500, color: COLORS.textSecondary, marginBottom: 8, display: "block" }}>
          Building Condition
        </span>
        <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <div
              key={n}
              style={{
                flex: 1,
                height: 8,
                borderRadius: 4,
                backgroundColor: n <= 3 ? COLORS.text : "#1C1C1E",
              }}
            />
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          {CONDITIONS.map((c) => (
            <span key={c} style={{ fontFamily: FONT_FAMILY.sans, fontSize: 13, color: COLORS.textSecondary }}>
              {c}
            </span>
          ))}
        </div>
      </div>

      <div style={{ position: "absolute", bottom: 50, left: 0, right: 0, textAlign: "center" }}>
        <span style={{
          fontFamily: FONT_FAMILY.sans, fontSize: 36, fontWeight: 600, color: COLORS.text,
          opacity: interpolate(frame, [55, 70], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}>
          Risk Score Based on Your Profile
        </span>
      </div>
    </AbsoluteFill>
  );
};
