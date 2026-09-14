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
export function qualifiesForWpmRecord(candidate: CandidateRecord): boolean {
  const hasVolume =
    candidate.wordsCompleted >= PB_MIN_WPM_WORDS ||
    candidate.typedCharacters >= PB_MIN_WPM_CHARS
  const hasTime = candidate.durationSeconds >= PB_MIN_WPM_DURATION_SEC
  const hasQuality = candidate.accuracy >= PB_MIN_WPM_ACCURACY
  const isHuman = candidate.wpm <= PB_MAX_HUMAN_WPM

  return hasVolume && hasTime && hasQuality && isHuman
}

/**
 * Validates whether an accuracy sample has sufficient characters to qualify for an all-time Accuracy PB.
 * Prevents 1 flawless word from registering as 100% "Best Accuracy Ever".
 */
export function qualifiesForAccuracyRecord(candidate: CandidateRecord): boolean {
  const hasVolume =
    candidate.typedCharacters >= PB_MIN_ACCURACY_CHARS ||
    candidate.wordsCompleted >= PB_MIN_ACCURACY_WORDS
  return hasVolume && candidate.accuracy > 0
}

/**
 * Validates whether a combo count meets the threshold to be celebrated as a milestone.
 */
export function qualifiesForComboRecord(candidate: CandidateRecord): boolean {
  return candidate.combo >= PB_MIN_COMBO_STREAK
}

/**
 * Centralized evaluation function that checks candidate performance against player records.
 * Returns newly achieved milestones and updated records strictly when thresholds are satisfied.
 */
export function evaluatePersonalBests(
  candidate: CandidateRecord,
  current: CurrentRecords
): PbValidationResult {
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
      previousValue: current.bestCombo,
      timestamp: now,
      messageKey: "combatFeedback.milestones.newComboRecord",
    })
  }

  return {
    isNewBestWpm,
    isNewBestAccuracy,
    isNewBestCombo,
    newRecords: updatedRecords,
    milestones,
  }
}
