import {
  AbsoluteFill,
  Img,
  staticFile,
  useCurrentFrame,
  spring,
  interpolate,
} from "remotion";
import { COLORS, FONT_FAMILY, SPRINGS, VIDEO } from "../../lib/constants";

const STATS = ["7 ML Models", "52 Provinces", "Real-time"];

export const ZoomToSpain: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      {/* Map screenshot with subtle perspective */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          perspective: 1200,
        }}
      >
        <Img
          src={staticFile("demo-map.png")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: "rotateY(-3deg)",
          }}
        />
      </div>

      {/* Semi-transparent overlay for text readability */}
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: "40%",
          background:
            "linear-gradient(to right, transparent 0%, rgba(5,5,8,0.85) 40%)",
        }}
      />

      {/* Stats typography */}
      <div
        style={{
          position: "absolute",
          right: 80,
          top: "50%",
          transform: "translateY(-50%)",
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        {STATS.map((text, i) => {
          const delay = i * 10;
          const entryProgress = spring({
            frame: frame - delay,
            fps: VIDEO.fps,
            config: SPRINGS.snappy,
          });
          const translateX = interpolate(entryProgress, [0, 1], [100, 0]);
          const opacity = interpolate(entryProgress, [0, 1], [0, 1]);

          return (
            <span
              key={text}
              style={{
                fontFamily: FONT_FAMILY.sans,
                fontSize: 48,
                fontWeight: 600,
                color: COLORS.text,
                transform: `translateX(${translateX}px)`,
                opacity,
                textShadow: "0 2px 20px rgba(0,0,0,0.8)",
              }}
            >
              {text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
