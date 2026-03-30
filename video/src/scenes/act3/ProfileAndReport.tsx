import { AbsoluteFill, useCurrentFrame, spring, interpolate } from "remotion";
import { COLORS, FONT_FAMILY, VIDEO } from "../../lib/constants";

const PROFILE_FIELDS = [
  { label: "Construction Year", value: "1975" },
  { label: "Materials", value: "Concrete + Brick" },
  { label: "Floors", value: "7" },
  { label: "Has Basement", value: "Yes" },
];

const REPORT_FEATURES = [
  { icon: "📜", title: "EU Compliance", desc: "ECN/599/2025" },
  { icon: "⚠️", title: "7 Hazards", desc: "Full coverage" },
  { icon: "🌊", title: "ARPSI Zones", desc: "Flood mapping" },
  { icon: "📄", title: "PDF Export", desc: "Shareable" },
];

export const ProfileAndReport: React.FC = () => {
  const frame = useCurrentFrame();

  const titleOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, display: "flex", flexDirection: "column", padding: "60px 120px", gap: 24 }}>
      <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 44, fontWeight: 700, color: COLORS.text, opacity: titleOpacity }}>
        Personalized Risk Assessment
      </span>

      <div style={{ display: "flex", gap: 24, flex: 1 }}>
        {/* Left: Building Profile */}
        <div style={{
          flex: 1, display: "flex", flexDirection: "column", gap: 14,
          opacity: interpolate(frame, [8, 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}>
          <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 20, fontWeight: 600, color: COLORS.textSecondary }}>Your Building Profile</span>
          {PROFILE_FIELDS.map((field, i) => {
            const delay = 12 + i * 5;
            const progress = spring({ frame: frame - delay, fps: VIDEO.fps, config: { damping: 22, stiffness: 140 } });
            const opacity = interpolate(progress, [0, 1], [0, 1]);
            const translateY = interpolate(progress, [0, 1], [20, 0]);
            return (
              <div key={i} style={{
                padding: "16px 22px", backgroundColor: "#111119", borderRadius: 10,
                display: "flex", justifyContent: "space-between", alignItems: "center",
                transform: `translateY(${translateY}px)`, opacity,
              }}>
                <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 17, fontWeight: 400, color: COLORS.textSecondary }}>{field.label}</span>
                <span style={{ fontFamily: FONT_FAMILY.mono, fontSize: 19, fontWeight: 600, color: COLORS.text }}>{field.value}</span>
              </div>
            );
          })}
          {/* Condition bar */}
          <div style={{
            padding: "16px 22px", backgroundColor: "#111119", borderRadius: 10,
            opacity: interpolate(frame, [35, 48], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          }}>
            <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 14, fontWeight: 500, color: COLORS.textSecondary, display: "block", marginBottom: 8 }}>Building Condition</span>
            <div style={{ display: "flex", gap: 4 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: n <= 3 ? COLORS.text : "#1C1C1E" }} />
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: 1, backgroundColor: "#1C1C1E" }} />

        {/* Right: Climate Risk Report */}
        <div style={{
          flex: 1, display: "flex", flexDirection: "column", gap: 14,
          opacity: interpolate(frame, [15, 28], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}>
          <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 20, fontWeight: 600, color: COLORS.textSecondary }}>Climate Risk Report</span>
          {/* Search bar */}
          <div style={{
            padding: "14px 20px", backgroundColor: "#111119", borderRadius: 10, border: "1px solid #2A2A2E",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 15, fontWeight: 400, color: COLORS.textSecondary }}>Enter any address in Spain...</span>
            <div style={{ padding: "6px 18px", borderRadius: 6, backgroundColor: COLORS.text }}>
              <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 13, fontWeight: 600, color: "#000" }}>Analyze</span>
            </div>
          </div>
          {/* Feature cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {REPORT_FEATURES.map((f, i) => {
              const delay = 22 + i * 6;
              const progress = spring({ frame: frame - delay, fps: VIDEO.fps, config: { damping: 20, stiffness: 120 } });
              const opacity = interpolate(progress, [0, 1], [0, 1]);
              const scale = interpolate(progress, [0, 1], [0.92, 1]);
              return (
                <div key={i} style={{
                  padding: "18px", backgroundColor: "#111119", borderRadius: 10,
                  display: "flex", flexDirection: "column", gap: 6,
                  transform: `scale(${scale})`, opacity,
                }}>
                  <span style={{ fontSize: 22 }}>{f.icon}</span>
                  <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 16, fontWeight: 600, color: COLORS.text }}>{f.title}</span>
                  <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 13, fontWeight: 400, color: COLORS.textSecondary }}>{f.desc}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", bottom: 40, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 34, fontWeight: 600, color: COLORS.text,
          opacity: interpolate(frame, [55, 70], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
          Risk Score Adapts to Your Situation
        </span>
      </div>
    </AbsoluteFill>
  );
};
