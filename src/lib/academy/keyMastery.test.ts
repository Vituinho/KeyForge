import assert from "node:assert/strict"
import { test } from "node:test"
import {
  calculateKeyMastery, emptyKeyMastery, emptyMasteryProgress, learnableKeys, localPracticeDate,
  masteryStorageKey, nextPracticeStage, recordMasteryPractice, recommendKey,
} from "./keyMastery"
import type { TypingAttempt } from "../typing/typingAttempt"

function samples(count: number, correct = count, responseTime = 250): TypingAttempt[] {
  return Array.from({ length: count }, (_, index) => ({
    expected: "r", typed: index < correct ? "r" : "x", correct: index < correct,
    responseTime, timestamp: index * responseTime,
  }))
}
function practiced(count = 25, rounds = 5) {
  let progress = emptyMasteryProgress()
  for (let stage = 0; stage < rounds; stage++) progress = recordMasteryPractice(progress, samples(count), "ABNT2", {
    targetKey: "r", stage: Math.min(stage, 5), lessonCompleted: stage === rounds - 1, date: "2026-09-30",
  })
  return progress
}

test("untrained keys and lesson counts alone grant no mastery", () => {
  assert.equal(calculateKeyMastery({ ...emptyKeyMastery(), lessonsCompleted: 99 }).mastery, 0)
  const progress = recordMasteryPractice(emptyMasteryProgress(), [], "ABNT2", { targetKey: "r", stage: 5, lessonCompleted: true })
  assert.equal(progress.keys.r, undefined)
  assert.equal(Object.values(progress.days)[0].lessons, 0)
})
test("a small perfect sample cannot master a key", () => {
  const record = practiced(3, 6).keys.r
  assert.equal(record.accuracy, 100)
  assert.equal(record.attempts, 18)
  assert.equal(record.status, "learning")
  assert.ok(record.mastery < 30)
})
test("sufficient accurate, timed and stable applied practice masters a key", () => {
  const record = practiced().keys.r
  assert.equal(record.attempts, 125)
  assert.equal(record.status, "mastered")
  assert.equal(record.mastery, 100)
  assert.equal(record.averageResponseTime, 250)
  assert.equal(record.averageSpeed, 48)
  assert.equal(record.bestSpeed, 48)
  assert.equal(record.lessonsCompleted, 1)
})
test("isolated repetition alone does not demonstrate applied mastery", () => {
  let progress = emptyMasteryProgress()
  for (let index = 0; index < 5; index++) progress = recordMasteryPractice(progress, samples(25), "ANSI", { targetKey: "r", stage: 0 })
  assert.notEqual(progress.keys.r.status, "mastered")
})
test("recurring recent errors lower mastery despite strong historical accuracy", () => {
  const initial = practiced(200)
  const updated = recordMasteryPractice(initial, samples(10, 7), "ABNT2", { targetKey: "r", stage: 5 })
  assert.ok(updated.keys.r.accuracy > 99)
  assert.equal(updated.keys.r.status, "weak")
  assert.ok(updated.keys.r.mastery < initial.keys.r.mastery)
  assert.equal(updated.keys.r.errors, 3)
})
test("less than 96% lifetime accuracy cannot be mastered", () => {
  let progress = emptyMasteryProgress()
  for (let index = 0; index < 5; index++) progress = recordMasteryPractice(progress, samples(40, 38), "ABNT2", { targetKey: "r", stage: 5 })
  assert.equal(progress.keys.r.accuracy, 95)
  assert.notEqual(progress.keys.r.status, "mastered")
})
test("untimed first keys do not inflate response speed or grant mastery", () => {
  const progress = recordMasteryPractice(emptyMasteryProgress(), samples(120, 120, 0), "ABNT2", { targetKey: "r", stage: 5 })
  assert.equal(progress.keys.r.averageSpeed, 0)
  assert.equal(progress.keys.r.averageResponseTime, 0)
  assert.notEqual(progress.keys.r.status, "mastered")
  const timed = recordMasteryPractice(progress, samples(10, 10, 300), "ABNT2", { targetKey: "r", stage: 5 })
  assert.equal(timed.keys.r.averageResponseTime, 300)
  assert.equal(timed.keys.r.averageSpeed, 40)
})
test("historical errors remain when a corrected attempt is subsequently recorded", () => {
  const initial = recordMasteryPractice(emptyMasteryProgress(), samples(1, 0), "ABNT2", { targetKey: "r", stage: 0 })
  const corrected = recordMasteryPractice(initial, samples(1), "ABNT2", { targetKey: "r", stage: 0 })
  assert.equal(corrected.keys.r.attempts, 2)
  assert.equal(corrected.keys.r.errors, 1)
  assert.equal(corrected.keys.r.correctAttempts, 1)
  assert.equal(corrected.keys.r.accuracy, 50)
  assert.equal(initial.keys.r.attempts, 1)
})
test("telemetry belongs to the expected missed key, never the substituted key", () => {
  const progress = recordMasteryPractice(emptyMasteryProgress(), [{ expected: "ç", typed: "c", correct: false, responseTime: 150, timestamp: 0 }], "ABNT2", { targetKey: "ç", stage: 0 })
  assert.equal(progress.keys.ç.errors, 1)
  assert.equal(progress.keys.c, undefined)
})
test("adaptive stages advance on evidence and step back on poor accuracy", () => {
  assert.equal(nextPracticeStage(0, practiced(4, 1).keys.r), 1)
  assert.equal(nextPracticeStage(5, practiced().keys.r), 5)
  const poor = recordMasteryPractice(emptyMasteryProgress(), samples(10, 5), "ABNT2", { targetKey: "r", stage: 3 }).keys.r
  assert.equal(nextPracticeStage(3, poor), 2)
  assert.equal(nextPracticeStage(0, poor), 0)
  assert.equal(nextPracticeStage(2, practiced(3, 1).keys.r), 2)
})
test("weak keys are recommended, while every layout key remains selectable", () => {
  const progress = recordMasteryPractice(emptyMasteryProgress(), samples(10, 5), "ABNT2", { targetKey: "r", stage: 0 })
  assert.equal(recommendKey(progress, "ABNT2"), "r")
  assert.ok(learnableKeys("ABNT2").includes("ç"))
  assert.ok(!learnableKeys("ANSI").includes("ç"))
  for (const layout of ["ABNT2", "ANSI"] as const) {
    const keys = learnableKeys(layout)
    assert.equal(new Set(keys).size, keys.length)
    assert.ok(keys.includes("0") && keys.includes("@") && keys.includes("~"))
  }
})
test("recent history stays bounded and daily practice includes partial drills", () => {
  const progress = practiced(25, 20)
  assert.equal(progress.keys.r.recentAttempts.length, 40)
  assert.equal(progress.keys.r.recentPerformance.length, 8)
  assert.equal(progress.days["2026-09-30"].attempts, 500)
  assert.equal(progress.days["2026-09-30"].lessons, 1)
  const partial = recordMasteryPractice(progress, samples(2), "ABNT2", { targetKey: "r", stage: 0, date: "2026-10-01" })
  assert.deepEqual(partial.days["2026-10-01"], { attempts: 2, lessons: 0 })
})
test("storage namespaces isolate players and layouts; daily dates use local calendar", () => {
  assert.notEqual(masteryStorageKey("one", "ABNT2"), masteryStorageKey("two", "ABNT2"))
  assert.notEqual(masteryStorageKey("one", "ABNT2"), masteryStorageKey("one", "ANSI"))
  assert.equal(localPracticeDate(new Date(2026, 8, 30, 23, 59)), "2026-09-30")
})
