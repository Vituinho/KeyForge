import assert from "node:assert/strict"
import { test } from "node:test"
import { Window } from "happy-dom"
import React, { act } from "react"
import { createRoot } from "react-dom/client"
import { IDBFactory } from "fake-indexeddb"
import { useBattleMusic } from "./useBattleMusic"
import { localBattleTracks } from "../lib/audio/localBattleTracks"
import { saveAudioSettings } from "../lib/audio/audioSettings"

test("battle hook follows encounter assignments, keeps results quiet, pauses hidden pages and stops on exit", async context => {
  const browser = new Window({ url: "http://localhost" })
  let now = 0, frameId = 0, urlId = 0
  const frames = new Map<number, FrameRequestCallback>(), revoked: string[] = []
  class AudioFixture {
    paused = true; volume = 0; loop = false; preload = ""; onerror = null
    async play() { this.paused = false }
    pause() { this.paused = true }
    removeAttribute() {}
    load() {}
  }
  const audios: AudioFixture[] = []
  Object.assign(globalThis, { window: browser, document: browser.document, indexedDB: new IDBFactory(), IS_REACT_ACT_ENVIRONMENT: true,
    Audio: class extends AudioFixture { constructor() { super(); audios.push(this) } },
    requestAnimationFrame: (callback: FrameRequestCallback) => { frames.set(++frameId, callback); return frameId },
    cancelAnimationFrame: (id: number) => { frames.delete(id) },
  })
  context.mock.method(performance, "now", () => now)
  context.mock.method(URL, "createObjectURL", () => `blob:fixture-${++urlId}`)
  context.mock.method(URL, "revokeObjectURL", (url: string) => { revoked.push(url) })
  const advance = async (ms: number) => { now += ms; const pending = [...frames.values()]; frames.clear(); await act(async () => { pending.forEach(callback => callback(now)) }) }
  const file = new File(["test audio"], "personal.mp3", { type: "audio/mpeg" })
  await localBattleTracks.assign("naruto", file)
  await localBattleTracks.assign("pain", file)
  saveAudioSettings({ enabled: true, masterVolume: .7, musicVolume: .35 })
  const host = browser.document.createElement("div"); browser.document.body.append(host)
  const root = createRoot(host as unknown as HTMLElement)
  function Harness({ enemy, result = false }: { enemy: string; result?: boolean }) { useBattleMusic(enemy, result); return null }
  try {
    await act(async () => { root.render(<Harness enemy="naruto" />) })
    await advance(650)
    assert.equal(audios.length, 1)
    assert.equal(audios[0].loop, true)
    await act(async () => { root.render(<Harness enemy="naruto" result />) })
    await advance(500)
    assert.ok(Math.abs(audios[0].volume - .0735) < .00001)
    assert.equal(audios.length, 1)
    await act(async () => { root.render(<Harness enemy="pain" />) })
    assert.equal(audios.length, 1)
    await advance(250)
    assert.equal(audios.length, 2)
    assert.equal(audios[0].paused, true)
    assert.equal(audios[1].paused, false)
    assert.deepEqual(revoked, ["blob:fixture-1"])
    Object.defineProperty(browser.document, "hidden", { configurable: true, value: true })
    browser.document.dispatchEvent(new browser.Event("visibilitychange"))
    assert.equal(audios[1].paused, true)
    Object.defineProperty(browser.document, "hidden", { configurable: true, value: false })
    browser.document.dispatchEvent(new browser.Event("visibilitychange"))
    await act(async () => {})
    assert.equal(audios[1].paused, false)
  } finally { await act(() => root.unmount()); await browser.happyDOM.close() }
  assert.ok(audios.every(audio => audio.paused))
  assert.equal(frames.size, 0)
  assert.deepEqual(revoked, ["blob:fixture-1", "blob:fixture-2"])
})
