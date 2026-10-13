# KeyForge backend migration and staging

The current local history preserves the six security commits and replaces their infrastructure with Fastify, Better Auth, Prisma and PostgreSQL. The existing Next.js app remains the frontend. No external deployment, production SQL, push or deletion of player data has been performed. Local verification is distinct from Railway/Vercel staging verification.

For the first real deployment, follow [STAGING_DEPLOYMENT.md](STAGING_DEPLOYMENT.md) and complete [STAGING_VERIFICATION.md](STAGING_VERIFICATION.md). They add explicit isolated-resource setup, backups, rollback and real two-account acceptance; preparing these files does not approve staging.

## Architecture

Browser HTTP requests use `/api/backend/*` on the frontend origin. A small Next route forwards to the Railway API with a server-only proxy secret. Better Auth uses database sessions and first-party HttpOnly cookies (Secure in production, SameSite=Lax). Neither credentials nor session tokens are stored in localStorage. Local auth metadata is display/cache information only.

The backend derives the authenticated account from the session, rejects extra progression fields, and replays issued campaign/practice input through the existing validators and balance functions. PostgreSQL serializable transactions commit profile, inventory, consumed challenge and a unique reward receipt together. Inventory rolls use server cryptographic randomness with existing drop weights, costs and duplicate salvage. Client-provided XP, ranks, wins and selected drops have no write endpoint.

WebSocket connects directly to Railway `/ws`. The browser first requests a 60-second, one-use ticket over authenticated HTTP, then sends it in the first WebSocket frame. The ticket is stored hashed and bound to a live database session. Origin, membership, message size/rate and active sessions are checked. Reconnection requests a new ticket and a persisted snapshot. Combat mutations go through the authoritative API; WebSocket only publishes server snapshots/presence. Word submissions queue locally so key feedback and the next word do not await network acknowledgements. Failed events retain their IDs for ordered retry.

Run **one backend replica** for staging. Set this explicitly in new-service settings as described in the staging runbook; the retained legacy Railway file also specifies one replica. Database transactions remain correct across processes, but socket fanout/presence are process-local; multiple replicas require a shared event bus and cross-process presence before they can be supported.

## Required variables

| Name | Where | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Railway backend only | Private PostgreSQL connection for a non-owner runtime role |
| `DATABASE_MIGRATION_URL` | Operator/migration job only | Database owner connection for reviewed migrations; never expose to the browser or leave in the running app |
| `BETTER_AUTH_SECRET` | Railway backend only | Random secret of at least 32 characters; use a unique strong value |
| `BACKEND_PROXY_SECRET` | Railway backend and Vercel server only | Separate random secret of at least 32 characters; must match on both services |
| `FRONTEND_ORIGIN` | Railway backend and Vercel server | Exact frontend origin, no path or trailing slash; HTTPS in production |
| `BACKEND_URL` | Vercel server only | HTTPS origin of the Railway backend |
| `NEXT_PUBLIC_BACKEND_WS_URL` | Vercel build | `wss://BACKEND_DOMAIN/ws` |
| `NEXT_PUBLIC_SITE_URL` | Vercel build | Canonical HTTPS frontend origin |
| `PORT` | Railway | Platform-assigned listening port; local default 4000 |
| `NODE_ENV` | Railway | `production` |
| `KEYFORGE_TEST_PG_BIN` | Local test runner only, optional | Directory containing initdb, pg_ctl and psql |

The proxy trusts Vercel's overwritten `x-forwarded-for` only when `VERCEL` is set, then supplies the client address with its secret. The backend ignores user-supplied forwarded headers. Local development uses a loopback rate-limit bucket. Better Auth login/signup limits are persisted in PostgreSQL; general HTTP and WebSocket limits supplement them. Review and test the real proxy chain on staging. [Vercel request header behavior](https://vercel.com/docs/headers/request-headers).

## Reproducible local setup

Use Node 24 and PostgreSQL 18. Install with `npm ci`, then `npm run backend:generate`. Copy `.env.example` into local configuration and supply real local values. Next loads `.env.local`; backend scripts intentionally do not load frontend files automatically. Export variables in the shell, or use Node's `--env-file` with a separate ignored backend environment file.

Create a local empty database, set the owner URL **only for the migration command**, and run `npm run db:migrate`. Never run `migrate reset` on an existing database. Start the backend with `npm run backend:dev` (variables already exported), then the frontend with `npm run dev`. Match `FRONTEND_ORIGIN` to the exact localhost URL used in the browser. Guest play and local Academy remain available when the backend is unconfigured; online auth/progression fail closed.

`npm run test:auth` and `npm run test:security:db` create their own loopback-only disposable PostgreSQL cluster and apply migrations. They do not accept an external test/production URL. The API tests use a non-superuser runtime database role. `npm run verify:release` also runs unit/game/balance/i18n/audio/TypeScript/ESLint checks, builds both apps and tests the built backend plus built Next proxy over real local HTTP. PostgreSQL binaries must be installed; tests fail rather than silently skipping database coverage.

## Prisma migrations

Apply the following checked-in migrations in order using `npm run db:migrate`, after backup and review:

1. `202610100001_backend`: persistent identities, sessions, profiles, inventory, challenges, receipts, matches/events, queue, tickets and legacy archives.
2. `202610100002_identity_integrity`: case-insensitive unique usernames. Resolve any pre-existing duplicate names explicitly before applying.
3. `202610100003_database_boundaries`: account/session/match foreign keys, restricted deletion, version constraint and no PUBLIC table/schema-create privileges.

Use a migration owner separately from the backend runtime login. Example grants below assume the owner has created `keyforge_app` with a generated password using a secure operator channel. Do not commit that password or paste it into docs. Run as owner against the intended database; review database name/role first:

```sql
ALTER ROLE keyforge_app NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
GRANT CONNECT ON DATABASE keyforge TO keyforge_app;
GRANT USAGE ON SCHEMA public TO keyforge_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO keyforge_app;
REVOKE ALL ON "_prisma_migrations" FROM keyforge_app;
REVOKE CREATE ON SCHEMA public FROM keyforge_app, PUBLIC;
```

Repeat/review grants when future migrations add tables. Runtime role must not own tables, inherit an owner role, have BYPASSRLS/SUPERUSER or create functions/schemas. Database credentials never go to the browser, and PostgreSQL should use Railway private networking. The app has no generic SQL, direct table CRUD or browser RPC interface. [Railway PostgreSQL](https://docs.railway.com/databases/postgresql).

## Existing records and legacy import

Keep a complete backup/export of the previous database, including identities/password hashes, all old profile/inventory/campaign records, verified records and award ledgers. This repository migration does not connect to or delete the old database. No automatic browser import can establish competitive trust.

The operator-only `npm run db:import -- --file OWNER_EXPORT.json --sha256 REVIEWED_SHA256` checks file integrity and makes no writes. Add `--apply` only after the owner has reviewed the export's provenance and backed up the target. It is not an HTTP endpoint. It imports in one transaction, preserves account UUIDs and original bcrypt password hashes, rejects conflicting existing identities rather than overwriting them, archives the complete original records, and deduplicates by archive hash/account ID. Unsupported/weak password hashes fail explicitly and need an owner-reviewed recovery procedure; they are never converted to plaintext or a fabricated password.

Export format is an array of `{id,email,username,emailVerified,passwordHash,createdAt,legacy}`. `legacy` contains the complete unverified original record. These accounts retain their old data in a protected archive and begin competitive play at the shipped baseline. Existing local saves are separately retained as `:legacy-unverified` snapshots; guest play/Academy storage remains local.

For records already verified by the preceding trusted implementation, the owner may supply `verified:{profile,inventory,auditReference,receipts:[{source,receipt}]}` from the actual protected store. This preserves their full verified progression, inventory and historic receipts. An audit reference and owner-reviewed source export are required; a hash alone proves file integrity, **not** that data is legitimate. Never populate `verified` from client-writable tables/localStorage. Historical challenges and active matches are not resumed across the architecture cutover; drain active matches before switching traffic and preserve their old records in the export/archive. Plan a small owner-reviewed reconciliation for conflicts; the importer never silently deletes or overwrites records.

## Railway setup (requires deployment authorization)

Create a separate staging project with PostgreSQL and one backend service. Use repository root as build context and set `RAILWAY_DOCKERFILE_PATH=backend/Dockerfile`. Set one replica, healthcheck and shutdown budgets explicitly in the service settings per the staging runbook: new Railway services cannot rely on deprecated `railway.toml`. The image builds TypeScript to `backend/dist/server.mjs`, prunes dev dependencies, runs as an unprivileged OS user and listens on Railway's `PORT`. The database connection uses private networking and the runtime role above.

Apply reviewed migrations with the operator credential **before** deploying the service. Migrations are deliberately not run automatically on server startup or deployment. Docker runtime does not include the Prisma migration CLI after pruning; use an authorized operator checkout/job with `npm ci` for migrations.

Configure backend variables, generate an HTTPS public backend domain, and verify `/health` actually checks PostgreSQL. Healthcheck path is configured; Railway's deployment healthcheck is not ongoing monitoring. Configure service monitoring/backups separately. [Railway healthchecks](https://docs.railway.com/deployments/healthchecks).

## Vercel setup

Use the existing Next preset and repository root. The checked-in `vercel.json` installs `npm ci` and builds `npm run backend:generate` followed by `npm run build`; Node 24.x is required by `package.json`. Prisma generation is needed for the repository-wide TypeScript check, although the Next app does not import database services into browser bundles. Set server-only `BACKEND_URL`, `BACKEND_PROXY_SECRET`, `FRONTEND_ORIGIN`, and the two public frontend variables above. Use staging-specific secrets/databases, distinct from production. Rebuild when public variables change.

Use one exact frontend hostname on staging; preview domains are not automatically trusted. Configure a separate staging backend/origin for a preview deployment rather than accepting wildcard origins. Verify cookies are Secure/HttpOnly/SameSite=Lax/host-only and that logout invalidates the database session and WebSocket access. No database or auth secret may appear in frontend bundles.

## Remaining gates before public launch

Deploy staging only after authorization and run real browser/two-account tests on the actual HTTPS/WSS origins: registration/login/logout/reload, profile/campaign/inventory persistence, valid rewards, forged/replayed events, queue/private rooms, damage/results, network loss/reconnect, disconnect grace, expired sessions and secret/rate-limit boundaries. Verify migrations/role privileges on the actual database, proxy IP behavior, backups/restore and operator-reviewed legacy exports. Local tests do not verify Railway networking, TLS, Vercel cookies, container builds or external configuration.

Multiple backend replicas remain unsupported until distributed fanout/presence are added. No mail-based recovery/verification provider is configured; email/password accounts work, but production recovery operations require an owner decision and secure provider setup. The existing soundtrack/content rights gates remain unchanged. Full npm audit has existing dev-tool findings; runtime-only audit is reported separately. Do not bypass a failing deployment/security check or declare public competition approved from local checks alone.
