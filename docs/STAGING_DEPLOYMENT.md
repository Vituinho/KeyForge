# First real KeyForge staging deployment

Status: preparation only. No Railway/Vercel service, remote migration, push or deployment has been performed. Staging is **not verified or approved** until the real-service evidence in [STAGING_VERIFICATION.md](STAGING_VERIFICATION.md) is complete. Existing production services and player data must remain untouched.

## 1. Freeze and identify the candidate

Start from this local repository, including migration commits `fabaa38`, `ffafa55`, `c833a58`, `14888e0`, `66d721d` and the subsequent staging-preparation commits. Do not reset to the older remote. Record `git rev-parse HEAD`, `git status --porcelain`, Node version, migration checksums and the `npm run verify:release` log directory. The tree must be clean and every release gate must pass.

The owner must separately authorize publishing this exact candidate and creating/deploying staging resources. Connecting a Git source can trigger an initial deployment or autodeploy: keep these disabled until variables and the database are ready. Do not push or connect the existing production project as a shortcut. Pin the deployed commit/image in the evidence record.

Use a dedicated **Railway staging project** with its own PostgreSQL service/volume and backend, and a dedicated **Vercel staging project**. Do not clone production secrets, mount its volume, link its database or import player exports for this first test. Two test accounts will be registered normally through the staging UI; no database seed or manual XP/ownership edits are needed.

## 2. Reserve stable hostnames and configure variables

Choose one stable HTTPS frontend hostname and one HTTPS backend hostname. Both origins have no path or trailing slash. WebSocket uses the backend hostname with `wss://.../ws`. Use these same hostnames throughout the test; random preview hostnames are intentionally not trusted.

Create two independent cryptographically random secrets, each at least 32 characters, in the secret manager. Never commit their values. The proxy secret must match on both services. Keep the auth secret unchanged across restart/rollback so existing session signatures remain valid.

| Variable NAME | Railway staging backend | Vercel staging frontend | Operator only |
| --- | --- | --- | --- |
| `DATABASE_URL` | Private PostgreSQL URL for non-owner `keyforge_app` | Never | — |
| `DATABASE_MIGRATION_URL` | Never in running backend (production startup rejects it) | Never | Temporary reviewed owner URL |
| `BETTER_AUTH_SECRET` | Unique staging auth secret | Never | Store securely for recovery |
| `BACKEND_PROXY_SECRET` | Unique staging proxy secret | Same secret, server only | — |
| `FRONTEND_ORIGIN` | Exact staging HTTPS frontend origin | Same exact origin, server only | — |
| `BACKEND_URL` | — | Exact staging HTTPS backend origin, server only | — |
| `NEXT_PUBLIC_BACKEND_WS_URL` | — | Staging WSS backend URL ending `/ws` | — |
| `NEXT_PUBLIC_SITE_URL` | — | Exact staging HTTPS frontend origin | — |
| `NODE_ENV` | `production` | Set by Vercel | — |
| `PORT` | Supplied by Railway; do not hardcode a development port | — | — |
| `RAILWAY_DOCKERFILE_PATH` | `backend/Dockerfile` | — | — |
| `RAILWAY_DEPLOYMENT_OVERLAP_SECONDS` | `0` | — | — |
| `RAILWAY_DEPLOYMENT_DRAINING_SECONDS` | `30` | — | — |

Safe templates: root `.env.staging.backend.example` and `.env.staging.frontend.example`. Replace all placeholders; use the platform secret store rather than uploading an environment file. `.env.local` currently contains local-development origin names only and is ignored by Git. The Docker build excludes environment files, downloaded platform configuration and backup artifacts. Only the two public URL variables above belong in `NEXT_PUBLIC_*`. Never put secrets in `next.config.env`, public variables or browser bundles.

## 3. Isolated database, backup and explicit migrations

Create the PostgreSQL service/volume only in the new staging project. Use PostgreSQL 18 to match local validation and record `SHOW server_version`; do not upgrade an existing production service or volume. Review its project/environment/service IDs and connection identity before issuing SQL. Create an empty `keyforge_staging` database there, or consistently use the isolated service's actual database name. Never create/drop/reset a database in a production service.

Use Node 24, `npm ci` and `npm run backend:generate` in an authorized operator checkout/job. Private Railway hostnames resolve inside its private network, not an ordinary local terminal. Run migrations from an authorized one-off operator job on that network, or use a separately authorized temporary staging-only connection with appropriate TLS and restricted access. The pruned backend runtime image deliberately has no migration CLI. Do not install it or add owner credentials to the running app.

Before every migration, make a backup using the procedure below, confirm the target identity, and inspect `backend/prisma/migrations`. Set `DATABASE_MIGRATION_URL` **only in the operator session**, then execute:

```text
npx prisma migrate status
npm run db:migrate
npx prisma migrate status
```

The first status may report pending migrations; do not mistake that expected result for permission to reset. The final status must show the three reviewed migrations applied: `202610100001_backend`, `202610100002_identity_integrity`, `202610100003_database_boundaries`. Never run `migrate dev`, `migrate reset`, `db push`, a seed script or a destructive down migration against staging/production. Applying these reviewed migrations is a separately authorized remote write; none has been applied during preparation.

Create the runtime login as owner in this staging database. Set its password interactively using `psql`'s `\password keyforge_app` or the secret manager/operator channel, not a committed SQL literal:

```sql
CREATE ROLE keyforge_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
GRANT CONNECT ON DATABASE keyforge_staging TO keyforge_app;
GRANT USAGE ON SCHEMA public TO keyforge_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO keyforge_app;
REVOKE ALL ON "_prisma_migrations" FROM keyforge_app;
REVOKE CREATE ON SCHEMA public FROM keyforge_app, PUBLIC;
```

Verify `current_database()`, `current_user`, administrative-role flags, table ownership, inherited memberships, absence of schema CREATE and migration-ledger access using the actual runtime connection. Set backend `DATABASE_URL` to this login's **private** connection, not the owner URL. Recheck grants after future migrations. Remove owner credentials from the migration job/session when finished. Keep production exports and legacy imports outside this first staging test; their separate owner-reviewed policy is in [BACKEND_DEPLOYMENT.md](BACKEND_DEPLOYMENT.md).

## 4. Railway backend

Use repository root as build context, `RAILWAY_DOCKERFILE_PATH=backend/Dockerfile`, and confirm build logs show Dockerfile detection. Keep the Dockerfile's exec-form `CMD` (`node backend/dist/server.mjs`); do not replace it with `npm start`, which starts the frontend. It builds with Node 24, generates Prisma, compiles TypeScript, prunes development dependencies and runs as OS user `node`. No secret build arguments or database access are required to build.

Set the following explicitly in the **new** service's dashboard: one replica in one region, no additional multi-region replicas, `/health`, healthcheck timeout 120 seconds, restart policy On Failure with five retries, no pre-deploy/migration command, and no serverless sleeping for this real-time service. Let Railway inject `PORT`; the backend validates it and binds `0.0.0.0`. Set overlap 0 and draining 30 seconds. The server closes WebSockets with 1012, bounds their close handshake at two seconds, drains HTTP and disconnects Prisma; its 25-second shutdown deadline fits inside that budget.

Do not rely on `railway.toml` for a first deployment. Current Railway documentation deprecates Config as Code and states that new services cannot opt into it; this file is retained only for legacy compatibility. This runbook uses explicit dashboard settings and supported Dockerfile/teardown variables. No IaC apply or remote configuration command has been run. [Railway configuration status](https://docs.railway.com/infrastructure-as-code), [Dockerfile selection](https://docs.railway.com/builds/dockerfiles), [teardown](https://docs.railway.com/deployments/deployment-teardown).

Generate the backend HTTPS domain mapped to the injected port and verify `/health` returns 200 only with database connectivity. Database outage must return 503 with no internal details. The probe checks connectivity; authentication/API smoke tests separately verify schema and permissions. Configure ongoing monitoring separately: Railway's deployment probe is not continuous monitoring. [Healthchecks](https://docs.railway.com/deployments/healthchecks).

Expose `/ws` on this same backend/port, preserving HTTP Upgrade. Do not route WebSocket through a Next function or add a proxy that strips Upgrade. Test actual 101 upgrade, authenticated messages, ping/pong and reconnect over WSS. HTTP `/api/*` requires the server-only proxy secret; `/health` is public and `/ws` authenticates separately using a one-use ticket.

Keep one serving backend process for the test. Before subsequent deployments, finish/drain active test matches and pause new test sessions; rolling deployments can briefly create old/new processes despite one steady-state replica. Process-local presence/fanout are not a distributed deployment guarantee. A restart exceeding the existing 15-second opponent grace may legitimately end a match; do not change gameplay rules to hide it.

## 5. Vercel frontend

Select repository root and the Next.js preset in the dedicated staging project. `vercel.json` pins install to `npm ci` and build to `npm run backend:generate && npm run build`. `package.json` requires Node 24.x; confirm the build log/runtime version. Prisma generation supports the repository-wide type check and does not need a database or auth credential on Vercel. [Vercel build configuration](https://vercel.com/docs/project-configuration/vercel-json), [Node version selection](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).

Set only the frontend variables in the table. Rebuild for public URL changes. A dedicated staging project's environment may be labeled Production by Vercel: it must still point to **staging** Railway and the stable staging hostname, never the live KeyForge project/database. Configure staging access controls/tester access without changing production protection. Do not broaden trusted origins to every `*.vercel.app` preview.

HTTP stays first-party: browser → frontend `/api/backend/*` → Railway. Better Auth has a fixed frontend `baseURL`, exact trusted origin, database sessions, disabled cookie cache, HttpOnly/Secure/SameSite=Lax/host-only cookies. Proxying avoids cross-site cookie dependence even when Railway and Vercel domains differ. Do not add SameSite=None, shared cookie domains or browser database/session secrets as a workaround. Verify this in real browsers, including Safari where available. [Better Auth proxy/cookie guidance](https://better-auth.com/docs/concepts/cookies).

The Next proxy copies an explicit header allowlist, overwrites the backend secret and supplies Vercel's trusted client IP. Better Auth does not derive its origin from browser-supplied forwarded host/protocol headers. Test the deployed proxy chain: forged headers must not change origin, identity or rate-limit source. Both proxy and backend reject mutation origins that differ from `FRONTEND_ORIGIN`; CORS alone is not authorization.

The browser obtains a short-lived one-use WebSocket ticket through this cookie-authenticated HTTP path, then connects directly to WSS. Each reconnect obtains a new ticket and server snapshot; the backend checks current session and room membership. Typing and word advancement remain local while submissions queue in order. Do not wait for network acknowledgements before rendering keystrokes.

## 6. Backup and restore procedure

Before migration, deployment or reviewed import, record exact staging resource IDs, commit/image, migration status/checksums, role/grant configuration, secret-store references (not values) and backup timestamp. Configure Railway volume backups/retention for the isolated PostgreSQL service; verify the plan supports the intended schedule and storage. Separately retain an encrypted logical backup off the application volume, accessible only to authorized operators.

Use PostgreSQL tools compatible with the server version. Prefer a protected PostgreSQL service file plus password file/secret channel so credentials do not appear in shell history. `PGSERVICE` below must identify only the reviewed staging-owner connection. These are future authorized operator commands, not commands executed against remote data during preparation:

```text
psql -X -v ON_ERROR_STOP=1 -c "SELECT current_database(), current_user, inet_server_addr(), inet_server_port()"
pg_dump --format=custom --file=/SECURE_LOCATION/keyforge-staging-before.dump
pg_restore --list /SECURE_LOCATION/keyforge-staging-before.dump
```

Require successful exit codes and record SHA-256, size and timestamp before encrypting/uploading the dump. Archive role/grant setup and protected secret references separately: `pg_dump` does not back up cluster roles or external secrets. Password hashes/sessions/player data in backups are sensitive; never put dumps, role passwords or auth headers in Git, build contexts or public evidence.

A listing is not a restore test. Provision a **second empty isolated restore database**, verify its identity, and define a protected PostgreSQL service entry named `keyforge_staging_restore` pointing only to that empty target. Set `PGSERVICE` to this entry for the identity check and explicitly supply it to `pg_restore` so restoration cannot fall back to SQL output:

```text
pg_restore --dbname="service=keyforge_staging_restore" --no-owner --no-acl --exit-on-error /SECURE_LOCATION/keyforge-staging-before.dump
```

This restores to the connection chosen by the operator; never point it at a live/populated database. Reapply reviewed non-owner grants and migration-ledger restrictions, then verify users/sessions, profiles, inventory, campaign records, match state/events, receipts and the three migration records. Test login/session and duplicate reward claims against the restored staging copy. Do not use `--clean`, drop the original database or overwrite a running service. Local automated tests also exercise dump/restore, but do not verify remote backup retention or recovery.

## 7. Two-account validation and acceptance

Register accounts A and B through the actual HTTPS staging frontend with controlled test inboxes and unique passwords. Use separate browser profiles/devices. Follow [STAGING_VERIFICATION.md](STAGING_VERIFICATION.md) for auth, persistence, genuine practice/campaign/PvP progression, private/quick rooms, simultaneous actions, duplicate claims, restart, reconnect, cookies/CSRF and negative authorization checks. Do not edit server timestamps or seed victories for deployed tests; those fixtures are restricted to disposable local databases.

Record timestamps, immutable deployment IDs/commit, browser/device, sanitized request/event IDs and observed outcomes. Store passwords/cookies only in the secret manager/browser; redact credentials in logs/screenshots. Complete all actual-service checks before changing the status from NOT VERIFIED. Failing auth, cross-account access, duplicate rewards, missing persistence or reconnect is a staging rejection, not a reason to relax safeguards.

## 8. Rollback

If any security/persistence check fails, stop tester access and new matches, preserve logs/evidence and take a fresh backup. Do not reset accounts, receipts or migration history to make tests pass.

If a known-good deployment exists **within this backend architecture** and the schema is compatible, roll the staging frontend and backend back to their recorded immutable versions. Preserve origin/secret/database settings, one replica and grants. Application rollback does not roll back SQL. Recheck health, two-account sessions/inventory, receipts and WSS before reopening staging. Do not roll back to the older remote/provider-based code.

For the first deployment there is no validated Railway baseline: disable/stop the isolated staging application, retain its database/volume/backups and fix forward. Production remains untouched. For an incompatible/failed schema change, keep writes paused and restore the pre-change backup to a **new isolated database**, apply secure grants, validate it, then explicitly authorize switching only the staging backend connection to that restored copy. Keep the original database for investigation. Never execute a destructive down migration or overwrite production.

## 9. Remaining launch gates

Actual Docker construction/Linux signal delivery, Railway HTTPS/WSS/networking, Vercel cookies/proxy/IP behavior, remote grants, backup/restore and real browser/two-account evidence remain pending until an authorized deployment. Email verification/recovery delivery still needs a provider decision; content-rights gates and existing development-tool advisories remain. Multiple replicas are unsupported. Preparing this runbook and passing local tests does not make staging or public competitive launch approved.
