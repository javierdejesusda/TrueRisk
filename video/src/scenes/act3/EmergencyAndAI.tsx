import { AbsoluteFill, useCurrentFrame, spring, interpolate } from "remotion";
import { COLORS, FONT_FAMILY, VIDEO } from "../../lib/constants";

const CONTACTS = [
  { name: "Protección Civil", phone: "955 373 100" },
  { name: "Bomberos", phone: "954 802 222" },
  { name: "Policía Local", phone: "092" },
  { name: "Hospital", phone: "913 368 000" },
];

const AI_RESPONSE = "Based on current wind conditions in your province (78 km/h gusts), I recommend staying indoors and away from windows. Secure loose outdoor objects.";

export const EmergencyAndAI: React.FC = () => {
  const frame = useCurrentFrame();
  const titleOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  const pulseProgress = spring({ frame: frame - 10, fps: VIDEO.fps, config: { damping: 8 } });
  const buttonScale = 1 + interpolate(pulseProgress, [0, 0.5, 1], [0, 0.05, 0]);

  const aiFrame = Math.max(0, frame - 40);
  const charsToShow = Math.min(Math.floor(aiFrame * 2), AI_RESPONSE.length);
  const displayedResponse = AI_RESPONSE.slice(0, charsToShow);
  const isTyping = charsToShow < AI_RESPONSE.length && frame >= 40;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, display: "flex", flexDirection: "column", padding: "50px 100px", gap: 20 }}>
      <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 48, fontWeight: 700, color: COLORS.text, opacity: titleOpacity }}>
        Emergency Response
      </span>

      <div style={{ display: "flex", gap: 24, flex: 1 }}>
        {/* Left: Emergency */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
          opacity: interpolate(frame, [5, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}>
          <div style={{
            padding: "16px 60px", borderRadius: 40, backgroundColor: "#DC2626",
            transform: `scale(${buttonScale})`, display: "flex", alignItems: "center", gap: 12,
          }}>
            <span style={{ fontSize: 24 }}>📞</span>
            <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 28, fontWeight: 700, color: "#FFF" }}>Call 112</span>
          </div>

          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
            {CONTACTS.map((c, i) => {
              const delay = 15 + i * 5;
              const progress = spring({ frame: frame - delay, fps: VIDEO.fps, config: { damping: 22, stiffness: 130 } });
              const opacity = interpolate(progress, [0, 1], [0, 1]);
              return (
                <div key={i} style={{
                  padding: "14px 20px", backgroundColor: "#111119", borderRadius: 10,
                  display: "flex", justifyContent: "space-between", opacity,
                }}>
                  <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 17, color: COLORS.textSecondary }}>{c.name}</span>
                  <span style={{ fontFamily: FONT_FAMILY.mono, fontSize: 18, fontWeight: 600, color: COLORS.text }}>{c.phone}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ width: 1, backgroundColor: "#1C1C1E" }} />

        {/* Right: AI Advisor */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14,
          opacity: interpolate(frame, [20, 35], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}>
          <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 18, fontWeight: 600, color: COLORS.textSecondary }}>AI Emergency Advisor</span>

          <div style={{ padding: "14px 18px", borderRadius: "14px 14px 4px 14px", backgroundColor: "#1C1C1E", border: "1px solid #2A2A2E", alignSelf: "flex-end", maxWidth: 400 }}>
            <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 16, color: COLORS.text }}>What should I do? Strong winds in my area.</span>
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: "#111119", border: "1px solid #2A2A2E", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🤖</div>
            <div style={{ padding: "14px 18px", borderRadius: "4px 14px 14px 14px", backgroundColor: "#111119" }}>
              <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 16, color: COLORS.text, lineHeight: 1.6 }}>
                {displayedResponse}{isTyping && <span style={{ color: COLORS.textSecondary }}>▊</span>}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom caption */}
      <div style={{ position: "absolute", bottom: 30, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 28, fontWeight: 600, color: COLORS.text,
          opacity: interpolate(frame, [55, 70], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          textShadow: "0 2px 20px rgba(0,0,0,0.9)",
        }}>
          One-tap 112 call, emergency contacts, and AI-powered guidance
        </span>
      </div>
    </AbsoluteFill>
  );
};
