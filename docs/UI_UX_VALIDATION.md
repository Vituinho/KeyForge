# UI and localization validation

This pass preserves the pending UI work and corrects observed layout and copy defects.
It does not change combat rules, typing semantics, progression, economy, authentication,
multiplayer authorization, database schema or server endpoints.

## Changes

- Natural Brazilian Portuguese across navigation, onboarding, authentication, Academy,
  training, campaigns, results, profiles, multiplayer and cosmetics. Shared labels use
  consistent WPM, rank, phase and inventory terminology. Mechanics retain their numbers.
- Missing `game.wpm`, `game.accuracy` and `dashboard.quickWidget.locker` references now
  resolve through existing shared dictionary keys.
- The translation audit checks literal `t(...)` references using the TypeScript parser,
  in addition to language parity. Unit tests check placeholders and non-empty copy.
- Dashboard actions stack on narrow screens; profile names can wrap without escaping
  cards. Pre-battle metrics use responsive columns. Battle HUD labels and typing focus
  are clearer. Academy decimals follow the selected locale without changing calculations.
- Mobile navigation respects responsive visibility. Language selection supports arrows,
  Home/End and Escape, restoring focus to its trigger. Dialogs fit short viewports.
- Keyboard settings reuse the existing focus trap and expose named switches. Onboarding
  controls have accessible names. Skin searches offer a translated empty state and reset.

## Reproduce the browser checks

Build and start the local frontend on loopback. The browser runner uses an existing
Playwright installation, without adding an application dependency. If needed, set
`KEYFORGE_PLAYWRIGHT_MODULE` to that installation's absolute package path.

```text
npm run build
node node_modules/next/dist/bin/next start -H 127.0.0.1 -p 3137
node scripts/verify-ui-layout.mjs --capture
```

Optional variables: `KEYFORGE_UI_PORT` (default 3137),
`KEYFORGE_BROWSER_EXECUTABLE` (defaults to installed Microsoft Edge). The runner
always uses `http://127.0.0.1`; it does not accept a production URL.
`--report-only` collects defects without failing. `--crates-only` runs just the
opening and reward dialog cases. JSON results and screenshots are written to a new
`keyforge-ui-*` folder in the OS temporary directory, not to Git.

The matrix uses English and Brazilian Portuguese at 360×800, 768×1024 and 1440×1000.
It covers 20 routes (including all seven world maps) plus onboarding, keyboard settings,
empty skin search, focused Academy, active battle, multiplayer hub, matchmaking,
private room, PvP arena/results and crate opening/reward dialogs: 192 combinations.
It checks document and content overflow (excluding intentional horizontal scroll
regions), visible raw translation keys and unnamed buttons. Screenshots complement
these checks; geometry alone cannot establish visual quality or accessibility.

Guest fixtures are isolated in temporary browser contexts. Online states use intercepted
local responses; external requests are blocked. They verify rendering only, not account
creation, live matches, rewards, networking, database persistence or security boundaries.
The room fixture stays waiting so the private-room case actually inspects its lobby.

## Validation and limitations

- Unit tests, including localization, language-switcher keyboard interaction, typing,
  Academy, battle flow and audio: 147 passing.
- TypeScript, repository ESLint, translation audit and optimized Next build: passing.
- English/Portuguese parity: 1,434 keys in each, no missing literal references.
- Campaign verification and PvP simulation: passing.
- Browser evidence: 180 route/state combinations in `keyforge-ui-Ba12ke`, plus 12
  crate-dialog combinations in `keyforge-ui-BN6152` (OS temporary directory).
  Both runners exited successfully with zero reported failures. The JSON and
  screenshot artifacts are local, disposable fixture evidence.

The build retains its existing `metadataBase` warning when no deployment origin is
configured. Desktop Chromium emulation does not replace physical touch/soft-keyboard
testing, Safari/Firefox checks, assistive-technology testing or real Railway/Vercel
two-account acceptance. Not every timed animation, reward variation, boss phase or
failure combination is exercised. No push, deployment or remote migration is included.
