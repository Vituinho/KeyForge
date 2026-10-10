# KeyForge — deployment gate

Status: **BLOCKED for a competitive public launch**. The frontend and local gameplay can be built and exercised. Do not treat passing simulations as verification of deployed database authority.

The subsequent P0 hardening implementation and required three SQL migrations are documented in [SECURITY_HARDENING.md](./SECURITY_HARDENING.md). Follow that staging/deployment gate before using the older release-pass notes below; they describe vulnerabilities as they existed at the end of that pass. No production changes have been applied.

## Build and environment

Validated toolchain: Node 24.20.0, npm, Next.js 16.3.8, React 19.2.8. Install the committed lockfile with `npm ci`.

| Variable | Purpose | Exposure |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project endpoint | Public browser configuration |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/publishable client key | Public; requires correct RLS and RPC grants |
| `NEXT_PUBLIC_SITE_URL` | Canonical HTTP(S) origin for sitemap/social metadata | Public; configure before building |
| `SUPABASE_SERVICE_ROLE_KEY` | Verified progression route's trusted database operations | Server runtime only; never browser/public |

Copy `.env.example` to local configuration or configure these names on the host. No credentials are supplied in this repository. Never expose a Supabase service-role key as `NEXT_PUBLIC_*`. Missing Supabase configuration enables guest play; login/register report unavailability instead of manufacturing accounts. Missing site origin leaves the sitemap empty and Next falls back to localhost for absolute social URLs; configure the real domain before launch.

Run:

```sh
npm ci
npm run verify:release
npm audit --omit=dev
npm run audit:audio -- --require-assets
npm run build
npm start
```

`verify:release` runs every discovered typing/Academy/audio/auth regression test, campaign/progression/balance checks, PvP simulations, i18n, soundtrack configuration, TypeScript, ESLint and the production build. It writes per-step logs and a results JSON into a temporary directory and fails on the first failed step. The default audio audit reports absent disabled tracks without blocking a playable silent game; `--require-assets` requires every asset, licensing record and enabled mapping. That strict content gate currently fails as expected.

## P0 — implementation complete locally; deployed authority still unverified

The subsequent security pass replaced browser-controlled online progression with server-validated challenges, shared balance reducers, an atomic receipt ledger and protected verified inventory. It also hardens PvP attempts/lifecycle/queue and separates unverified local/legacy records without deleting them. The original schema scripts remain upgrade inputs; the three ordered migrations in [SECURITY_HARDENING.md](./SECURITY_HARDENING.md) are mandatory. Never rerun the original scripts after applying them.

`verify:release` now also runs real PostgreSQL security regressions in its own isolated loopback cluster, using installed `initdb`, `pg_ctl` and `psql` binaries (`KEYFORGE_TEST_PG_BIN` may override their directory). No production URL is used. A local passing database test does not verify Supabase Auth, PostgREST or Realtime. Actual staging privileges, malicious HTTP calls, concurrent claims, legitimate gameplay and legacy-data communication must pass before competitive launch.

## Supabase staging verification

Review the actual deployed schema and the ordered migrations/audit in the security report before installation. No SQL or production configuration was applied during this release or the subsequent hardening pass.

- Configure Auth site URL, allowed redirect URLs, email confirmation/delivery and the desired provider settings for the real domain.
- Check the deployed tables, signup trigger, crate RPC and all multiplayer RPC signatures against the checked-in files.
- Confirm that untrusted roles cannot bypass RPCs by modifying health, results, rewards or inventory rows directly.
- Verify Realtime access/publication for match and queue flows with two real accounts.
- Exercise registration, confirmation, login, session refresh, logout, cloud save conflict handling and all seven campaign world summaries.
- Exercise quick match, private room, readiness, attempts, disconnect/reconnection, surrender, result claims and rematch. Confirm damage/rewards and rejection cases in the database, not only the browser.

Verified campaign scores, milestone claims and baselines now live in the protected profile document; personal Academy mastery/daily practice remains local. Validate account isolation and intended cross-device behavior in staging before advertising synchronization guarantees.

Password recovery is excluded from this release: the old inert "forgot password" label was removed; there is no implemented reset request/callback flow. Add and verify that flow with the real Auth redirect/email settings before advertising account recovery.

## Soundtrack and IP content gate

Place tracks in **`public/audio/bgm/`**, following every exact filename in [SOUNDTRACK_MANIFEST.md](SOUNDTRACK_MANIFEST.md). All 56 associations exist and are individually configurable; all 56 assets and their licensing evidence are absent. No fallback track is configured, and missing/unlicensed tracks stay silent without failed network loops.

For each track record creator/source, a license/evidence link, commercial-use permission and attribution in `src/lib/audio/battleMusic.ts`. Verify playback in a real browser before enabling it. Use commissioned/original or appropriately licensed material; no official anime recordings were added.

Existing franchise names/characters also have no supplied rights clearance. Resolve that content review or replace the roster/branding with original characters before a commercial/public launch. This report records absent evidence and does not establish legal permission.

## Hosting and final smoke check

After the P0 gate and content decisions, configure the variables on the target Next.js host, build from the lockfile, set the domain/TLS and rerun critical flows on that origin. Verify sitemap, robots, icon and social image URLs, browser console, responsive navigation, local persistence, missing-track silence and leaving battles. A local passing build is not a deployment. No push or deployment was performed.

Runtime dependency audit after the Next patch upgrade: zero reported vulnerabilities. The full audit still reports five high-severity development-tool dependency findings in the braces/micromatch/fast-glob/Next ESLint chain, with no compatible automatic patch offered at validation time. Do not force-downgrade the ESLint configuration to hide this result; track a compatible tooling update separately.
