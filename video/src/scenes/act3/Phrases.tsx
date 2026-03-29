import { AbsoluteFill, useCurrentFrame, spring, interpolate } from "remotion";
import { COLORS, FONT_FAMILY, VIDEO } from "../../lib/constants";

const LANGUAGES = ["Español", "English", "Français", "Deutsch", "العربية", "Português", "中文", "Українська", "Română", "日本語", "한국어", "Русский"];

const PHRASES = [
  { situation: "Medical emergency", phrase: "I need an ambulance", lang: "English" },
  { situation: "Necesito un médico", phrase: "I need a doctor", lang: "English" },
  { situation: "Soy alérgico/a a...", phrase: "I am allergic to...", lang: "English" },
  { situation: "Tengo dolor de pecho", phrase: "I have chest pain", lang: "English" },
];

export const Phrases: React.FC = () => {
  const frame = useCurrentFrame();

  const titleOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, display: "flex", flexDirection: "column", padding: "60px 200px", gap: 24 }}>
      <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 48, fontWeight: 700, color: COLORS.text, opacity: titleOpacity }}>
        Emergency Phrases
      </span>

      {/* Language tags */}
      <div style={{
        display: "flex", gap: 10, flexWrap: "wrap",
        opacity: interpolate(frame, [8, 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}>
        {LANGUAGES.map((lang, i) => (
          <div key={i} style={{
            padding: "6px 16px", borderRadius: 20,
            backgroundColor: i === 1 ? COLORS.text : "#1C1C1E",
            border: i === 1 ? "none" : "1px solid #2A2A2E",
          }}>
            <span style={{
              fontFamily: FONT_FAMILY.sans, fontSize: 15, fontWeight: 500,
              color: i === 1 ? "#000" : COLORS.textSecondary,
            }}>{lang}</span>
          </div>
        ))}
      </div>

      {/* Phrase cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 8 }}>
        {PHRASES.map((p, i) => {
          const delay = 18 + i * 7;
          const progress = spring({ frame: frame - delay, fps: VIDEO.fps, config: { damping: 22, stiffness: 130 } });
          const opacity = interpolate(progress, [0, 1], [0, 1]);
          const translateY = interpolate(progress, [0, 1], [30, 0]);
          return (
            <div key={i} style={{
              padding: "20px 28px", backgroundColor: "#111119", borderRadius: 12,
              display: "flex", flexDirection: "column", gap: 8,
              transform: `translateY(${translateY}px)`, opacity,
            }}>
              <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 14, fontWeight: 400, color: COLORS.textSecondary }}>{p.situation}</span>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 24, fontWeight: 600, color: COLORS.text }}>{p.phrase}</span>
                <div style={{ padding: "6px 16px", borderRadius: 8, backgroundColor: "#1C1C1E", border: "1px solid #2A2A2E" }}>
                  <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 14, fontWeight: 500, color: COLORS.textSecondary }}>🔊 Listen</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ position: "absolute", bottom: 50, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 36, fontWeight: 600, color: COLORS.text,
          opacity: interpolate(frame, [55, 70], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
          Emergency Phrases in 12 Languages
        </span>
      </div>
    </AbsoluteFill>
  );
};
