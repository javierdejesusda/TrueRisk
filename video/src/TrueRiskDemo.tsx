import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { flip } from "@remotion/transitions/flip";
import { clockWipe } from "@remotion/transitions/clock-wipe";
import { LightLeak } from "@remotion/light-leaks";

import { SCENE_DURATIONS as D, TRANSITION_DURATIONS as T, VIDEO } from "./lib/constants";

import { TheDate } from "./scenes/act1/TheDate";
import { TheStorm } from "./scenes/act1/TheStorm";
import { TheCost } from "./scenes/act1/TheCost";
import { TheQuestion } from "./scenes/act1/TheQuestion";
import { Heartbeat } from "./scenes/act2/Heartbeat";
import { GlobeReveal } from "./scenes/act2/GlobeReveal";
import { ZoomToSpain } from "./scenes/act3/ZoomToSpain";
import { Dashboard } from "./scenes/act3/Dashboard";
import { MapDeepDive } from "./scenes/act3/MapDeepDive";
import { Alerts } from "./scenes/act3/Alerts";
import { Emergency } from "./scenes/act3/Emergency";
import { Predictions } from "./scenes/act3/Predictions";
import { Preparedness } from "./scenes/act3/Preparedness";
import { StatsBarrage } from "./scenes/act3/StatsBarrage";
import { Constellation } from "./scenes/act4/Constellation";
import { Callback } from "./scenes/act4/Callback";
import { LogoClose } from "./scenes/act4/LogoClose";

export const TrueRiskDemo: React.FC = () => {
  return (
    <AbsoluteFill>
      <TransitionSeries>
        {/* === ACT 1: THE DISASTER === */}
        <TransitionSeries.Sequence durationInFrames={D.theDate}>
          <TheDate />
        </TransitionSeries.Sequence>

        {/* No transition — hard cut per spec (sequenced, no overlap) */}

        <TransitionSeries.Sequence durationInFrames={D.theStorm}>
          <TheStorm />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: T.fadeMedium })}
        />

        <TransitionSeries.Sequence durationInFrames={D.theCost}>
          <TheCost />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: T.fadeShort })}
        />

        <TransitionSeries.Sequence durationInFrames={D.theQuestion}>
          <TheQuestion />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: T.fadeShort })}
        />

        {/* === ACT 2: THE REVEAL === */}
        <TransitionSeries.Sequence durationInFrames={D.heartbeat}>
          <Heartbeat />
        </TransitionSeries.Sequence>

        {/* Light leak overlay bridging heartbeat → globe (60 frames, centered on cut point) */}
        <TransitionSeries.Overlay durationInFrames={60}>
          <LightLeak hueShift={100} seed={1} />
        </TransitionSeries.Overlay>

        <TransitionSeries.Sequence durationInFrames={D.globeReveal}>
          <GlobeReveal />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={clockWipe({ width: VIDEO.width, height: VIDEO.height })}
          timing={springTiming({ config: { damping: 20 }, durationInFrames: T.clockWipe })}
        />

        {/* === ACT 3: THE PRODUCT === */}
        <TransitionSeries.Sequence durationInFrames={D.zoomToSpain}>
          <ZoomToSpain />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-right" })}
          timing={springTiming({ config: { damping: 20 }, durationInFrames: T.wipe })}
        />

        <TransitionSeries.Sequence durationInFrames={D.dashboard}>
          <Dashboard />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={flip({ direction: "from-right" })}
          timing={springTiming({ config: { damping: 20 }, durationInFrames: T.flip })}
        />

        <TransitionSeries.Sequence durationInFrames={D.mapDeepDive}>
          <MapDeepDive />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-bottom" })}
          timing={springTiming({ config: { damping: 20 }, durationInFrames: T.slide })}
        />

        <TransitionSeries.Sequence durationInFrames={D.alerts}>
          <Alerts />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-left" })}
          timing={springTiming({ config: { damping: 20 }, durationInFrames: T.slideShort })}
        />

        <TransitionSeries.Sequence durationInFrames={D.emergency}>
          <Emergency />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={springTiming({ config: { damping: 20 }, durationInFrames: T.slideShort })}
        />

        <TransitionSeries.Sequence durationInFrames={D.predictions}>
          <Predictions />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-left" })}
          timing={springTiming({ config: { damping: 20 }, durationInFrames: T.slideShort })}
        />

        <TransitionSeries.Sequence durationInFrames={D.preparedness}>
          <Preparedness />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: T.fadeShort })}
        />

        <TransitionSeries.Sequence durationInFrames={D.statsBarrage}>
          <StatsBarrage />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: T.fadeMedium })}
        />

        {/* === ACT 4: THE CLOSING === */}
        {/* Light leak embedded inside Constellation (not as Overlay — avoids adjacency violation with fade transition above) */}
        <TransitionSeries.Sequence durationInFrames={D.constellation}>
          <Constellation />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: T.fadeLong })}
        />

        <TransitionSeries.Sequence durationInFrames={D.callback}>
          <Callback />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: T.fadeMedium })}
        />

        <TransitionSeries.Sequence durationInFrames={D.logoClose}>
          <LogoClose />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
