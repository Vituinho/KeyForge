import assert from "node:assert/strict"
import { test } from "node:test"
import { loadPracticeHistory, savePracticeRun, practiceHistoryKey } from "./practiceHistoryStorage"
import type { TypingStats } from "../../types/typing"

test("practice history is local, bounded and isolated per player and layout", () => {
  const store = new Map<string, string>()
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { getItem: (key: string) => store.get(key) ?? null, setItem: (key: string, value: string) => store.set(key, value) } })
  const stats = { totalTypingAttempts: 100, totalErrors: 3, battleWpm: 40, battleAccuracy: 97, totalElapsedTime: 30 } as TypingStats
  try {
    for (let i = 0; i < 65; i++) savePracticeRun("a", "ANSI", stats)
    assert.equal(loadPracticeHistory("a", "ANSI").length, 60)
    assert.equal(loadPracticeHistory("a", "ABNT2").length, 0)
    assert.equal(loadPracticeHistory("b", "ANSI").length, 0)
    store.set(practiceHistoryKey("a", "ANSI"), '[{"accuracy":200}]')
    assert.deepEqual(loadPracticeHistory("a", "ANSI"), [])
    store.set(practiceHistoryKey("a", "ANSI"), "invalid JSON")
    assert.deepEqual(loadPracticeHistory("a", "ANSI"), [])
  } finally { Reflect.deleteProperty(globalThis, "localStorage") }
})
