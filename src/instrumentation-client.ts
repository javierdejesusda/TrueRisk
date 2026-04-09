import * as Sentry from "@sentry/nextjs";

// Known upstream bug pattern: MapLibre GL's internal Actor.receive() crashes
// with "Cannot read properties of null (reading 'id')" when a Worker receives
// a MessageEvent whose data is null. This happens when browser extensions or
// service workers broadcast null messages to every in-page worker. MapLibre
// lacks a null guard in src/util/actor.ts (confirmed in 5.22.0). See
// TRUERISK-FRONTEND-T. The tile worker recovers on its next message, so the
// error is functionally benign — but we still want it grouped separately
// and de-prioritised so it does not drown real errors.
const MAPLIBRE_WORKER_NULL_MSG =
  /Cannot read properties of null \(reading 'id'\)/i;

function isMapLibreWorkerNullMessage(event: Sentry.ErrorEvent): boolean {
  const values = event.exception?.values ?? [];
  return values.some((v) => {
    const message = v.value ?? "";
    if (!MAPLIBRE_WORKER_NULL_MSG.test(message)) return false;
    const mech = v.mechanism?.type ?? "";
    return (
      mech.includes("addEventListener") ||
      (v.stacktrace?.frames ?? []).some((f) =>
        (f.function ?? "").toLowerCase().includes("worker")
      )
    );
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
    // Route known-upstream MapLibre worker races to their own fingerprint
    // and downgrade to warning so alerting rules don't escalate on them.
    if (isMapLibreWorkerNullMessage(event)) {
      event.level = "warning";
      event.fingerprint = ["maplibre-actor-null-data"];
      event.tags = {
        ...(event.tags ?? {}),
        upstream_known_bug: "maplibre-actor-null-data",
        feature: "map",
      };
    }
    return event;
  },
});

// Required by @sentry/nextjs to instrument client-side navigations
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
