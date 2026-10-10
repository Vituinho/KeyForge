import assert from "node:assert/strict"
import { test } from "node:test"
import { Window } from "happy-dom"
import React, { act } from "react"
import { createRoot } from "react-dom/client"
import { useBattle } from "./useBattle"
import { useTypingEngine } from "./useTypingEngine"
import { CHARACTERS } from "../data/characters"
import type { BattleState } from "../types/battle"
import { replayBattle, BattleInputEvent } from "../lib/security/battleValidation"

test("battle timers survive renders; the final strike is included and typing advances immediately", async () => {
  const browser = new Window({ url: "http://localhost:3002" })
  Object.assign(globalThis, { window: browser, document: browser.document, HTMLElement: browser.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true })
  const nativeInterval = globalThis.setInterval
  const nativeClear = globalThis.clearInterval
  const nativeNow = Date.now
  let now = 1000
  Date.now = () => now
  let starts = 0
  const timers = new Set<ReturnType<typeof setInterval>>()
  globalThis.setInterval = ((callback: () => void, ms: number) => {
    if (ms === 60000) starts++
    const timer = nativeInterval(callback, ms); timers.add(timer); return timer
  }) as typeof setInterval
  const enemy = { ...CHARACTERS[0], maxHp: 200, attack: 0, attackInterval: 60000, mechanics: [] }
  let engine!: ReturnType<typeof useTypingEngine>
  let combat!: ReturnType<typeof useBattle>
  let completed: BattleState | null = null
  const texts = ["computer", "rato"]
  function Harness() {
    combat = useBattle({ enemy, texts, onBattleEnd: () => { completed = combat.battleState } })
    engine = useTypingEngine({ text: combat.currentText, onComplete: stats => {
      const { isEnemyDefeated } = combat.applyRoundDamage(stats)
      if (!isEnemyDefeated) { engine.nextRound(texts[1]); combat.advanceToNextSentence() }
    } })
    return React.createElement("input", { ref: engine.inputRef, readOnly: true })
  }
  const host = browser.document.createElement("div")
  browser.document.body.append(host)
  const root = createRoot(host as unknown as HTMLElement)
  const type = async (key: string) => act(() => {
    now += 75
    host.querySelector("input")!.dispatchEvent(new browser.KeyboardEvent("keydown", { key, bubbles: true }))
  })
  try {
    await act(() => root.render(React.createElement(Harness)))
    assert.ok(combat.battleState.battleStartTime)
    for (const key of "comouter") await type(key)
    assert.equal(engine.stats.totalErrors, 1)
    assert.equal(engine.stats.totalCorrectCharacters, 7)
    assert.equal(combat.battleState.roundHistory[0].errors, 1)
    assert.equal(engine.expectedKey, "r")
    await type("r") // No delay/focus/reward gate before the next character.
    assert.equal(engine.expectedKey, "a")
    for (const key of "ato") await type(key)
    assert.equal(starts, 1)
    assert.ok(completed)
    assert.equal((completed as BattleState).phase, "victory")
    assert.equal((completed as BattleState).roundHistory.length, 2)
    assert.ok((completed as BattleState).battleEndTime)
  } finally {
    await act(() => root.unmount())
    for (const timer of timers) nativeClear(timer)
    globalThis.setInterval = nativeInterval
    Date.now = nativeNow
    await browser.happyDOM.close()
  }
})

test("an interrupted battle retains attempts newer than the sampled HUD metrics", async () => {
  const browser = new Window({ url: "http://localhost:3003" })
  Object.assign(globalThis, { window: browser, document: browser.document, HTMLElement: browser.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true })
  let engine!: ReturnType<typeof useTypingEngine>
  function Harness({ enabled }: { enabled: boolean }) {
    engine = useTypingEngine({ text: "computers", enabled, statsUpdateIntervalMs: 10000 })
    return React.createElement("input", { ref: engine.inputRef, readOnly: true })
  }
  const host = browser.document.createElement("div")
  browser.document.body.append(host)
  const root = createRoot(host as unknown as HTMLElement)
  try {
    await act(() => root.render(React.createElement(Harness, { enabled: true })))
    for (const key of "comouter") await act(() => {
      host.querySelector("input")!.dispatchEvent(new browser.KeyboardEvent("keydown", { key, bubbles: true }))
    })
    assert.ok(engine.stats.totalTypingAttempts < 8)
    await act(() => root.render(React.createElement(Harness, { enabled: false })))
    const final = engine.getStats()
    assert.equal(final.totalTypingAttempts, 8)
    assert.equal(final.totalCorrectCharacters, 7)
    assert.equal(final.totalErrors, 1)
    assert.equal(final.keyStats.p.errors, 1)
    assert.equal(final.errorLog[0].typed, "o")
  } finally {
    await act(() => root.unmount())
    await browser.happyDOM.close()
  }
})

test("security evidence captures final keys and Backspace without gating the next drill", async () => {
  const browser = new Window({ url: "http://localhost:3004" })
  Object.assign(globalThis, { window: browser, document: browser.document, HTMLElement: browser.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true })
  const nativeNow = Date.now
  let now = 1000, round = 0
  Date.now = () => now
  const events: BattleInputEvent[] = []
  const texts = ["computer", "rato"]
  let engine!: ReturnType<typeof useTypingEngine>
  let final!: ReturnType<typeof useTypingEngine>["stats"]
  function Harness() {
    engine = useTypingEngine({ text: texts[round], statsUpdateIntervalMs: 100,
      onInputEvent: (key, timestamp) => events.push({ key, at: timestamp - 1000 }),
      onComplete: stats => {
        assert.equal(events.at(-1)?.key, round === 0 ? "r" : "o")
        if (round++ === 0) engine.nextRound(texts[1])
        else final = stats
      },
    })
    return React.createElement("input", { ref: engine.inputRef, readOnly: true })
  }
  const host = browser.document.createElement("div")
  browser.document.body.append(host)
  const root = createRoot(host as unknown as HTMLElement)
  try {
    await act(() => root.render(React.createElement(Harness)))
    for (const key of ["c","o","m","x","Backspace",..."puter"]) await act(() => {
      now += 200; host.querySelector("input")!.dispatchEvent(new browser.KeyboardEvent("keydown", { key, bubbles: true }))
    })
    assert.equal(engine.expectedKey, "r")
    for (const key of "rato") await act(() => {
      now += 200; host.querySelector("input")!.dispatchEvent(new browser.KeyboardEvent("keydown", { key, bubbles: true }))
    })
    const enemy = { ...CHARACTERS[0], maxHp: 100000, attack: 0, attackInterval: 60000, mechanics: [] }
    const server = replayBattle({enemy,texts,language:"en"},events,now-1000+100,true).finalStats
    for (const key of ["totalErrors","totalTypingAttempts","totalCorrectCharacters","battleAccuracy","battleWpm","bestCombo"] as const) assert.equal(server[key],final[key],key)
    assert.equal(server.keyStats.p.errors,1)
    assert.deepEqual(server.keyStats,final.keyStats)
  } finally {
    await act(() => root.unmount()); Date.now=nativeNow; await browser.happyDOM.close()
  }
})
