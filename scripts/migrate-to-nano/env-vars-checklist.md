# gp.nano / gp.micro env-var carry-over checklist

> **Migration update — 2026-05-08:** The 2026-05-08 migration target is **gp.micro**
> (4 GB RAM) running in **full-features mode**, not gp.nano. In full-features mode
> the "Change for nano (override starter values)" and "Omit on nano (intentionally
> empty)" sections below **do not apply** — every value, including `OPENAI_API_KEY`,
> is carried over verbatim from the gp.starter Dokploy panel. The conservative-mode
> sections are preserved here as the runbook for any future downsize to gp.nano or
> for a temporary degradation to relieve memory pressure.

When migrating from gp.starter to a smaller plan, the source of truth for secrets is
**the gp.starter Dokploy panel**, not the local `.env.production.example` file. Open
both Dokploy panels side by side and copy values per the tables below.

## Critical to carry exactly (data integrity)

| Var | Why exact match matters |
| --- | --- |
| `FIELD_ENCRYPTION_KEY` | Application-level encrypted columns are unreadable if this changes. Restoring a dump with a different key corrupts every encrypted field. |
| `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | The dump expects the same role/db owner. Mismatch breaks restore. |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` | Existing browser push subscriptions are bound to this keypair. Changing them invalidates every active subscription silently. |

## Carry as-is, low risk if changed

| Var | Notes |
| --- | --- |
| `JWT_SECRET` | Changing logs everyone out (they re-authenticate). Acceptable if you're OK with that. |
| `NEXTAUTH_SECRET` | Same as above. |
| `NEXTAUTH_URL` | Stays `https://truerisk.cloud` — no change. |
| `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` | Same Sentry project, same DSNs. |
| `NEXT_PUBLIC_SENTRY_ENVIRONMENT` | Keep `production`. |
| `AEMET_API_KEY`, `FIRMS_MAP_KEY`, `CDSAPI_KEY`, `OPENAQ_API_KEY` | External API keys. Not strictly required if the corresponding feature is unused; carry them so nothing silently breaks. |
| `RESEND_API_KEY` | Email sending. Carry if you want emails to keep working. |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_MESSAGING_SERVICE_SID`, `TWILIO_FROM_PHONE` | SMS. Same as above. |

## Change for nano (conservative-mode only — skip on gp.micro full-features)

These come from `.env.production.nano.example`. **Apply only when targeting gp.nano
or another sub-2-GB host with the `docker-compose.nano.yml` overlay active.** On
gp.micro full-features, leave these unset so the upstream defaults (or the values
already configured on gp.starter) apply.

```
WORKERS=1
ENABLE_SCHEDULER=false
ENABLE_TFT_FORECASTS=false
SENTRY_TRACES_SAMPLE_RATE=0.01
NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=0.01
NEXT_PUBLIC_DISABLED_FEATURES=ai_summary,chat,suggestions,narrative,emergency_plan
```

## Omit on nano (conservative-mode only)

| Var | Effect |
| --- | --- |
| `OPENAI_API_KEY` | **Conservative-mode only.** Leave empty so backend returns HTTP 503 for AI summary, chat, suggestions, narrative, and emergency-plan; frontend renders the maintenance card. **In full-features mode, carry it over verbatim** from gp.starter. |

## Workflow

### Full-features mode (gp.micro, 2026-05-08 migration)

1. In gp.starter Dokploy: open the compose project → environment variables.
2. Click reveal/copy each value (do NOT screenshot — values include secrets).
3. In a temporary local file (in your password manager, not committed), paste **every**
   value, including `OPENAI_API_KEY`. Skip the "Change for nano" overrides above.
4. In the new Dokploy panel: paste the block into the env block of the compose project,
   save, redeploy.
5. Delete the temporary local file once the new stack is healthy.

### Conservative-mode (gp.nano or temporary degradation)

1. Steps 1–2 as above.
2. In a temporary local file, paste the carry-over values **except** `OPENAI_API_KEY`
   (leave it empty).
3. Append the nano overrides from `.env.production.nano.example`.
4. In Dokploy: paste the resulting block, save, redeploy.
5. Delete the temporary local file once the stack is healthy.

## Sanity check before cutover

After the new stack is up but before flipping DNS:

```
bash scripts/migrate-to-nano/verify-nano.sh https://<dokploy-preview-url>
```

- **Conservative-mode:** all four checks should pass as-written.
- **Full-features mode:** the chat-503 check will fail (chat returns 200). Either skip
  it, temporarily set `ENABLE_CHAT=false` in Dokploy to assert the kill-switch path and
  then revert, or run a manual chat `curl` expecting 200.
