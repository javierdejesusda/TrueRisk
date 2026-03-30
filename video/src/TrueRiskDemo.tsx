import { AbsoluteFill, staticFile, interpolate } from "remotion";
import { Audio } from "@remotion/media";
import { TransitionSeries, linearTiming, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";

import { SCENE_DURATIONS as D, TRANSITION_DURATIONS as T } from "./lib/constants";

import { TheDate } from "./scenes/act1/TheDate";
import { TheCost } from "./scenes/act1/TheCost";
import { TheQuestion } from "./scenes/act1/TheQuestion";
import { HeroVideo } from "./scenes/HeroVideo";
import { Dashboard } from "./scenes/act3/Dashboard";
import { MapDeepDive } from "./scenes/act3/MapDeepDive";
import { Alerts } from "./scenes/act3/Alerts";
import { Evacuation } from "./scenes/act3/Evacuation";
import { Emergency } from "./scenes/act3/Emergency";
import { AiAdvisor } from "./scenes/act3/AiAdvisor";
import { Drought } from "./scenes/act3/Drought";
import { Predictions } from "./scenes/act3/Predictions";
import { Preparedness } from "./scenes/act3/Preparedness";
import { CommunityReports } from "./scenes/act3/CommunityReports";
import { DataSources } from "./scenes/act3/DataSources";
import { Profile } from "./scenes/act3/Profile";
import { Report } from "./scenes/act3/Report";
import { Phrases } from "./scenes/act3/Phrases";
import { Bilingual } from "./scenes/act3/Bilingual";
import { Notifications } from "./scenes/act3/Notifications";
import { Callback } from "./scenes/act4/Callback";
import { LogoClose } from "./scenes/act4/LogoClose";

// Clean crossfade — the only transition type for a professional look
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
  timing: linearTiming({ durationInFrames: 25 }),
});

export const TrueRiskDemo: React.FC = () => {
  return (
    <AbsoluteFill>
      <Audio
        src={staticFile("music.mp3")}
        volume={(f) =>
          interpolate(f, [0, 45, 2400, 2600], [0, 0.7, 0.7, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        }
      />

      <TransitionSeries>
        {/* === OPENING === */}
        <TransitionSeries.Sequence durationInFrames={D.theDate}>
          <TheDate />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...longFade()} />

        <TransitionSeries.Sequence durationInFrames={D.theCost}>
          <TheCost />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...mediumFade()} />

        <TransitionSeries.Sequence durationInFrames={D.theQuestion}>
          <TheQuestion />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...longFade()} />

        {/* === HERO === */}
        <TransitionSeries.Sequence durationInFrames={D.heroVideo}>
          <HeroVideo />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...longFade()} />

        {/* === PRODUCT SHOWCASE === */}
        <TransitionSeries.Sequence durationInFrames={D.dashboard}>
          <Dashboard />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...shortFade()} />

        <TransitionSeries.Sequence durationInFrames={D.map}>
          <MapDeepDive />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...shortFade()} />

        <TransitionSeries.Sequence durationInFrames={D.alerts}>
          <Alerts />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...shortFade()} />

        <TransitionSeries.Sequence durationInFrames={D.evacuation}>
          <Evacuation />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...shortFade()} />

        <TransitionSeries.Sequence durationInFrames={D.emergency}>
          <Emergency />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...mediumFade()} />

        <TransitionSeries.Sequence durationInFrames={D.aiAdvisor}>
          <AiAdvisor />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...shortFade()} />

        <TransitionSeries.Sequence durationInFrames={D.drought}>
          <Drought />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...shortFade()} />

        <TransitionSeries.Sequence durationInFrames={D.predictions}>
          <Predictions />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...shortFade()} />

        <TransitionSeries.Sequence durationInFrames={D.preparedness}>
          <Preparedness />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...shortFade()} />

        <TransitionSeries.Sequence durationInFrames={D.communityReports}>
          <CommunityReports />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...shortFade()} />

        <TransitionSeries.Sequence durationInFrames={D.dataSources}>
          <DataSources />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...shortFade()} />

        <TransitionSeries.Sequence durationInFrames={D.profile}>
          <Profile />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...shortFade()} />

        <TransitionSeries.Sequence durationInFrames={D.report}>
          <Report />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...shortFade()} />

        <TransitionSeries.Sequence durationInFrames={D.phrases}>
          <Phrases />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...shortFade()} />

        <TransitionSeries.Sequence durationInFrames={D.bilingual}>
          <Bilingual />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...shortFade()} />

        <TransitionSeries.Sequence durationInFrames={D.notifications}>
          <Notifications />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...longFade()} />

        {/* === CLOSING === */}
        <TransitionSeries.Sequence durationInFrames={D.callback}>
          <Callback />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...mediumFade()} />

        <TransitionSeries.Sequence durationInFrames={D.logoClose}>
          <LogoClose />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
