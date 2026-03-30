import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";

type CinematicWrapperProps = {
  children: React.ReactNode;
};

export const CinematicWrapper: React.FC<CinematicWrapperProps> = ({
  children,
}) => {
  const frame = useCurrentFrame();
  // Shift grain pattern each frame for organic feel
  const seed = frame % 100;

  return (
    <AbsoluteFill>
      {children}
      {/* Cinematic vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.5) 100%)",
          pointerEvents: "none",
        }}
      />
      {/* Film grain */}
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <filter id={`grain-${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" seed={seed} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </svg>
      <div
        style={{
          position: "absolute",
          inset: -20,
          opacity: 0.04,
          filter: `url(#grain-${seed})`,
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
