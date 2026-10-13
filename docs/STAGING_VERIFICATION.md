# Real staging evidence — NOT VERIFIED

All actual-service checks below are **NOT RUN**. Preparation/local tests are not deployed evidence. Fill this record only after the owner authorizes deployment and the actual services exist. Never include passwords, cookies, tickets, connection strings or secret values.

## Local preparation evidence (2026-10-13)

The final `npm run verify:release` passed all 17 gates: 102 unit tests, 258 PostgreSQL-backed security assertions, authentication, campaign/progression/balance/PvP, i18n/audio, TypeScript, ESLint, backend and Next production builds, and the expanded HTTP suite. Its local logs are in the OS temporary directory `keyforge-release-aAcItB`.

The HTTP suite uses the compiled services and two normally registered accounts against disposable PostgreSQL, checks concurrent room actions/duplicate crate claims, then restarts the backend and verifies session/profile/inventory/match/receipt persistence and the actual client's automatic WebSocket reconnect. It also dumps/restores the isolated database, verifies the restored inventory/match/migration ledger/unique receipt and checks a database outage produces readiness 503. Windows invokes the installed SIGTERM handler over IPC; Linux/container signal delivery, HTTPS cookie jars and deployed WSS remain unverified.

Production configuration checks passed for assigned/invalid ports, HTTPS origin enforcement and rejection of runtime migration credentials. Runtime dependency audit found zero vulnerabilities. No game/frontend source was changed by staging preparation. Commits `149e745` and `32fcd73` contain backend readiness/restart and forwarded-IP safeguards; deployment configuration/runbooks are in the commit containing this evidence update.

Earlier local attempts timed out during Prisma startup or `initdb` disk synchronization with a one-minute process limit (release log `keyforge-release-TZTFSe` retains the failure). The Windows disposable-cluster setup budget was increased to three minutes; real fsync, actual migrations and every assertion remain enabled. The final complete rerun passed. None of these local results completes a deployed acceptance case below.

## Environment record

| Field | Actual value |
| --- | --- |
| Date/operator | NOT RECORDED |
| Candidate commit/image | NOT RECORDED |
| Railway staging project/environment/service IDs | NOT CREATED/VERIFIED |
| Railway PostgreSQL service/database/volume ID | NOT CREATED/VERIFIED |
| Backend deployment ID / replica count | NOT DEPLOYED / verify exactly 1 |
| Vercel staging project/deployment ID | NOT DEPLOYED |
| Stable HTTPS frontend/backend and WSS URLs | NOT RECORDED |
| Applied migrations and runtime role check | NOT VERIFIED |
| Backup hash/timestamp and isolated restore result | NOT VERIFIED |
| Accounts A/B identifiers (no passwords) | NOT REGISTERED |
| Browsers/devices including Safari if available | NOT RECORDED |
| Accept/reject decision and unresolved failures | NOT VERIFIED |

## Acceptance cases

Run with two accounts created through the real staging UI. Record a timestamp, sanitized evidence reference and outcome for every row. The default state is pending, not success.

| Case | Expected deployed result | Actual result |
| --- | --- | --- |
| Candidate/container | Exact authorized commit, Docker build, Node 24, unprivileged runtime, port matches Railway | NOT RUN |
| Replica/topology | One backend replica/region, separate staging DB/volume, no production credential or resource | NOT RUN |
| Health | 200 with database available; 503 without it; no SQL/secret details; monitoring enabled | NOT RUN |
| Migration/runtime grants | Three applied migrations; non-owner/non-admin; no schema CREATE, owner inheritance or migration-ledger writes | NOT RUN |
| Registration A/B | Real email/password creation; case-insensitive username uniqueness; no fabricated auth | NOT RUN |
| Login/session reload | Correct password succeeds, incorrect fails; reload/new tab retains the real session | NOT RUN |
| Cookie attributes | Secure, HttpOnly, SameSite=Lax, host-only on stable frontend; no auth token in localStorage | NOT RUN |
| Cross-domain hosting | Frontend cookie session works through proxy; no third-party Railway cookie dependence; Safari where available | NOT RUN |
| Logout | Database session invalidated; protected HTTP rejected and existing WSS access closed | NOT RUN |
| CSRF/origin | Foreign/missing/null mutation origin rejected; wildcard previews untrusted | NOT RUN |
| Proxy spoofing/rate limits | Forged secret/client IP/forwarded host/protocol cannot bypass identity/origin; actual client IP and auth limits verified | NOT RUN |
| Secrets | No database/auth/proxy secret in public env, browser JS, client requests or public logs | NOT RUN |
| Protected writes/account isolation | Forged XP/rank/currency/completion/ownership rejected; A cannot modify/read B's private progression/inventory | NOT RUN |
| Manual Academy / practice | Instant typing, ABNT2/ANSI, preserved mastery and local persistence; real valid practice reward when applicable | NOT RUN |
| Campaign | Genuine typing completion earns existing reward once; next stage unlocks; locked/fake completion rejected | NOT RUN |
| Inventory/equipment | Only owned skin can equip; reload persists; arbitrary inventory writes rejected | NOT RUN |
| Crate/purchase concurrency | Repeat the same captured request ID concurrently: one outcome/receipt/spend; changed bound payload rejected | NOT RUN |
| Quick matchmaking | A/B paired into the same authoritative match; queue exit cannot race into two human/bot outcomes | NOT RUN |
| Private rooms | Server room code joins B; outsider fails; ready/cancel/leave/replacement follow validated membership | NOT RUN |
| Simultaneous ready/words | Independent A/B actions commit without lost state, duplicate events or client damage authority | NOT RUN |
| Typing/network | Keystrokes/next word instant under latency; queued word IDs remain ordered and retries do not duplicate attempts/damage | NOT RUN |
| Genuine PvP result/reward | Real played result is authoritative; same reward submitted twice/concurrently changes progression once | NOT RUN |
| Forged/replayed match event | Fake victory, out-of-order word, altered event binding and outsider match action rejected | NOT RUN |
| WSS authentication | 101 upgrade; no-ticket/wrong-origin/expired/reused-ticket closed; participant receives persisted snapshot | NOT RUN |
| Membership/session revocation | Leaving lobby removes subscription; account logout/expiry closes access; outsider cannot subscribe | NOT RUN |
| Disconnect/reconnect | Fresh ticket after network loss; same persistent match; existing 15s opponent grace applied correctly | NOT RUN |
| Backend restart | Real platform SIGTERM drains, restart completes; both cookies/profiles/inventory/receipts survive; client automatically reconnects | NOT RUN |
| Restart reward replay | Captured pre-restart reward/crate request still resolves to one receipt after restart | NOT RUN |
| Backup/isolated restore | Encrypted backup, separate empty restore target, roles restored safely, profiles/matches/receipts and sessions verified | NOT RUN |
| Frontend/audio/i18n | No redesign/regression; PT-BR/EN, Academy, campaign, cosmetics and soundtrack controls preserved | NOT RUN |
| Rollback rehearsal | Known-good compatible app rollback or safe first-deploy shutdown; retained DB/receipts; never destructive down SQL | NOT RUN |

Suggested order: topology/migrations → two-account auth → practice/campaign/inventory → private/quick PvP and negative checks → network/restart → backup/restore/rollback. Finish current matches before a planned redeploy. Keep both accounts available for concurrent actions; do not use privileged SQL to manufacture game results.

For duplicate/replay cases, replay only those accounts' captured staging requests through the authenticated same-origin browser path. Keep the original request/event ID and body, then separately test a changed body with the same ID. Verify profile/inventory/receipt changes once using owner-approved **read-only** inspection. Redact session headers in evidence. No console edits of server timestamps or local-to-competitive import are permitted.

Acceptance requires every required deployed check to pass, with failures resolved and backup/rollback confirmed. Until then: **staging NOT VERIFIED; public launch blocked**.
