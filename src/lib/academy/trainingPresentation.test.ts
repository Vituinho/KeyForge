import assert from "node:assert/strict"
import { test } from "node:test"
import { en } from "../../locales/en"
import { ptBR } from "../../locales/pt-BR"
import { emptyKeyMastery, emptyMasteryProgress, recordMasteryPractice } from "./keyMastery"
import type { KeyPerformance } from "./keyMastery"
import {
  academyNavigation, dailyGoal, emptyAcademyPractice, loadAcademyPractice, performanceTrend,
  practiceSample, recordAcademyPractice, saveAcademyPractice, trainingScore,
} from "./trainingPresentation"

function sample(speed = 40, accuracy = 98, attempts = 50): KeyPerformance {
  return { speed, accuracy, attempts, correct: attempts * accuracy / 100, date: "2026-10-03", stage: 4 }
}
const attempts = Array.from({ length: 40 }, (_, index) => ({
  expected: "r", typed: index === 5 ? "x" : "r", correct: index !== 5,
  responseTime: index === 0 ? 0 : 250, timestamp: index * 250,
}))

test("learning rate remains uncertain with sparse, incomplete or untimed history", () => {
  for (const history of [[], [sample()], Array(5).fill(sample()), Array(6).fill(sample(40, 98, 2)), Array(6).fill(sample(0))]) {
    assert.deepEqual(performanceTrend(history), { rate: "uncertain", speedDelta: null, accuracyDelta: null })
  }
})
test("sufficient recent history reports accurate deltas and learning direction", () => {
  const previous = Array(3).fill(sample(40, 96))
  assert.deepEqual(performanceTrend([...previous, ...Array(3).fill(sample(44, 98))]), { rate: "improving", speedDelta: 4, accuracyDelta: 2 })
  assert.equal(performanceTrend([...previous, ...Array(3).fill(sample(41, 96))]).rate, "stable")
  assert.equal(performanceTrend([...previous, ...Array(3).fill(sample(50, 90))]).rate, "declining")
  assert.equal(performanceTrend([...previous, ...Array(3).fill(sample(35, 96))]).rate, "declining")
})
test("trend windows use weighted attempts, not fabricated unweighted accuracy", () => {
  const before = [sample(40, 100, 10), sample(40, 90, 100), sample(40, 100, 10)]
  const after = Array(3).fill(sample(44, 95, 40))
  const result = performanceTrend([...before, ...after])
  assert.ok(Math.abs((result.accuracyDelta ?? 0) - (95 - 110 / 120 * 100)) < .001)
  assert.equal(result.speedDelta, 4)
})
test("presentation score is small, deterministic and rewards accuracy, speed, volume and consistency", () => {
  const baseline = Array(3).fill(sample(30, 90, 30))
  const score = trainingScore(baseline)
  assert.equal(trainingScore([]), 0)
  assert.equal(trainingScore(baseline), score)
  assert.ok(trainingScore(Array(3).fill(sample(30, 90, 60))) > score)
  assert.ok(trainingScore(Array(3).fill(sample(30, 98, 30))) > score)
  assert.ok(trainingScore(Array(3).fill(sample(50, 90, 30))) > score)
  const uneven = [sample(40, 100), sample(40, 80), sample(40, 90)]
  assert.ok(trainingScore(Array(3).fill(sample(40, 90))) > trainingScore(uneven))
  assert.equal(trainingScore(Array(3).fill(sample(60, 100, 100))), 1000)
})
test("daily progress counts active intervals, excludes first untimed keys and caps pauses", () => {
  const data = [...attempts, { ...attempts[0], responseTime: 60000 }]
  const recorded = practiceSample(data, "r", 0, "2026-10-03")
  assert.equal(recorded.seconds, 39 * .25 + 2)
  assert.equal(dailyGoal(7 * 60).minutes, 7)
  assert.ok(Math.abs(dailyGoal(7 * 60).percent - 7 / 15 * 100) < .001)
  assert.equal(dailyGoal(1200).percent, 100)
  assert.equal(dailyGoal(-10).percent, 0)
  assert.equal(dailyGoal(Number.NaN).percent, 0)
})
test("recording practice never changes mastery or historical typing errors", () => {
  const progress = recordMasteryPractice(emptyMasteryProgress(), attempts, "ABNT2", { targetKey: "r", stage: 0 })
  const before = structuredClone(progress)
  const practice = recordAcademyPractice(emptyAcademyPractice(), attempts, "r", 0)
  assert.deepEqual(progress, before)
  assert.equal(progress.keys.r.errors, 1)
  assert.equal(practice.history[0].correct, 39)
  assert.equal(recordAcademyPractice(practice, [], "r", 0), practice)
  assert.equal(emptyKeyMastery().mastery, 0)
})
test("practice persistence is per player/layout, backward compatible, and defensive", () => {
  const entries = new Map<string, string>()
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage")
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => entries.set(key, value),
  } })
  try {
    const practice = recordAcademyPractice(emptyAcademyPractice(), attempts, "r", 0)
    saveAcademyPractice("player:ABNT2", practice)
    assert.deepEqual(loadAcademyPractice("player:ABNT2"), practice)
    assert.deepEqual(loadAcademyPractice("player:ANSI"), emptyAcademyPractice())
    assert.deepEqual(loadAcademyPractice("other:ABNT2"), emptyAcademyPractice())
    entries.set("player:ABNT2:practice", "{broken")
    assert.deepEqual(loadAcademyPractice("player:ABNT2"), emptyAcademyPractice())
    entries.set("player:ABNT2:practice", JSON.stringify({ version: 1, days: { bad: -1 }, history: [] }))
    assert.deepEqual(loadAcademyPractice("player:ABNT2"), emptyAcademyPractice())
  } finally {
    if (descriptor) Object.defineProperty(globalThis, "localStorage", descriptor)
    else Reflect.deleteProperty(globalThis, "localStorage")
  }
})
test("navigation respects typing activity and legitimate editable fields", () => {
  assert.equal(academyNavigation("ArrowLeft", false, false), "previous")
  assert.equal(academyNavigation("ArrowRight", false, false), "next")
  assert.equal(academyNavigation("ArrowLeft", false, true), null)
  assert.equal(academyNavigation("Escape", false, true), "overview")
  for (const key of ["ArrowLeft", "ArrowRight", "Escape"]) assert.equal(academyNavigation(key, true, false), null)
  assert.equal(academyNavigation("r", false, false), null)
})
test("Academy presentation translations have identical EN and PT-BR keys", () => {
  assert.deepEqual(Object.keys(en.academyMastery).sort(), Object.keys(ptBR.academyMastery).sort())
  for (const [key, value] of Object.entries(en.academyMastery)) {
    assert.ok(value.length > 0 && ptBR.academyMastery[key as keyof typeof ptBR.academyMastery].length > 0)
  }
})
