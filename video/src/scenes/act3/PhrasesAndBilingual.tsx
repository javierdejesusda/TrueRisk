import { AbsoluteFill, useCurrentFrame, spring, interpolate } from "remotion";
import { COLORS, FONT_FAMILY, VIDEO } from "../../lib/constants";

const LANGUAGES = ["Español", "English", "Français", "Deutsch", "العربية", "Português", "中文", "Українська", "Română", "日本語", "한국어", "Русский"];

const PHRASES = [
  { es: "Necesito una ambulancia", en: "I need an ambulance" },
  { es: "Necesito un médico", en: "I need a doctor" },
  { es: "Soy alérgico/a a...", en: "I am allergic to..." },
  { es: "Tengo dolor de pecho", en: "I have chest pain" },
  { es: "¿Dónde está el refugio?", en: "Where is the shelter?" },
  { es: "Hay una inundación", en: "There is a flood" },
];

export const PhrasesAndBilingual: React.FC = () => {
  const frame = useCurrentFrame();
  const titleOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, display: "flex", flexDirection: "column", padding: "36px 60px", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 52, fontWeight: 700, color: COLORS.text, opacity: titleOpacity }}>Multilingual Support</span>
        <div style={{ display: "flex", gap: 0, borderRadius: 10, overflow: "hidden", border: "1px solid #2A2A2E",
          opacity: interpolate(frame, [5, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}>
          <div style={{ padding: "10px 28px", backgroundColor: COLORS.text }}>
            <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 18, fontWeight: 600, color: "#000" }}>ES</span>
          </div>
          <div style={{ padding: "10px 28px", backgroundColor: "#111119" }}>
            <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 18, fontWeight: 600, color: COLORS.textSecondary }}>EN</span>
          </div>
        </div>
      </div>

      {/* Language tags — full width wrap */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", opacity: interpolate(frame, [8, 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
        {LANGUAGES.map((lang, i) => (
          <div key={i} style={{ padding: "8px 18px", borderRadius: 20, backgroundColor: i <= 1 ? "rgba(255,255,255,0.12)" : "#111119", border: "1px solid #2A2A2E" }}>
            <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 16, fontWeight: 500, color: i <= 1 ? COLORS.text : COLORS.textSecondary }}>{lang}</span>
          </div>
        ))}
      </div>

      {/* Phrases — 2-column grid for full width */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, flex: 1 }}>
        {PHRASES.map((p, i) => {
          const delay = 16 + i * 5;
          const progress = spring({ frame: frame - delay, fps: VIDEO.fps, config: { damping: 22, stiffness: 130 } });
          const opacity = interpolate(progress, [0, 1], [0, 1]);
          return (
            <div key={i} style={{ padding: "18px 24px", backgroundColor: "#111119", borderRadius: 12, display: "flex", alignItems: "center", gap: 16, opacity }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 22, fontWeight: 500, color: COLORS.text }}>{p.es}</span>
              </div>
              <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 18, color: COLORS.textSecondary }}>→</span>
              <div style={{ flex: 1 }}>
                <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 22, fontWeight: 500, color: COLORS.textSecondary }}>{p.en}</span>
              </div>
              <div style={{ padding: "6px 14px", borderRadius: 8, backgroundColor: "#1C1C1E", border: "1px solid #2A2A2E" }}>
                <span style={{ fontSize: 16 }}>🔊</span>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ position: "absolute", bottom: 30, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 32, fontWeight: 600, color: COLORS.text, opacity: interpolate(frame, [55, 70], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), textShadow: "0 2px 20px rgba(0,0,0,0.9)" }}>
          Emergency phrases in 12 languages with full Spanish and English interface
        </span>
      </div>
    </AbsoluteFill>
  );
};
