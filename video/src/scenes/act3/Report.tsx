import { AbsoluteFill, useCurrentFrame, spring, interpolate } from "remotion";
import { COLORS, FONT_FAMILY, VIDEO } from "../../lib/constants";

const FEATURES = [
  { icon: "📜", title: "ECN/599/2025 Compliance", desc: "Climate risk data per EU directive" },
  { icon: "⚠️", title: "7 Natural Hazards", desc: "Floods, wildfires, drought, heatwave, seismic, cold, wind" },
  { icon: "🌊", title: "ARPSI Flood Zones", desc: "Official flood risk mapping data" },
  { icon: "📄", title: "Shareable PDF Reports", desc: "Download & share with stakeholders" },
];

export const Report: React.FC = () => {
  const frame = useCurrentFrame();

  const titleOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, display: "flex", flexDirection: "column", alignItems: "center", padding: "80px 200px", gap: 32 }}>
      <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 48, fontWeight: 700, color: COLORS.text, opacity: titleOpacity }}>
        Climate Risk Report
      </span>

      {/* Search bar mockup */}
      <div style={{
        width: 700, padding: "16px 28px", borderRadius: 12, backgroundColor: "#111119", border: "1px solid #2A2A2E",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        opacity: interpolate(frame, [8, 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}>
        <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 18, fontWeight: 400, color: COLORS.textSecondary }}>Enter any address in Spain...</span>
        <div style={{ padding: "8px 24px", borderRadius: 8, backgroundColor: COLORS.text }}>
          <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 16, fontWeight: 600, color: "#000" }}>Analyze Risk</span>
        </div>
      </div>

      {/* Feature cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, width: "100%", maxWidth: 1000 }}>
        {FEATURES.map((f, i) => {
          const delay = 18 + i * 8;
          const progress = spring({ frame: frame - delay, fps: VIDEO.fps, config: { damping: 20, stiffness: 120 } });
          const opacity = interpolate(progress, [0, 1], [0, 1]);
          const scale = interpolate(progress, [0, 1], [0.9, 1]);
          return (
            <div key={i} style={{
              padding: "24px", backgroundColor: "#111119", borderRadius: 12,
              display: "flex", flexDirection: "column", gap: 10,
              transform: `scale(${scale})`, opacity,
            }}>
              <span style={{ fontSize: 28 }}>{f.icon}</span>
              <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 20, fontWeight: 600, color: COLORS.text }}>{f.title}</span>
              <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 16, fontWeight: 400, color: COLORS.textSecondary }}>{f.desc}</span>
            </div>
          );
        })}
      </div>

      <div style={{ position: "absolute", bottom: 50, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 36, fontWeight: 600, color: COLORS.text,
          opacity: interpolate(frame, [55, 70], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
          Address-Specific Risk Reports
        </span>
      </div>
    </AbsoluteFill>
  );
};
