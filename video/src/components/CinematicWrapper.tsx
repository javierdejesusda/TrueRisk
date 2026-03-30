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
    </AbsoluteFill>
  );
};
