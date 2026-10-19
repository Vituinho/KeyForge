import assert from "node:assert/strict"
import { test } from "node:test"
import { BATTLE_MUSIC } from "./battleMusic"
import { OFFICIAL_RECORDINGS, selectBattleMusic, type OfficialRecording } from "./officialBattleMusic"
import { MusicManager } from "./musicManager"

// Synthetic metadata fixture only: no official recording or permission is asserted.
const fixture: OfficialRecording = {
  enemyId: "pain", title: "Synthetic clearance fixture", composers: ["Test composer"],
  file: "/audio/bgm/official/fixture.mp3", sourceUrl: "https://example.invalid/metadata",
  permissionDocument: "docs/audio-rights/fixture.md", sha256: "a".repeat(64),
  rights: { synchronization: true, masterUse: true, publicHosting: true, commercialUse: true },
}

test("cleared official recording wins automatically and retains its encounter's original as fallback", () => {
  const selection = selectBattleMusic("pain", { pain: fixture })
  assert.equal(selection.primary?.file, fixture.file)
  assert.equal(selection.primary?.name, fixture.title)
  assert.equal(selection.fallback, BATTLE_MUSIC.pain)
  assert.equal(selectBattleMusic("naruto", { pain: fixture }).primary, BATTLE_MUSIC.naruto)
  assert.deepEqual(selectBattleMusic("unknown", { unknown: { ...fixture, enemyId: "unknown" } }), { primary: null, fallback: null })
})

test("listening URLs, traversal, incomplete rights and mismatched encounters never replace defaults", () => {
  const rejected = [
    { ...fixture, file: "https://open.spotify.com/track/fixture" },
    { ...fixture, file: "/audio/bgm/official/../original/pain.wav" },
    { ...fixture, permissionDocument: "../permission.md" },
    { ...fixture, sha256: "missing" },
    { ...fixture, enemyId: "naruto" },
    ...Object.keys(fixture.rights).map(key => ({ ...fixture, rights: { ...fixture.rights, [key]: false } })),
  ]
  for (const recording of rejected) assert.equal(selectBattleMusic("pain", { pain: recording }).primary, BATTLE_MUSIC.pain)
  assert.equal(Object.keys(OFFICIAL_RECORDINGS).length, 0, "No real official assets/grants have been supplied")
})

test("official media failure releases its element and starts one looping original fallback", async () => {
  const audios: { src: string; paused: boolean; loop: boolean; onerror: null | (() => void) }[] = []
  const manager = new MusicManager({
    createAudio: src => {
      const audio = { src, paused: true, loop: false, volume: 0, preload: "", onerror: null as null | (() => void),
        async play() { this.paused = false }, pause() { this.paused = true },
        removeAttribute() { this.src = "" }, load() {} }
      audios.push(audio)
      return audio as unknown as HTMLAudioElement
    }, now: () => 0, frame: () => 1, cancelFrame: () => {},
  })
  try {
    const selection = selectBattleMusic("pain", { pain: fixture })
    manager.play(selection.primary, selection.fallback)
    await Promise.resolve()
    audios[0].onerror?.()
    await Promise.resolve()
    assert.equal(audios.length, 2)
    assert.equal(audios[0].src, "")
    assert.equal(audios[0].paused, true)
    assert.equal(audios[1].src, BATTLE_MUSIC.pain.file)
    assert.equal(audios[1].loop, true)
    assert.equal(audios.filter(audio => !audio.paused).length, 1)
  } finally { manager.cleanup() }
})
