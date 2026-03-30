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
  durationInFrames: 2753,
} as const;

export const SCENE_DURATIONS = {
  theDate: 90,
  theCost: 120,
  theQuestion: 60,
  heroVideo: 153,
  dashboard: 140,
  map: 140,
  alerts: 130,
  evacuation: 130,
  emergency: 130,
  aiAdvisor: 150,
  drought: 130,
  predictions: 140,
  preparedness: 130,
  communityReports: 130,
  dataSources: 130,
  profile: 130,
  report: 130,
  phrases: 120,
  bilingual: 120,
  notifications: 110,
  callback: 150,
  logoClose: 120,
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
