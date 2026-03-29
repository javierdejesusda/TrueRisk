export const COLORS = {
  bg: "#050508",
  bgSecondary: "#0C0C14",
  card: "#111119",
  text: "#EEEEF0",
  textSecondary: "#A0A0B4",
  accent: "#84CC16",
  danger: "#EF4444",
  dangerDark: "#e51f1f",
  warning: "#F97316",
  blue: "#3B82F6",
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
  durationInFrames: 2250,
} as const;

export const SCENE_DURATIONS = {
  theDate: 90,
  theStorm: 180,
  theCost: 120,
  theQuestion: 60,
  heartbeat: 90,
  globeReveal: 120,
  zoomToSpain: 150,
  dashboard: 210,
  mapDeepDive: 180,
  alerts: 150,
  emergency: 90,
  predictions: 90,
  preparedness: 90,
  statsBarrage: 120,
  constellation: 180,
  callback: 180,
  logoClose: 150,
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
