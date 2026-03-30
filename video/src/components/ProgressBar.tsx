import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

// Progress bar only visible during product showcase section
const SHOW_START = 450;  // After hero video
const SHOW_END = 1900;   // Before callback

export const ProgressBar: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const progress = interpolate(frame, [0, durationInFrames], [0, 100], {
    extrapolateRight: "clamp",
  });

  // Fade in/out only during product showcase
  const barOpacity = interpolate(frame,
    [SHOW_START, SHOW_START + 20, SHOW_END - 20, SHOW_END],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  if (barOpacity <= 0) return null;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        width: `${progress}%`,
        height: 2,
        backgroundColor: "rgba(255, 255, 255, 0.25)",
        opacity: barOpacity,
        zIndex: 100,
      }}
    />
  );
};
