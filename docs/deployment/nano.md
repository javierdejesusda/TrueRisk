# Running TrueRisk on a Cubepath gp.nano VPS

## Target sizing
- 1 vCPU, 2 GB RAM, 40 GB disk, 3 TB bandwidth.
- Expected load: 1–2 concurrent users, low-frequency requests.
- No active development; goal is uninterrupted availability with zero ongoing maintenance.

## What changes vs. the gp.starter deployment
| Capability | gp.starter | gp.nano |
| --- | --- | --- |
| TFT probabilistic forecasts | enabled | disabled (deterministic score-based fallback) |
| APScheduler 6h pipeline + frequent checks | enabled | disabled |
| AI summaries / chat (OpenAI) | enabled | disabled (HTTP 503) |
| Daily backup-cron container | enabled | disabled (manual on-demand) |
| Gunicorn workers | 2 | 1 |
| Postgres shared_buffers | default | 96 MB |
| Sentry traces sample rate | 0.1 | 0.01 |

Citizen-facing UI continues to function: risk scores, alerts, weather, push, auth, maps, offline pack.

## Pre-flight (do 24 h before cutover)
1. **Lower DNS TTL** for `truerisk.cloud` (and any subdomains) to 300 s in your DNS provider. This lets you cut over quickly without hours of stale resolution.
2. **Take a fresh dump** from the gp.starter host now and copy it to your laptop, even if you'll take another one on cutover day. Cheap insurance.
3. **Open the gp.starter Dokploy panel** and read every env var. Use `scripts/migrate-to-nano/env-vars-checklist.md` to know which to copy and which to override; paste the carry-overs into a temp file in your password manager.
4. **Read** `scripts/migrate-to-nano/env-vars-checklist.md` — the `FIELD_ENCRYPTION_KEY` and `VAPID_*` keys must be copied verbatim or you'll break encrypted data and push subscriptions.
5. **Confirm Cubepath access** — log in, verify you can provision a gp.nano in the same region as the current starter.

## Provisioning the new VPS
1. In the Cubepath panel, **do not delete gp.starter yet**. Provision a new gp.nano alongside it.
2. SSH in. Install Docker, create 2 GB swap, install Dokploy in one shot:
   ```
   curl -fsSL https://raw.githubusercontent.com/javierdejesusda/TrueRisk/main/scripts/migrate-to-nano/bootstrap-host.sh | sudo bash
   ```
   The script is idempotent — re-run it if anything fails partway. Source: `scripts/migrate-to-nano/bootstrap-host.sh`.
3. Register the same Git repo / compose project in Dokploy as the starter has.
4. In the Dokploy compose configuration, set the compose-file argument to:
   `-f docker-compose.prod.yml -f docker-compose.nano.yml`
5. Populate environment variables from your pre-flight temp file (carry-overs + nano overrides). Reference: `scripts/migrate-to-nano/env-vars-checklist.md`.

## Migrating data
1. On the **starter** host, take a final dump:
   `docker compose -f docker-compose.prod.yml --profile backup run --rm backup`
   then copy `/var/lib/docker/volumes/<project>_backups/_data/<latest>.sql.gz` to your laptop.
2. On the **nano** host, after Dokploy has started the stack at least once (so the `db` volume exists), restore:
   ```
   gunzip -c <dump>.sql.gz | docker compose -f docker-compose.prod.yml -f docker-compose.nano.yml exec -T db psql -U "$POSTGRES_USER" "$POSTGRES_DB"
   ```
3. Run migrations: Dokploy's compose runs the `migrate` one-off on each deploy; trigger a redeploy.

## Cutover
1. Run the smoke test against the Dokploy preview URL:
   ```
   bash scripts/migrate-to-nano/verify-nano.sh https://<dokploy-preview-url>
   ```
   All four checks must pass (frontend 200, health 200, chat 503, province forecast contains q50). Source: `scripts/migrate-to-nano/verify-nano.sh`.
2. Hit a few citizen pages in a browser via the preview URL. Confirm risk scores render with deterministic forecasts; chat / AI summary surfaces show the "Feature paused" maintenance card rather than crashing.
3. Watch `docker stats` for 10 minutes under your synthetic browsing — backend should sit under 600 MB RSS, frontend under 350 MB, db under 280 MB.
4. Update DNS A record for `truerisk.cloud` (and any subdomains) to point at the nano IP. TTL should already be ≤300 s from the pre-flight step.
5. After DNS propagates, re-run the smoke test against the live URL:
   ```
   bash scripts/migrate-to-nano/verify-nano.sh https://truerisk.cloud
   ```
6. Leave the starter running for **48 hours** as rollback insurance.
7. Take one more dump from the nano (now-authoritative) to your laptop.
8. Delete the gp.starter VPS in the Cubepath panel.

## Reverting to gp.starter
If at any point you want the full feature set back:
1. Provision a gp.starter (or any host with ≥4 GB RAM).
2. Deploy with **only** `-f docker-compose.prod.yml` (no nano overlay) and the standard `.env.production` (no nano additions).
3. Restore the most recent dump.
4. Switch DNS back.
The codebase changes (config flags) default to the starter behaviour, so no code revert is needed.

## Health & no-maintenance posture
- All containers use `restart: unless-stopped`; OOM kills auto-recover.
- Sentry alerts surface frontend crashes; with sample rate 0.01 the free tier should never fill.
- Disable Dokploy's auto-update of the compose stack to avoid surprise redeploys when the repo gets stray commits.
- Quarterly: log in and run `docker system prune -af --volumes` (skip the `pgdata` and `backups` volumes — they are named, not anonymous).
