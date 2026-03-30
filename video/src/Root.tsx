import { Composition, Still } from "remotion";
import { TrueRiskDemo } from "./TrueRiskDemo";
import { VIDEO } from "./lib/constants";
import "./lib/fonts";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="TrueRiskDemo"
        component={TrueRiskDemo}
        durationInFrames={VIDEO.durationInFrames}
        fps={VIDEO.fps}
        width={VIDEO.width}
        height={VIDEO.height}
      />
      <Still
        id="Thumbnail"
        component={TrueRiskDemo}
        width={VIDEO.width}
        height={VIDEO.height}
      />
    </>
  );
};
