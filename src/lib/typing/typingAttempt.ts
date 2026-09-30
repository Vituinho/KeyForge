/** Compare one attempt at the current expected position, as useTypingEngine does. */
export function isTypingCharacterCorrect(expected: string, typed: string): boolean {
  return typed.normalize("NFC") === expected.normalize("NFC")
}

export interface TypingAttempt {
  expected: string
  typed: string
  correct: boolean
  responseTime: number
  timestamp: number
}
