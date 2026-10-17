# Battle music

Place licensed MP3 files here using the exact names in `docs/SOUNDTRACK_MANIFEST.md`.
Configure each entry in `src/lib/audio/battleMusic.ts`, including its source and license evidence.
Only entries with `available: true`, a license and commercial permission are played.
Run `npm run audit:audio` after supplying files. The strict content gate is
`npm run audit:audio -- --require-assets`.

No music assets or official anime soundtracks are distributed with this repository.

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
Removing an assignment returns the encounter to its licensed manifest track, if any.
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
Only then supply the exact asset filename, set commercialUse and available, and run
the existing audit. Keep the track disabled if permissions or the file are missing.
Do not download, scrape or embed unofficial recordings as a fallback.
