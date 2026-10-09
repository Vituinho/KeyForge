# KeyForge — final release pass

Release status: **BLOCKED**. Local implementation and production build are usable; competitive public release still requires server-authority hardening, external-service verification and content rights decisions. See [deployment gate](RELEASE_DEPLOYMENT.md).

## Completed changes

- Premium dark landing with a real interactive typing preview, accurate seven-world roster, responsive header/footer, app navigation and active-route indicators. Removed unsupported ranked-season UI and relabeled the existing level/rank-derived matchmaking estimate; presence stays unknown until synchronized.
- Preserved validated Academy mastery/adaptive algorithms, manual keys, ABNT2/ANSI, finger guidance and daily goals. Added actual error counts to adaptive recaps and removed blocking delays from legacy/general training and single-player battle sentence changes.
- Completed free practice and 15/30/60-second benchmarks using the existing attempt-based engine, with per-player/layout local history and statistics. Timed WPM includes the full measurement window. Benchmarks do not award combat XP.
- Stabilized SSR snapshots, removed fabricated offline authentication, handled confirmation-required signup, restricted return URLs, fixed initial guest state/logout/session reconciliation and reused one Supabase Auth client.
- Moved completion rewards out of render and deduplicated them for the same completion, guarded simultaneous crate opens, kept authenticated opening server-dependent, included the final hit in battle results, stopped render-driven attack-timer restarts and captured exact typing telemetry at battle termination despite sampled HUD updates.
- Repaired cloud campaign serialization for all seven worlds without schema changes. Local RPG rewards, combat formulas and server-authoritative PvP damage were preserved.
- Added 56 independent soundtrack mappings, lightweight looping HTMLAudio playback, fades/crossfades, result ducking, cleanup, genuine-interaction autoplay recovery, licensed fallback support, failure caching and persisted master/music/SFX controls. Repaired SFX master-volume routing and disconnected finished oscillator nodes.
- Added focus trapping/restoration, Escape handling, body scroll management and safe recovery to dialogs; keyboard shortcuts respect interactive controls. Added localized missing/error/root-error screens and localized performance descriptions.
- Added canonical-origin configuration, robots/sitemap, original icon/social graphic, reproducible release validation and soundtrack content gates. Patched Next.js and compatible transitive dependencies. Fixed an existing nondeterministic balance simulator without changing its 73 assertions or game rules.
- Localized campaign/dashboard/profile summaries, boss descriptions, all typing-focus labels and 35 cosmetic descriptions. Bound authentication fields to their labels, removed the inert password-recovery label and fixed the guest navigation loop. Corrected advertised minimum crate rarity to match the existing weights without changing drop odds.
- Preserved focus during crate charging/reveals and made weak-key fallback drills practice the actual missed accented letter or symbol instead of unrelated English words. Added focused regressions.
- Fixed false world completion discovered by direct-boss browser testing: a new completion/reward requires actual records for every stage, while historical completed saves are preserved. This does not replace the outstanding server-authority gate.
- Respect saved onboarding completion after hydration. Every one of the 56 encounter intros now resolves a translated narrative or existing stage explanation instead of displaying missing translation IDs.
- Generic defeat coaching now refers to the recorded battle performance rather than incorrectly attributing every unfamiliar opponent to Naruto.

## Commits created

| SHA | Change |
|---|---|
| 4b31135 | fix: stabilize authentication rewards and instant typing flow |
| d391d18 | feat(audio): add character-specific battle music and controls |
| 242cf5d | fix: sync campaign progress across all anime worlds |
| 4d72bd6 | style: polish landing navigation and launch metadata |
| 3df55a7 | feat(training): complete practice benchmarks and performance history |
| c965a0a | style: clarify multiplayer lobby and live presence |
| 59f937e | fix: improve dialog accessibility and error recovery |
| ef89def | fix: capture complete typing telemetry when battles end |
| ff59ea3 | style: expose victory coaching and finish mobile navigation |
| 9092856 | test: make balance simulations deterministic |
| 05c5dd2 | fix(auth): share a single Supabase session client |
| 7b08b97 | fix(audio): preserve paused playback when changing volume |
| c25c2b2 | style(battle): fit combat cards to mobile screens |
| 4da3279 | fix(i18n): translate all campaign typing focus labels |
| d0b4617 | fix(i18n): localize cosmetic catalog descriptions |
| 33d0475 | fix(cosmetics): report the actual minimum crate rarity |
| 5cd655f | fix(cosmetics): retain dialog focus and localize crate reveals |
| 1c26e05 | fix(auth): label forms and prevent guest navigation loops |
| fc0f024 | fix(i18n): localize dashboard campaign recommendations |
| 97c2dfd | fix(i18n): translate campaign summaries across player pages |
| 43d3d1d | fix(i18n): localize boss intros and stage focus badges |
| 360ee67 | fix(training): keep weakness drills focused on accented keys |
| 9cb9f36 | fix(campaign): require actual stage clears for world rewards |
| 8705c89 | fix: respect saved onboarding completion after hydration |
| 9ceebfb | fix(i18n): provide localized descriptions for every encounter |
| 78f1e4f | fix(battle): use accurate coaching for generic opponents |

The final documentation/validation commit is available in `git log`; its own SHA cannot be embedded in its committed contents.

## Automated validation

Final regression run: **83 unit/regression tests passed** via `npm test`. Full release checks: multiplayer security **10/10**, campaign **372/372**, progression **35/35**, deterministic balance **73/73**, quick/private PvP simulations passed. PT-BR/EN parity: **1404 keys each**, no missing entries. TypeScript, ESLint and Next.js production build passed. Default audio configuration audit passed with all absent/unlicensed tracks disabled. Runtime npm audit: **0** vulnerabilities; full audit: **5 high-severity dev-tool findings**.

Latest 83-test logs: `keyforge-release-3ijM8p` in the OS temporary directory. Full-check logs: `keyforge-release-xKVwpO`. The full release runner's last unit snapshot contained 80 tests; the additional campaign and encounter-translation regressions were subsequently verified in the final 83-test run. TypeScript, ESLint and production build were rerun after the last UI fixes.

The legacy balance suite initially failed one timing assertion on an unseeded random run (Pain profile B: 100.5 seconds, maximum 100). It now averages 100 independent, fixed Mulberry32 seeds per persona instead of ten random runs. All original assertions and timing requirements are retained; no RPG rebalance was made.

The strict soundtrack gate intentionally fails: 56 missing files, 56 unverified licenses and 56 disabled mappings. Default configuration validation succeeds because these tracks are disabled and gameplay remains silent safely.

## Genuine browser checks

Production server on a separate disposable localhost origin; no user account credentials were used and no existing origin's saves were reset.

| Flow | Observed result |
|---|---|
| Landing preview | One substituted character, completed drill, 97% accuracy; later correct characters continued normally |
| Responsive landing | No horizontal overflow at 360, 390, 768, 1024, 1366, 1440 and 1920 px |
| Academy overview | Key selection, weak/recommended state, uncertain trend and layout-scoped records visible |
| Academy training | Immediate autofocus, completed drill and first attempt of the next drill accepted without a transition lock |
| Adaptive session | All eight drills advanced automatically, four targets completed, actual attempts/errors/mastery recap displayed |
| Academy persistence/navigation | Records persisted after reload; ANSI and ABNT2 remained separate; Escape returned to overview and Right changed idle selection |
| Daily goal | Real accumulated active time and completed daily lesson reflected in the overview |
| Free practice | Completed text switched instantly; one error persisted into the saved result |
| Timed practice | First attempt started the 15-second timer; expiry produced a result and history row including idle time |
| Battle victory | Naruto defeated after a sentence with one substitution; 98% accuracy, one error, damage finalization, rewards and next-stage link shown |
| Browser console | No warnings/errors observed in tested guest flows |

| Responsive battle | Both combat cards visible without document overflow at 360, 390, 768, 1024, 1366, 1440 and 1920 px; desktop HUD/text/keyboard fit at 1366×768 |
| Audio controls | Three labeled sliders, music adjustment and mute persistence; absent tracks caused no failed playback loop |
| Crate and locker | Crate consumed exactly once, actual reveal/equip persisted; ready dialog trapped Tab, Escape closed and restored focus; charging retained focus inside the dialog and the reveal description was translated |
| Auth forms | Final registration fields had accessible labels; blank submission showed localized validation without sending credentials; guest CTA reached `/game` |
| Guest multiplayer | Account guard offered login/registration instead of pretending to connect to an opponent |
| Mobile navigation | Menu selected the seven-world overview and closed immediately; dashboard/profile/world overview had no horizontal overflow at 390 px |
| Onboarding | First control focused; Escape closed the introduction; final dashboard reload respected saved completion |
| Boss encounter | Madara advanced through phases 1/2/3 while the input retained focus, then victory included all three intentional accent substitutions |
| Battle defeat | Keystroke Sovereign defeated the idle player after 38 seconds; result retained three errors, zero dealt damage and 100 received damage, with rematch/training navigation |
| Locale | EN/PT-BR switch updated the actual landing content and document `lang`; Portuguese restored after the check |
| Final encounter intro | Keystroke Sovereign displayed the Portuguese stage explanation instead of an unresolved translation ID |

The boss check exposed and led to a correction of false world completion after direct boss entry. The additional regression tests require actual complete stage coverage for new completion rewards. Server validation of campaign eligibility/awards remains a P0 gate.

Not verified: real signup/email delivery/login/logout/refresh, cross-device cloud sync, two-account live quick/private PvP, disconnect/reconnect/result claim/rematch, and real soundtrack playback. The corresponding automated suites use pure fixtures/simulations; music lifecycle tests use an injected audio runtime. These are not replacements for deployed-service or licensed-file smoke tests. Password recovery is safely excluded: the inert label was removed, and no reset flow is claimed.

## Soundtrack and configuration

[SOUNDTRACK_MANIFEST.md](SOUNDTRACK_MANIFEST.md) contains the complete 56-character table: actual ID, name, exact filename, intended style, presence and licensing fields. Place assets in `public/audio/bgm/`, complete evidence in `src/lib/audio/battleMusic.ts`, verify actual playback, then enable mappings. No official recordings or third-party character images were added.

Required environment names: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`. Supabase policy/RPC staging verification and hosting steps are in [RELEASE_DEPLOYMENT.md](RELEASE_DEPLOYMENT.md). No push, deployment or production database/configuration change was performed.

## Remaining release gates

| Severity | Evidence / exact next action |
|---|---|
| P0 — competitive integrity | Owner-writable profile XP/rank/stats and client-controlled campaign/reward data; implement validated eligibility/award ledger and restrict sensitive writes before public competition |
| P0 — inventory integrity | Owner-inserted cosmetics/crates and trusted local/cloud maximum merge; restrict authoritative awards and verified import, then test replay/concurrency/account isolation |
| P1 — external verification | Configure staging Auth/Realtime and use two real accounts for login, cloud saves and live PvP end-to-end testing |
| Content gate | Supply playable licensed/original files for the desired 56-character soundtrack roster; obtain documented permission/clearance or original replacements for franchise content |
| Production setup | Configure real canonical origin, host and Auth redirects, rebuild and rerun smoke checks on that origin |
| Non-critical tooling limitation | Full npm audit has five high-severity dev-tool findings; runtime-only audit reports zero. Track a compatible tooling patch without force-downgrading Next ESLint |
| Persistence limitation | Cloud schema stores world summaries, while some rich campaign milestone/best-score data remain local; validate cross-device expectations |

Do not declare the public release ready until the P0 server-authority gate and the intended content/service requirements have been resolved.
