import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { Video } from "@remotion/media";
import { staticFile } from "remotion";
import { COLORS, FONT_FAMILY } from "../lib/constants";

export const HeroVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const urlOpacity = interpolate(frame, [30, 45], [0, 0.7], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      <Video
        src={staticFile("prod-hero.mp4")}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      <div style={{ position: "absolute", bottom: 30, right: 40, opacity: urlOpacity }}>
        <span style={{ fontFamily: FONT_FAMILY.mono, fontSize: 16, fontWeight: 500, color: "rgba(255,255,255,0.8)", letterSpacing: 0.5 }}>
          truerisk.cloud
        </span>
      </div>
    </AbsoluteFill>
  );
};
