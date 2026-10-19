# Battle music

All 56 encounters now ship with their own original default recording under `original/`.
Visitors do not need to choose, upload or configure a file. The existing battle hook
selects the current enemy's manifest entry when combat mounts, loops it, and recovers
from autoplay rejection on a genuine pointer/key interaction. Saved mute and volume
preferences are respected. Audio never blocks typing.

These are newly authored synthetic scores, not official anime recordings. No official
recordings, samples, covers or franchise melodies were sourced. Each world has its own
tempo, harmonic palette and instrumentation; each encounter has a seeded original
motif and arrangement, with stronger percussion and extra pads for climactic fights.
The complete score/synthesizer is `scripts/audio/renderBattleTrack.ts`. Commercial
hosting and redistribution permission is in `original/LICENSE.txt`. The 56 WAVs total
about 34 MiB, are mono PCM16/22.05 kHz and last roughly 12–18 seconds per loop. Only the
selected recording is loaded by gameplay; the roster is not preloaded.

Regenerate deterministically with `npx tsx scripts/generate-battle-audio.ts`. This also
writes `original/provenance.json` with generator version, tempo, duration, bytes and
SHA-256 for every recording. Review generated changes before committing them.
The strict gate `npm run audit:audio -- --require-assets` requires all 56 enabled
recordings, distribution permission, matching original-file hashes, valid PCM headers
and non-silent/non-clipped sample peaks. It does not waive licensing for future assets.

Actual local HTTP loading, browser decoding of every WAV and visitor playback can be
checked after `npm run build` and a loopback Next server on port 3137:
`node scripts/verify-battle-audio.mjs`. The optional test uses an existing Playwright
installation (`KEYFORGE_PLAYWRIGHT_MODULE`) and installed Edge; it adds no runtime
dependency. `KEYFORGE_UI_PORT` changes the loopback port. API requests are intercepted,
external requests are blocked, and no production data or accounts are used. It checks
all 56 decodes plus actual playback/loop/SPA cleanup in one battle from each world.
Browser autoplay rules still require a permitted interaction; this test does not
disable them. No Railway/Vercel deployment is implied by local verification.

## Personal encounter tracks

Open Battle audio settings, select one of the 56 encounters, and choose a local audio
file. MP3, Ogg, WAV, M4A, AAC, FLAC, WebM and Opus can be selected; actual decoding
depends on the browser. Files must be non-empty and at most 100 MiB. If playback
fails, select the file again or use a format your browser supports.

The file and its encounter assignment are stored in browser IndexedDB, never uploaded
or served to other players. Storage is scoped to this browser/origin/device, shared
by accounts using that browser, and may be cleared or evicted. No file-system path,
cookie or server credential is persisted in an assignment. If storage is blocked or
full, the selected file still works for the current page session, with a notice.
Removing an assignment returns the encounter to its bundled original manifest track.
If persistent removal fails, the UI warns that the previous assignment can return
after reload. Browser data cleanup removes the persisted audio as well as its metadata.

The existing player handles looping, master/music volume, mute, result ducking,
visibility pause/resume and user-interaction recovery after autoplay rejection.
SFX volume remains independent. Encounter changes fade the old track out before
starting the next one; only one recording plays at a time. Exit releases the audio
element and revokes any temporary Blob URL. No local file playback marks a bundled
manifest asset as licensed or satisfies the strict distribution audit.

## Supplying licensed official recordings

All 56 mappings remain independently configurable, including 48 anime encounters
and eight original Nexus encounters. The manifest's character-specific musical
directions are selection guidance, not claims that a particular official recording
is included or cleared. Naruto / Shippuden, Jujutsu Kaisen, Dragon Ball, One Piece,
Solo Leveling and Demon Slayer recordings use the same gated asset path.

Before adding a recording, obtain documented permission covering both the sound
recording and composition for the intended distribution, territories and use.
Keep the rights evidence with the release review, record its reference in the
manifest's license/source fields and provide any required attribution. Streaming
subscriptions or ownership of a soundtrack copy do not establish distribution rights.
Only then supply the asset, replace that encounter's file and license/source fields,
set commercialUse and available, and run the existing audit. Keep the bundled original
as the default until the official replacement's file and permissions are verified.
Do not download, scrape or embed unofficial recordings as a fallback.
