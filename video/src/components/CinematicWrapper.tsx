import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";

type CinematicWrapperProps = {
  children: React.ReactNode;
  zoomFrom?: number;
  zoomTo?: number;
};

export const CinematicWrapper: React.FC<CinematicWrapperProps> = ({
  children,
  zoomFrom = 1.0,
  zoomTo = 1.03,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const scale = interpolate(frame, [0, durationInFrames], [zoomFrom, zoomTo], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <div style={{ width: "100%", height: "100%", transform: `scale(${scale})` }}>
        {children}
      </div>
      {/* Cinematic vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.6) 100%)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
