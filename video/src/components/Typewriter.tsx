import { useCurrentFrame, interpolate } from "remotion";
import { FONT_FAMILY, COLORS } from "../lib/constants";

type TypewriterProps = {
  text: string;
  startFrame?: number;
  charsPerFrame?: number;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  showCursor?: boolean;
  cursorBlinkFrames?: number;
};

export const Typewriter: React.FC<TypewriterProps> = ({
  text,
  startFrame = 0,
  charsPerFrame = 4,
  fontSize = 64,
  fontWeight = 300,
  color = COLORS.text,
  showCursor = true,
  cursorBlinkFrames = 15,
}) => {
  const frame = useCurrentFrame();
  const relativeFrame = Math.max(0, frame - startFrame);

  const charsToShow = Math.min(
    Math.floor(relativeFrame * charsPerFrame),
    text.length
  );
  const displayedText = text.slice(0, charsToShow);

  const cursorOpacity = showCursor
    ? interpolate(
        (frame - startFrame) % cursorBlinkFrames,
        [0, cursorBlinkFrames / 2, cursorBlinkFrames],
        [1, 0, 1],
        { extrapolateRight: "clamp" }
      )
    : 0;

  return (
    <span
      style={{
        fontFamily: FONT_FAMILY.sans,
        fontSize,
        fontWeight,
        color,
        whiteSpace: "pre-wrap",
      }}
    >
      {displayedText}
      {showCursor && (
        <span
          style={{
            opacity: cursorOpacity,
            fontWeight: 100,
            color: COLORS.accent,
          }}
        >
          |
        </span>
      )}
    </span>
  );
};
