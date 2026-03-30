import { AbsoluteFill, useCurrentFrame, spring, interpolate } from "remotion";
import { COLORS, FONT_FAMILY, VIDEO } from "../../lib/constants";

const PROFILE_FIELDS = [
  { label: "Construction Year", value: "1975" },
  { label: "Materials", value: "Concrete + Brick" },
  { label: "Floors", value: "7" },
  { label: "Has Basement", value: "Yes" },
  { label: "Has Elevator", value: "Yes" },
  { label: "Medical Dep.", value: "Electricity" },
];

const REPORT_FEATURES = [
  { icon: "📜", title: "EU Compliance", desc: "ECN/599/2025 directive data" },
  { icon: "⚠️", title: "7 Natural Hazards", desc: "Full coverage analysis" },
  { icon: "🌊", title: "ARPSI Flood Zones", desc: "Official flood mapping" },
  { icon: "📄", title: "PDF Export", desc: "Download & share reports" },
];

const CONDITIONS = ["Poor", "Fair", "Average", "Good", "Excellent"];

export const ProfileAndReport: React.FC = () => {
  const frame = useCurrentFrame();
  const titleOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, display: "flex", flexDirection: "column", padding: "36px 60px", gap: 16 }}>
      <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 52, fontWeight: 700, color: COLORS.text, opacity: titleOpacity }}>Personalized Assessment</span>

      {/* Profile fields — 3-column grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, opacity: interpolate(frame, [8, 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
        {PROFILE_FIELDS.map((f, i) => {
          const delay = 10 + i * 4;
          const progress = spring({ frame: frame - delay, fps: VIDEO.fps, config: { damping: 22, stiffness: 140 } });
          const opacity = interpolate(progress, [0, 1], [0, 1]);
          return (
            <div key={i} style={{ padding: "18px 24px", backgroundColor: "#111119", borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center", opacity }}>
              <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 20, color: COLORS.textSecondary }}>{f.label}</span>
              <span style={{ fontFamily: FONT_FAMILY.mono, fontSize: 22, fontWeight: 600, color: COLORS.text }}>{f.value}</span>
            </div>
          );
        })}
      </div>

      {/* Building condition bar — full width */}
      <div style={{ padding: "18px 24px", backgroundColor: "#111119", borderRadius: 12, opacity: interpolate(frame, [30, 42], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
        <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 16, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 10 }}>Building Condition</span>
        <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} style={{ flex: 1, height: 10, borderRadius: 5, backgroundColor: n <= 3 ? COLORS.text : "#1C1C1E" }} />
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          {CONDITIONS.map((c) => (
            <span key={c} style={{ fontFamily: FONT_FAMILY.sans, fontSize: 14, color: COLORS.textSecondary }}>{c}</span>
          ))}
        </div>
      </div>

      {/* Search bar + Report features — full width */}
      <div style={{ padding: "16px 24px", backgroundColor: "#111119", borderRadius: 12, border: "1px solid #2A2A2E",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        opacity: interpolate(frame, [35, 48], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}>
        <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 18, color: COLORS.textSecondary }}>Enter any address in Spain...</span>
        <div style={{ padding: "10px 28px", borderRadius: 8, backgroundColor: COLORS.text }}>
          <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 16, fontWeight: 600, color: "#000" }}>Analyze Risk</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, opacity: interpolate(frame, [40, 52], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
        {REPORT_FEATURES.map((f, i) => {
          const delay = 42 + i * 5;
          const progress = spring({ frame: frame - delay, fps: VIDEO.fps, config: { damping: 20, stiffness: 120 } });
          const opacity = interpolate(progress, [0, 1], [0, 1]);
          return (
            <div key={i} style={{ padding: "20px", backgroundColor: "#111119", borderRadius: 12, display: "flex", flexDirection: "column", gap: 8, opacity }}>
              <span style={{ fontSize: 28 }}>{f.icon}</span>
              <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 20, fontWeight: 600, color: COLORS.text }}>{f.title}</span>
              <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 15, color: COLORS.textSecondary }}>{f.desc}</span>
            </div>
          );
        })}
      </div>

      <div style={{ position: "absolute", bottom: 30, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 32, fontWeight: 600, color: COLORS.text, opacity: interpolate(frame, [55, 70], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), textShadow: "0 2px 20px rgba(0,0,0,0.9)" }}>
          Risk score adapts to your building profile with exportable PDF reports
        </span>
      </div>
    </AbsoluteFill>
  );
};
