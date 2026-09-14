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
  activeEffects?: string[]
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
  currentPhase: number
  totalPhases: number
  phaseName?: string
  phaseTransitionBanner?: string | null
  activeMechanicEffects: string[]
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
  wpm?: number
  battleAccuracy: number
  accuracy?: number
  bestCombo: number
  combo?: number
  totalErrors: number
  damageDealt: number
  damageTaken: number
  xpEarned: number
  durationSeconds: number
  elapsedTime?: number
  timestamp: string | number // ISO string or epoch ms
}

