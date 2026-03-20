'use client';

import { useTranslations } from 'next-intl';

interface FirstAidCard {
  title: string;
  icon: React.ReactNode;
  borderColor: string;
  iconColor: string;
  steps: string[];
}

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
