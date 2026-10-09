# Battle music

Place licensed MP3 files here using the exact names in `docs/SOUNDTRACK_MANIFEST.md`.
Configure each entry in `src/lib/audio/battleMusic.ts`, including its source and license evidence.
Only entries with `available: true`, a license and commercial permission are played.
Run `npm run audit:audio` after supplying files. The strict content gate is
`npm run audit:audio -- --require-assets`.

No music assets or official anime soundtracks are distributed with this repository.
