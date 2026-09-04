export type CharState = "untyped" | "correct" | "incorrect" | "current"

export interface CharData {
  char: string
  state: CharState
}

export interface KeyStat {
  attempts: number
  correct: number
  errors: number
  totalResponseTime: number // sum for averaging
}

export interface KeyError {
  expected: string
  typed: string
  position: number
  timestamp: number
  responseTime: number // ms since last keypress (clamped to prevent idle distortion)
  comboBeforeError: number
  textId?: string
}

export interface TypingStats {
  // Current sentence / round metrics
  currentWpm: number
  currentRawWpm: number
  currentAccuracy: number
  currentErrors: number
  currentStreak: number

  // Battle / Session cumulative metrics
  battleWpm: number
  battleAccuracy: number
  bestWpm: number
  totalTypingAttempts: number
  totalErrors: number
  combo: number
  bestCombo: number
  bestStreak: number

  // Counts
  typedCharacters: number
  correctCharacters: number
  incorrectCharacters: number
  totalCorrectCharacters: number
  totalIncorrectCharacters: number

  // Timing
  elapsedTime: number // seconds for current sentence
  totalElapsedTime: number // total active typing seconds across session

  // Engine diagnostics
  keyStats: Record<string, KeyStat>
  errorLog: KeyError[]
  isCompleted: boolean
  currentIndex: number

  // Backwards compatibility aliases
  wpm: number // aliases currentWpm
  rawWpm: number // aliases currentRawWpm
  accuracy: number // aliases currentAccuracy
  errors: number // aliases currentErrors
}

export interface WeakKey {
  key: string
  attempts: number
  errors: number
  errorRate: number // 0–1
  averageResponseTime: number
  impactScore?: number
}

export interface WeakKeyCombination {
  bigram: string
  attempts: number
  errors: number
  errorRate: number
  averageResponseTime: number
}

export interface WeakWord {
  word: string
  attempts: number
  errors: number
  errorRate: number
  averageWpm?: number
}

export interface TrainingExercise {
  targetKey: string
  exercises: string[]
  description: string
}
