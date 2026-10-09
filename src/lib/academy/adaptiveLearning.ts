import type { TypingAttempt } from "../typing/typingAttempt"
import type { Finger, KeyboardLayoutId } from "../keyboard/fingerMap"
import { getPracticeFinger, generateKeyExercises } from "./keyExercises"
import { emptyKeyMastery, learnableKeys, localPracticeDate, type KeyMastery, type MasteryProgress } from "./keyMastery"
import { performanceTrend, practiceSample, type PracticeSample } from "./trainingPresentation"

export const MIN_KEY_ATTEMPTS = 20
export const MIN_TRANSITION_ATTEMPTS = 12
export const MIN_TRANSITION_TIMED = 8
export type ReviewState = "healthy" | "reviewSoon" | "reviewRecommended"
export type RecommendationReason = "lowAccuracy" | "recurringErrors" | "slowResponse" | "decliningPerformance"
  | "smallSample" | "lowMastery" | "slowTransition" | "transitionErrors" | "fingerWeakness" | "reviewSoon" | "reviewRecommended" | "balancedReview"
export interface PathAttempt extends TypingAttempt { transitionBreak?: boolean }
export interface TransitionRecord {
  from: string; to: string; attempts: number; errors: number; timedAttempts: number; responseTimeTotal: number
  averageResponseTime: number; recentResponseTimes: number[]; recentResponseTime: number
}
export interface LearningTelemetry { version: 1; transitions: Record<string, TransitionRecord>; strongKeys: string[] }
export interface LearningTarget {
  id: string; kind: "key" | "transition" | "finger" | "mixed"; keys: string[]; finger?: Finger
  reason: RecommendationReason; priority: number; evidence: { attempts: number; accuracy?: number; responseTime?: number }
}
export interface LearningPath { fingerprint: string; targets: LearningTarget[]; progress: MasteryProgress }
export interface SessionDrill { target: LearningTarget; text: string; stage: number; targetIndex: number }
export interface LearningSession { targets: LearningTarget[]; drills: SessionDrill[]; estimatedSeconds: number }
export interface SessionRecap { samples: PracticeSample[]; targetsCompleted: number; masteryGains: Record<string, number> }
export function emptyLearningTelemetry(): LearningTelemetry { return { version: 1, transitions: {}, strongKeys: [] } }
const normalized = (key: string) => key.normalize("NFC").toLowerCase()

/** Adjacent expected positions only. Spaces, drill boundaries and cursor corrections break the chain. */
export function recordLearningTelemetry(old: LearningTelemetry, attempts: PathAttempt[], progress: MasteryProgress, layout: KeyboardLayoutId): LearningTelemetry {
  const allowed = new Set(learnableKeys(layout)), transitions = { ...old.transitions }
  for (let index = 1; index < attempts.length; index++) {
    const previous = attempts[index - 1], current = attempts[index]
    const from = normalized(previous.expected), to = normalized(current.expected)
    if (current.transitionBreak || !allowed.has(from) || !allowed.has(to) || from === to) continue
    const id = `${from}→${to}`
    const record = transitions[id] ?? { from, to, attempts: 0, errors: 0, timedAttempts: 0,
      responseTimeTotal: 0, averageResponseTime: 0, recentResponseTimes: [], recentResponseTime: 0 }
    const timed = Number.isFinite(current.responseTime) && current.responseTime > 0
    const responseTimeTotal = record.responseTimeTotal + (timed ? Math.min(2000, current.responseTime) : 0)
    const timedAttempts = record.timedAttempts + Number(timed)
    const recentResponseTimes = timed ? [...record.recentResponseTimes, Math.min(2000, current.responseTime)].slice(-20) : record.recentResponseTimes
    transitions[id] = { ...record, attempts: record.attempts + 1, errors: record.errors + Number(!current.correct),
      timedAttempts, responseTimeTotal, averageResponseTime: timedAttempts ? responseTimeTotal / timedAttempts : 0,
      recentResponseTimes, recentResponseTime: recentResponseTimes.reduce((sum, time) => sum + time, 0) / (recentResponseTimes.length || 1) }
  }
  const strongKeys = [...new Set([...old.strongKeys, ...Object.entries(progress.keys)
    .filter(([, key]) => key.status === "good" || key.status === "mastered").map(([key]) => key)])].filter((key) => allowed.has(key))
  return { version: 1, transitions, strongKeys }
}

function recentAccuracy(record: KeyMastery) {
  const recent = record.recentAttempts
  return recent.length ? recent.filter(Boolean).length / recent.length * 100 : 100
}
function recurringErrors(record: KeyMastery) {
  return record.recentAttempts.length >= 10 && record.recentAttempts.slice(-10).filter((correct) => !correct).length >= 3
}
export function keyReviewState(record: KeyMastery, previouslyStrong: boolean, date = localPracticeDate()): ReviewState | null {
  if (!previouslyStrong && record.status !== "good" && record.status !== "mastered") return null
  const recent = recentAccuracy(record)
  if (record.recentAttempts.length >= 10 && (recent < 92 || recurringErrors(record))
    || performanceTrend(record.recentPerformance).rate === "declining") return "reviewRecommended"
  const lastDate = record.recentPerformance.at(-1)?.date
  const days = lastDate ? (Date.parse(date) - Date.parse(lastDate)) / 86400000 : Infinity
  // This is missing recent validation, not a loss of mastery or proof of weakness.
  return days > 14 || !Number.isFinite(days) || record.recentAttempts.length < 10 ? "reviewSoon" : "healthy"
}

export function rankLearningTargets(progress: MasteryProgress, telemetry: LearningTelemetry, layout: KeyboardLayoutId, date = localPracticeDate()): LearningTarget[] {
  const keys = learnableKeys(layout), candidates: LearningTarget[] = []
  const timedKeys = Object.values(progress.keys).filter((key) => key.timedAttempts >= 20)
  const baseline = timedKeys.length ? timedKeys.reduce((sum, key) => sum + key.averageResponseTime, 0) / timedKeys.length : 300
  for (const key of keys) {
    const record = progress.keys[key] ?? emptyKeyMastery(), enough = record.attempts >= MIN_KEY_ATTEMPTS
    const accuracy = Math.min(record.accuracy, record.recentAttempts.length >= 10 ? recentAccuracy(record) : 100)
    const review = keyReviewState(record, telemetry.strongKeys.includes(key), date)
    let reason: RecommendationReason, priority: number
    if (enough && recurringErrors(record)) { reason = "recurringErrors"; priority = 100 + (100 - accuracy) / 5 }
    else if (enough && accuracy < 94) { reason = "lowAccuracy"; priority = 90 + (94 - accuracy) / 5 }
    else if (review === "reviewRecommended") { reason = review; priority = 85 }
    else if (enough && performanceTrend(record.recentPerformance).rate === "declining") { reason = "decliningPerformance"; priority = 80 }
    else if (record.timedAttempts >= 20 && record.averageResponseTime > Math.max(350, baseline * 1.25)) { reason = "slowResponse"; priority = 70 + Math.min(10, record.averageResponseTime / 100) }
    else if (review === "reviewSoon") { reason = review; priority = 55 }
    else if (!enough) { reason = "smallSample"; priority = (/^[a-zç]$/.test(key) ? 40 : 20) + (MIN_KEY_ATTEMPTS - record.attempts) / 20 }
    else if (record.mastery < 75) { reason = "lowMastery"; priority = 45 + (75 - record.mastery) / 15 }
    else continue
    candidates.push({ id: `key:${key}`, kind: "key", keys: [key], reason, priority,
      evidence: { attempts: record.attempts, accuracy, responseTime: record.averageResponseTime } })
  }
  for (const record of Object.values(telemetry.transitions)) {
    if (!keys.includes(record.from) || !keys.includes(record.to)) continue
    if (record.attempts < MIN_TRANSITION_ATTEMPTS || record.timedAttempts < MIN_TRANSITION_TIMED || record.recentResponseTimes.length < MIN_TRANSITION_TIMED) continue
    const accuracy = (1 - record.errors / record.attempts) * 100
    const reference = progress.keys[record.to]?.timedAttempts >= 20 ? progress.keys[record.to].averageResponseTime : baseline
    const slow = record.recentResponseTime > Math.max(350, reference * 1.25)
    if (accuracy >= 94 && !slow) continue
    candidates.push({ id: `transition:${record.from}→${record.to}`, kind: "transition", keys: [record.from, record.to],
      reason: accuracy < 94 ? "transitionErrors" : "slowTransition", priority: accuracy < 94 ? 82 : 68,
      evidence: { attempts: record.attempts, accuracy, responseTime: record.recentResponseTime } })
  }
  const groups = new Map<Finger, string[]>()
  for (const key of keys) {
    const finger = getPracticeFinger(key, layout)?.finger
    if (finger && (progress.keys[key]?.attempts ?? 0) >= MIN_KEY_ATTEMPTS) groups.set(finger, [...(groups.get(finger) ?? []), key])
  }
  for (const [finger, group] of groups) {
    const records = group.map((key) => progress.keys[key]), attempts = records.reduce((sum, key) => sum + key.attempts, 0)
    const accuracy = records.reduce((sum, key) => sum + key.correctAttempts, 0) / attempts * 100
    const weak = group.filter((key) => progress.keys[key].accuracy < 94 || recurringErrors(progress.keys[key]))
    const timed = records.reduce((sum, key) => sum + key.timedAttempts, 0)
    const responseTime = timed ? records.reduce((sum, key) => sum + key.responseTimeTotal, 0) / timed : 0
    const slow = group.filter((key) => progress.keys[key].timedAttempts >= 20 && progress.keys[key].averageResponseTime > Math.max(350, baseline * 1.25))
    if (group.length < 2 || attempts < 60 || (weak.length < 2 && slow.length < 2)) continue
    candidates.push({ id: `finger:${finger}`, kind: "finger", finger, keys: group, reason: "fingerWeakness",
      priority: 76, evidence: { attempts, accuracy, responseTime } })
  }
  const ordered = candidates.sort((a, b) => b.priority - a.priority || keys.indexOf(a.keys[0]) - keys.indexOf(b.keys[0]) || a.id.localeCompare(b.id, "en"))
  return ordered
}

/** Quantized evidence prevents plan churn from inconsequential metric changes. No per-keystroke ranking. */
export function learningFingerprint(progress: MasteryProgress, telemetry: LearningTelemetry, layout: KeyboardLayoutId, date = localPracticeDate()): string {
  return JSON.stringify([layout, learnableKeys(layout).map((key) => {
    const record = progress.keys[key] ?? emptyKeyMastery()
    return [record.status, Math.floor(record.mastery / 10), Math.min(4, Math.floor(record.attempts / 10)),
      Math.floor(record.accuracy / 2), Math.floor(record.averageResponseTime / 50), record.timedAttempts >= 20,
      record.recentAttempts.length >= 10, Math.floor(recentAccuracy(record) / 2), recurringErrors(record),
      performanceTrend(record.recentPerformance).rate, keyReviewState(record, telemetry.strongKeys.includes(key), date)]
  }), Object.entries(telemetry.transitions).filter(([, record]) => record.attempts >= MIN_TRANSITION_ATTEMPTS
    && record.timedAttempts >= MIN_TRANSITION_TIMED && record.recentResponseTimes.length >= MIN_TRANSITION_TIMED)
    .sort(([a], [b]) => a.localeCompare(b, "en")).map(([id, record]) =>
    [id, record.attempts >= MIN_TRANSITION_ATTEMPTS, record.timedAttempts >= MIN_TRANSITION_TIMED,
      record.recentResponseTimes.length >= MIN_TRANSITION_TIMED, Math.floor(record.recentResponseTime / 50), Math.floor(record.errors / record.attempts * 50)])])
}
export function refreshLearningPath(previous: LearningPath | null, progress: MasteryProgress, telemetry: LearningTelemetry, layout: KeyboardLayoutId, date = localPracticeDate()): LearningPath {
  const fingerprint = learningFingerprint(progress, telemetry, layout, date)
  if (previous?.fingerprint === fingerprint) return previous
  const ranked = rankLearningTargets(progress, telemetry, layout, date), selected: LearningTarget[] = []
  // Include a measured transition/finger weakness when available, while preserving the highest priority target.
  if (ranked[0]) selected.push(ranked[0])
  const specialized = ranked.find((target) => target.kind !== "key" && target.id !== selected[0]?.id)
  for (const target of ranked) {
    if (selected.length >= (specialized ? 2 : 3)) break
    if (target.id === specialized?.id) continue
    if (!selected.some((current) => current.id === target.id)) selected.push(target)
  }
  if (specialized) selected.push(specialized)
  const reviewKeys = learnableKeys(layout).filter((key) => progress.keys[key]?.status === "good" || progress.keys[key]?.status === "mastered").slice(0, 4)
  const mixedKeys = [...new Set([...selected.flatMap((target) => target.keys), ...reviewKeys])].slice(0, 6)
  selected.push({ id: "mixed", kind: "mixed", keys: mixedKeys.length ? mixedKeys : ["a", "s", "d", "f"],
    reason: "balancedReview", priority: 0, evidence: { attempts: 0 } })
  return { fingerprint, targets: selected, progress }
}

/** Prebuild every drill. Session order stays fixed until recap, regardless of telemetry updates. */
export function generateLearningSession(targets: LearningTarget[], progress: MasteryProgress, layout: KeyboardLayoutId): LearningSession {
  const drills: SessionDrill[] = []
  targets.forEach((target, targetIndex) => {
    if (target.kind === "key") {
      const record = progress.keys[target.keys[0]] ?? emptyKeyMastery()
      const stage = record.status === "mastered" ? 4 : Math.min(4, Math.floor(record.mastery / 18))
      const exercises = generateKeyExercises(target.keys[0], layout)
      for (const nextStage of [stage, Math.min(5, stage + 1)]) drills.push({ target, targetIndex, stage: nextStage, text: exercises[nextStage].text })
    } else if (target.kind === "transition") {
      const pair = target.keys.join("")
      for (const text of [Array(12).fill(pair).join(" "), Array(6).fill(`${pair}${pair}`).join(" ")]) drills.push({ target, targetIndex, stage: -1, text })
    } else {
      const keys = target.keys.slice(0, 6)
      for (const text of [Array(6).fill(keys.join("")).join(" "), Array(4).fill(keys.map((key, index) => `${key}${keys[(index + 1) % keys.length]}`).join(" ")).join(" ")]) drills.push({ target, targetIndex, stage: -1, text })
    }
  })
  const measured = Object.values(progress.keys).filter((key) => key.timedAttempts >= 20)
  const ms = measured.length ? measured.reduce((sum, key) => sum + key.averageResponseTime, 0) / measured.length : 300
  return { targets, drills, estimatedSeconds: Math.round(drills.reduce((sum, drill) => sum + Array.from(drill.text).length, 0) * Math.max(150, Math.min(800, ms)) / 1000) }
}
export function advanceLearningSession(session: LearningSession, currentIndex: number) {
  const nextIndex = Math.min(session.drills.length, currentIndex + 1)
  return { nextIndex, next: session.drills[nextIndex] ?? null, completed: nextIndex === session.drills.length,
    targetsCompleted: session.targets.filter((_, index) => session.drills.filter((drill) => drill.targetIndex === index)
      .every((drill) => session.drills.indexOf(drill) < nextIndex)).length }
}
export function summarizeLearningSession(samples: PracticeSample[], targetsCompleted: number, before: MasteryProgress, after: MasteryProgress): SessionRecap {
  const masteryGains: Record<string, number> = {}
  for (const [key, record] of Object.entries(after.keys)) {
    const gain = record.mastery - (before.keys[key]?.mastery ?? 0)
    if (gain > 0) masteryGains[key] = gain
  }
  return { samples, targetsCompleted, masteryGains }
}
export function sessionSample(attempts: PathAttempt[], drill: SessionDrill) {
  return practiceSample(attempts, drill.target.keys[0], drill.stage)
}
export function loadLearningTelemetry(storageKey: string): LearningTelemetry {
  try {
    const parsed = JSON.parse(localStorage.getItem(`${storageKey}:learning-path`) ?? "null") as LearningTelemetry | null
    if (parsed?.version !== 1 || !parsed.transitions || !Array.isArray(parsed.strongKeys) || !parsed.strongKeys.every((key) => typeof key === "string")) return emptyLearningTelemetry()
    for (const [id, record] of Object.entries(parsed.transitions)) {
      if (!record || typeof record.from !== "string" || typeof record.to !== "string" || id !== `${record.from}→${record.to}`
        || ![record.attempts, record.errors, record.timedAttempts, record.responseTimeTotal, record.averageResponseTime, record.recentResponseTime].every((value) => Number.isFinite(value) && value >= 0)
        || record.errors > record.attempts || record.timedAttempts > record.attempts || !Array.isArray(record.recentResponseTimes)
        || record.recentResponseTimes.length > 20 || !record.recentResponseTimes.every((time) => Number.isFinite(time) && time > 0 && time <= 2000)) return emptyLearningTelemetry()
    }
    return parsed
  } catch { return emptyLearningTelemetry() }
}
export function saveLearningTelemetry(storageKey: string, telemetry: LearningTelemetry) {
  try { localStorage.setItem(`${storageKey}:learning-path`, JSON.stringify(telemetry)) } catch { /* Training works without storage. */ }
}
