import assert from "node:assert/strict"
import { test } from "node:test"
import { practiceSecondsRemaining, finishPractice } from "./practiceClock"
import type { TypingStats } from "@/types/typing"

test("timed practice starts at the first attempt and expires at the chosen deadline", () => {
  assert.equal(practiceSecondsRemaining(null, 15, 999999), 15)
  assert.equal(practiceSecondsRemaining(1000, 15, 1001), 15)
  assert.equal(practiceSecondsRemaining(1000, 15, 15001), 1)
  assert.equal(practiceSecondsRemaining(1000, 15, 16000), 0)
  assert.equal(practiceSecondsRemaining(1000, 15, 20000), 0)
})
test("free practice has no artificial deadline", () => {
  assert.equal(practiceSecondsRemaining(null, 0, 0), null)
  assert.equal(practiceSecondsRemaining(0, 0, 999999), null)
})

test("finished benchmarks include idle time without rewriting historical mistakes", () => {
  const stats = { totalCorrectCharacters: 20, totalTypingAttempts: 25, totalErrors: 5, battleAccuracy: 80,
    keyStats: { r: { attempts: 10, correct: 5, errors: 5, totalResponseTime: 1000 } }, errorLog: [], bestCombo: 8,
    totalElapsedTime: 2, battleWpm: 120, isCompleted: false } as unknown as TypingStats
  const result = finishPractice(stats, 15)
  assert.equal(result.battleWpm, 16)
  assert.equal(result.rawWpm, 20)
  assert.equal(result.totalElapsedTime, 15)
  assert.equal(result.battleAccuracy, 80)
  assert.equal(result.totalErrors, 5)
  assert.equal(result.keyStats, stats.keyStats)
  assert.equal(result.bestCombo, 8)
  assert.equal(result.isCompleted, true)
  assert.equal(stats.isCompleted, false)
})
