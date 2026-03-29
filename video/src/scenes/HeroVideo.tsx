import { AbsoluteFill } from "remotion";
import { Video } from "@remotion/media";
import { staticFile } from "remotion";
import { COLORS } from "../lib/constants";

export const HeroVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      <Video
        src={staticFile("prod-hero.mp4")}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </AbsoluteFill>
  );
};
