import { AbsoluteFill, useCurrentFrame, spring, interpolate } from "remotion";
import { COLORS, FONT_FAMILY, VIDEO } from "../../lib/constants";

const PAIRS = [
  { es: "Panel de Control", en: "Dashboard" },
  { es: "Mapa de Riesgo", en: "Risk Map" },
  { es: "Alertas Activas", en: "Active Alerts" },
  { es: "Rutas de Evacuación", en: "Evacuation Routes" },
  { es: "Predicciones de Riesgo", en: "Risk Predictions" },
  { es: "Preparación", en: "Preparedness" },
];

export const Bilingual: React.FC = () => {
  const frame = useCurrentFrame();

  const titleOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, display: "flex", flexDirection: "column", alignItems: "center", padding: "70px 200px", gap: 28 }}>
      <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 48, fontWeight: 700, color: COLORS.text, opacity: titleOpacity }}>
        Fully Bilingual
      </span>

      {/* Language toggle */}
      <div style={{
        display: "flex", gap: 0, borderRadius: 10, overflow: "hidden", border: "1px solid #2A2A2E",
        opacity: interpolate(frame, [8, 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}>
        <div style={{ padding: "10px 32px", backgroundColor: COLORS.text }}>
          <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 18, fontWeight: 600, color: "#000" }}>ES</span>
        </div>
        <div style={{ padding: "10px 32px", backgroundColor: "#111119" }}>
          <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 18, fontWeight: 600, color: COLORS.textSecondary }}>EN</span>
        </div>
      </div>

      {/* Translation pairs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "14px 24px", alignItems: "center", width: "100%", maxWidth: 900 }}>
        {PAIRS.map((p, i) => {
          const delay = 14 + i * 6;
          const progress = spring({ frame: frame - delay, fps: VIDEO.fps, config: { damping: 22, stiffness: 130 } });
          const opacity = interpolate(progress, [0, 1], [0, 1]);
          const translateX = interpolate(progress, [0, 1], [20, 0]);
          return (
            <>
              <div key={`es-${i}`} style={{ textAlign: "right" as const, transform: `translateX(-${translateX}px)`, opacity }}>
                <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 22, fontWeight: 500, color: COLORS.text }}>{p.es}</span>
              </div>
              <div key={`arrow-${i}`} style={{ opacity }}>
                <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 18, color: COLORS.textSecondary }}>→</span>
              </div>
              <div key={`en-${i}`} style={{ transform: `translateX(${translateX}px)`, opacity }}>
                <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 22, fontWeight: 500, color: COLORS.textSecondary }}>{p.en}</span>
              </div>
            </>
          );
        })}
      </div>

      <div style={{ position: "absolute", bottom: 50, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 36, fontWeight: 600, color: COLORS.text,
          opacity: interpolate(frame, [55, 70], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
          Spanish & English — Full i18n
        </span>
      </div>
    </AbsoluteFill>
  );
};
