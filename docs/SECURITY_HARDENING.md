# P0 security hardening — 2026-10-10

Implementation is ready for **staging validation**. Public competitive launch is **still blocked** until the deployed Supabase access controls, Auth, HTTP RPCs and Realtime are verified. No push, deployment or production SQL was performed.

## Evidence and trust boundaries

The audit inspected the three checked-in Supabase schemas, every checked-in SECURITY DEFINER function, authentication, storage/import paths, reward processors, match services and their UI callers. The configured local Supabase URL is a placeholder; there are no live database credentials or service-role credentials available. Consequently this is a verified local upgrade of the repository schema, **not an inspection/certification of the actual deployed database**. Additional live policies/RPCs must be inventoried before approval.

| Operation | Before | New trusted boundary |
| --- | --- | --- |
| XP, level, rank, typing stats | Browser reward processors and owner profile/stats writes | Next.js validates the authenticated user with Supabase `auth.getUser`, replays issued attempts, calls shared balance reducers; service-only atomic commit |
| Campaign completion, first clears, world unlocks, reward crates | Client result/progression and campaign/history writes | Server-issued enemy/text challenge, verified sequential stage coverage, replay-derived outcome; one receipt per owned session |
| Academy/home-row/weak-key XP and technique | Client lesson ID, completion and stats | Owned issued practice recipe, canonical exercises and all attempted positions, server-derived stats, existing reward formulas |
| PvP victories, XP, rank, shards, drops | Participant match/event writes, browser stats/outcome/reward calculations | No direct DML; participant RPC validates expected word, attempts, arrival rate, sequence and replay; locked server match/results determine rewards |
| Currency, forging, crate count | Browser shard totals and crate upserts | Owner-only RPC purchases at catalogue prices under the account lock; service commit grants earned shards/crates |
| Crate outcomes, cosmetic unlocks | Client-local selection/import; old RPC lacked transaction nonce/current catalogue | Cryptographic database roll from the shipped catalogue, immutable request receipt, account-wide lock, atomic consume/unlock/salvage |
| Equipped cosmetics | Browser profile writes | Owned-inventory validation in `equip_verified_skin`; match RPCs also require owned skins |
| Imported/local progression and old cloud rows | Automatic local-to-cloud maximum/union/overwrite | Preserved unverified snapshot and separate account cache; no progression import endpoint or automatic promotion |
| Username, language, keyboard accessibility settings | Owner profile update with broad grants | Owner RLS plus grants on precisely these three preference columns |
| Guest/offline practice and Shadow Shinobi | Local storage | Remains personal/unverified; cannot mint verified online progression |
| Academy mastery, learning path, practice history, daily goal | Local per-player/layout telemetry | Remains personal telemetry; never an authorization source for rank/XP/inventory |

## Vulnerabilities addressed

- Owner policies permitted arbitrary XP/level/rank/shard updates, inventory inserts, crate upserts, fake campaign completion and history. Revocation covers **column grants as well as table grants**, including TRUNCATE/REFERENCES/TRIGGER. Clients cannot write another user's rows or protected owned rows.
- Signup and multiplayer definer functions had unsafe `search_path` and default PUBLIC execution. New/replaced definers use `pg_catalog`, explicit schema-qualified objects, authentication/ownership checks and explicit role grants. Private helpers and server reward RPCs cannot be called by browser roles.
- Old word submissions trusted WPM/accuracy/combo and an expected word string instead of actual attempts. The new RPC derives telemetry from its own deterministic word sequence; substitutions advance, following correct keys count, Backspace keeps historical errors/attempts. Replays are authorized before returning a result and must match the original payload.
- NULL player-2 membership comparisons could bypass authorization. Membership is now NULL-safe, including resolved matches.
- Readiness could restart active/resolved matches. Cancel/forfeit/disconnect and readiness now enforce lifecycle constraints; quick rewards require the authoritative queue. Concurrent queue retries and bot timeout cannot replace a confirmed human match.
- Browser broadcast events could supply winner/HP and errors could fall back to simulated state. Online outcomes now use database state and fail closed; broadcasts supply visual hints only. Shadow matches remain explicitly local.
- Profile/inventory updates and reward retries could duplicate rewards or lose concurrent updates. Account locks, a `(user_id,source)` receipt ledger, version comparison and one transaction cover progression, inventory, history and session consumption. Cached receipts return the original result; later profile caches refresh authoritative state.
- `TIMEZONE('utc', NOW())` discarded the zone before reassignment to a zoned timestamp, causing future events in a non-UTC database. Server timestamps/defaults now use `clock_timestamp()`; consecutive words and disconnect grace are tested.
- Local saves could be merged into authenticated progress and leak between account caches. Saves now have per-account namespaces and legacy preservation; cloud write helpers accept preferences only.

Game reward, XP, rank, campaign damage, crate prices/weights and PvP damage/energy formulas were reused. The typing engine only gained an optional passive input observer; it does not await network requests. Academy drill generation/mastery algorithms, immediate transitions and audio remain unchanged.

## Legacy preservation and import policy

The original profiles, stats, campaign rows, inventory and crate rows are **retained**. Migration 001 also captures them in `keyforge_private.legacy_snapshots` with classification `unverified`, before changing grants. Existing matches retain `authority_version=0`; their outcomes cannot mint new verified rewards.

New `verified_*` tables start with the shipped baseline, starter skins, 50 shards and one basic crate. This intentionally distinguishes an online verified record from the old preserved record; it does **not** assert that every old player cheated. Previously client-writable rows cannot establish competitive trust simply because they are in Supabase.

Guest save keys and personal Academy per-player/layout telemetry remain available. The first replaced account cache is archived under `:legacy-unverified`; account switching does not import another account or guest save. The UI gives a localized legacy notice. Existing unverified Academy lesson flags are not merged into the verified profile.

There is no browser import RPC. Before launch, support must communicate the separate verified baseline and provide an evidence-review process. Legitimate progress can be preserved for personal/offline play; promotion requires independent authoritative evidence (for example historical server logs or independently trusted purchase receipts), an explicit administrator decision, a retained source snapshot and an audited, idempotent **server-only** migration. Old client-writable battle history and self-reported screenshots/local JSON are insufficient evidence. Do not bulk copy/max/union old XP, rank, inventory or campaign flags into `verified_*`. Do not delete originals or snapshots.

## Required SQL and rollout

Apply these **once, in order**, after reviewing the real staging schema and taking a restorable backup:

1. `supabase/migrations/202610100001_verified_progression.sql` — legacy preservation, verified baseline, RLS/grants, protected catalogues and signup.
2. `supabase/migrations/202610100002_atomic_rewards_inventory.sql` — crate/purchase/equip transactions, receipt ledger and service-only challenge/reward persistence.
3. `supabase/migrations/202610100003_validated_multiplayer.sql` — participant/lifecycle checks, attempt-derived word telemetry, replay protection and authoritative queue.

Each migration has BEGIN/COMMIT. A migration failure must be investigated rather than skipped. They target the repository's existing schema and are not intended to be repeatedly rerun. A fresh isolated installation uses `schema.sql`, `cosmetics_schema.sql`, `multiplayer_schema.sql` **before** these migrations. Never rerun the legacy schema scripts after hardening: they can recreate old policies/functions. Restore or forward-fix a failed rollout; do not reinstate permissive grants to make an old client work.

The two catalogue/multiplayer generators copy existing balance/data into SQL. Regenerate only when those sources change, review the resulting migration diff and use a new forward migration after deployment.

Recommended staging sequence: inventory actual policies/RPCs/grants; backup; maintenance window stopping old online clients; migrations in order; read-only audit below; server environment/code deployment; authenticated staging tests; explicitly approve production. Account/cloud rewards fail closed without the migrations/server key. Do not expose an old client against the changed API.

Run `supabase/audits/verify_security_boundaries.sql` as database owner. This read-only gate checks effective API/column privileges, RLS, browser roles without SUPERUSER/BYPASSRLS, definer search paths and an allowlist of **exact RPC signatures**, and prints policies/function grants for review. Custom invoker RPCs are included: an unreviewed wrapper could modify JWT settings and call a definer. Extension-owned invoker utilities are inventoried for manual review. Unknown functions/overloads or inherited privileges are a blocker to investigate, not a reason to bypass the gate. A passing catalogue audit still does not substitute for HTTP/JWT tests.

## Supabase and hosting Dashboard steps

- Use a separate staging project, import representative legacy records and independently compare its schema with the repository. Inspect Table Editor policies, effective grants, every public RPC/overload and Auth signup triggers. Confirm `public.profiles` contains `language` and `keyboard_settings`, and all expected multiplayer tables exist before running the migrations.
- Keep `keyforge_private` out of the API exposed schemas. Confirm the existing Realtime publication contains matches, events and queue; owner/participant SELECT policies must constrain Postgres Changes delivery. Verify private schemas/legacy snapshots are never available through REST/GraphQL/Realtime.
- Configure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and the server runtime's **`SUPABASE_SERVICE_ROLE_KEY`** in protected hosting environment variables. Never use a `NEXT_PUBLIC_` service key, put it in Git/local player data or configure it in browser code. The only service-key consumer is the `server-only` Next route. Rotate any historically leaked key before launch.
- Verify Auth site URL/redirect allowlist, email confirmation and appropriate signup/login rate limits. Use real Auth users/tokens in staging, not test `auth.uid()` settings. Check requests after logout/token expiry and revoked sessions fail closed. Enable normal API/WAF rate limits and monitor rejected challenges/RPCs.
- Reload the PostgREST schema cache if required after the reviewed migrations (`NOTIFY pgrst, 'reload schema'` from the owner console). Verify server-only RPCs are available to the server role while unauthorized calls are rejected.
- Deploy the Next server runtime, not a static export, with the key provisioned. Confirm production browser bundles and browser network payloads contain no service-role key.

## Validation and remaining launch gates

Executed locally on the hardened code:

| Validation | Result |
| --- | --- |
| Discovered unit/integration tests, including Academy/typing/auth/audio | 100 passed |
| Real PostgreSQL 18.6 roles/RLS/RPC/concurrency/security audit | 176 checks passed |
| Existing multiplayer security simulations | 10 passed (mock/simulation, separate from database checks) |
| Campaign invariants | 372 passed |
| Progression checks | 35 passed |
| Balance checks | 73 passed |
| PvP simulation, i18n and audio configuration audits | Passed |
| TypeScript, ESLint, production build | Passed; no ESLint errors/warnings |
| Built-server HTTP smoke and browser bundle isolation | Passed |

After the final bounded practice transport allowance, all 17 affected server-replay/React-flow tests and TypeScript/ESLint/build were rerun successfully. The full release gate's local logs are `keyforge-release-n7XCaz` in OS temp (173 database checks at that point); subsequent exact-signature/invoker/BYPASSRLS negative audit tests increased the database total to 176, rerun successfully. The build's existing missing canonical-site-origin metadata warning remains a hosting configuration step.

`npm run test:security:db` initializes a fresh loopback-only PostgreSQL cluster, installs the original schemas and migrations, then executes malicious calls under real `anon`, `authenticated` and `service_role` roles. It accepts **no production database URL**. Set `KEYFORGE_TEST_PG_BIN` to installed `initdb`, `pg_ctl` and `psql` binaries when needed. Logs/temporary cluster directories remain in OS temp for investigation; the test stops only its own cluster.

`npm run test:security:http` requires a production build. It starts/stops its own loopback server on an isolated port with the service key deliberately absent, checks eight existing game pages, POST-only routing, anonymous 401, missing-key 503, no-store responses and absence of the server-key variable in browser JavaScript bundles. It does not call live Supabase. Both database and HTTP checks are now included in `npm run verify:release`.

Database checks cover forged progression, cross-user changes, direct inventory/campaign/event writes, unauthorized/anonymous RPCs, unsafe grants, legacy preservation, crate replay, concurrent claims, rollback on partial failure, wrong word sequence/payload, independent errors/Backspace, resolved match restart, disconnect timing, verified PvP rewards, practice/campaign source separation and atomic queue decisions. SQL PRNG output is compared against the existing TypeScript generator for both languages. Auth is a fixture `auth.uid()` function in this isolated test, **not real Supabase Auth/PostgREST**.

Required staging tests with Alice/Bob/outsider/anon and real JWTs:

1. Run the read-only audit and keep results; inspect all actual policies/RPC overloads. Try REST INSERT/UPDATE/DELETE/UPSERT against every protected table, including another user's ID. Only owned preference updates may succeed.
2. Submit forged XP/rank/winner/campaign/inventory/import fields to `/api/progression`; call service-only RPCs directly with anon/user tokens; try expired/revoked/spoofed tokens. Confirm no protected state changes and no secrets leak.
3. Finish a genuine first battle and a repeated clear; test locked/fake campaign completion, duplicate/concurrent reward requests, partial failure and a changed account version. Compare all seven worlds, enemy mechanics/phases and shipped XP with the local tests. Check real network latency around the battle's start/end clock; rejected evidence must not fall back to online grants.
4. Train both ABNT2 and ANSI: substitutions, Backspace, home-row, weak keys, manual keys and adaptive sessions; confirm immediate transitions/focus and background verified rewards, including a later receipt retry. Personal mastery/daily progress must remain intact.
5. Play two real-browser PvP sessions through private lobby and quick queue; verify readiness/countdown, consecutive words, replay/mismatched payload, damage, result/XP, forfeit/reconnection and disconnect grace. Forge broadcast winner/HP events: they must not change database state/rewards. Exercise simultaneous queue matching versus bot timeout. Old authority-version-0 outcomes and Shadow matches must never reward the verified account.
6. Open/forge crates twice concurrently with the same and different transaction IDs; verify exactly-once consumption and owned unlocks, insufficient currency, duplicate salvage and failure rollback. The client must never supply a selected skin/outcome.
7. Inspect browser/network bundles for service secrets; verify Realtime isolation and each player's profile/cache across logout/account switching and tampered local import. Confirm old snapshots/records remain recoverable and the legacy policy is communicated.

Input transcripts are validated against owned server-issued content, timing bounds and server match state; they are not proof of physical human typing. Automated clients/collusion remain an abuse concern for competitive launch and need operational monitoring/policy. This change does not claim bot-proof anticheat. Live schema verification, hosting secrets, real HTTP/Auth/Realtime controls, legacy review communication and the staging gameplay checks above remain launch blockers. No public-launch P0 closure is claimed.
