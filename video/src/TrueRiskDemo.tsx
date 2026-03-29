import { AbsoluteFill, staticFile, interpolate, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { TransitionSeries, linearTiming, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";

import { SCENE_DURATIONS as D, TRANSITION_DURATIONS as T } from "./lib/constants";

import { TheDate } from "./scenes/act1/TheDate";
import { TheCost } from "./scenes/act1/TheCost";
import { TheQuestion } from "./scenes/act1/TheQuestion";
import { HeroVideo } from "./scenes/HeroVideo";
import { Dashboard } from "./scenes/act3/Dashboard";
import { MapDeepDive } from "./scenes/act3/MapDeepDive";
import { Alerts } from "./scenes/act3/Alerts";
import { Emergency } from "./scenes/act3/Emergency";
import { Predictions } from "./scenes/act3/Predictions";
import { Preparedness } from "./scenes/act3/Preparedness";
import { Callback } from "./scenes/act4/Callback";
import { LogoClose } from "./scenes/act4/LogoClose";

export const TrueRiskDemo: React.FC = () => {
  return (
    <AbsoluteFill>
      {/* Background music with fade in/out */}
      <Audio
        src={staticFile("music.mp3")}
        volume={(f) =>
          interpolate(f, [0, 30, 1250, 1350], [0, 0.7, 0.7, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        }
      />

      <TransitionSeries>
        {/* === OPENING: THE DISASTER === */}
        <TransitionSeries.Sequence durationInFrames={D.theDate}>
          <TheDate />
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

        {/* === THE HERO: Landing page video === */}
        <TransitionSeries.Sequence durationInFrames={D.heroVideo}>
          <HeroVideo />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: T.fadeMedium })}
        />

        {/* === PRODUCT SHOWCASE === */}
        <TransitionSeries.Sequence durationInFrames={D.dashboard}>
          <Dashboard />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={springTiming({ config: { damping: 20 }, durationInFrames: T.slideShort })}
        />

        <TransitionSeries.Sequence durationInFrames={D.map}>
          <MapDeepDive />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-left" })}
          timing={springTiming({ config: { damping: 20 }, durationInFrames: T.slideShort })}
        />

        <TransitionSeries.Sequence durationInFrames={D.alerts}>
          <Alerts />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={springTiming({ config: { damping: 20 }, durationInFrames: T.slideShort })}
        />

        <TransitionSeries.Sequence durationInFrames={D.emergency}>
          <Emergency />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-left" })}
          timing={springTiming({ config: { damping: 20 }, durationInFrames: T.slideShort })}
        />

        <TransitionSeries.Sequence durationInFrames={D.predictions}>
          <Predictions />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={springTiming({ config: { damping: 20 }, durationInFrames: T.slideShort })}
        />

        <TransitionSeries.Sequence durationInFrames={D.preparedness}>
          <Preparedness />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: T.fadeMedium })}
        />

        {/* === CLOSING === */}
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
