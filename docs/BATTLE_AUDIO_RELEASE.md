# Automatic battle soundtrack delivery

All 56 encounter entries now resolve to enabled, bundled original WAV recordings.
The existing battle hook/player selects the encounter track without user setup.
Personal browser-local assignments still override the bundled track; removing one
restores the default. Saved master/music/SFX levels and mute continue to apply.

## Recording provenance and distribution permission

These are original procedural scores and synthesized recordings authored for this
repository. They contain no downloaded recordings, third-party samples, franchise
melodies, covers or official performances. No rights to official anime soundtracks
were supplied, so no official recording has been added or represented as cleared.

`scripts/audio/renderBattleTrack.ts` contains the complete composition and instrument
code. `scripts/generate-battle-audio.ts` reproduces the files and provenance record.
Each encounter has a distinct motif/arrangement; seven palettes vary tempo, pitch,
percussion and lead timbre. Climactic encounters add heavier percussion and pad layers.
The results are synthetic game loops, not orchestral performances or authentic OSTs.

`public/audio/bgm/original/LICENSE.txt` grants use, hosting and redistribution,
including commercial use, for these original compositions/recordings. It does not
license franchise names, imagery or future official music. Keep its notice with the
distributed assets. `provenance.json` records all 56 hashes, byte counts, generation
version, tempo and duration; the full score source is included for review.

The WAV files total 34.1 MiB (mono PCM16, 22.05 kHz), served as static same-origin
assets. Gameplay loads only the selected file. No backend, upload service, third-party
audio host, additional runtime dependency or server credential is required.

Official recordings can replace individual manifest entries only after actual files
and documented distribution permission for the master and composition are supplied.
The original defaults remain available until those replacements are cleared. Existing
historical release reports describing missing soundtracks predate this asset delivery;
the generated soundtrack manifest is the current inventory.

## Executed validation

- Strict `npm run audit:audio -- --require-assets`: 56 mappings, zero missing files,
  zero unverified licenses, zero disabled entries. Original assets additionally pass
  SHA-256, byte count, PCM header, non-silent peak and clipping checks.
- 149 unit/regression tests, including reproducible generation, all encounter hashes,
  local overrides, autoplay recovery, volume, sequential transitions and cleanup.
- TypeScript/Next production build, ESLint and EN/PT-BR translation audit.
- `scripts/verify-battle-audio.mjs` against the local production frontend in installed
  Edge/Chromium: all 56 actual files returned HTTP 200 with audio MIME and decoded to
  audible PCM with expected duration. Seven visitor battles (one per world) started
  the expected recording after the start-button click without file selection. Each
  had one active looping element and released its source on SPA exit. One loop was
  exercised through its full duration. Autoplay policy was not bypassed.

The browser check intercepts auth/API responses into an isolated guest session and
blocks external requests. It does not verify Railway, Vercel/CDN caching, physical
speakers, every device or browser. Browser user-activation rules and saved mute must
still be respected. The existing build warning about an unset deployment metadata
origin remains unrelated to audio. No push or deployment is included.

## Official reference catalog follow-up

[OFFICIAL_SOUNDTRACK_CATALOG.md](OFFICIAL_SOUNDTRACK_CATALOG.md) records 41 verified
references, seven unresolved references and eight KeyForge originals across all 56
encounters. Verification concerns metadata, not distribution rights. No official
recording is installed or enabled. Three additional catalog tests bring the local
unit/regression suite to 152 passing tests; TypeScript, targeted ESLint, i18n, the
production build and strict audio audit also pass.

## Official recording selector

The battle hook now prefers an entry in the cleared official-recording registry and
falls back to the corresponding original on media failure. No official grant or master
has been supplied, so no official music was enabled. See the generated
[actual availability report](OFFICIAL_AUDIO_AVAILABILITY.md) for every encounter
and the real licensing routes. Unit fixtures test selector/failure behavior without
pretending to be licensed assets. Browser checks cover actual original fallback audio.

Latest verification: 156 unit/regression tests pass. The production build, standalone
TypeScript, targeted ESLint and strict bundled-asset audit pass. The updated real
Chromium verifier decodes all 56 actual defaults and exercises seven battle starts,
loop boundary, single active track and SPA cleanup. These are original fallbacks,
not official-master playback tests. The explicit `--require-official` audit exits 1
for 48 missing cleared anime masters. No Vercel deployment or official playback is
claimed. The existing metadataBase build warning remains.
