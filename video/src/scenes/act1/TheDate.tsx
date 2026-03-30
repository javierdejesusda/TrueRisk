import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { Typewriter } from "../../components/Typewriter";
import { COLORS } from "../../lib/constants";

export const TheDate: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
      }}
    >
      <Typewriter text="October 29, 2024" startFrame={10} charsPerFrame={1.5} fontSize={64} fontWeight={300} color={COLORS.text} />
      <div style={{
        width: 60, height: 1, backgroundColor: "rgba(255,255,255,0.2)",
        opacity: interpolate(frame, [25, 35], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }} />
      <Typewriter text="Valencia, Spain" startFrame={30} charsPerFrame={1.5} fontSize={64} fontWeight={300} color={COLORS.text} showCursor={true} />
    </AbsoluteFill>
  );
};
