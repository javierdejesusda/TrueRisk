import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Typewriter } from "../../components/Typewriter";
import { COLORS } from "../../lib/constants";

export const TheDate: React.FC = () => {
  const frame = useCurrentFrame();
  const shakeX = Math.sin(frame * 7.3) * 2;
  const shakeY = Math.cos(frame * 5.1) * 2;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        transform: `translate(${shakeX}px, ${shakeY}px)`,
      }}
    >
      <Typewriter text="October 29, 2024" startFrame={10} charsPerFrame={3} fontSize={64} fontWeight={300} color={COLORS.text} />
      <Typewriter text="Valencia, Spain" startFrame={35} charsPerFrame={3} fontSize={64} fontWeight={300} color={COLORS.text} showCursor={true} />
    </AbsoluteFill>
  );
};
