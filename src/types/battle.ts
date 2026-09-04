import { TypingStats, WeakKey, TrainingExercise } from "./typing"

export type BattlePhase =
  | "pre-battle"
  | "fighting"
  | "victory"
  | "defeat"

export type StrikeType = "normal" | "perfect" | "critical" | "miss"

export interface DamageEvent {
  id: string
  amount: number
  strikeType: StrikeType
  timestamp: number
  targetIsEnemy: boolean // true = damaged enemy, false = damaged player
}

export interface RoundResult {
  wpm: number
  accuracy: number
  combo: number
  errors: number
  damage: number
  strikeType: StrikeType
  text: string
}

export interface BattleState {
  phase: BattlePhase
  enemyHp: number
  playerHp: number
  maxEnemyHp: number
  maxPlayerHp: number
  currentTextIndex: number
  roundHistory: RoundResult[]
  damageEvents: DamageEvent[]
  battleStartTime: number | null
  battleEndTime: number | null
}

export interface BattleResult {
  victory: boolean
  totalDamageDealt: number
  totalDamageTaken: number
  finalStats: TypingStats
  weakKeys: WeakKey[]
  exercises: TrainingExercise[]
  roundHistory: RoundResult[]
  elapsedTime: number
}

export interface BattleHistoryEntry {
  id: string
  enemyId: string
  enemyName: string
  enemyAnime: string
  enemyLevel: number
  themeColor: string
  victory: boolean
  battleWpm: number
  battleAccuracy: number
  bestCombo: number
  totalErrors: number
  damageDealt: number
  damageTaken: number
  xpEarned: number
  durationSeconds: number
  timestamp: string // ISO string
}

