import { Img, staticFile } from "remotion";
import { COLORS } from "../lib/constants";

type FloatingCardProps = {
  src: string;
  rotateY?: number;
  rotateX?: number;
  scale?: number;
  showReflection?: boolean;
  shadowColor?: string;
  shadowOpacity?: number;
};

export const FloatingCard: React.FC<FloatingCardProps> = ({
  src,
  rotateY = 0,
  rotateX = 0,
  scale = 1,
  showReflection = false,
  shadowColor = COLORS.accent,
  shadowOpacity = 0.15,
}) => {
  return (
    <div
      style={{
        perspective: 1200,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        transform: `scale(${scale})`,
      }}
    >
      <div
        style={{
          transform: `rotateY(${rotateY}deg) rotateX(${rotateX}deg)`,
          boxShadow: `0 40px 80px rgba(${hexToRgb(shadowColor)}, ${shadowOpacity})`,
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <Img
          src={staticFile(src)}
          style={{ width: "100%", height: "auto", display: "block" }}
        />
      </div>
      {showReflection && (
        <div
          style={{
            transform: `rotateY(${rotateY}deg) rotateX(${-rotateX}deg) scaleY(-1)`,
            opacity: 0.15,
            filter: "blur(4px)",
            maskImage:
              "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)",
            borderRadius: 12,
            overflow: "hidden",
            marginTop: -4,
          }}
        >
          <Img
            src={staticFile(src)}
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </div>
      )}
    </div>
  );
};

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}
