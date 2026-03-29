import {
  AbsoluteFill,
  Img,
  staticFile,
  useCurrentFrame,
  spring,
  interpolate,
} from "remotion";
import { COLORS, FONT_FAMILY, SPRINGS, VIDEO } from "../../lib/constants";

export const Predictions: React.FC = () => {
  const frame = useCurrentFrame();

  // Fan-out effect: three cards
  const fanProgress = spring({ frame, fps: VIDEO.fps, config: SPRINGS.snappy });

  const cards = [
    { rotate: interpolate(fanProgress, [0, 1], [0, -8]), z: 0 },
    { rotate: 0, z: 1 },
    { rotate: interpolate(fanProgress, [0, 1], [0, 8]), z: 0 },
  ];

  // Text fade in
  const textOpacity = spring({ frame: frame - 20, fps: VIDEO.fps, config: SPRINGS.smooth });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Card fan */}
      <div style={{ position: "relative", width: 900, height: 500 }}>
        {cards.map((card, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `rotate(${card.rotate}deg)`,
              zIndex: card.z,
            }}
          >
            <Img
              src={staticFile("demo-predictions.png")}
              style={{
                width: 850,
                height: "auto",
                borderRadius: 12,
                boxShadow: `0 20px 60px rgba(0,0,0,0.5)`,
              }}
            />
          </div>
        ))}
      </div>

      {/* Typography */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: textOpacity,
        }}
      >
        <span
          style={{
            fontFamily: FONT_FAMILY.mono,
            fontSize: 36,
            fontWeight: 500,
            color: COLORS.accent,
            textShadow: "0 2px 20px rgba(0,0,0,0.9)",
          }}
        >
          XGBoost · LightGBM · PyTorch
        </span>
      </div>
    </AbsoluteFill>
  );
};
