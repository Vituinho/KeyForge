export type EnemyType = "normal" | "elite" | "boss"

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
  level: number
  type: EnemyType
  maxHp: number
  attack: number
  attackInterval: number // milliseconds between enemy attacks
  recommendedWpm: number
  recommendedAccuracy: number // 0–100
  difficulty: number // 1–100
  themeColor: string // primary hex color for UI theming
  accentColor: string // secondary hex color
  abilities?: EnemyAbility[]
  description?: string
}
