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
import { Emergency } from "./scenes/act3/Emergency";
import { AiAdvisor } from "./scenes/act3/AiAdvisor";
import { Drought } from "./scenes/act3/Drought";
import { Predictions } from "./scenes/act3/Predictions";
import { Preparedness } from "./scenes/act3/Preparedness";
import { ProfileAndReport } from "./scenes/act3/ProfileAndReport";
import { PhrasesAndBilingual } from "./scenes/act3/PhrasesAndBilingual";
import { Notifications } from "./scenes/act3/Notifications";
import { DataSources } from "./scenes/act3/DataSources";
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
          interpolate(f, [0, 45, 2300, 2500], [0, 0.7, 0.7, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        }
      />

      <TransitionSeries>
        {/* === OPENING — emotional weight === */}
        <TransitionSeries.Sequence durationInFrames={D.theDate}>
          <CinematicWrapper>
            <TheDate />
          </CinematicWrapper>
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...longFade()} />

        <TransitionSeries.Sequence durationInFrames={D.theCost}>
          <CinematicWrapper zoomFrom={1.02} zoomTo={1.0}>
            <TheCost />
          </CinematicWrapper>
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...longFade()} />

        <TransitionSeries.Sequence durationInFrames={D.theQuestion}>
          <CinematicWrapper>
            <TheQuestion />
          </CinematicWrapper>
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...longFade()} />

        {/* === HERO === */}
        <TransitionSeries.Sequence durationInFrames={D.heroVideo}>
          <HeroVideo />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...longFade()} />

        {/* === PRODUCT SHOWCASE === */}

        {/* Dashboard — no bottom caption, content speaks */}
        <TransitionSeries.Sequence durationInFrames={D.dashboard}>
          <CinematicWrapper zoomFrom={1.0} zoomTo={1.025}>
            <Dashboard />
          </CinematicWrapper>
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...shortFade()} />

        {/* Map — screenshot in BrowserFrame */}
        <TransitionSeries.Sequence durationInFrames={D.map}>
          <CinematicWrapper zoomFrom={1.0} zoomTo={1.02}>
            <MapDeepDive />
          </CinematicWrapper>
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...shortFade()} />

        {/* Alerts */}
        <TransitionSeries.Sequence durationInFrames={D.alerts}>
          <CinematicWrapper>
            <Alerts />
          </CinematicWrapper>
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...shortFade()} />

        {/* Evacuation */}
        <TransitionSeries.Sequence durationInFrames={D.evacuation}>
          <CinematicWrapper zoomFrom={1.0} zoomTo={1.025}>
            <Evacuation />
          </CinematicWrapper>
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...mediumFade()} />

        {/* Emergency */}
        <TransitionSeries.Sequence durationInFrames={D.emergency}>
          <CinematicWrapper zoomFrom={1.02} zoomTo={1.0}>
            <Emergency />
          </CinematicWrapper>
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...mediumFade()} />

        {/* AI Advisor */}
        <TransitionSeries.Sequence durationInFrames={D.aiAdvisor}>
          <CinematicWrapper>
            <AiAdvisor />
          </CinematicWrapper>
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...shortFade()} />

        {/* Drought */}
        <TransitionSeries.Sequence durationInFrames={D.drought}>
          <CinematicWrapper zoomFrom={1.0} zoomTo={1.02}>
            <Drought />
          </CinematicWrapper>
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...shortFade()} />

        {/* Predictions — 8 ML models */}
        <TransitionSeries.Sequence durationInFrames={D.predictions}>
          <CinematicWrapper zoomFrom={1.02} zoomTo={1.0}>
            <Predictions />
          </CinematicWrapper>
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...shortFade()} />

        {/* Preparedness */}
        <TransitionSeries.Sequence durationInFrames={D.preparedness}>
          <CinematicWrapper>
            <Preparedness />
          </CinematicWrapper>
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...shortFade()} />

        {/* Profile + Report (merged) */}
        <TransitionSeries.Sequence durationInFrames={D.profileAndReport}>
          <CinematicWrapper zoomFrom={1.0} zoomTo={1.025}>
            <ProfileAndReport />
          </CinematicWrapper>
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...shortFade()} />

        {/* Data Sources */}
        <TransitionSeries.Sequence durationInFrames={D.dataSources}>
          <CinematicWrapper zoomFrom={1.02} zoomTo={1.0}>
            <DataSources />
          </CinematicWrapper>
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...shortFade()} />

        {/* Phrases + Bilingual (merged) */}
        <TransitionSeries.Sequence durationInFrames={D.phrasesAndBilingual}>
          <CinematicWrapper>
            <PhrasesAndBilingual />
          </CinematicWrapper>
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...mediumFade()} />

        {/* Notifications */}
        <TransitionSeries.Sequence durationInFrames={D.notifications}>
          <CinematicWrapper zoomFrom={1.0} zoomTo={1.02}>
            <Notifications />
          </CinematicWrapper>
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...longFade()} />

        {/* === CLOSING === */}
        <TransitionSeries.Sequence durationInFrames={D.callback}>
          <CinematicWrapper zoomFrom={1.02} zoomTo={1.0}>
            <Callback />
          </CinematicWrapper>
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...mediumFade()} />

        <TransitionSeries.Sequence durationInFrames={D.logoClose}>
          <CinematicWrapper>
            <LogoClose />
          </CinematicWrapper>
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
