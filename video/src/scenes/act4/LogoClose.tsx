import {
  AbsoluteFill,
  useCurrentFrame,
  spring,
  interpolate,
} from "remotion";
import { COLORS, FONT_FAMILY, SPRINGS, VIDEO } from "../../lib/constants";

export const LogoClose: React.FC = () => {
  const frame = useCurrentFrame();

  const logoScale = spring({ frame, fps: VIDEO.fps, config: SPRINGS.smooth });
  const logoScaleFinal = interpolate(logoScale, [0, 1], [0.9, 1]);

  const taglineOpacity = interpolate(frame, [20, 35], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const urlOpacity = interpolate(frame, [35, 45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const finalLineOpacity = interpolate(frame, [55, 70], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fadeToBlack = interpolate(frame, [120, 140], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        height: "100%", gap: 20,
      }}>
        <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 80, fontWeight: 700, color: COLORS.text, transform: `scale(${logoScaleFinal})` }}>
          TrueRisk
        </span>
        <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 24, fontWeight: 400, color: COLORS.textSecondary, opacity: taglineOpacity }}>
          Climate Emergency Management Platform
        </span>
        <span style={{ fontFamily: FONT_FAMILY.mono, fontSize: 20, fontWeight: 400, color: COLORS.text, opacity: urlOpacity }}>
          truerisk.cloud
        </span>
        <div style={{ marginTop: 36, opacity: finalLineOpacity }}>
          <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 32, fontWeight: 400, color: COLORS.textSecondary }}>
            Built for Spain. Built to save lives.
          </span>
        </div>
      </div>

      <div style={{ position: "absolute", inset: 0, backgroundColor: "black", opacity: fadeToBlack }} />
    </AbsoluteFill>
  );
};
