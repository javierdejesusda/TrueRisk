import {
  AbsoluteFill,
  Img,
  staticFile,
  useCurrentFrame,
  spring,
  interpolate,
} from "remotion";
import { LightLeak } from "@remotion/light-leaks";
import { COLORS, SPRINGS, VIDEO } from "../../lib/constants";

type CardPosition = {
  src: string;
  x: number;
  y: number;
  rotateY: number;
  rotateX: number;
  fromX: number;
  fromY: number;
};

const SURROUNDING_CARDS: CardPosition[] = [
  { src: "demo-map.png", x: -480, y: -220, rotateY: -15, rotateX: 5, fromX: -1200, fromY: -600 },
  { src: "demo-alerts.png", x: 480, y: -220, rotateY: 12, rotateX: -3, fromX: 1200, fromY: -600 },
  { src: "demo-emergency.png", x: 560, y: 50, rotateY: 20, rotateX: 0, fromX: 1200, fromY: 0 },
  { src: "demo-predictions.png", x: 420, y: 260, rotateY: -10, rotateX: 8, fromX: 1200, fromY: 600 },
  { src: "demo-preparedness.png", x: -420, y: 260, rotateY: 15, rotateX: -5, fromX: -1200, fromY: 600 },
  { src: "demo-landing.png", x: -560, y: 50, rotateY: -18, rotateX: 0, fromX: -1200, fromY: 0 },
];

export const Constellation: React.FC = () => {
  const frame = useCurrentFrame();

  // Dashboard center card entry
  const centerScale = spring({
    frame,
    fps: VIDEO.fps,
    config: { damping: 20 },
  });

  // Slow rotation of entire group
  const groupRotateY = interpolate(frame, [0, 180], [0, 8], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        perspective: 1500,
      }}
    >
      {/* Light leak embedded here (not as TransitionSeries.Overlay to avoid adjacency violation) */}
      <LightLeak hueShift={160} seed={2} />

      <div
        style={{
          position: "relative",
          width: 1400,
          height: 800,
          transform: `rotateY(${groupRotateY}deg)`,
          transformStyle: "preserve-3d",
        }}
      >
        {/* Center dashboard */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: `translate(-50%, -50%) scale(${centerScale * 0.6})`,
            zIndex: 10,
          }}
        >
          <Img
            src={staticFile("demo-dashboard-valencia.png")}
            style={{
              width: 700,
              height: "auto",
              borderRadius: 12,
              boxShadow: "0 30px 60px rgba(132, 204, 22, 0.1)",
            }}
          />
        </div>

        {/* Surrounding cards */}
        {SURROUNDING_CARDS.map((card, i) => {
          const cardProgress = spring({
            frame: frame - 15 - i * 5,
            fps: VIDEO.fps,
            config: SPRINGS.snappy,
          });

          const x = interpolate(cardProgress, [0, 1], [card.fromX, card.x]);
          const y = interpolate(cardProgress, [0, 1], [card.fromY, card.y]);
          const opacity = interpolate(cardProgress, [0, 1], [0, 1]);

          return (
            <div
              key={card.src}
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotateY(${card.rotateY}deg) rotateX(${card.rotateX}deg)`,
                opacity,
                zIndex: 1,
              }}
            >
              <Img
                src={staticFile(card.src)}
                style={{
                  width: 340,
                  height: "auto",
                  borderRadius: 8,
                  boxShadow: "0 20px 40px rgba(132, 204, 22, 0.1)",
                }}
              />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
