import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import { COLORS, FONT_FAMILY, VIDEO } from "../../lib/constants";

const PARTICLE_COUNT = 220;
const RAINFALL_READINGS = ["200mm", "350mm", "412mm/12h", "287mm", "510mm"];

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

type Particle = { x: number; speed: number; height: number; delay: number; opacity: number };

const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
  x: seededRandom(i) * VIDEO.width,
  speed: 8 + seededRandom(i + 1000) * 12,
  height: 20 + seededRandom(i + 2000) * 20,
  delay: seededRandom(i + 3000) * 60,
  opacity: 0.3 + seededRandom(i + 4000) * 0.5,
}));

type ReadingPos = { x: number; y: number; showFrame: number };

const readingPositions: ReadingPos[] = RAINFALL_READINGS.map((_, i) => ({
  x: 200 + seededRandom(i + 5000) * (VIDEO.width - 400),
  y: 150 + seededRandom(i + 6000) * (VIDEO.height - 300),
  showFrame: i * 30 + 15,
}));

export const TheStorm: React.FC = () => {
  const frame = useCurrentFrame();

  const waterTop = interpolate(frame, [0, 180], [100, 60], {
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });

  const fadeOut = interpolate(frame, [165, 180], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.stormNavy }}>
      {particles.map((p, i) => {
        const y = ((frame - p.delay) * p.speed) % (VIDEO.height + p.height * 2) - p.height;
        const adjustedX = p.x + (frame - p.delay) * 3;
        return (
          <div key={i} style={{
            position: "absolute", left: adjustedX % VIDEO.width, top: y,
            width: 2, height: p.height,
            backgroundColor: `rgba(255, 255, 255, ${p.opacity * fadeOut})`,
            transform: "rotate(-30deg)", transformOrigin: "top left",
          }} />
        );
      })}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, top: `${waterTop}%`,
        background: `linear-gradient(to bottom, rgba(26, 58, 92, 0.2) 0%, rgba(26, 58, 92, 0.6) 100%)`,
        opacity: fadeOut,
      }} />
      {readingPositions.map((pos, i) => {
        const readingFrame = frame - pos.showFrame;
        const visible = readingFrame >= 0 && readingFrame < 15;
        if (!visible) return null;
        const readingOpacity = interpolate(readingFrame, [0, 3, 12, 15], [0, 0.2, 0.2, 0], { extrapolateRight: "clamp" });
        return (
          <div key={`reading-${i}`} style={{
            position: "absolute", left: pos.x, top: pos.y,
            fontFamily: FONT_FAMILY.mono, fontSize: 48, fontWeight: 400,
            color: COLORS.text, opacity: readingOpacity * fadeOut,
          }}>
            {RAINFALL_READINGS[i]}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
