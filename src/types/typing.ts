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
  responseTime: number // ms since last keypress
  comboBeforeError: number
}

export interface TypingStats {
  wpm: number
  rawWpm: number
  accuracy: number
  combo: number
  bestCombo: number
  errors: number
  typedCharacters: number
  correctCharacters: number
  incorrectCharacters: number
  elapsedTime: number // seconds
  currentStreak: number
  bestStreak: number
  keyStats: Record<string, KeyStat>
  errorLog: KeyError[]
  isCompleted: boolean
  currentIndex: number
}

export interface WeakKey {
  key: string
  attempts: number
  errors: number
  errorRate: number // 0–1
  averageResponseTime: number
}

export interface TrainingExercise {
  targetKey: string
  exercises: string[]
  description: string
}
