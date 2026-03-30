import { AbsoluteFill, useCurrentFrame, spring, interpolate } from "remotion";
import { COLORS, FONT_FAMILY, VIDEO } from "../../lib/constants";

const PROVINCES = [
  { name: "Valencia", score: 72, level: "High" },
  { name: "Castellón", score: 68, level: "High" },
  { name: "Alicante", score: 55, level: "Medium" },
  { name: "Barcelona", score: 42, level: "Medium" },
  { name: "Madrid", score: 15, level: "Low" },
  { name: "Zaragoza", score: 38, level: "Medium" },
  { name: "Huesca", score: 45, level: "Medium" },
  { name: "Tarragona", score: 51, level: "Medium" },
  { name: "Murcia", score: 35, level: "Low" },
  { name: "Sevilla", score: 12, level: "Low" },
  { name: "Málaga", score: 18, level: "Low" },
  { name: "Granada", score: 22, level: "Low" },
];

const LAYERS = ["Risk Scores", "Active Alerts", "Fire Hotspots", "Earthquakes", "Reservoirs", "River Gauges"];

export const MapDeepDive: React.FC = () => {
  const frame = useCurrentFrame();

  const titleOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const statsOpacity = interpolate(frame, [8, 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, display: "flex", flexDirection: "column", padding: "50px 120px", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 44, fontWeight: 700, color: COLORS.text, opacity: titleOpacity }}>
          Risk Map — 52 Provinces
        </span>
        <div style={{ display: "flex", gap: 24, opacity: statsOpacity }}>
          <span style={{ fontFamily: FONT_FAMILY.mono, fontSize: 18, fontWeight: 500, color: COLORS.textSecondary }}>154 fires</span>
          <span style={{ fontFamily: FONT_FAMILY.mono, fontSize: 18, fontWeight: 500, color: COLORS.textSecondary }}>5 quakes</span>
          <span style={{ fontFamily: FONT_FAMILY.mono, fontSize: 18, fontWeight: 500, color: COLORS.textSecondary }}>374 reservoirs</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 20, flex: 1 }}>
        {/* Province grid */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          {PROVINCES.map((p, i) => {
            const delay = 8 + i * 3;
            const progress = spring({ frame: frame - delay, fps: VIDEO.fps, config: { damping: 24, stiffness: 130 } });
            const opacity = interpolate(progress, [0, 1], [0, 1]);
            const scale = interpolate(progress, [0, 1], [0.92, 1]);

            const scoreBarWidth = interpolate(progress, [0, 1], [0, p.score]);

            return (
              <div key={i} style={{
                padding: "16px 20px", backgroundColor: "#111119", borderRadius: 10,
                display: "flex", flexDirection: "column", gap: 8,
                transform: `scale(${scale})`, opacity,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 17, fontWeight: 500, color: COLORS.text }}>{p.name}</span>
                  <span style={{ fontFamily: FONT_FAMILY.mono, fontSize: 20, fontWeight: 700, color: COLORS.text }}>{p.score}</span>
                </div>
                <div style={{ height: 4, borderRadius: 2, backgroundColor: "#1C1C1E" }}>
                  <div style={{ width: `${scoreBarWidth}%`, height: "100%", borderRadius: 2, backgroundColor: COLORS.text }} />
                </div>
                <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 12, fontWeight: 400, color: COLORS.textSecondary }}>{p.level}</span>
              </div>
            );
          })}
        </div>

        {/* Map layers */}
        <div style={{
          width: 260, display: "flex", flexDirection: "column", gap: 10,
          opacity: interpolate(frame, [25, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}>
          <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 16, fontWeight: 600, color: COLORS.textSecondary, marginBottom: 4 }}>MAP LAYERS</span>
          {LAYERS.map((layer, i) => (
            <div key={i} style={{
              padding: "12px 16px", backgroundColor: "#111119", borderRadius: 8,
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: COLORS.text }} />
              <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 15, fontWeight: 400, color: COLORS.text }}>{layer}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ position: "absolute", bottom: 40, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 34, fontWeight: 600, color: COLORS.text,
          opacity: interpolate(frame, [50, 65], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
          Every Province. Every Hazard. Every Hour.
        </span>
      </div>
    </AbsoluteFill>
  );
};
