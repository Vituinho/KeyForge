import assert from "node:assert/strict"
import { test } from "node:test"
import { Window } from "happy-dom"
import React, { act } from "react"
import { createRoot } from "react-dom/client"
import { useBattle } from "./useBattle"
import { useTypingEngine } from "./useTypingEngine"
import { CHARACTERS } from "../data/characters"
import type { BattleState } from "../types/battle"

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
