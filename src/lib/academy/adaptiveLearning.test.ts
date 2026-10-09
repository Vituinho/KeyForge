import assert from "node:assert/strict"
import { test } from "node:test"
import { en } from "../../locales/en"
import { ptBR } from "../../locales/pt-BR"
import { emptyKeyMastery, emptyMasteryProgress, type KeyMastery, type MasteryProgress } from "./keyMastery"
import {
  advanceLearningSession, emptyLearningTelemetry, generateLearningSession, keyReviewState,
  loadLearningTelemetry, rankLearningTargets, recordLearningTelemetry, refreshLearningPath,
  saveLearningTelemetry, sessionSample, summarizeLearningSession, type LearningTarget, type PathAttempt,
} from "./adaptiveLearning"

const date = "2026-10-09"
function key(overrides: Partial<KeyMastery> = {}): KeyMastery {
  return { ...emptyKeyMastery(), attempts: 100, correctAttempts: 98, errors: 2, accuracy: 98,
    mastery: 85, status: "good", timedAttempts: 100, timedCorrect: 98, responseTimeTotal: 25000,
    averageResponseTime: 250, averageSpeed: 47.04, bestSpeed: 50, recentAttempts: Array(40).fill(true),
    recentPerformance: Array.from({ length: 6 }, () => ({ attempts: 20, correct: 20, accuracy: 100, speed: 45, stage: 4, date })), ...overrides }
}
function progress(keys: Record<string, KeyMastery>): MasteryProgress { return { ...emptyMasteryProgress(), keys } }
function attempt(expected: string, correct = true, responseTime = 250, transitionBreak = false): PathAttempt {
  return { expected, typed: correct ? expected : "x", correct, responseTime, timestamp: 1, transitionBreak }
}
function pairs(count: number, time = 600): PathAttempt[] {
  return Array.from({ length: count }, () => [attempt("r"), attempt("t", true, time), attempt(" ")]).flat()
}

test("recurring errors and reliable low accuracy outrank slow, untrained and low-mastery keys", () => {
  const data = progress({ r: key({ accuracy: 88, correctAttempts: 88, errors: 12 }),
    t: key({ averageResponseTime: 700, responseTimeTotal: 70000 }), e: key({ mastery: 50, status: "learning" }) })
  const ranked = rankLearningTargets(data, emptyLearningTelemetry(), "ANSI", date)
  assert.equal(ranked[0].id, "key:r")
  assert.equal(ranked[0].reason, "lowAccuracy")
  assert.ok(ranked.findIndex((target) => target.id === "key:t") < ranked.findIndex((target) => target.id === "key:a"))
  const repeated = progress({ r: key({ recentAttempts: [...Array(7).fill(true), false, false, false] }) })
  assert.equal(rankLearningTargets(repeated, emptyLearningTelemetry(), "ANSI", date)[0].reason, "recurringErrors")
  const recentDrop = progress({ r: key({ recentAttempts: [...Array(25).fill(true), ...Array(5).fill(false), ...Array(10).fill(true)] }) })
  assert.equal(rankLearningTargets(recentDrop, emptyLearningTelemetry(), "ANSI", date)[0].evidence.accuracy, 87.5)
})

test("small key samples are exploration, not a confident weakness or speed claim", () => {
  const data = progress({ r: key({ attempts: 19, correctAttempts: 10, errors: 9, accuracy: 52.6,
    timedAttempts: 19, mastery: 10, status: "learning", recentAttempts: Array(19).fill(false), averageResponseTime: 900 }) })
  const target = rankLearningTargets(data, emptyLearningTelemetry(), "ABNT2", date).find((target) => target.id === "key:r")!
  assert.equal(target.reason, "smallSample")
  data.keys.r.attempts = 20
  assert.equal(rankLearningTargets(data, emptyLearningTelemetry(), "ABNT2", date)[0].reason, "recurringErrors")
})

test("transition analysis attributes errors to expected destination without cascading source errors", () => {
  const initial = emptyLearningTelemetry()
  const data = recordLearningTelemetry(initial, [attempt("R", false), attempt("T"), attempt("E", false), attempt("R")], emptyMasteryProgress(), "ANSI")
  assert.equal(data.transitions["r→t"].attempts, 1)
  assert.equal(data.transitions["r→t"].errors, 0)
  assert.equal(data.transitions["t→e"].errors, 1)
  assert.equal(data.transitions["e→r"].errors, 0)
  assert.equal(data.transitions["r→t"].averageResponseTime, 250)
  assert.deepEqual(initial, emptyLearningTelemetry())
})

test("transition chains stop at spaces, unsupported keys, corrections and drill boundaries", () => {
  let data = recordLearningTelemetry(emptyLearningTelemetry(), [attempt("r"), attempt("t", false), attempt("r", true, 250, true), attempt("r"), attempt(" "), attempt("t"), attempt("é"), attempt("o")], emptyMasteryProgress(), "ANSI")
  assert.equal(data.transitions["r→t"].errors, 1)
  assert.equal(data.transitions["t→r"], undefined)
  assert.equal(Object.keys(data.transitions).length, 1)
  data = recordLearningTelemetry(data, [attempt("t")], emptyMasteryProgress(), "ANSI")
  assert.equal(data.transitions["r→t"].attempts, 1)
})

test("transitions require adequate attempted and timed samples before ranking", () => {
  const data = progress({ r: key(), t: key() })
  let telemetry = recordLearningTelemetry(emptyLearningTelemetry(), pairs(11), data, "ANSI")
  assert.ok(!rankLearningTargets(data, telemetry, "ANSI", date).some((target) => target.kind === "transition"))
  telemetry = recordLearningTelemetry(telemetry, pairs(1), data, "ANSI")
  const target = rankLearningTargets(data, telemetry, "ANSI", date).find((target) => target.kind === "transition")!
  assert.equal(target.id, "transition:r→t")
  assert.equal(target.reason, "slowTransition")
  assert.equal(target.evidence.attempts, 12)
  telemetry.transitions["r→t"].timedAttempts = 7
  assert.ok(!rankLearningTargets(data, telemetry, "ANSI", date).some((target) => target.kind === "transition"))
  const untimed = recordLearningTelemetry(emptyLearningTelemetry(), pairs(20, 0), data, "ANSI")
  assert.equal(untimed.transitions["r→t"].averageResponseTime, 0)
  assert.ok(!rankLearningTargets(data, untimed, "ANSI", date).some((target) => target.kind === "transition"))
})

test("recent transition response is bounded and can recover despite a slow lifetime average", () => {
  const data = progress({ r: key(), t: key() })
  let telemetry = recordLearningTelemetry(emptyLearningTelemetry(), pairs(20, 900), data, "ANSI")
  telemetry = recordLearningTelemetry(telemetry, pairs(20, 200), data, "ANSI")
  assert.equal(telemetry.transitions["r→t"].averageResponseTime, 550)
  assert.equal(telemetry.transitions["r→t"].recentResponseTime, 200)
  assert.equal(telemetry.transitions["r→t"].recentResponseTimes.length, 20)
  assert.ok(!rankLearningTargets(data, telemetry, "ANSI", date).some((target) => target.kind === "transition"))
})

test("finger weakness needs evidence on multiple keys, using the existing finger map", () => {
  const weak = key({ accuracy: 90, correctAttempts: 90, errors: 10 })
  let data = progress({ r: weak })
  assert.ok(!rankLearningTargets(data, emptyLearningTelemetry(), "ABNT2", date).some((target) => target.kind === "finger"))
  data = progress({ r: weak, t: weak })
  const target = rankLearningTargets(data, emptyLearningTelemetry(), "ABNT2", date).find((target) => target.kind === "finger")!
  assert.equal(target.finger, "leftIndex")
  assert.deepEqual(target.keys, ["r", "t"])
})

test("review states require prior strength; age flags missing validation without mastery decay", () => {
  const strong = key({ mastery: 100, status: "mastered" }), before = structuredClone(strong)
  assert.equal(keyReviewState(strong, false, date), "healthy")
  assert.equal(keyReviewState(strong, true, "2026-11-01"), "reviewSoon")
  assert.deepEqual(strong, before)
  const regression = key({ mastery: 72, status: "weak", recentAttempts: [...Array(7).fill(true), false, false, false] })
  assert.equal(keyReviewState(regression, true, date), "reviewRecommended")
  assert.equal(keyReviewState(regression, false, date), null)
  const telemetry = recordLearningTelemetry(emptyLearningTelemetry(), [], progress({ r: strong }), "ANSI")
  assert.ok(recordLearningTelemetry(telemetry, [], progress({ r: regression }), "ANSI").strongKeys.includes("r"))
})

test("recommendation refresh reuses the path until quantized evidence materially changes", () => {
  const data = progress({ r: key() }), telemetry = emptyLearningTelemetry()
  const first = refreshLearningPath(null, data, telemetry, "ANSI", date)
  assert.equal(refreshLearningPath(first, data, telemetry, "ANSI", "2026-10-10"), first)
  const minor = progress({ r: key({ averageResponseTime: 251 }) })
  assert.equal(refreshLearningPath(first, minor, telemetry, "ANSI", date), first)
  const sparse = recordLearningTelemetry(telemetry, pairs(2), data, "ANSI")
  assert.equal(refreshLearningPath(first, data, sparse, "ANSI", date), first)
  const changed = progress({ r: key({ accuracy: 90, correctAttempts: 90, errors: 10 }) })
  assert.notEqual(refreshLearningPath(first, changed, telemetry, "ANSI", date), first)
})

test("session generation is deterministic, prebuilt, layout aware and ends with mixed review", () => {
  const data = progress({ r: key({ accuracy: 90, correctAttempts: 90 }), t: key() })
  const telemetry = recordLearningTelemetry(emptyLearningTelemetry(), pairs(12), data, "ABNT2")
  const path = refreshLearningPath(null, data, telemetry, "ABNT2", date)
  const session = generateLearningSession(path.targets, data, "ABNT2")
  assert.equal(path.targets.at(-1)?.kind, "mixed")
  assert.equal(new Set(path.targets.map((target) => target.id)).size, path.targets.length)
  assert.ok(path.targets.some((target) => target.kind === "transition"))
  assert.deepEqual(generateLearningSession(path.targets, data, "ABNT2"), session)
  assert.equal(session.drills.length, path.targets.length * 2)
  assert.ok(session.estimatedSeconds > 0)
  assert.ok(session.drills.every((drill) => drill.text.length && drill.target.keys.every((key) => drill.text.includes(key))))
  const cedilla: LearningTarget = { id: "key:ç", kind: "key", keys: ["ç"], reason: "smallSample", priority: 1, evidence: { attempts: 0 } }
  assert.ok(generateLearningSession([cedilla], emptyMasteryProgress(), "ABNT2").drills.every((drill) => drill.text.includes("ç")))
  assert.ok(!refreshLearningPath(null, emptyMasteryProgress(), emptyLearningTelemetry(), "ANSI", date).targets.some((target) => target.keys.includes("ç")))
})

test("automatic progression advances drills and targets once, then produces an accurate recap", () => {
  const before = emptyMasteryProgress(), path = refreshLearningPath(null, before, emptyLearningTelemetry(), "ANSI", date)
  const session = generateLearningSession(path.targets, before, "ANSI"), samples = []
  for (let index = 0; index < session.drills.length; index++) {
    samples.push(sessionSample([attempt("a"), attempt("b", index !== 0)], session.drills[index]))
    const advanced = advanceLearningSession(session, index)
    assert.equal(advanced.nextIndex, index + 1)
    assert.equal(advanced.completed, index === session.drills.length - 1)
    assert.equal(advanced.targetsCompleted, Math.floor((index + 1) / 2))
    assert.equal(advanced.next, session.drills[index + 1] ?? null)
  }
  const recap = summarizeLearningSession(samples, path.targets.length, before, progress({ a: key({ mastery: 15 }) }))
  assert.equal(recap.targetsCompleted, path.targets.length)
  assert.equal(recap.samples.reduce((sum, sample) => sum + sample.attempts - sample.correct, 0), 1)
  assert.equal(recap.masteryGains.a, 15)
  assert.equal(advanceLearningSession(session, session.drills.length).completed, true)
})

test("learning telemetry persists separately per player/layout and rejects corrupt snapshots", () => {
  const entries = new Map<string, string>(), descriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage")
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
    getItem: (key: string) => entries.get(key) ?? null, setItem: (key: string, value: string) => entries.set(key, value),
  } })
  try {
    const telemetry = recordLearningTelemetry(emptyLearningTelemetry(), pairs(12), progress({ r: key() }), "ABNT2")
    saveLearningTelemetry("player:ABNT2", telemetry)
    assert.deepEqual(loadLearningTelemetry("player:ABNT2"), telemetry)
    assert.deepEqual(loadLearningTelemetry("player:ANSI"), emptyLearningTelemetry())
    assert.deepEqual(loadLearningTelemetry("other:ABNT2"), emptyLearningTelemetry())
    entries.set("player:ABNT2:learning-path", "broken")
    assert.deepEqual(loadLearningTelemetry("player:ABNT2"), emptyLearningTelemetry())
    entries.set("player:ABNT2:learning-path", JSON.stringify({ ...telemetry, transitions: { bad: {} } }))
    assert.deepEqual(loadLearningTelemetry("player:ABNT2"), emptyLearningTelemetry())
  } finally {
    if (descriptor) Object.defineProperty(globalThis, "localStorage", descriptor)
    else Reflect.deleteProperty(globalThis, "localStorage")
  }
})

test("adaptive path explanations and recap have matching EN and PT-BR translations", () => {
  assert.deepEqual(Object.keys(en.academyPath).sort(), Object.keys(ptBR.academyPath).sort())
})
