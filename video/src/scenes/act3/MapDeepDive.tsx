import { AbsoluteFill } from "remotion";
import { BrowserFrame } from "../../components/BrowserFrame";
import { COLORS } from "../../lib/constants";

export const MapDeepDive: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      <BrowserFrame
        src="prod-map.png"
        title="truerisk.cloud — Risk Map"
        tiltX={8}
        tiltY={3}
        oscillationSpeed={0.025}
        oscillationAmplitude={1.8}
        scaleFrom={0.93}
      />
    </AbsoluteFill>
  );
};
