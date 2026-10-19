import { createHash } from "node:crypto"
import { mkdirSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"
import { BATTLE_MUSIC } from "../src/lib/audio/battleMusic"
import { renderBattleTrack } from "./audio/renderBattleTrack"

const directory = resolve("public/audio/bgm/original")
mkdirSync(directory, { recursive: true })
const tracks = Object.values(BATTLE_MUSIC).map((track, index) => {
  const { audio, ...score } = renderBattleTrack(track.enemyId, index)
  const file = `${track.enemyId}.wav`
  writeFileSync(resolve(directory, file), audio)
  return { enemyId: track.enemyId, file, bytes: audio.length, sha256: createHash("sha256").update(audio).digest("hex"), ...score }
})
writeFileSync(resolve(directory, "provenance.json"), JSON.stringify({
  source: "Original procedural composition and synthesis authored for KeyForge; no third-party samples or recordings",
  generator: "scripts/audio/renderBattleTrack.ts", license: "/audio/bgm/original/LICENSE.txt", tracks,
}, null, 2) + "\n")
console.log(`Rendered ${tracks.length} original battle loops (${(tracks.reduce((total, track) => total + track.bytes, 0) / 1048576).toFixed(1)} MiB).`)
