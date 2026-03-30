import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

export const ProgressBar: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const progress = interpolate(frame, [0, durationInFrames], [0, 100], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        width: `${progress}%`,
        height: 2,
        backgroundColor: "rgba(255, 255, 255, 0.3)",
        zIndex: 100,
      }}
    />
  );
};
