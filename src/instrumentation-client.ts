import * as Sentry from "@sentry/nextjs";

// Upstream/third-party noise patterns. These errors originate outside our
// code (MapLibre GL internals, browser extensions, transient network
// failures) and produce high-volume events that drown real bugs. Drop them
// entirely at the edge so they never reach the Sentry project.
//
// - MapLibre worker null-data race (TRUERISK-FRONTEND-T): Actor.receive()
//   has no null guard in 5.22.0; extensions/service workers that broadcast
//   null MessageEvents trip it. The worker recovers on its next message.
// - MapLibre fragment shader compile (TRUERISK-FRONTEND-S): WebGL
//   driver/GPU-state failures during requestAnimationFrame. Recoverable
//   via the map error boundary; nothing we can patch in-process.
// - MetaMask connection (TRUERISK-FRONTEND-W): injected by the wallet
//   extension when the page has no EIP-1193 provider; not our code.
// - Generic "Load failed" (TRUERISK-FRONTEND-V): Safari's opaque fetch
//   network-failure message, almost always a client connectivity drop.
const DROP_PATTERNS: Array<{ re: RegExp; needsWorkerFrame?: boolean }> = [
  { re: /Cannot read properties of null \(reading 'id'\)/i, needsWorkerFrame: true },
  { re: /Could not compile (fragment|vertex) shader/i },
  { re: /Failed to connect to MetaMask/i },
  { re: /^(TypeError: )?Load failed$/i },
];

function shouldDrop(event: Sentry.ErrorEvent): boolean {
  const values = event.exception?.values ?? [];
  return values.some((v) => {
    const message = v.value ?? "";
    for (const { re, needsWorkerFrame } of DROP_PATTERNS) {
      if (!re.test(message)) continue;
      if (!needsWorkerFrame) return true;
      // For the MapLibre null-id case, require a Worker frame so we don't
      // accidentally swallow an unrelated null-id bug in our own code.
      const mech = v.mechanism?.type ?? "";
      if (mech.includes("addEventListener")) return true;
      const frames = v.stacktrace?.frames ?? [];
      if (frames.some((f) => (f.function ?? "").toLowerCase().includes("worker"))) {
        return true;
      }
    }
    return false;
  });
}

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || "development",
  tracesSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0,
  beforeSend(event) {
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
    }
    if (shouldDrop(event)) {
      return null;
    }
    return event;
  },
});

// Required by @sentry/nextjs to instrument client-side navigations
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
