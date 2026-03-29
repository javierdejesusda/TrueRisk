import {
  AbsoluteFill,
  Img,
  staticFile,
  useCurrentFrame,
  spring,
  interpolate,
} from "remotion";
import { Typewriter } from "../../components/Typewriter";
import { RadarPing } from "../../components/RadarPing";
import { COLORS, FONT_FAMILY, SPRINGS, VIDEO } from "../../lib/constants";

const LABELS = [
  { text: "Floods", x: 850, y: 340 },
  { text: "Fires", x: 950, y: 260 },
  { text: "Earthquakes", x: 750, y: 420 },
  { text: "Reservoirs", x: 1000, y: 400 },
];

// Valencia approximate center on the map screenshot
const VALENCIA_CENTER = { x: 880, y: 360 };

export const MapDeepDive: React.FC = () => {
  const frame = useCurrentFrame();

  // Zoom into Valencia: scale 1 → 1.8
  const scale = interpolate(frame, [0, 60], [1, 1.8], {
    extrapolateRight: "clamp",
  });

  // Translate to center Valencia as we zoom
  const translateX = interpolate(frame, [0, 60], [0, -(VALENCIA_CENTER.x - 960) * 0.8], {
    extrapolateRight: "clamp",
  });
  const translateY = interpolate(frame, [0, 60], [0, -(VALENCIA_CENTER.y - 540) * 0.8], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, overflow: "hidden" }}>
      {/* Map screenshot with zoom */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
          transformOrigin: "center center",
        }}
      >
        <Img
          src={staticFile("demo-map.png")}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      {/* Radar ping on Valencia */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          opacity: interpolate(frame, [50, 70], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        <RadarPing
          ringCount={3}
          staggerFrames={10}
          loopFrames={30}
          maxScale={3}
          color={COLORS.danger}
          size={40}
        />
      </div>

      {/* Feature labels */}
      {LABELS.map((label, i) => {
        const labelProgress = spring({
          frame: frame - 80 - i * 8,
          fps: VIDEO.fps,
          config: SPRINGS.snappy,
        });
        const labelX = interpolate(labelProgress, [0, 1], [20, 0]);
        const labelOpacity = interpolate(labelProgress, [0, 1], [0, 1]);

        return (
          <div
            key={label.text}
            style={{
              position: "absolute",
              left: label.x,
              top: label.y,
              transform: `translateX(${labelX}px)`,
              opacity: labelOpacity,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: COLORS.accent,
              }}
            />
            <span
              style={{
                fontFamily: FONT_FAMILY.sans,
                fontSize: 22,
                fontWeight: 600,
                color: COLORS.text,
                textShadow: "0 2px 10px rgba(0,0,0,0.9)",
              }}
            >
              {label.text}
            </span>
          </div>
        );
      })}

      {/* Bottom typography */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          left: 0,
          right: 0,
          textAlign: "center",
        }}
      >
        <Typewriter
          text="Every province. Every hazard. Every hour."
          startFrame={100}
          charsPerFrame={6}
          fontSize={44}
          fontWeight={600}
          color={COLORS.text}
        />
      </div>
    </AbsoluteFill>
  );
};
