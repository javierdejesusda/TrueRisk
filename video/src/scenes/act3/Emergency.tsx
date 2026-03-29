import { AbsoluteFill, useCurrentFrame, spring, interpolate } from "remotion";
import { COLORS, FONT_FAMILY, VIDEO } from "../../lib/constants";

const CONTACTS = [
  { name: "Protección Civil", phone: "955 373 100" },
  { name: "Bomberos", phone: "954 802 222" },
  { name: "Policía Local", phone: "092" },
  { name: "Hospital", phone: "913 368 000" },
];

const FIRST_AID = ["CPR", "Burns", "Choking", "Drowning", "Fractures"];

export const Emergency: React.FC = () => {
  const frame = useCurrentFrame();

  const titleOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  // 112 button pulse
  const pulseProgress = spring({ frame: frame - 10, fps: VIDEO.fps, config: { damping: 8 } });
  const buttonScale = 1 + interpolate(pulseProgress, [0, 0.5, 1], [0, 0.06, 0]);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 200px", gap: 28 }}>
      <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 48, fontWeight: 700, color: COLORS.text, opacity: titleOpacity }}>
        Emergencies
      </span>

      {/* 112 Button */}
      <div style={{
        padding: "18px 80px", borderRadius: 40, backgroundColor: "#DC2626",
        transform: `scale(${buttonScale})`,
        display: "flex", alignItems: "center", gap: 16,
        opacity: interpolate(frame, [5, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}>
        <span style={{ fontSize: 28 }}>📞</span>
        <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 32, fontWeight: 700, color: "#FFF" }}>Call 112</span>
      </div>

      {/* Emergency contacts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, width: "100%", maxWidth: 1000 }}>
        {CONTACTS.map((c, i) => {
          const delay = 18 + i * 6;
          const progress = spring({ frame: frame - delay, fps: VIDEO.fps, config: { damping: 22, stiffness: 130 } });
          const opacity = interpolate(progress, [0, 1], [0, 1]);
          const translateY = interpolate(progress, [0, 1], [30, 0]);
          return (
            <div key={i} style={{
              padding: "18px 24px", backgroundColor: "#111119", borderRadius: 10,
              display: "flex", justifyContent: "space-between", alignItems: "center",
              transform: `translateY(${translateY}px)`, opacity,
            }}>
              <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 20, fontWeight: 400, color: COLORS.textSecondary }}>{c.name}</span>
              <span style={{ fontFamily: FONT_FAMILY.mono, fontSize: 22, fontWeight: 600, color: COLORS.text }}>{c.phone}</span>
            </div>
          );
        })}
      </div>

      {/* First aid tags */}
      <div style={{
        display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center",
        opacity: interpolate(frame, [45, 58], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}>
        <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 16, fontWeight: 500, color: COLORS.textSecondary, marginRight: 8 }}>First Aid Guide:</span>
        {FIRST_AID.map((aid) => (
          <div key={aid} style={{ padding: "6px 16px", borderRadius: 20, backgroundColor: "#1C1C1E", border: "1px solid #2A2A2E" }}>
            <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 16, fontWeight: 500, color: COLORS.text }}>{aid}</span>
          </div>
        ))}
      </div>

      <div style={{ position: "absolute", bottom: 50, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 36, fontWeight: 600, color: COLORS.text,
          opacity: interpolate(frame, [55, 70], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
          One Tap to Safety
        </span>
      </div>
    </AbsoluteFill>
  );
};
