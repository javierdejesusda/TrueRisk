'use client';

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

const CARDS: FirstAidCard[] = [
  {
    title: 'Seguridad ante inundaciones',
    icon: <FloodIcon />,
    borderColor: 'border-accent-blue/40',
    iconColor: 'text-accent-blue',
    steps: [
      'Sube a plantas altas. Nunca bajes al sotano.',
      'No camines ni conduzcas por zonas inundadas.',
      'Alejate de rios, barrancos y cauces secos.',
      'Desconecta la electricidad si el agua sube.',
      'Ten preparado un kit de emergencia con agua, linterna y documentos.',
      'Si quedas atrapado, sube al tejado y senala tu posicion.',
    ],
  },
  {
    title: 'Golpe de calor',
    icon: <HeatIcon />,
    borderColor: 'border-accent-orange/40',
    iconColor: 'text-accent-orange',
    steps: [
      'Traslada a la persona a un lugar fresco y a la sombra.',
      'Dale agua fresca a pequenos sorbos.',
      'Aplica panos humedos en frente, cuello y munecas.',
      'Abanica para bajar la temperatura corporal.',
      'Llama al 112 si pierde el conocimiento.',
      'Evita alcohol y cafeina durante olas de calor.',
    ],
  },
  {
    title: 'Protocolo sismico',
    icon: <SeismicIcon />,
    borderColor: 'border-accent-yellow/40',
    iconColor: 'text-accent-yellow',
    steps: [
      'Agachate, cubrete bajo una mesa solida y sujetate.',
      'Alejate de ventanas, espejos y objetos pesados.',
      'No uses el ascensor. Usa las escaleras.',
      'Si estas fuera, alejate de edificios y cables electricos.',
      'Tras el temblor, comprueba fugas de gas y danos estructurales.',
      'Prepara un punto de encuentro con tu familia.',
    ],
  },
];

export function FirstAidCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {CARDS.map((card) => (
        <div
          key={card.title}
          className={`glass rounded-2xl border-t-4 ${card.borderColor} p-4`}
        >
          <h3 className="font-[family-name:var(--font-display)] text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
            {card.icon}
            {card.title}
          </h3>
          <ol className="space-y-2">
            {card.steps.map((step, i) => (
              <li key={i} className="bg-white/[0.03] rounded-lg p-2 flex gap-2 font-[family-name:var(--font-sans)] text-xs text-text-secondary leading-relaxed">
                <span className="font-[family-name:var(--font-mono)] text-text-muted shrink-0">{i + 1}.</span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}
