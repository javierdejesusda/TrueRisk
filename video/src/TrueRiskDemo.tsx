import { AbsoluteFill, staticFile, interpolate } from "remotion";
import { Audio } from "@remotion/media";
import { TransitionSeries, linearTiming, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";

import { SCENE_DURATIONS as D } from "./lib/constants";
import { CinematicWrapper } from "./components/CinematicWrapper";

import { TheDate } from "./scenes/act1/TheDate";
import { TheCost } from "./scenes/act1/TheCost";
import { TheQuestion } from "./scenes/act1/TheQuestion";
import { HeroVideo } from "./scenes/HeroVideo";
import { Dashboard } from "./scenes/act3/Dashboard";
import { MapDeepDive } from "./scenes/act3/MapDeepDive";
import { Alerts } from "./scenes/act3/Alerts";
import { Evacuation } from "./scenes/act3/Evacuation";
import { EmergencyAndAI } from "./scenes/act3/EmergencyAndAI";
import { DroughtAndPredictions } from "./scenes/act3/DroughtAndPredictions";
import { Preparedness } from "./scenes/act3/Preparedness";
import { ProfileAndReport } from "./scenes/act3/ProfileAndReport";
import { PhrasesAndBilingual } from "./scenes/act3/PhrasesAndBilingual";
import { PlatformFeatures } from "./scenes/act3/PlatformFeatures";
import { Callback } from "./scenes/act4/Callback";
import { LogoClose } from "./scenes/act4/LogoClose";

const shortFade = () => ({
  presentation: fade(),
  timing: linearTiming({ durationInFrames: 12 }),
});

const mediumFade = () => ({
  presentation: fade(),
  timing: springTiming({ config: { damping: 200 }, durationInFrames: 18 }),
});

const longFade = () => ({
  presentation: fade(),
  timing: linearTiming({ durationInFrames: 28 }),
});

export const TrueRiskDemo: React.FC = () => {
  return (
    <AbsoluteFill>
      <Audio
        src={staticFile("music.mp3")}
        volume={(f) =>
          interpolate(f, [0, 45, 2200, 2400], [0, 0.7, 0.7, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        }
      />

      <TransitionSeries>
        {/* === OPENING === */}
        <TransitionSeries.Sequence durationInFrames={D.theDate}>
          <CinematicWrapper><TheDate /></CinematicWrapper>
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...longFade()} />

        <TransitionSeries.Sequence durationInFrames={D.theCost}>
          <CinematicWrapper><TheCost /></CinematicWrapper>
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...longFade()} />

        <TransitionSeries.Sequence durationInFrames={D.theQuestion}>
          <CinematicWrapper><TheQuestion /></CinematicWrapper>
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...longFade()} />

        {/* === HERO === */}
        <TransitionSeries.Sequence durationInFrames={D.heroVideo}>
          <HeroVideo />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...longFade()} />

        {/* === PRODUCT SHOWCASE === */}
        <TransitionSeries.Sequence durationInFrames={D.dashboard}>
          <CinematicWrapper><Dashboard /></CinematicWrapper>
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...mediumFade()} />

        <TransitionSeries.Sequence durationInFrames={D.map}>
          <CinematicWrapper><MapDeepDive /></CinematicWrapper>
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...shortFade()} />

        <TransitionSeries.Sequence durationInFrames={D.alerts}>
          <CinematicWrapper><Alerts /></CinematicWrapper>
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...shortFade()} />

        <TransitionSeries.Sequence durationInFrames={D.evacuation}>
          <CinematicWrapper><Evacuation /></CinematicWrapper>
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...mediumFade()} />

        <TransitionSeries.Sequence durationInFrames={D.emergencyAndAI}>
          <CinematicWrapper><EmergencyAndAI /></CinematicWrapper>
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...mediumFade()} />

        <TransitionSeries.Sequence durationInFrames={D.droughtAndPredictions}>
          <CinematicWrapper><DroughtAndPredictions /></CinematicWrapper>
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...shortFade()} />

        <TransitionSeries.Sequence durationInFrames={D.preparedness}>
          <CinematicWrapper><Preparedness /></CinematicWrapper>
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...shortFade()} />

        <TransitionSeries.Sequence durationInFrames={D.profileAndReport}>
          <CinematicWrapper><ProfileAndReport /></CinematicWrapper>
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...shortFade()} />

        <TransitionSeries.Sequence durationInFrames={D.phrasesAndBilingual}>
          <CinematicWrapper><PhrasesAndBilingual /></CinematicWrapper>
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...mediumFade()} />

        <TransitionSeries.Sequence durationInFrames={D.platformFeatures}>
          <CinematicWrapper><PlatformFeatures /></CinematicWrapper>
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...longFade()} />

        {/* === CLOSING === */}
        <TransitionSeries.Sequence durationInFrames={D.callback}>
          <CinematicWrapper><Callback /></CinematicWrapper>
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...mediumFade()} />

        <TransitionSeries.Sequence durationInFrames={D.logoClose}>
          <CinematicWrapper><LogoClose /></CinematicWrapper>
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
