# Running TrueRisk on a Cubepath low-spec VPS (gp.nano / gp.micro)

> **Migration update — 2026-05-08:** This runbook was originally drafted for **gp.nano**
> (1 vCPU / 2 GB / 40 GB / 3 TB). The actual migration target was upgraded at provision
> time to **gp.micro** (2 vCPU / 4 GB / 80 GB / 5 TB) because gp.nano left no headroom
> for Dokploy + Postgres + the app stack. The gp.micro deployment runs in **full-features
> mode** — TFT forecasts, APScheduler, and all AI features (chat, summaries, suggestions,
> narrative, emergency plan) are **enabled**, matching the gp.starter feature set.
>
> Live state on `194.26.100.154` (vps25182.cubepath.net):
> - Bootstrap was handled by Cubepath's one-click Dokploy template (Docker 28.5.0, Compose
>   plugin, Dokploy on Swarm with `dokploy-traefik` + `dokploy` + `dokploy-redis` +
>   `dokploy-postgres` already running). The script in
>   `scripts/migrate-to-nano/bootstrap-host.sh` is **not used**.
> - 2 GB swap file (`/swapfile`) was added manually post-provision; `vm.swappiness=10`.
>   The 4 GB host with swap comfortably fits the prod limits (frontend 512 MB +
>   backend 2 GB + db 1 GB ≈ 3.5 GB).
> - Compose-file argument in Dokploy: **`-f docker-compose.prod.yml` only** (no nano overlay).
> - Env vars: skip the "Change for nano (override starter values)" section in
>   `scripts/migrate-to-nano/env-vars-checklist.md`. Only the "Critical to carry exactly"
>   and "Carry as-is" sections apply. `OPENAI_API_KEY` is carried over (not blanked).
> - `verify-nano.sh`'s **chat-503 check is invalid** in full-features mode — chat returns
>   200. Either skip that check, temporarily set `ENABLE_CHAT=false` to validate the kill
>   switch, or run an updated verifier that asserts `200` for chat.
>
> The kill-switch infrastructure (`ENABLE_SCHEDULER`, `ENABLE_TFT_FORECASTS`, the frontend
> `MaintenanceCard`, the chat 503 guard) ships unchanged and remains available as a
> graceful-degradation path if RAM pressure ever forces a downgrade. The
> `docker-compose.nano.yml` overlay and `.env.production.nano.example` are preserved
> in-tree as the **conservative-mode** runbook for any future downsizing or short-term
> resource crunch — apply them by switching the compose argument to
> `-f docker-compose.prod.yml -f docker-compose.nano.yml` and appending the nano-override
> env block.

## Target sizing
- **Live (gp.micro):** 2 vCPU, 4 GB RAM, 80 GB disk, 5 TB bandwidth, +2 GB swap.
- **Conservative-mode reference (gp.nano):** 1 vCPU, 2 GB RAM, 40 GB disk, 3 TB bandwidth.
- Expected load: 1–2 concurrent users, low-frequency requests.
- No active development; goal is uninterrupted availability with zero ongoing maintenance.

## What changes vs. the gp.starter deployment
| Capability | gp.starter | gp.micro (live) | gp.nano (conservative-mode) |
| --- | --- | --- | --- |
| TFT probabilistic forecasts | enabled | enabled | disabled (deterministic score-based fallback) |
| APScheduler 6h pipeline + frequent checks | enabled | enabled | disabled |
| AI summaries / chat (OpenAI) | enabled | enabled | disabled (HTTP 503) |
| Daily backup-cron container | enabled | enabled | disabled (manual on-demand) |
| Gunicorn workers | 2 | 2 | 1 |
| Postgres shared_buffers | default | default | 96 MB |
| Sentry traces sample rate | 0.1 | 0.1 | 0.01 |

Citizen-facing UI continues to function on either tier: risk scores, alerts, weather,
push, auth, maps, offline pack. On gp.nano the AI surfaces render the
`MaintenanceCard` ("Feature paused") instead of crashing.

## Pre-flight (do 24 h before cutover)
1. **Lower DNS TTL** for `truerisk.cloud` (and any subdomains) to 300 s in your DNS
   provider. This lets you cut over quickly without hours of stale resolution. *Done
   for the 2026-05-08 migration: both `@` and `api` A records moved to TTL 300.*
2. **Take a fresh dump** from the gp.starter host now and copy it to your laptop, even
   if you'll take another one on cutover day. Cheap insurance.
3. **Open the gp.starter Dokploy panel** and read every env var. Use
   `scripts/migrate-to-nano/env-vars-checklist.md` to know which to copy. For full-
   features mode you carry **all** of them verbatim (including `OPENAI_API_KEY`); for
   conservative mode you also append the nano-override block.
4. **Read** `scripts/migrate-to-nano/env-vars-checklist.md` — the `FIELD_ENCRYPTION_KEY`
   and `VAPID_*` keys must be copied verbatim or you'll break encrypted data and push
   subscriptions.
5. **Confirm Cubepath access** — log in, verify you can provision the target plan in
   the same region as the current starter.

## Provisioning the new VPS
1. In the Cubepath panel, **do not delete gp.starter yet**. Provision the new VPS
   alongside it. *For the 2026-05-08 migration, gp.micro was provisioned via Cubepath's
   one-click Dokploy template, which pre-installs Docker + Dokploy on a Debian 12 base.*
2. **If using the Dokploy one-click template (recommended path):** SSH in once and add a
   2 GB swap file — the template does not configure swap by default:
   ```
   ssh root@<new-ip> 'fallocate -l 2G /swapfile && chmod 600 /swapfile && \
     mkswap /swapfile && swapon /swapfile && \
     echo "/swapfile none swap sw 0 0" >> /etc/fstab && \
     sysctl -w vm.swappiness=10 && \
     (grep -q "^vm.swappiness" /etc/sysctl.conf || echo "vm.swappiness=10" >> /etc/sysctl.conf)'
   ```
3. **If provisioning a bare VPS (no Dokploy template):** install Docker, swap, and
   Dokploy in one shot:
   ```
   curl -fsSL https://raw.githubusercontent.com/javierdejesusda/TrueRisk/main/scripts/migrate-to-nano/bootstrap-host.sh | sudo bash
   ```
   The script is idempotent. Source: `scripts/migrate-to-nano/bootstrap-host.sh`.
4. Register the same Git repo / compose project in Dokploy as the starter has.
5. In the Dokploy compose configuration, set the compose-file argument:
   - **Full-features (gp.micro / 4 GB+):** `-f docker-compose.prod.yml`
   - **Conservative-mode (gp.nano / 2 GB):** `-f docker-compose.prod.yml -f docker-compose.nano.yml`
6. Populate environment variables from your pre-flight temp file. Reference:
   `scripts/migrate-to-nano/env-vars-checklist.md`. For full-features mode, skip the
   "Change for nano (override starter values)" block.

## Migrating data
1. On the **starter** host, take a final dump:
   `docker compose -f docker-compose.prod.yml --profile backup run --rm backup`
   then copy `/var/lib/docker/volumes/<project>_backups/_data/<latest>.sql.gz` to your
   laptop (or directly to the new VPS via `scp`).
2. On the **new** host, after Dokploy has started the stack at least once (so the `db`
   volume exists), restore. Adjust the compose argument to match the deployment mode:
   ```
   # Full-features (gp.micro):
   gunzip -c <dump>.sql.gz | docker compose -f docker-compose.prod.yml exec -T db psql -U "$POSTGRES_USER" "$POSTGRES_DB"

   # Conservative-mode (gp.nano):
   gunzip -c <dump>.sql.gz | docker compose -f docker-compose.prod.yml -f docker-compose.nano.yml exec -T db psql -U "$POSTGRES_USER" "$POSTGRES_DB"
   ```
3. Run migrations: Dokploy's compose runs the `migrate` one-off on each deploy; trigger
   a redeploy.

## Cutover
1. Run the smoke test against the Dokploy preview URL:
   ```
   bash scripts/migrate-to-nano/verify-nano.sh https://<dokploy-preview-url>
   ```
   The script asserts: frontend 200, `/api/v1/health` 200, **chat 503**, province
   forecast contains `q50`. Source: `scripts/migrate-to-nano/verify-nano.sh`.
   - In **conservative-mode** all four checks should pass as-is.
   - In **full-features mode** the chat-503 check will fail (chat returns 200). Either
     skip it, temporarily set `ENABLE_CHAT=false` in Dokploy to assert the kill-switch
     path and then revert, or run a manual `curl` for the chat check expecting 200.
2. Hit a few citizen pages in a browser via the preview URL. Confirm risk scores render.
   - Conservative-mode: chat / AI summary surfaces show the "Feature paused" maintenance
     card rather than crashing.
   - Full-features mode: chat / AI summary surfaces work as on gp.starter.
3. Watch `docker stats` for 10 minutes under synthetic browsing.
   - **gp.micro full-features:** backend should sit under ~1.6 GB RSS, frontend under
     ~400 MB, db under ~600 MB. Swap usage should stay <500 MB; sustained swap pressure
     means it's time to switch to conservative-mode.
   - **gp.nano conservative-mode:** backend under 600 MB, frontend under 350 MB, db
     under 280 MB.
4. Update DNS A records for `truerisk.cloud` and `api.truerisk.cloud` to point at the
   new IP. TTL should already be ≤300 s from the pre-flight step.
5. After DNS propagates, re-run the smoke test against the live URL:
   ```
   bash scripts/migrate-to-nano/verify-nano.sh https://truerisk.cloud
   ```
6. Leave the starter running for **48 hours** as rollback insurance.
7. Take one more dump from the new host (now-authoritative) to your laptop.
8. Delete the gp.starter VPS in the Cubepath panel.

## Reverting / cross-tier moves
The codebase defaults to gp.starter behaviour, so no code revert is needed at any tier.
The differences are purely the compose argument, env block, and target sizing:
- **back to gp.starter or any ≥4 GB host:** deploy with only `-f docker-compose.prod.yml`,
  the standard `.env.production` (no nano additions). Restore the most recent dump.
- **down to gp.nano (conservative-mode) without re-provisioning:** in Dokploy, change
  the compose argument to `-f docker-compose.prod.yml -f docker-compose.nano.yml` and
  append the nano-override env block from `.env.production.nano.example`. Redeploy.
- **back up to full-features without re-provisioning:** drop the second `-f` argument
  and remove the nano-override env keys. Redeploy.

## Health & no-maintenance posture
- All containers use `restart: unless-stopped`; OOM kills auto-recover.
- Sentry alerts surface frontend crashes; with sample rate 0.01 (conservative-mode) or
  0.1 (full-features) the free tier should remain comfortable for 1–2 users.
- Disable Dokploy's auto-update of the compose stack to avoid surprise redeploys when
  the repo gets stray commits.
- Quarterly: log in and run `docker system prune -af --volumes` (skip the `pgdata` and
  `backups` volumes — they are named, not anonymous).
- On gp.micro full-features, watch `free -h` swap usage during the first week. If it
  consistently exceeds ~1 GB and `docker stats` shows backend RSS pinned to its limit,
  flip to conservative-mode rather than upsizing — see the cross-tier section above.
