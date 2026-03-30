import { AbsoluteFill, staticFile, interpolate } from "remotion";
import { Audio } from "@remotion/media";
import { TransitionSeries, linearTiming, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";

import { SCENE_DURATIONS as D } from "./lib/constants";

import { TheDate } from "./scenes/act1/TheDate";
import { TheCost } from "./scenes/act1/TheCost";
import { TheQuestion } from "./scenes/act1/TheQuestion";
import { HeroVideo } from "./scenes/HeroVideo";
import { DashboardAndAlerts } from "./scenes/act3/DashboardAndAlerts";
import { MapDeepDive } from "./scenes/act3/MapDeepDive";
import { EvacuationAndPreparedness } from "./scenes/act3/EvacuationAndPreparedness";
import { EmergencyAndAI } from "./scenes/act3/EmergencyAndAI";
import { DroughtAndPredictions } from "./scenes/act3/DroughtAndPredictions";
import { ProfileAndReport } from "./scenes/act3/ProfileAndReport";
import { PhrasesAndBilingual } from "./scenes/act3/PhrasesAndBilingual";
import { PlatformFeatures } from "./scenes/act3/PlatformFeatures";
import { BlackPause } from "./scenes/act4/BlackPause";
import { Callback } from "./scenes/act4/Callback";
import { LogoClose } from "./scenes/act4/LogoClose";
import { ProgressBar } from "./components/ProgressBar";

// Opening: short fades so text doesn't overlap (scenes hold longer instead)
const openingFade = () => ({
  presentation: fade(),
  timing: linearTiming({ durationInFrames: 15 }),
});

// Product showcase: snappy fades
const quickFade = () => ({
  presentation: fade(),
  timing: linearTiming({ durationInFrames: 10 }),
});

// Between sections: medium
const medFade = () => ({
  presentation: fade(),
  timing: springTiming({ config: { damping: 200 }, durationInFrames: 18 }),
});

// Closing: slow again
const closingFade = () => ({
  presentation: fade(),
  timing: linearTiming({ durationInFrames: 35 }),
});

export const TrueRiskDemo: React.FC = () => {
  return (
    <AbsoluteFill>
      <Audio
        src={staticFile("music.mp3")}
        volume={(f) =>
          interpolate(f, [0, 45, 1900, 2100], [0, 0.7, 0.7, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        }
      />

      <ProgressBar />

      <TransitionSeries>
        {/* === OPENING — slow, emotional === */}
        <TransitionSeries.Sequence durationInFrames={D.theDate}>
          <TheDate />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...openingFade()} />

        <TransitionSeries.Sequence durationInFrames={D.theCost}>
          <TheCost />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...openingFade()} />

        <TransitionSeries.Sequence durationInFrames={D.theQuestion}>
          <TheQuestion />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...openingFade()} />

        {/* === HERO — fade from black into hero video === */}
        <TransitionSeries.Sequence durationInFrames={D.heroVideo}>
          <HeroVideo />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...medFade()} />

        {/* === PRODUCT SHOWCASE — snappy transitions === */}
        <TransitionSeries.Sequence durationInFrames={D.dashboardAndAlerts}>
          <DashboardAndAlerts />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...quickFade()} />

        <TransitionSeries.Sequence durationInFrames={D.map}>
          <MapDeepDive />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...quickFade()} />

        <TransitionSeries.Sequence durationInFrames={D.evacuationAndPreparedness}>
          <EvacuationAndPreparedness />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...quickFade()} />

        <TransitionSeries.Sequence durationInFrames={D.emergencyAndAI}>
          <EmergencyAndAI />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...quickFade()} />

        <TransitionSeries.Sequence durationInFrames={D.droughtAndPredictions}>
          <DroughtAndPredictions />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...quickFade()} />

        <TransitionSeries.Sequence durationInFrames={D.profileAndReport}>
          <ProfileAndReport />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...quickFade()} />

        <TransitionSeries.Sequence durationInFrames={D.phrasesAndBilingual}>
          <PhrasesAndBilingual />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...quickFade()} />

        <TransitionSeries.Sequence durationInFrames={D.platformFeatures}>
          <PlatformFeatures />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...closingFade()} />

        {/* === CLOSING — slow, deliberate === */}
        <TransitionSeries.Sequence durationInFrames={D.blackPause}>
          <BlackPause />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...closingFade()} />

        <TransitionSeries.Sequence durationInFrames={D.callback}>
          <Callback />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...closingFade()} />

        <TransitionSeries.Sequence durationInFrames={D.logoClose}>
          <LogoClose />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
