'use client';

import { useTranslations } from 'next-intl';

function FloodIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v6" />
      <path d="M12 22v-6" />
      <path d="M2 12h6" />
      <path d="M22 12h-6" />
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
      <path d="M2 17c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
      <path d="M2 21c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
    </svg>
  );
}

function HeatIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-orange)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

function SeismicIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-yellow)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  );
}

function WildfireIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 12c2-2.96 0-7-1-8 0 3.04-1.18 4.43-2.58 5.96C7 11.54 6 13.24 6 15a6 6 0 0 0 12 0c0-1.76-1-3.46-2.42-5.04C14.18 8.43 13 7.04 13 4c-1 1-3 5.04-1 8z" />
    </svg>
  );
}

function DroughtIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v2" />
      <circle cx="12" cy="12" r="4" />
      <path d="M12 20v2" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="M6 18L4 20" />
      <path d="M18 18l2 2" />
    </svg>
  );
}

function ColdwaveIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22D3EE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20" />
      <path d="M2 12h20" />
      <path d="m4.93 4.93 14.14 14.14" />
      <path d="m19.07 4.93-14.14 14.14" />
      <path d="m9 2 3 3 3-3" />
      <path d="m9 22 3-3 3 3" />
    </svg>
  );
}

function WindstormIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" />
      <path d="M9.6 4.6A2 2 0 1 1 11 8H2" />
      <path d="M12.6 19.4A2 2 0 1 0 14 16H2" />
    </svg>
  );
}

interface FirstAidCardDef {
  titleKey: string;
  stepsKey: string;
  icon: React.ReactNode;
  borderColor: string;
  iconColor: string;
}

const CARD_DEFS: FirstAidCardDef[] = [
  {
    titleKey: 'flood',
    stepsKey: 'floodSteps',
    icon: <FloodIcon />,
    borderColor: 'border-accent-blue/40',
    iconColor: 'text-accent-blue',
  },
  {
    titleKey: 'wildfire',
    stepsKey: 'wildfireSteps',
    icon: <WildfireIcon />,
    borderColor: 'border-accent-red/40',
    iconColor: 'text-accent-red',
  },
  {
    titleKey: 'heatwave',
    stepsKey: 'heatwaveSteps',
    icon: <HeatIcon />,
    borderColor: 'border-accent-orange/40',
    iconColor: 'text-accent-orange',
  },
  {
    titleKey: 'earthquake',
    stepsKey: 'earthquakeSteps',
    icon: <SeismicIcon />,
    borderColor: 'border-accent-yellow/40',
    iconColor: 'text-accent-yellow',
  },
  {
    titleKey: 'drought',
    stepsKey: 'droughtSteps',
    icon: <DroughtIcon />,
    borderColor: 'border-amber-500/40',
    iconColor: 'text-amber-400',
  },
  {
    titleKey: 'coldwave',
    stepsKey: 'coldwaveSteps',
    icon: <ColdwaveIcon />,
    borderColor: 'border-cyan-400/40',
    iconColor: 'text-cyan-400',
  },
  {
    titleKey: 'windstorm',
    stepsKey: 'windstormSteps',
    icon: <WindstormIcon />,
    borderColor: 'border-white/20',
    iconColor: 'text-text-muted',
  },
];

export function FirstAidCards() {
  const t = useTranslations('FirstAid');

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {CARD_DEFS.map((card) => {
        const title = t(card.titleKey);
        const steps = t(card.stepsKey).split('. ').filter(Boolean).map(s => s.endsWith('.') ? s : s + '.');
        return (
          <div
            key={card.titleKey}
            className={`glass rounded-2xl border-t-4 ${card.borderColor} p-4`}
          >
            <h3 className="font-[family-name:var(--font-display)] text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
              {card.icon}
              {title}
            </h3>
            <ol className="space-y-2">
              {steps.map((step, i) => (
                <li key={i} className="bg-white/[0.03] rounded-lg p-2 flex gap-2 font-[family-name:var(--font-sans)] text-xs text-text-secondary leading-relaxed">
                  <span className="font-[family-name:var(--font-mono)] text-text-muted shrink-0">{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        );
      })}
    </div>
  );
}
