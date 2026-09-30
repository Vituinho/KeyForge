import type { TypingAttempt } from "../typing/typingAttempt"
import type { KeyboardLayoutId } from "../keyboard/fingerMap"

export type KeyStatus = "untrained" | "weak" | "learning" | "good" | "mastered"
export interface KeyPerformance {
  attempts: number
  correct: number
  accuracy: number
  speed: number
  stage: number
  date: string
}
export interface KeyMastery {
  mastery: number
  attempts: number
  correctAttempts: number
  errors: number
  accuracy: number
  responseTimeTotal: number
  timedAttempts: number
  timedCorrect: number
  averageResponseTime: number
  bestSpeed: number
  averageSpeed: number
  lessonsCompleted: number
  recentAttempts: boolean[]
  recentPerformance: KeyPerformance[]
  status: KeyStatus
}
export interface MasteryProgress {
  version: 1
  keys: Record<string, KeyMastery>
  days: Record<string, { attempts: number; lessons: number }>
}

export const LEARNING_STAGES = ["repetition", "anchor", "transitions", "patterns", "words", "sentences"] as const
export function learnableKeys(layout: KeyboardLayoutId): string[] {
  return Array.from("abcdefghijklmnopqrstuvwxyz" + (layout === "ABNT2" ? "ç" : "")
    + "0123456789,.;:!?@#$%&*()-_=+[]{}\\|/'\"<>`~^" + (layout === "ABNT2" ? "ºª" : ""))
}
export function emptyKeyMastery(): KeyMastery {
  return { mastery: 0, attempts: 0, correctAttempts: 0, errors: 0, accuracy: 100,
    responseTimeTotal: 0, timedAttempts: 0, timedCorrect: 0, averageResponseTime: 0,
    bestSpeed: 0, averageSpeed: 0, lessonsCompleted: 0,
    recentAttempts: [], recentPerformance: [], status: "untrained" }
}
export function emptyMasteryProgress(): MasteryProgress {
  return { version: 1, keys: {}, days: {} }
}
function percent(correct: number, total: number) { return total ? correct / total * 100 : 100 }

/** Completion adds no mastery points. Only recorded expected-key attempts supply evidence. */
export function calculateKeyMastery(record: KeyMastery): KeyMastery {
  if (!record.attempts) return { ...record, mastery: 0, status: "untrained" }
  const accuracy = percent(record.correctAttempts, record.attempts)
  const recentAccuracy = percent(record.recentAttempts.filter(Boolean).length, record.recentAttempts.length)
  const recent = record.recentPerformance.slice(-5)
  const consistency = recent.length ? recent.filter((sample) => sample.accuracy >= 92).length / recent.length : 0
  const averageResponseTime = record.timedAttempts ? record.responseTimeTotal / record.timedAttempts : 0
  // Response-time-derived WPM excludes first keys and untimed samples rather than granting infinite speed.
  const averageSpeed = record.responseTimeTotal ? record.timedCorrect * 12000 / record.responseTimeTotal : 0
  const speedScore = Math.min(1, averageSpeed / 40)
  const confidence = Math.min(1, record.attempts / 100)
  const score = Math.round((accuracy * .45 + recentAccuracy * .25 + consistency * 15 + speedScore * 15) * confidence)
  const tail = record.recentAttempts.slice(-10)
  const recurringWeakness = tail.filter((correct) => !correct).length >= 3
  const stable = recent.length >= 3 && recent.every((sample) => sample.accuracy >= 92)
  const appliedPractice = recent.some((sample) => sample.stage >= 4)
  const mastered = record.attempts >= 100 && accuracy >= 96 && recentAccuracy >= 96
    && stable && !recurringWeakness && record.timedAttempts >= 30 && appliedPractice && score >= 90
  const mastery = mastered ? 100 : Math.min(99, score)
  const status: KeyStatus = mastered ? "mastered"
    : (record.attempts >= 10 && (accuracy < 85 || recentAccuracy < 80 || recurringWeakness)) ? "weak"
    : mastery >= 75 && accuracy >= 92 && recentAccuracy >= 90 ? "good" : "learning"
  return { ...record, accuracy, averageResponseTime, averageSpeed, mastery, status }
}

export function localPracticeDate(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
}

export function recordMasteryPractice(
  progress: MasteryProgress, attempts: TypingAttempt[], layout: KeyboardLayoutId,
  options: { targetKey?: string; stage: number; lessonCompleted?: boolean; date?: string },
): MasteryProgress {
  const date = options.date ?? localPracticeDate()
  const allowed = new Set(learnableKeys(layout))
  const grouped = new Map<string, TypingAttempt[]>()
  for (const attempt of attempts) {
    const key = attempt.expected.normalize("NFC").toLowerCase()
    if (!allowed.has(key)) continue
    grouped.set(key, [...(grouped.get(key) ?? []), attempt])
  }
  const keys = { ...progress.keys }
  for (const [key, samples] of grouped) {
    const old = keys[key] ?? emptyKeyMastery()
    const correct = samples.filter((sample) => sample.correct).length
    const timed = samples.filter((sample) => sample.responseTime > 0 && Number.isFinite(sample.responseTime))
    const time = timed.reduce((sum, sample) => sum + Math.min(sample.responseTime, 2000), 0)
    const timedCorrect = timed.filter((sample) => sample.correct).length
    const speed = time ? timedCorrect * 12000 / time : 0
    keys[key] = calculateKeyMastery({
      ...old, attempts: old.attempts + samples.length, correctAttempts: old.correctAttempts + correct,
      errors: old.errors + samples.length - correct,
      responseTimeTotal: old.responseTimeTotal + time, timedAttempts: old.timedAttempts + timed.length,
      timedCorrect: old.timedCorrect + timedCorrect, bestSpeed: Math.max(old.bestSpeed, speed),
      lessonsCompleted: old.lessonsCompleted + (options.lessonCompleted && options.targetKey === key ? 1 : 0),
      recentAttempts: [...old.recentAttempts, ...samples.map((sample) => sample.correct)].slice(-40),
      recentPerformance: [...old.recentPerformance, {
        attempts: samples.length, correct, accuracy: percent(correct, samples.length), speed,
        stage: options.targetKey === key ? options.stage : -1, date,
      }].slice(-8),
    })
  }
  const day = progress.days[date] ?? { attempts: 0, lessons: 0 }
  return { version: 1, keys, days: { ...progress.days, [date]: {
    attempts: day.attempts + attempts.length,
    lessons: day.lessons + (attempts.length && options.lessonCompleted ? 1 : 0),
  } } }
}

/** Letters are recommended before numbers/symbols; recommendations never restrict manual selection. */
export function recommendKey(progress: MasteryProgress, layout: KeyboardLayoutId): string {
  const keys = learnableKeys(layout)
  const letters = keys.filter((key) => /^[a-zç]$/.test(key))
  const pool = letters.some((key) => progress.keys[key]?.status !== "mastered") ? letters : keys
  return [...pool].sort((a, b) => {
    const left = progress.keys[a] ?? emptyKeyMastery(), right = progress.keys[b] ?? emptyKeyMastery()
    const priority = (record: KeyMastery) => record.status === "weak" ? -1 : record.mastery
    return priority(left) - priority(right)
  })[0]
}

export function nextPracticeStage(stage: number, key: KeyMastery): number {
  const latest = key.recentPerformance.at(-1)
  if (!latest) return stage
  if (latest.accuracy < 85) return Math.max(0, stage - 1)
  if (latest.attempts >= 4 && latest.accuracy >= 92) return Math.min(5, stage + 1)
  return stage
}

export function masteryStorageKey(playerId: string, layout: KeyboardLayoutId) {
  return `keyforge_academy_mastery_v1:${encodeURIComponent(playerId)}:${layout}`
}
export function loadMasteryProgress(storageKey: string): MasteryProgress {
  try {
    const value = JSON.parse(localStorage.getItem(storageKey) ?? "null") as MasteryProgress | null
    if (value?.version !== 1 || !value.keys || !value.days) return emptyMasteryProgress()
    // An invalid local snapshot must not crash training.
    for (const record of Object.values(value.keys)) {
      if (!record || !Array.isArray(record.recentAttempts) || !Array.isArray(record.recentPerformance)
        || ![record.attempts, record.correctAttempts, record.errors, record.responseTimeTotal,
          record.timedAttempts, record.timedCorrect, record.lessonsCompleted, record.bestSpeed].every(Number.isFinite)) return emptyMasteryProgress()
    }
    return value
  } catch { return emptyMasteryProgress() }
}
export function saveMasteryProgress(storageKey: string, progress: MasteryProgress): void {
  try { localStorage.setItem(storageKey, JSON.stringify(progress)) } catch {
    // Training remains usable when browser storage is unavailable or full.
  }
}
