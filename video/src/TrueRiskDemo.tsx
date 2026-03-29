import { AbsoluteFill, staticFile, interpolate } from "remotion";
import { Audio } from "@remotion/media";
import { TransitionSeries, linearTiming, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { flip } from "@remotion/transitions/flip";

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

export const TrueRiskDemo: React.FC = () => {
  return (
    <AbsoluteFill>
      {/* Background music with fade in/out */}
      <Audio
        src={staticFile("music.mp3")}
        volume={(f) =>
          interpolate(f, [0, 30, 2500, 2650], [0, 0.7, 0.7, 0], {
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

        {/* === HERO === */}
        <TransitionSeries.Sequence durationInFrames={D.heroVideo}>
          <HeroVideo />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-bottom" })}
          timing={springTiming({ config: { damping: 15, stiffness: 120 }, durationInFrames: T.fadeLong })}
        />

        {/* === PRODUCT SHOWCASE — varied transitions === */}

        {/* Dashboard (screenshot) */}
        <TransitionSeries.Sequence durationInFrames={D.dashboard}>
          <Dashboard />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={springTiming({ config: { damping: 22, stiffness: 110 }, durationInFrames: T.fadeMedium })}
        />

        {/* Map (screenshot) */}
        <TransitionSeries.Sequence durationInFrames={D.map}>
          <MapDeepDive />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-right" })}
          timing={springTiming({ config: { damping: 20 }, durationInFrames: T.fadeMedium })}
        />

        {/* Alerts (custom) */}
        <TransitionSeries.Sequence durationInFrames={D.alerts}>
          <Alerts />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-bottom" })}
          timing={springTiming({ config: { damping: 18, stiffness: 130 }, durationInFrames: T.slideShort })}
        />

        {/* Evacuation (custom) */}
        <TransitionSeries.Sequence durationInFrames={D.evacuation}>
          <Evacuation />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={flip({ direction: "from-right" })}
          timing={springTiming({ config: { damping: 20 }, durationInFrames: T.fadeMedium })}
        />

        {/* Emergency (custom) */}
        <TransitionSeries.Sequence durationInFrames={D.emergency}>
          <Emergency />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: T.fadeMedium })}
        />

        {/* AI Advisor (custom) */}
        <TransitionSeries.Sequence durationInFrames={D.aiAdvisor}>
          <AiAdvisor />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-left" })}
          timing={springTiming({ config: { damping: 22 }, durationInFrames: T.fadeMedium })}
        />

        {/* Drought (custom) */}
        <TransitionSeries.Sequence durationInFrames={D.drought}>
          <Drought />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={springTiming({ config: { damping: 20, stiffness: 120 }, durationInFrames: T.slideShort })}
        />

        {/* Predictions (custom) */}
        <TransitionSeries.Sequence durationInFrames={D.predictions}>
          <Predictions />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-top" })}
          timing={springTiming({ config: { damping: 18, stiffness: 130 }, durationInFrames: T.slideShort })}
        />

        {/* Preparedness (custom) */}
        <TransitionSeries.Sequence durationInFrames={D.preparedness}>
          <Preparedness />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-bottom" })}
          timing={springTiming({ config: { damping: 20 }, durationInFrames: T.fadeMedium })}
        />

        {/* Community Reports (custom) */}
        <TransitionSeries.Sequence durationInFrames={D.communityReports}>
          <CommunityReports />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={flip({ direction: "from-left" })}
          timing={springTiming({ config: { damping: 20 }, durationInFrames: T.fadeMedium })}
        />

        {/* Data Sources (custom) */}
        <TransitionSeries.Sequence durationInFrames={D.dataSources}>
          <DataSources />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={springTiming({ config: { damping: 22, stiffness: 140 }, durationInFrames: T.slideShort })}
        />

        {/* Profile (custom) */}
        <TransitionSeries.Sequence durationInFrames={D.profile}>
          <Profile />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-right" })}
          timing={springTiming({ config: { damping: 20 }, durationInFrames: T.fadeMedium })}
        />

        {/* Report (custom) */}
        <TransitionSeries.Sequence durationInFrames={D.report}>
          <Report />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-bottom" })}
          timing={springTiming({ config: { damping: 18, stiffness: 120 }, durationInFrames: T.slideShort })}
        />

        {/* Phrases (custom) */}
        <TransitionSeries.Sequence durationInFrames={D.phrases}>
          <Phrases />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: T.fadeMedium })}
        />

        {/* Bilingual (custom) */}
        <TransitionSeries.Sequence durationInFrames={D.bilingual}>
          <Bilingual />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-left" })}
          timing={springTiming({ config: { damping: 22 }, durationInFrames: T.fadeMedium })}
        />

        {/* Notifications (custom) */}
        <TransitionSeries.Sequence durationInFrames={D.notifications}>
          <Notifications />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: T.fadeLong })}
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
