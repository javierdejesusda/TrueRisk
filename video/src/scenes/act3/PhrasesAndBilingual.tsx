import { AbsoluteFill, useCurrentFrame, spring, interpolate } from "remotion";
import { COLORS, FONT_FAMILY, VIDEO } from "../../lib/constants";

const LANGUAGES = ["Español", "English", "Français", "Deutsch", "العربية", "Português", "中文", "Українська", "Română", "日本語", "한국어", "Русский"];

const PHRASES = [
  { es: "Necesito una ambulancia", en: "I need an ambulance" },
  { es: "Necesito un médico", en: "I need a doctor" },
  { es: "Soy alérgico/a a...", en: "I am allergic to..." },
  { es: "Tengo dolor de pecho", en: "I have chest pain" },
];

export const PhrasesAndBilingual: React.FC = () => {
  const frame = useCurrentFrame();

  const titleOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, display: "flex", flexDirection: "column", padding: "60px 160px", gap: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 44, fontWeight: 700, color: COLORS.text, opacity: titleOpacity }}>
          Multilingual Support
        </span>
        {/* Language toggle */}
        <div style={{
          display: "flex", gap: 0, borderRadius: 8, overflow: "hidden", border: "1px solid #2A2A2E",
          opacity: interpolate(frame, [5, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}>
          <div style={{ padding: "8px 24px", backgroundColor: COLORS.text }}>
            <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 15, fontWeight: 600, color: "#000" }}>ES</span>
          </div>
          <div style={{ padding: "8px 24px", backgroundColor: "#111119" }}>
            <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 15, fontWeight: 600, color: COLORS.textSecondary }}>EN</span>
          </div>
        </div>
      </div>

      {/* Language tags */}
      <div style={{
        display: "flex", gap: 8, flexWrap: "wrap",
        opacity: interpolate(frame, [8, 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}>
        {LANGUAGES.map((lang, i) => (
          <div key={i} style={{
            padding: "5px 14px", borderRadius: 16,
            backgroundColor: i <= 1 ? "rgba(255,255,255,0.12)" : "#111119",
            border: "1px solid #2A2A2E",
          }}>
            <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 13, fontWeight: 500, color: i <= 1 ? COLORS.text : COLORS.textSecondary }}>{lang}</span>
          </div>
        ))}
      </div>

      {/* Phrase cards with translation */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {PHRASES.map((p, i) => {
          const delay = 16 + i * 6;
          const progress = spring({ frame: frame - delay, fps: VIDEO.fps, config: { damping: 22, stiffness: 130 } });
          const opacity = interpolate(progress, [0, 1], [0, 1]);
          const translateY = interpolate(progress, [0, 1], [25, 0]);
          return (
            <div key={i} style={{
              padding: "18px 24px", backgroundColor: "#111119", borderRadius: 10,
              display: "flex", alignItems: "center", gap: 20,
              transform: `translateY(${translateY}px)`, opacity,
            }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 20, fontWeight: 500, color: COLORS.text }}>{p.es}</span>
              </div>
              <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 16, color: COLORS.textSecondary }}>→</span>
              <div style={{ flex: 1 }}>
                <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 20, fontWeight: 500, color: COLORS.textSecondary }}>{p.en}</span>
              </div>
              <div style={{ padding: "5px 14px", borderRadius: 6, backgroundColor: "#1C1C1E", border: "1px solid #2A2A2E" }}>
                <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 12, fontWeight: 500, color: COLORS.textSecondary }}>🔊</span>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ position: "absolute", bottom: 40, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 34, fontWeight: 600, color: COLORS.text,
          opacity: interpolate(frame, [50, 65], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
          Multilingual Support
        </span>
      </div>
    </AbsoluteFill>
  );
};
