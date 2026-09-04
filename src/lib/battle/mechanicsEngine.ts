import { TypingStats } from "@/types/typing"
import { Enemy } from "@/types/character"
import { RoundResult } from "@/types/battle"
import {
  ComboScalingConfig,
  ConsistencyConfig,
  FocusGenjutsuConfig,
  PrecisionStrikeConfig,
  SpeedCheckConfig,
} from "@/types/mechanics"

export interface MechanicEvaluationContext {
  roundStats: TypingStats
  enemy: Enemy
  roundHistory: RoundResult[]
  baseCalculatedDamage: number
  currentPhase?: number
}

export interface MechanicEvaluationResult {
  modifiedDamage: number
  totalMultiplier: number
  extraPlayerDamageTaken: number
  activeEffects: string[]
  feedbackNotes: string[]
}

/**
 * Pure evaluator for battle mechanics.
 * Iterates through configured mechanics on the enemy without hardcoded character names.
 */
export function evaluateEnemyMechanics(
  context: MechanicEvaluationContext
): MechanicEvaluationResult {
  const { roundStats, enemy, roundHistory, baseCalculatedDamage } = context

  let multiplier = 1.0
  let extraPlayerDamageTaken = 0
  const activeEffects: string[] = []
  const feedbackNotes: string[] = []

  const mechanics = enemy.mechanics ?? []

  for (const mech of mechanics) {
    switch (mech.type) {
      case "precision-strike": {
        const config = mech as PrecisionStrikeConfig
        if (roundStats.currentAccuracy < config.targetAccuracy) {
          multiplier *= config.belowThresholdPenalty
          activeEffects.push(`PRECISION PENALTY (${Math.round((1 - config.belowThresholdPenalty) * 100)}% Dmg Reduced)`)
          feedbackNotes.push(
            `Accuracy was ${roundStats.currentAccuracy}% (target: ${config.targetAccuracy}%). Precise strikes deal full damage.`
          )
        } else {
          multiplier *= config.aboveThresholdBonus
          activeEffects.push(`PRECISION STRIKE (+${Math.round((config.aboveThresholdBonus - 1) * 100)}%)`)
        }
        break
      }

      case "speed-check": {
        const config = mech as SpeedCheckConfig
        if (roundStats.currentWpm < config.slowThreshold) {
          multiplier *= config.slowMultiplier
          activeEffects.push(`SPEED PENALTY (${Math.round((1 - config.slowMultiplier) * 100)}% Dmg Reduced)`)
          feedbackNotes.push(
            `WPM was ${roundStats.currentWpm} (min: ${config.slowThreshold}). Higher speed breaks through guard.`
          )
        } else {
          // Find matching speed threshold (sorted descending)
          const sorted = [...config.thresholds].sort((a, b) => b.minWpm - a.minWpm)
          const matched = sorted.find((t) => roundStats.currentWpm >= t.minWpm)
          if (matched && matched.multiplier > 1.0) {
            multiplier *= matched.multiplier
            activeEffects.push(`${matched.label} (x${matched.multiplier})`)
          }
        }
        break
      }

      case "consistency": {
        const config = mech as ConsistencyConfig
        if (roundHistory.length > 0) {
          const prevWpmSum = roundHistory.reduce((acc, r) => acc + r.wpm, 0)
          const avgPrevWpm = prevWpmSum / roundHistory.length
          const diff = Math.abs(roundStats.currentWpm - avgPrevWpm)

          if (diff <= config.maxWpmVariance) {
            multiplier *= config.bonusMultiplier
            activeEffects.push(`CONSISTENCY BONUS (+${Math.round((config.bonusMultiplier - 1) * 100)}%)`)
          } else {
            multiplier *= config.penaltyMultiplier
            activeEffects.push(`RHYTHM SWING PENALTY (-${Math.round((1 - config.penaltyMultiplier) * 100)}%)`)
            feedbackNotes.push(`Speed swung by ${Math.round(diff)} WPM from your battle average. Maintain steady rhythm.`)
          }
        }
        break
      }

      case "combo-scaling": {
        const config = mech as ComboScalingConfig
        const sortedTiers = [...config.tiers].sort((a, b) => b.minCombo - a.minCombo)
        const matchedTier = sortedTiers.find((t) => roundStats.bestCombo >= t.minCombo)

        if (matchedTier) {
          multiplier *= matchedTier.multiplier
          activeEffects.push(
            matchedTier.label ?? `COMBO SURGE (x${matchedTier.multiplier})`
          )
        }

        // Error penalty / counter-attack
        if (roundStats.currentErrors > 0 && (config.breakComboCounterAttack ?? 0) > 0) {
          const counterDmg = config.breakComboCounterAttack!
          extraPlayerDamageTaken += counterDmg
          activeEffects.push(`COUNTERED (-${counterDmg} HP)`)
          feedbackNotes.push(`Errors disrupted your flow and triggered counter damage.`)
        }
        break
      }

      case "focus-genjutsu": {
        const config = mech as FocusGenjutsuConfig
        if (config.complexPunctuation) {
          if (roundStats.currentAccuracy >= 96) {
            multiplier *= 1.2
            activeEffects.push("GENJUTSU DISPELLED (+20%)")
          } else if (roundStats.currentAccuracy < 90) {
            multiplier *= 0.7
            activeEffects.push("TRAPPED IN GENJUTSU (-30%)")
            feedbackNotes.push("Genjutsu texts test precision on punctuation and symbols. Stay focused.")
          }
        }
        break
      }

      case "multi-phase":
      case "multi-phase-boss":
        // Phases are handled by the battle state controller
        break
    }
  }

  const modifiedDamage = Math.round(baseCalculatedDamage * multiplier)

  return {
    modifiedDamage,
    totalMultiplier: multiplier,
    extraPlayerDamageTaken,
    activeEffects,
    feedbackNotes,
  }
}
