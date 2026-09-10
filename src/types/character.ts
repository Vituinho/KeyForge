import { EnemyMechanicConfig } from "./mechanics"

export type EnemyType = "normal" | "elite" | "boss"
export type TypingFocus =
  | "balanced"
  | "accuracy"
  | "precision"
  | "speed"
  | "consistency"
  | "combo"
  | "focus"
  | "endurance"
  | "all"

export interface EnemyAbility {
  id: string
  name: string
  description: string
  // Trigger conditions — to be expanded in future versions
  trigger?: "on_error" | "on_low_accuracy" | "on_time" | "on_health_low"
  triggerThreshold?: number
}

export interface Enemy {
  id: string
  name: string
  anime: string
  world?: string // e.g. "naruto"
  stage?: number // stage order within world (1 to 8)
  level: number
  type: EnemyType
  typingFocus?: TypingFocus
  maxHp: number
  attack: number
  attackInterval: number // milliseconds between enemy attacks
  recommendedWpm: number
  recommendedAccuracy: number // 0–100
  difficulty: number // 1–100
  xpReward?: number
  firstClearBonusXp?: number
  isBoss?: boolean
  themeColor: string // primary hex color for UI theming
  accentColor: string // secondary hex color
  abilities?: EnemyAbility[]
  mechanics?: EnemyMechanicConfig[]
  description?: string
}
