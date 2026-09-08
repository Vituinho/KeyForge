import { MultiplayerMatchRow } from "@/types/database"
import { verifyMatchWord, getWordAt } from "@/lib/multiplayer/wordGenerator"

export interface WordValidationInput {
  matchId: string
  wordIndex: number
  wordText: string
  wpm: number
  accuracy: number
  combo: number
  playerId: string
}

export interface ValidationResult {
  isValid: boolean
  isSuspicious: boolean
  sanitizedWpm: number
  sanitizedAccuracy: number
  sanitizedCombo: number
  reason?: string
}

/**
 * Tracks the timestamp of the last processed submission per player
 * to detect inhuman burst packet floods.
 */
const lastSubmissionTimestamp = new Map<string, number>()

/**
 * Validates a word completion submission against deterministic seed,
 * sequential progression, and human typing physical limits.
 */
export function validateWordSubmission(
  match: MultiplayerMatchRow,
  input: WordValidationInput
): ValidationResult {
  const isP1 = match.player_1_id === input.playerId
  const currentWordIndex = isP1 ? match.player_1_word_index : match.player_2_word_index

  // 1. Strict Monotonicity: word index must match current expected index
  if (input.wordIndex !== currentWordIndex) {
    return {
      isValid: false,
      isSuspicious: true,
      sanitizedWpm: 0,
      sanitizedAccuracy: 0,
      sanitizedCombo: 0,
      reason: `Out-of-order word index: expected ${currentWordIndex}, received ${input.wordIndex}`,
    }
  }

  // 2. Deterministic Word Sequence Verification against Match Seed
  const isCorrectWord = verifyMatchWord(
    match.seed,
    input.wordIndex,
    input.wordText,
    match.word_count,
    match.language
  )
  if (!isCorrectWord) {
    const expectedWord = getWordAt(match.seed, input.wordIndex, match.word_count, match.language)
    return {
      isValid: false,
      isSuspicious: true,
      sanitizedWpm: 0,
      sanitizedAccuracy: 0,
      sanitizedCombo: 0,
      reason: `Word mismatch at index ${input.wordIndex}: expected '${expectedWord}', received '${input.wordText}'`,
    }
  }

  // 3. Minimum Character Speed / Rate Limiting (Flood Prevention)
  const now = Date.now()
  const key = `${match.id}:${input.playerId}`
  const lastTime = lastSubmissionTimestamp.get(key)
  lastSubmissionTimestamp.set(key, now)

  let isSuspicious = false
  if (lastTime) {
    const deltaMs = now - lastTime
    // Even competitive grandmaster typists require at least 80ms per word
    if (deltaMs < 80 && !input.playerId.startsWith("shadow_")) {
      isSuspicious = true
    }
  }

  // 4. Sanitize Physics Limits
  // WPM upper bound: realistic human max ~260 WPM
  let sanitizedWpm = Math.max(0, input.wpm)
  if (sanitizedWpm > 260) {
    sanitizedWpm = 260
    isSuspicious = true
  }

  // Accuracy bounded to [0, 100]
  const sanitizedAccuracy = Math.max(0, Math.min(100, input.accuracy))

  // Combo bounded to total completed words so far + 1
  const maxPossibleCombo = input.wordIndex + 1
  const sanitizedCombo = Math.max(0, Math.min(maxPossibleCombo, input.combo))
  if (input.combo > maxPossibleCombo) {
    isSuspicious = true
  }

  return {
    isValid: true,
    isSuspicious,
    sanitizedWpm,
    sanitizedAccuracy,
    sanitizedCombo,
  }
}

/**
 * Resets rate limiting state for a finished match.
 */
export function cleanupMatchRateLimits(matchId: string): void {
  for (const key of lastSubmissionTimestamp.keys()) {
    if (key.startsWith(`${matchId}:`)) {
      lastSubmissionTimestamp.delete(key)
    }
  }
}
