export const COLORS = {
  bg: "#050508",
  bgSecondary: "#0C0C14",
  card: "#111119",
  text: "#FFFFFF",
  textSecondary: "#999999",
  accent: "#FFFFFF",
  danger: "#FFFFFF",
  dangerDark: "#FFFFFF",
  warning: "#FFFFFF",
  blue: "#FFFFFF",
  stormNavy: "#0a1628",
  stormGrey: "#2a3040",
  waterBlue: "#1a3a5c",
} as const;

export const SPRINGS = {
  smooth: { damping: 200 },
  snappy: { damping: 20, stiffness: 200 },
  bouncy: { damping: 8 },
  heavy: { damping: 15, stiffness: 80, mass: 2 },
} as const;

export const VIDEO = {
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 2628,
} as const;

export const SCENE_DURATIONS = {
  theDate: 100,
  theCost: 150,      // Longer hold for emotional impact
  theQuestion: 80,   // More breathing room
  heroVideo: 153,
  dashboard: 160,    // More time to absorb
  map: 150,
  alerts: 140,
  evacuation: 140,
  emergency: 140,
  aiAdvisor: 160,
  drought: 140,
  predictions: 150,
  preparedness: 140,
  profileAndReport: 150,  // Merged profile + report
  phrasesAndBilingual: 140, // Merged phrases + bilingual
  notifications: 120,
  dataSources: 140,
  callback: 160,
  logoClose: 130,
} as const;

export const TRANSITION_DURATIONS = {
  fadeShort: 15,
  fadeMedium: 20,
  fadeLong: 25,
  clockWipe: 90,
  wipe: 20,
  flip: 25,
  slide: 20,
  slideShort: 15,
} as const;

export const FONT_FAMILY = {
  sans: "Geist Sans",
  mono: "Geist Mono",
} as const;
