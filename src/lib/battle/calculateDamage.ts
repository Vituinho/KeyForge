import { StrikeType } from "@/types/battle"

export interface DamageCalculationInput {
  wpm: number
  accuracy: number // 0–100
  combo: number
  errors: number
  baseDamage?: number
}

export interface DamageCalculationResult {
  damage: number
  strikeType: StrikeType
  label: string
  wpmMultiplier: number
  accuracyMultiplier: number
  comboMultiplier: number
}

/**
 * Calculate damage dealt at the end of a typing round.
 *
 * Formula:
 *   damage = baseDamage * wpmMult * accuracyMult * comboMult
 *
 * Strike types:
 *   - critical: accuracy >= 98% AND combo >= 15 → 2x bonus
 *   - perfect:  errors === 0                   → 1.5x bonus
 *   - normal:   everything else
 *   - miss:     accuracy < 60%                 → no damage
 */
export function calculateDamage(
  input: DamageCalculationInput
): DamageCalculationResult {
  const { wpm, accuracy, combo, errors, baseDamage = 30 } = input

  // Miss — too many errors
  if (accuracy < 60) {
    return {
      damage: 0,
      strikeType: "miss",
      label: "MISS",
      wpmMultiplier: 0,
      accuracyMultiplier: 0,
      comboMultiplier: 0,
    }
  }

  const wpmMultiplier = computeWpmMultiplier(wpm)
  const accuracyMultiplier = computeAccuracyMultiplier(accuracy)
  const comboMultiplier = computeComboMultiplier(combo)

  let rawDamage =
    baseDamage * wpmMultiplier * accuracyMultiplier * comboMultiplier

  let strikeType: StrikeType = "normal"
  let label = "STRIKE"

  if (accuracy >= 98 && combo >= 15) {
    rawDamage *= 2
    strikeType = "critical"
    label = "CRITICAL HIT"
  } else if (errors === 0) {
    rawDamage *= 1.5
    strikeType = "perfect"
    label = "PERFECT STRIKE"
  }

  return {
    damage: Math.round(rawDamage),
    strikeType,
    label,
    wpmMultiplier,
    accuracyMultiplier,
    comboMultiplier,
  }
}

function computeWpmMultiplier(wpm: number): number {
  // Scales 0→3 over 0→120 WPM, capped at 3
  return Math.min(3, Math.max(0.2, wpm / 40))
}

function computeAccuracyMultiplier(accuracy: number): number {
  // Perfect accuracy = 1.5x, 60% accuracy = 0.2x
  if (accuracy >= 100) return 1.5
  if (accuracy >= 95) return 1.2
  if (accuracy >= 85) return 1.0
  if (accuracy >= 75) return 0.7
  if (accuracy >= 65) return 0.4
  return 0.2
}

function computeComboMultiplier(combo: number): number {
  if (combo >= 30) return 2.0
  if (combo >= 20) return 1.5
  if (combo >= 10) return 1.2
  if (combo >= 5) return 1.1
  return 1.0
}
