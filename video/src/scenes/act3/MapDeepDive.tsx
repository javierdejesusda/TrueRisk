import { AbsoluteFill, Img, staticFile, useCurrentFrame, interpolate } from "remotion";
import { COLORS, FONT_FAMILY } from "../../lib/constants";

export const MapDeepDive: React.FC = () => {
  const frame = useCurrentFrame();
  const textOpacity = interpolate(frame, [40, 55], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      <Img
        src={staticFile("prod-map.png")}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      <div style={{
        position: "absolute", bottom: 50, left: 0, right: 0, textAlign: "center",
        opacity: textOpacity,
      }}>
        <span style={{ fontFamily: FONT_FAMILY.sans, fontSize: 36, fontWeight: 600, color: COLORS.text, textShadow: "0 2px 20px rgba(0,0,0,0.9)" }}>
          52 Provinces. 7 Hazard Models.
        </span>
      </div>
    </AbsoluteFill>
  );
};
