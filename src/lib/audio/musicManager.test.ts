import assert from "node:assert/strict"
import { test } from "node:test"
import { MusicManager } from "./musicManager"
import { BATTLE_MUSIC, type BattleMusicTrack } from "./battleMusic"
import { CHARACTERS } from "../../data/characters"
import { normalizeAudioSettings, saveAudioSettings } from "./audioSettings"

const track = (id: string): BattleMusicTrack => ({ enemyId: id, name: id, file: `/audio/bgm/${id}.mp3`, style: "Test", available: true, source: "Original test fixture", license: "CC0", commercialUse: true, attribution: null })
class FakeAudio {
  volume = 0; loop = false; preload = ""; onerror: (() => void) | null = null
  plays = 0; pauses = 0; loads = 0; removed = false; blocked = false; unsupported = false
  async play() { this.plays++; if (this.blocked) throw Object.assign(new Error("Autoplay"), { name: "NotAllowedError" }); if (this.unsupported) throw Object.assign(new Error("Unsupported"), { name: "NotSupportedError" }) }
  pause() { this.pauses++ }
  removeAttribute() { this.removed = true }
  load() { this.loads++ }
}
function harness() {
  let now = 0, id = 0
  const frames = new Map<number, FrameRequestCallback>(), audios: FakeAudio[] = []
  const manager = new MusicManager({ createAudio: () => { const audio = new FakeAudio(); audios.push(audio); return audio as unknown as HTMLAudioElement },
    now: () => now, frame: callback => { frames.set(++id, callback); return id }, cancelFrame: id => { frames.delete(id) } })
  const advance = (ms: number) => { now += ms; const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(callback => callback(now)) }
  saveAudioSettings({ enabled: true, masterVolume: .7, musicVolume: .35, sfxVolume: .8 })
  return { manager, audios, advance, frames }
}
const settle = () => new Promise<void>(resolve => queueMicrotask(resolve))

test("audio preferences migrate old saves, preserve mute and clamp malformed volumes", () => {
  assert.deepEqual(normalizeAudioSettings({ enabled: false, masterVolume: .2, sfxVolume: .6 }), { enabled: false, masterVolume: .2, musicVolume: .35, sfxVolume: .6 })
  assert.deepEqual(normalizeAudioSettings({ masterVolume: Infinity, musicVolume: -1, sfxVolume: 2 }), { enabled: true, masterVolume: .7, musicVolume: 0, sfxVolume: 1 })
  assert.deepEqual(normalizeAudioSettings(null), normalizeAudioSettings({}))
})
test("all 56 encounter IDs have independent mappings; missing or unlicensed assets stay silent", () => {
  assert.equal(Object.keys(BATTLE_MUSIC).length, CHARACTERS.length)
  assert.equal(new Set(Object.values(BATTLE_MUSIC).map(entry => entry.file)).size, CHARACTERS.length)
  for (const enemy of CHARACTERS) assert.equal(BATTLE_MUSIC[enemy.id].enemyId, enemy.id)
  const { manager, audios } = harness()
  manager.play(null)
  manager.play({ ...track("missing"), available: false })
  manager.play({ ...track("unlicensed"), license: null })
  assert.equal(audios.length, 0)
  manager.cleanup()
})
test("fade-in, loop and same-enemy requests preserve playback through sentences and phases", async () => {
  const { manager, audios, advance } = harness()
  manager.play(track("r")); await settle(); advance(650)
  assert.equal(audios[0].loop, true)
  assert.equal(audios[0].volume, .7 * .35)
  manager.play(track("r")); manager.play(track("r"))
  assert.equal(audios.length, 1); assert.equal(audios[0].plays, 1)
  manager.cleanup()
})
test("crossfade releases the old track, while results duck smoothly and exit cleans resources", async () => {
  const { manager, audios, advance, frames } = harness()
  manager.play(track("r")); await settle(); advance(650)
  manager.play(track("t")); await settle(); advance(400)
  assert.ok(audios[0].volume > 0 && audios[1].volume > 0)
  advance(400); assert.equal(audios[0].removed, true)
  manager.setResultMode(true); advance(250)
  assert.ok(audios[1].volume < .245 && audios[1].volume > .073)
  advance(250); assert.ok(Math.abs(audios[1].volume - .0735) < .00001)
  manager.stop(); advance(500)
  assert.equal(audios[1].removed, true); assert.equal(frames.size, 0)
})
test("missing media is remembered and an explicitly licensed fallback is used once", async () => {
  const { manager, audios } = harness()
  manager.play(track("r"), track("fallback")); await settle()
  audios[0].onerror?.(); await settle()
  assert.equal(audios.length, 2)
  manager.play(track("r"), track("fallback"))
  assert.equal(audios.length, 2)
  manager.cleanup()
})
test("autoplay rejection remains pending until resume; mute is never overridden", async () => {
  const { manager, audios } = harness()
  manager.play(track("r")); audios[0].blocked = true
  manager.pause(); await settle()
  manager.resume(); await settle()
  assert.equal(audios[0].plays, 2)
  manager.mute(true); audios[0].blocked = false
  manager.resume(); await settle(); assert.equal(audios[0].plays, 2)
  manager.mute(false); await settle(); assert.equal(audios[0].plays, 3)
  manager.cleanup()
})
test("volume changes apply without creating or restarting tracks", async () => {
  const { manager, audios, advance } = harness()
  manager.play(track("r")); await settle(); advance(650)
  manager.setVolume(.5)
  assert.equal(audios[0].volume, .35); assert.equal(audios.length, 1)
  manager.cleanup()
})
test("leaving during a pending play cannot restart a released audio element", async () => {
  const { manager, audios, frames } = harness()
  manager.play(track("r")); manager.cleanup(); await settle()
  assert.equal(audios[0].removed, true); assert.equal(frames.size, 0)
})

test("playback rejection uses the licensed fallback without retrying failed media", async () => {
  const { manager, audios } = harness()
  manager.play(track("r"), track("fallback")); await settle()
  audios[0].unsupported = true
  manager.pause(); manager.resume(); await settle(); await settle()
  assert.equal(audios.length, 2)
  assert.equal(audios[0].removed, true)
  manager.play(track("r"), track("fallback"))
  assert.equal(audios.length, 2)
  manager.cleanup()
})
