import { TypingStats } from "@/types/typing"
import { Enemy } from "@/types/character"
import { RoundResult } from "@/types/battle"
import {
  AdaptiveWeaknessConfig,
  ComboScalingConfig,
  ConsistencyConfig,
  FocusGenjutsuConfig,
  NexusMasteryConfig,
  PrecisionStrikeConfig,
  SpeedCheckConfig,
  TouchTypingConfig,
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
        if (config.accuracyTiers && config.accuracyTiers.length > 0) {
          const sorted = [...config.accuracyTiers].sort((a, b) => b.minAccuracy - a.minAccuracy)
          const matched = sorted.find((t) => roundStats.currentAccuracy >= t.minAccuracy) ?? sorted[sorted.length - 1]
          multiplier *= matched.multiplier
          if (matched.label) {
            activeEffects.push(matched.label)
          }
          if (matched.multiplier < 1.0) {
            feedbackNotes.push(
              `Accuracy was ${roundStats.currentAccuracy}%. Aim for higher precision to pierce defenses.`
            )
          }
        } else {
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
          if (matched) {
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

          if (config.varianceTiers && config.varianceTiers.length > 0) {
            const sorted = [...config.varianceTiers].sort((a, b) => a.maxVariance - b.maxVariance)
            const matched = sorted.find((t) => diff <= t.maxVariance) ?? sorted[sorted.length - 1]
            multiplier *= matched.multiplier
            if (matched.label) {
              activeEffects.push(matched.label)
            }
            if (matched.multiplier < 1.0) {
              feedbackNotes.push(`Speed swung by ${Math.round(diff)} WPM from battle average. Maintain a steady cadence.`)
            }
          } else {
            if (diff <= config.maxWpmVariance) {
              multiplier *= config.bonusMultiplier
              activeEffects.push(`CONSISTENCY BONUS (+${Math.round((config.bonusMultiplier - 1) * 100)}%)`)
            } else {
              multiplier *= config.penaltyMultiplier
              activeEffects.push(`RHYTHM SWING PENALTY (-${Math.round((1 - config.penaltyMultiplier) * 100)}%)`)
              feedbackNotes.push(`Speed swung by ${Math.round(diff)} WPM from your battle average. Maintain steady rhythm.`)
            }
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

      case "adaptive-weakness": {
        const config = mech as AdaptiveWeaknessConfig
        if (config.accuracyTiers && config.accuracyTiers.length > 0) {
          const sorted = [...config.accuracyTiers].sort((a, b) => b.minAccuracy - a.minAccuracy)
          const matched = sorted.find((t) => roundStats.currentAccuracy >= t.minAccuracy) ?? sorted[sorted.length - 1]
          multiplier *= matched.multiplier
          if (matched.label) {
            activeEffects.push(matched.label)
          }
          if (matched.multiplier < 1.0) {
            feedbackNotes.push("Errors on weak keys reduce attack force. Focus on clean fingering.")
          }
        } else {
          const minAcc = config.minAccuracyRequirement ?? 95
          if (roundStats.currentErrors > 0 || roundStats.currentAccuracy < minAcc) {
            multiplier *= config.errorPenaltyMultiplier
            const penaltyPct = Math.round((1 - config.errorPenaltyMultiplier) * 100)
            activeEffects.push(`WEAKNESS EXPLOITED (-${penaltyPct}%)`)
            feedbackNotes.push("Typos or inaccurate keystrokes expose your weaknesses. Focus on deliberate control.")
          } else {
            multiplier *= config.flawlessBonusMultiplier
            const bonusPct = Math.round((config.flawlessBonusMultiplier - 1) * 100)
            activeEffects.push(`WEAKNESS OVERCOME (+${bonusPct}%)`)
          }
        }
        break
      }

      case "touch-typing": {
        const config = mech as TouchTypingConfig
        if (config.accuracyTiers && config.accuracyTiers.length > 0) {
          const sorted = [...config.accuracyTiers].sort((a, b) => b.minAccuracy - a.minAccuracy)
          const matched = sorted.find((t) => roundStats.currentAccuracy >= t.minAccuracy) ?? sorted[sorted.length - 1]
          multiplier *= matched.multiplier
          if (matched.label) {
            activeEffects.push(matched.label)
          }
          if (matched.multiplier < 1.0) {
            feedbackNotes.push("Touch typing form slipped. Re-anchor to the home row keys.")
          }
        } else {
          if (roundStats.currentAccuracy < config.accuracyThreshold) {
            multiplier *= config.penaltyMultiplier
            const penPct = Math.round((1 - config.penaltyMultiplier) * 100)
            activeEffects.push(`DISCIPLINE BROKEN (-${penPct}%)`)
            feedbackNotes.push(
              `Total Concentration Breathing requires ${config.accuracyThreshold}% touch-typing precision across all keys.`
            )
          } else {
            multiplier *= config.bonusMultiplier
            const bonPct = Math.round((config.bonusMultiplier - 1) * 100)
            activeEffects.push(`TOTAL CONCENTRATION (+${bonPct}%)`)
          }
        }
        break
      }

      case "nexus-mastery": {
        const config = mech as NexusMasteryConfig
        const meetsWpm = roundStats.currentWpm >= config.minWpm
        const meetsAcc = roundStats.currentAccuracy >= config.minAccuracy

        if (meetsWpm && meetsAcc) {
          multiplier *= config.bonusMultiplier
          const bonPct = Math.round((config.bonusMultiplier - 1) * 100)
          activeEffects.push(`NEXUS SOVEREIGN (+${bonPct}%)`)
        } else if (roundStats.currentAccuracy < 85) {
          // Low accuracy suffers severe suppression regardless of speed
          multiplier *= 0.50
          activeEffects.push("ERRATIC CADENCE (-50%)")
          feedbackNotes.push("Inaccurate typing shatters your focus. Accuracy is essential in the Nexus.")
        } else if (roundStats.currentAccuracy < 92) {
          multiplier *= 0.70
          activeEffects.push("CRUCIBLE SUPPRESSION (-30%)")
          feedbackNotes.push(`Maintain tight accuracy (target: ${config.minAccuracy}%).`)
        } else if (!meetsWpm) {
          // Near accuracy but lower WPM -> gentle scaling, not impossible!
          const speedRatio = Math.max(0.75, roundStats.currentWpm / config.minWpm)
          multiplier *= speedRatio
          activeEffects.push(`TEMPO DRAG (-${Math.round((1 - speedRatio) * 100)}%)`)
        } else {
          // Met speed but slight accuracy dip
          multiplier *= 0.85
          activeEffects.push("FOCUS FLICKER (-15%)")
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
