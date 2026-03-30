import { AbsoluteFill, useCurrentFrame, spring, interpolate } from "remotion";
import { COLORS, FONT_FAMILY, VIDEO } from "../../lib/constants";

const AI_RESPONSE = "Based on current wind conditions in your province (78 km/h gusts), I recommend staying indoors and away from windows. Secure loose outdoor objects. If you must travel, avoid elevated roads and bridges. Keep your emergency kit accessible.";

export const AiAdvisor: React.FC = () => {
  const frame = useCurrentFrame();

  const titleOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  // User message appears
  const userMsgOpacity = interpolate(frame, [10, 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // AI response types in character by character
  const aiStartFrame = 30;
  const charsPerFrame = 2;
  const relativeFrame = Math.max(0, frame - aiStartFrame);
  const charsToShow = Math.min(Math.floor(relativeFrame * charsPerFrame), AI_RESPONSE.length);
  const displayedResponse = AI_RESPONSE.slice(0, charsToShow);
  const isTyping = charsToShow < AI_RESPONSE.length && frame >= aiStartFrame;

  // Powered by badge
  const badgeOpacity = interpolate(frame, [40, 55], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, display: "flex", flexDirection: "column", padding: "60px 240px", gap: 24 }}>
      <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 48, fontWeight: 700, color: COLORS.text, opacity: titleOpacity }}>
        AI Emergency Advisor
      </span>

      {/* Chat container */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20, flex: 1 }}>
        {/* User message */}
        <div style={{ display: "flex", justifyContent: "flex-end", opacity: userMsgOpacity }}>
          <div style={{ maxWidth: 600, padding: "16px 22px", borderRadius: "16px 16px 4px 16px", backgroundColor: "#1C1C1E", border: "1px solid #2A2A2E" }}>
            <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 20, fontWeight: 400, color: COLORS.text }}>
              What should I do? There are strong winds in my area.
            </span>
          </div>
        </div>

        {/* AI response */}
        <div style={{
          display: "flex", justifyContent: "flex-start",
          opacity: interpolate(frame, [aiStartFrame - 5, aiStartFrame], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}>
          <div style={{ display: "flex", gap: 14, maxWidth: 800, alignItems: "flex-start" }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: "#111119", border: "1px solid #2A2A2E", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
              🤖
            </div>
            <div style={{ padding: "16px 22px", borderRadius: "4px 16px 16px 16px", backgroundColor: "#111119" }}>
              <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 20, fontWeight: 400, color: COLORS.text, lineHeight: 1.6 }}>
                {displayedResponse}
                {isTyping && <span style={{ color: COLORS.textSecondary }}>▊</span>}
              </span>
            </div>
          </div>
        </div>
      </div>


      <div style={{ position: "absolute", bottom: 50, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 36, fontWeight: 600, color: COLORS.text,
          opacity: interpolate(frame, [70, 85], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
          Context-Aware AI Guidance
        </span>
      </div>
    </AbsoluteFill>
  );
};
