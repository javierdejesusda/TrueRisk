import { AbsoluteFill, useCurrentFrame, spring, interpolate } from "remotion";
import { COLORS, FONT_FAMILY, VIDEO } from "../../lib/constants";

const CONTACTS = [
  { name: "Protección Civil", phone: "955 373 100" },
  { name: "Bomberos", phone: "954 802 222" },
  { name: "Policía Local", phone: "092" },
  { name: "Hospital", phone: "913 368 000" },
];

const AI_RESPONSE = "Based on current wind conditions in your province (78 km/h gusts), I recommend staying indoors and away from windows. Secure loose outdoor objects. If you must travel, avoid elevated roads and bridges.";

export const EmergencyAndAI: React.FC = () => {
  const frame = useCurrentFrame();
  const titleOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const pulseProgress = spring({ frame: frame - 10, fps: VIDEO.fps, config: { damping: 8 } });
  const buttonScale = 1 + interpolate(pulseProgress, [0, 0.5, 1], [0, 0.05, 0]);

  const aiFrame = Math.max(0, frame - 50);
  const charsToShow = Math.min(Math.floor(aiFrame * 2.5), AI_RESPONSE.length);
  const displayedResponse = AI_RESPONSE.slice(0, charsToShow);
  const isTyping = charsToShow < AI_RESPONSE.length && frame >= 50;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, display: "flex", flexDirection: "column", padding: "36px 60px", gap: 16 }}>
      {/* Header with 112 button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 52, fontWeight: 700, color: COLORS.text, opacity: titleOpacity }}>Emergency Response</span>
        <div style={{
          padding: "14px 50px", borderRadius: 40, backgroundColor: "#DC2626", transform: `scale(${buttonScale})`,
          display: "flex", alignItems: "center", gap: 12,
          opacity: interpolate(frame, [5, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}>
          <span style={{ fontSize: 24 }}>📞</span>
          <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 32, fontWeight: 700, color: "#FFF" }}>Call 112</span>
        </div>
      </div>

      {/* Contacts — full width 4-column grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14, opacity: interpolate(frame, [10, 24], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
        {CONTACTS.map((c, i) => (
          <div key={i} style={{ padding: "20px 24px", backgroundColor: "#111119", borderRadius: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 18, color: COLORS.textSecondary }}>{c.name}</span>
            <span style={{ fontFamily: FONT_FAMILY.mono, fontSize: 26, fontWeight: 700, color: COLORS.text }}>{c.phone}</span>
          </div>
        ))}
      </div>

      {/* AI Chat — full width */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16, padding: "24px 32px", backgroundColor: "#111119", borderRadius: 14,
        opacity: interpolate(frame, [25, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>🤖</span>
          <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 22, fontWeight: 600, color: COLORS.text }}>AI Emergency Advisor</span>
        </div>

        <div style={{ alignSelf: "flex-end", maxWidth: 700, padding: "16px 22px", borderRadius: "16px 16px 4px 16px", backgroundColor: "#1C1C1E", border: "1px solid #2A2A2E" }}>
          <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 20, color: COLORS.text }}>What should I do? There are strong winds in my area.</span>
        </div>

        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: "#1C1C1E", border: "1px solid #2A2A2E", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>🤖</div>
          <div style={{ padding: "16px 22px", borderRadius: "4px 16px 16px 16px", backgroundColor: "#1C1C1E", flex: 1 }}>
            <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 20, color: COLORS.text, lineHeight: 1.6 }}>
              {displayedResponse}{isTyping && <span style={{ color: COLORS.textSecondary }}>▊</span>}
            </span>
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", bottom: 30, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 32, fontWeight: 600, color: COLORS.text, opacity: interpolate(frame, [55, 70], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), textShadow: "0 2px 20px rgba(0,0,0,0.9)" }}>
          One-tap 112 call, emergency contacts, and AI-powered guidance
        </span>
      </div>
    </AbsoluteFill>
  );
};
