import { PersonalBestMilestone } from "@/types/progression"

export interface CandidateRecord {
  wpm: number
  accuracy: number
  combo: number
  typedCharacters: number
  wordsCompleted: number
  durationSeconds: number
  isSentenceCompleted?: boolean
}

export interface CurrentRecords {
  bestWpm: number
  bestAccuracy: number
  bestCombo: number
}

export interface PbValidationResult {
  isNewBestWpm: boolean
  isNewBestAccuracy: boolean
  isNewBestCombo: boolean
  newRecords: CurrentRecords
  milestones: PersonalBestMilestone[]
}

export type CandidateInput = {
  wpm?: number
  currentWpm?: number
  accuracy?: number
  currentAccuracy?: number
  combo?: number
  currentStreak?: number
  typedCharacters?: number
  wordsCompleted?: number
  durationSeconds?: number
  elapsedTime?: number
  totalElapsedTime?: number
  isSentenceCompleted?: boolean
}

export type PlayerOrCandidate =
  | CandidateInput
  | {
      username?: string
      stats?: { battlesPlayed?: number }
      bestWpm?: number
      bestAccuracy?: number
      bestCombo?: number
    }

// Validation Thresholds to prevent micro-sample record exploitation
export const PB_MIN_WPM_CHARS = 80
export const PB_MIN_WPM_WORDS = 15
export const PB_MIN_WPM_DURATION_SEC = 8
export const PB_MIN_WPM_ACCURACY = 90
export const PB_MAX_HUMAN_WPM = 260

export const PB_MIN_ACCURACY_CHARS = 50
export const PB_MIN_ACCURACY_WORDS = 8

export const PB_MIN_COMBO_STREAK = 15

/**
 * Validates whether a typing sample meets minimum volume thresholds to qualify as a legitimate Personal Best.
 * Prevents 1-word bursts (e.g. typing "it" in 0.2s = 200 WPM) from corrupting the player's records.
 */
export function qualifiesForWpmRecord(candidate: CandidateInput): boolean {
  if (!candidate) return false
  const typedCharacters = candidate.typedCharacters ?? 0
  const wordsCompleted =
    candidate.wordsCompleted ?? Math.round(typedCharacters / 5)
  const durationSeconds =
    candidate.durationSeconds ??
    candidate.elapsedTime ??
    candidate.totalElapsedTime ??
    0
  const accuracy = candidate.accuracy ?? candidate.currentAccuracy ?? 0
  const wpm = candidate.wpm ?? candidate.currentWpm ?? 0

  const hasVolume =
    wordsCompleted >= PB_MIN_WPM_WORDS ||
    typedCharacters >= PB_MIN_WPM_CHARS
  const hasTime = durationSeconds >= PB_MIN_WPM_DURATION_SEC
  const hasQuality = accuracy >= PB_MIN_WPM_ACCURACY
  const isHuman = wpm <= PB_MAX_HUMAN_WPM

  return hasVolume && hasTime && hasQuality && isHuman
}

/**
 * Validates whether an accuracy sample has sufficient characters to qualify for an all-time Accuracy PB.
 * Prevents 1 flawless word from registering as 100% "Best Accuracy Ever".
 */
export function qualifiesForAccuracyRecord(candidate: CandidateInput): boolean {
  if (!candidate) return false
  const typedCharacters = candidate.typedCharacters ?? 0
  const wordsCompleted =
    candidate.wordsCompleted ?? Math.round(typedCharacters / 5)
  const accuracy = candidate.accuracy ?? candidate.currentAccuracy ?? 0

  const hasVolume =
    typedCharacters >= PB_MIN_ACCURACY_CHARS ||
    wordsCompleted >= PB_MIN_ACCURACY_WORDS
  return hasVolume && accuracy > 0
}

/**
 * Validates whether a combo count meets the threshold to be celebrated as a milestone.
 */
export function qualifiesForComboRecord(candidate: CandidateInput): boolean {
  if (!candidate) return false
  const combo = candidate.combo ?? candidate.currentStreak ?? 0
  return combo >= PB_MIN_COMBO_STREAK
}

export type PersonalBestResult = PersonalBestMilestone[] & PbValidationResult

/**
 * Centralized evaluation function that checks candidate performance against player records.
 * Returns newly achieved milestones and updated records strictly when thresholds are satisfied.
 * Supports both (candidate, current) and (player, stats, stageId?, worldId?).
 */
export function evaluatePersonalBests(
  arg1: PlayerOrCandidate,
  arg2: CandidateInput | CurrentRecords,
  _stageId?: string,
  _worldId?: string
): PersonalBestResult {
  void _stageId
  void _worldId

  let candidate: CandidateRecord
  let current: CurrentRecords

  const a1 = arg1 as Record<string, unknown>
  const a2 = arg2 as Record<string, unknown>

  if (
    a1 &&
    (a1.stats !== undefined ||
      a1.username !== undefined ||
      (typeof a1.bestWpm === "number" && typeof a2?.typedCharacters === "number"))
  ) {
    // Called as (player, stats)
    const player = a1 as { bestWpm?: number; bestAccuracy?: number; bestCombo?: number }
    const stats = a2 as CandidateInput
    current = {
      bestWpm: player.bestWpm ?? 0,
      bestAccuracy: player.bestAccuracy ?? 0,
      bestCombo: player.bestCombo ?? 0,
    }
    candidate = {
      wpm: stats.wpm ?? stats.currentWpm ?? 0,
      accuracy: stats.accuracy ?? stats.currentAccuracy ?? 0,
      combo: stats.combo ?? stats.currentStreak ?? 0,
      typedCharacters: stats.typedCharacters ?? 0,
      wordsCompleted:
        stats.wordsCompleted ?? Math.round((stats.typedCharacters ?? 0) / 5),
      durationSeconds:
        stats.durationSeconds ??
        stats.elapsedTime ??
        stats.totalElapsedTime ??
        0,
    }
  } else {
    // Called as (candidate, current)
    const candInput = a1 as CandidateInput
    const currInput = a2 as unknown as CurrentRecords
    candidate = {
      wpm: candInput.wpm ?? candInput.currentWpm ?? 0,
      accuracy: candInput.accuracy ?? candInput.currentAccuracy ?? 0,
      combo: candInput.combo ?? candInput.currentStreak ?? 0,
      typedCharacters: candInput.typedCharacters ?? 0,
      wordsCompleted:
        candInput.wordsCompleted ?? Math.round((candInput.typedCharacters ?? 0) / 5),
      durationSeconds:
        candInput.durationSeconds ??
        candInput.elapsedTime ??
        candInput.totalElapsedTime ??
        0,
    }
    current = currInput || { bestWpm: 0, bestAccuracy: 0, bestCombo: 0 }
  }

  const now = Date.now()
  const milestones: PersonalBestMilestone[] = []

  let isNewBestWpm = false
  let isNewBestAccuracy = false
  let isNewBestCombo = false

  const updatedRecords: CurrentRecords = { ...current }

  // 1. Evaluate WPM Record
  if (qualifiesForWpmRecord(candidate) && candidate.wpm > current.bestWpm) {
    isNewBestWpm = true
    updatedRecords.bestWpm = candidate.wpm
    milestones.push({
      type: "wpm",
      value: candidate.wpm,
      newValue: candidate.wpm,
      previousValue: current.bestWpm,
      timestamp: now,
      messageKey: "combatFeedback.milestones.newWpmRecord",
    })
  }

  // 2. Evaluate Accuracy Record
  if (
    qualifiesForAccuracyRecord(candidate) &&
    candidate.accuracy > current.bestAccuracy
  ) {
    isNewBestAccuracy = true
    updatedRecords.bestAccuracy = candidate.accuracy
    milestones.push({
      type: "accuracy",
      value: candidate.accuracy,
      newValue: candidate.accuracy,
      previousValue: current.bestAccuracy,
      timestamp: now,
      messageKey: "combatFeedback.milestones.newAccuracyRecord",
    })
  }

  // 3. Evaluate Combo Record
  if (
    qualifiesForComboRecord(candidate) &&
    candidate.combo > current.bestCombo
  ) {
    isNewBestCombo = true
    updatedRecords.bestCombo = candidate.combo
    milestones.push({
      type: "combo",
      value: candidate.combo,
      newValue: candidate.combo,
      previousValue: current.bestCombo,
      timestamp: now,
      messageKey: "combatFeedback.milestones.newComboRecord",
    })
  }

  const resultMeta = {
    isNewBestWpm,
    isNewBestAccuracy,
    isNewBestCombo,
    newRecords: updatedRecords,
    milestones,
  }

  return Object.assign(milestones, resultMeta) as PersonalBestResult
}
