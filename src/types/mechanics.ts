export type BattleMechanicType =
  | "standard"
  | "precision-strike"
  | "speed-check"
  | "consistency"
  | "combo-scaling"
  | "focus-genjutsu"
  | "adaptive-weakness"
  | "touch-typing"
  | "nexus-mastery"
  | "multi-phase"
  | "multi-phase-boss"

export interface BaseMechanicConfig {
  type: BattleMechanicType
  id: string
  name: string
  description: string
}

export interface AccuracyTier {
  minAccuracy: number
  multiplier: number
  label?: string
}

export interface VarianceTier {
  maxVariance: number
  multiplier: number
  label?: string
}

export interface PrecisionStrikeConfig extends BaseMechanicConfig {
  type: "precision-strike"
  targetAccuracy: number // e.g. 94
  belowThresholdPenalty: number // e.g. 0.5 (deals 50% damage if under target)
  aboveThresholdBonus: number // e.g. 1.2 (deals 120% damage if at or above target)
  accuracyTiers?: AccuracyTier[] // Optional smooth progression tiers
}

export interface SpeedCheckThreshold {
  minWpm: number
  multiplier: number
  label: string
}

export interface SpeedCheckConfig extends BaseMechanicConfig {
  type: "speed-check"
  thresholds: SpeedCheckThreshold[]
  slowThreshold: number // below this WPM deals reduced damage
  slowMultiplier: number // e.g. 0.6
}

export interface ConsistencyConfig extends BaseMechanicConfig {
  type: "consistency"
  maxWpmVariance: number
  maxAccVariance: number
  bonusMultiplier: number
  penaltyMultiplier: number
  varianceTiers?: VarianceTier[] // Optional smooth variance bands
}

export interface ComboScalingTier {
  minCombo: number
  multiplier: number
  label?: string
}

export interface ComboScalingConfig extends BaseMechanicConfig {
  type: "combo-scaling"
  tiers: ComboScalingTier[]
  breakComboCounterAttack?: number // counter damage dealt to player on combo loss
}

export interface FocusGenjutsuConfig extends BaseMechanicConfig {
  type: "focus-genjutsu"
  complexPunctuation: boolean
}

export interface AdaptiveWeaknessConfig extends BaseMechanicConfig {
  type: "adaptive-weakness"
  targetWeakLetters?: string[]
  errorPenaltyMultiplier: number // e.g. 0.70 (deals 70% damage if errors occur)
  flawlessBonusMultiplier: number // e.g. 1.25 (deals 125% damage if flawless)
  minAccuracyRequirement?: number // e.g. 95
  accuracyTiers?: AccuracyTier[] // Optional smooth accuracy progression
}

export interface TouchTypingConfig extends BaseMechanicConfig {
  type: "touch-typing"
  targetFingerGroup?: "index" | "middle" | "ring" | "pinky" | "all"
  requireHomeRowFocus?: boolean
  accuracyThreshold: number // e.g. 96
  bonusMultiplier: number // e.g. 1.35
  penaltyMultiplier: number // e.g. 0.65
  accuracyTiers?: AccuracyTier[] // Optional smooth accuracy progression
}

export interface NexusMasteryConfig extends BaseMechanicConfig {
  type: "nexus-mastery"
  minWpm: number
  minAccuracy: number
  bonusMultiplier: number
  penaltyMultiplier: number
  wpmWeight?: number // e.g. 0.45
  accWeight?: number // e.g. 0.55
}

export interface MultiPhaseConfig extends BaseMechanicConfig {
  type: "multi-phase" | "multi-phase-boss"
  totalPhases: number
  phaseNames: string[]
  phaseHpRatios: number[]
}

export type EnemyMechanicConfig =
  | PrecisionStrikeConfig
  | SpeedCheckConfig
  | ConsistencyConfig
  | ComboScalingConfig
  | FocusGenjutsuConfig
  | AdaptiveWeaknessConfig
  | TouchTypingConfig
  | NexusMasteryConfig
  | MultiPhaseConfig
