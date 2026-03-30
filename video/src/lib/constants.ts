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
  durationInFrames: 2368,
} as const;

export const SCENE_DURATIONS = {
  theDate: 130,
  theCost: 170,
  theQuestion: 120,
  heroVideo: 153,
  dashboardAndAlerts: 160,
  map: 160,
  evacuationAndPreparedness: 180,
  emergencyAndAI: 180,
  droughtAndPredictions: 180,
  profileAndReport: 170,
  phrasesAndBilingual: 150,
  platformFeatures: 160,
  statsLine: 100,
  blackPause: 45,
  callback: 170,
  logoClose: 140,
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
