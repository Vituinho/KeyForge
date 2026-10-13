# KeyForge backend migration report

## Result

The local repository now uses Next.js with a server-only HTTP proxy, a Node 24/Fastify TypeScript backend, Better Auth database sessions, PostgreSQL 18/Prisma and authenticated WebSocket. The previous provider dependency, browser client, environment variables, database API routes, schema scripts and deployment instructions have been removed. The six preceding security commits remain in Git history. No push, deployment, external schema change or production-data deletion was performed.

Typing still advances locally without awaiting network acknowledgements. Campaign and multiplayer rewards use the existing balance functions. Academy mastery, adaptive paths, layouts, audio and frontend presentation have been preserved. Authenticated persistence is owned by backend services: issued typing challenges, authoritative match state, server-random crates, unique event receipts and serializable transactions. Local progress is archived as unverified; the operator importer can preserve reviewed verified profiles, inventory, passwords and historic receipts without granting trust to browser saves.

## Commits

| Commit | Phase |
| --- | --- |
| `fabaa38` | PostgreSQL schema, Better Auth and authoritative game services |
| `ffafa55` | Identity/proxy boundaries and operator-only legacy import |
| `c833a58` | Cookie API clients, matchmaking/private rooms and authenticated WebSocket |
| `14888e0` | Session/account integrity, lobby lifecycle, historical receipts and expanded database security checks |
| Commit containing this report: `chore(backend): retire legacy infrastructure and document staging setup` | Remove obsolete infrastructure; reproducible build, deployment and validation instructions |

The preserved security commits are `1838b37`, `257b312`, `c798236`, `2afefbe`, `5cf6428` and `0811555`.

## Local verification

The final release runner generates Prisma, executes the following gates and retains complete logs in the temporary directory printed by `npm run verify:release`:

Executed on 2026-10-13: all 17 release gates passed. The final local log directory is `keyforge-release-iQgsnR` under the operating system temporary directory.

- 102 unit tests, including Academy, mastery/adaptive generation, attempt-based typing and nonblocking ordered multiplayer submission.
- 255 actual PostgreSQL-backed security assertions using applied migrations and a non-owner runtime role: real password authentication/session persistence/logout, protected-field forgery, cross-account access, transaction/idempotence/replay, inventory/crates, ABNT2/ANSI practice, campaign gates/replay, two-account PvP/rewards, authenticated WebSocket, membership, disconnect/reconnect, session revocation, production-cookie attributes and legacy imports.
- The former 176 database API checks were adapted to the applicable service/transaction boundaries, rather than kept as obsolete RPC mocks.
- Multiplayer security audit, 372 campaign checks, 35 progression checks, 73 balance checks and PvP simulation.
- PT-BR/EN i18n audit, audio asset audit, Next route type generation, TypeScript and ESLint.
- Backend production compilation and Next production build.
- Actual local HTTP against both compiled applications and disposable PostgreSQL: registration, cookies/session/logout, inventory, CSRF/forgery rejection, eight game pages and absence of backend secrets in browser JavaScript.
- Runtime dependency audit: zero vulnerabilities. Full dependency audit: five high findings in existing development tooling; these remain a tooling follow-up.

Database tests create isolated loopback clusters and explicitly override migration URLs; they do not use existing database credentials. Runtime grants and account boundaries were verified locally. These results do not verify a deployed database or Railway/Vercel infrastructure.

## Deployment artifacts

See [BACKEND_DEPLOYMENT.md](BACKEND_DEPLOYMENT.md) for complete Railway/Vercel setup, environment variable names, runtime-role SQL, backups, operator import format and the required staging scenarios. The three ordered Prisma migrations are in `backend/prisma/migrations`. Apply reviewed migrations explicitly using the owner credential; the running backend never runs migrations automatically.

`backend/Dockerfile` builds the backend and runs it as an unprivileged OS user. `railway.toml` specifies its healthcheck and **one replica**. Container construction was not tested locally because Docker is unavailable; the compiled Node service was tested. WebSocket fanout/presence are currently process-local, so additional replicas require a shared event bus before being enabled.

## Remaining launch gates

Ready for authorized real staging validation, not approval for a public competitive launch. Railway/Vercel have not been deployed or verified. Staging must validate the container, actual HTTPS/WSS origins/cookies, proxy/IP and rate-limit behavior, database role grants, real browser/two-account flows, network recovery and backup/restore. Existing-account export provenance and conflict reconciliation require owner review. Email verification/recovery delivery is not configured and requires a secure provider decision. Existing soundtrack/content-rights gates and development-tool audit findings remain documented.
