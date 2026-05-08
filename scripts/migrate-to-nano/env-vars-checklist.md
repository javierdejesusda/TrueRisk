# gp.nano env-var carry-over checklist

When migrating from gp.starter to gp.nano, the source of truth for secrets is
**the gp.starter Dokploy panel**, not the local `.env.production.example`
file. Open both Dokploy panels side by side and copy values per the table
below.

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

## Change for nano (override starter values)

These come from `.env.production.nano.example`:

```
WORKERS=1
ENABLE_SCHEDULER=false
ENABLE_TFT_FORECASTS=false
SENTRY_TRACES_SAMPLE_RATE=0.01
NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=0.01
NEXT_PUBLIC_DISABLED_FEATURES=ai_summary,chat,suggestions,narrative,emergency_plan
```

## Omit on nano (intentionally empty)

| Var | Effect |
| --- | --- |
| `OPENAI_API_KEY` | Leave empty. Backend returns HTTP 503 for AI summary, chat, suggestions, narrative, emergency-plan. Frontend renders the maintenance card. |

## Workflow

1. In gp.starter Dokploy: open the compose project → environment variables.
2. Click reveal/copy each value listed above (do NOT screenshot — values include secrets).
3. In a temporary local file (`~/Desktop/nano-envs.txt`, in your password
   manager, anything that's not committed), paste the carried values.
4. Append the nano overrides from `.env.production.nano.example`.
5. In gp.nano Dokploy: paste the resulting block into the env block of the
   compose project, save, redeploy.
6. Delete the temporary local file once the gp.nano stack is healthy.

## Sanity check before cutover

After the gp.nano stack is up but before flipping DNS:

```
bash scripts/migrate-to-nano/verify-nano.sh https://<dokploy-preview-url>
```

All four checks should pass.
