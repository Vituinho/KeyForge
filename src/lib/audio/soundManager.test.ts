import assert from "node:assert/strict"
import { test } from "node:test"
import { soundManager } from "./soundManager"

test("procedural cues share the master/SFX gain and release oscillator nodes", () => {
  const gains: { value: number; disconnected: boolean; destination?: unknown }[] = []
  const oscillators: { onended: (() => void) | null; disconnected: boolean }[] = []
  class Context {
    state = "running"; currentTime = 0; destination = {}
    createGain() {
      const node = { value: 0, disconnected: false, destination: undefined as unknown,
        gain: { setValueAtTime: (value: number) => { node.value = value }, exponentialRampToValueAtTime: () => {} },
        connect: (target: unknown) => { node.destination = target }, disconnect: () => { node.disconnected = true } }
      gains.push(node); return node
    }
    createOscillator() {
      const node = { onended: null as (() => void) | null, disconnected: false, type: "sine", frequency: { setValueAtTime: () => {} }, connect: () => {}, start: () => {}, stop: () => {}, disconnect: () => { node.disconnected = true } }
      oscillators.push(node); return node
    }
    async resume() {} async suspend() {} async close() {}
  }
  Object.defineProperty(globalThis, "window", { value: { AudioContext: Context }, configurable: true })
  soundManager.saveSettings({ enabled: true, masterVolume: .2, sfxVolume: .4 })
  try {
    soundManager.playKeystroke(); soundManager.playTypo(); soundManager.playSentenceComplete(); soundManager.playPersonalBest(); soundManager.playBossPhaseShift()
    assert.equal(oscillators.length, 11)
    const masterGains = gains.filter(node => node.value === .2 * .4)
    assert.equal(masterGains.length, 5)
    for (const oscillator of oscillators) oscillator.onended?.()
    assert.ok(oscillators.every(node => node.disconnected))
    assert.ok(gains.every(node => node.disconnected))
    soundManager.saveSettings({ masterVolume: 0 })
    soundManager.playBossPhaseShift(); assert.equal(oscillators.length, 11)
    soundManager.saveSettings({ enabled: false, masterVolume: 1 })
    soundManager.playKeystroke(); assert.equal(oscillators.length, 11)
  } finally { soundManager.cleanup(); Reflect.deleteProperty(globalThis, "window") }
})
test("SFX remain inert without browser audio support", () => {
  soundManager.playKeystroke(); soundManager.playTypo(); soundManager.playBossPhaseShift()
})
