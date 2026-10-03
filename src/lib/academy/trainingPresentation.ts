import type { KeyPerformance } from "./keyMastery"
import { localPracticeDate } from "./keyMastery"
import type { TypingAttempt } from "../typing/typingAttempt"

export type LearningRate = "improving" | "stable" | "declining" | "uncertain"
export interface PracticeSample extends KeyPerformance { key: string; seconds: number }
export interface AcademyPractice {
  version: 1
  days: Record<string, number>
  history: PracticeSample[]
}
export const DAILY_GOAL_SECONDS = 15 * 60
export function emptyAcademyPractice(): AcademyPractice { return { version: 1, days: {}, history: [] } }

function weighted(samples: KeyPerformance[]) {
  const attempts = samples.reduce((sum, sample) => sum + sample.attempts, 0)
  return {
    attempts,
    accuracy: attempts ? samples.reduce((sum, sample) => sum + sample.correct, 0) / attempts * 100 : 0,
    speed: attempts ? samples.reduce((sum, sample) => sum + sample.speed * sample.attempts, 0) / attempts : 0,
  }
}

/** Compare two equally sized windows; sparse or untimed evidence produces no claim. */
export function performanceTrend(samples: KeyPerformance[]) {
  const windows = samples.slice(-6)
  if (windows.length < 6) return { rate: "uncertain" as LearningRate, speedDelta: null, accuracyDelta: null }
  const previous = weighted(windows.slice(0, 3)), recent = weighted(windows.slice(3))
  if (previous.attempts < 30 || recent.attempts < 30 || windows.some((sample) => sample.speed <= 0)) {
    return { rate: "uncertain" as LearningRate, speedDelta: null, accuracyDelta: null }
  }
  const speedDelta = recent.speed - previous.speed, accuracyDelta = recent.accuracy - previous.accuracy
  // An accuracy regression is never presented as improvement merely because speed rose.
  const rate: LearningRate = accuracyDelta <= -2 || speedDelta <= -3 ? "declining"
    : accuracyDelta >= -0.5 && (accuracyDelta >= 1 || speedDelta >= 2) ? "improving" : "stable"
  return { rate, speedDelta, accuracyDelta }
}

/** Presentation only, 0–1000. Never passed to rewards, mastery, combat, or rank. */
export function trainingScore(samples: KeyPerformance[]): number {
  if (!samples.length) return 0
  const { accuracy, speed } = weighted(samples)
  const correct = samples.reduce((sum, sample) => sum + sample.correct, 0)
  const meanAccuracy = samples.reduce((sum, sample) => sum + sample.accuracy, 0) / samples.length
  const deviation = samples.reduce((sum, sample) => sum + Math.abs(sample.accuracy - meanAccuracy), 0) / samples.length
  const consistency = Math.max(0, 1 - deviation / 20) * Math.min(1, samples.length / 3)
  return Math.round(1000 * (Math.min(1, correct / 300) * .3 + accuracy / 100 * .3
    + Math.min(1, speed / 60) * .25 + consistency * .15) * (accuracy / 100))
}

export function practiceSample(attempts: TypingAttempt[], key: string, stage: number, date = localPracticeDate()): PracticeSample {
  const correct = attempts.filter((attempt) => attempt.correct).length
  const timed = attempts.filter((attempt) => attempt.responseTime > 0 && Number.isFinite(attempt.responseTime))
  // Only active intervals count; pauses cannot inflate the daily goal.
  const seconds = timed.reduce((sum, attempt) => sum + Math.min(2000, attempt.responseTime), 0) / 1000
  return { key, stage, date, attempts: attempts.length, correct,
    accuracy: attempts.length ? correct / attempts.length * 100 : 100, seconds,
    speed: seconds ? timed.filter((attempt) => attempt.correct).length * 12 / seconds : 0 }
}
export function recordAcademyPractice(practice: AcademyPractice, attempts: TypingAttempt[], key: string, stage: number): AcademyPractice {
  if (!attempts.length) return practice
  const sample = practiceSample(attempts, key, stage)
  return { version: 1, days: { ...practice.days, [sample.date]: (practice.days[sample.date] ?? 0) + sample.seconds },
    history: [...practice.history, sample].slice(-60) }
}
export function dailyGoal(seconds: number) {
  const activeSeconds = Number.isFinite(seconds) ? Math.max(0, seconds) : 0
  return { minutes: activeSeconds / 60, percent: Math.min(100, activeSeconds / DAILY_GOAL_SECONDS * 100) }
}
export function loadAcademyPractice(storageKey: string): AcademyPractice {
  try {
    const parsed = JSON.parse(localStorage.getItem(`${storageKey}:practice`) ?? "null") as AcademyPractice | null
    if (parsed?.version !== 1 || !parsed.days || !Array.isArray(parsed.history)
      || !Object.values(parsed.days).every((seconds) => Number.isFinite(seconds) && seconds >= 0)
      || !parsed.history.every((sample) => sample && typeof sample.key === "string"
        && [sample.attempts, sample.correct, sample.accuracy, sample.speed, sample.seconds].every(Number.isFinite))) return emptyAcademyPractice()
    return parsed
  } catch { return emptyAcademyPractice() }
}
export function saveAcademyPractice(storageKey: string, practice: AcademyPractice) {
  try { localStorage.setItem(`${storageKey}:practice`, JSON.stringify(practice)) } catch { /* Practice stays usable without storage. */ }
}

/** Navigation must leave real editable fields alone; the engine's readonly capture is exempt. */
export function academyNavigation(key: string, editable: boolean, active: boolean): "previous" | "next" | "overview" | null {
  if (editable) return null
  if (key === "Escape") return "overview"
  if (active) return null
  return key === "ArrowLeft" ? "previous" : key === "ArrowRight" ? "next" : null
}
