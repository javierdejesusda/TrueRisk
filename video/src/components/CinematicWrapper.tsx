import React from "react";
import { AbsoluteFill } from "remotion";

type CinematicWrapperProps = {
  children: React.ReactNode;
};

export const CinematicWrapper: React.FC<CinematicWrapperProps> = ({
  children,
}) => {
  return (
    <AbsoluteFill>
      {children}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.5) 100%)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
