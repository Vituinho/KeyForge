export interface BattleXpParams {
  victory: boolean
  enemyLevel?: number
  wpm: number
  accuracy: number // 0–100
  totalErrors: number
  bestCombo?: number
}

export interface BattleXpResult {
  totalXp: number
  baseXp: number
  speedBonusXp: number
  accuracyBonusXp: number
  perfectBonusXp: number
  isVictory: boolean
}

/**
 * Calculates XP earned from a battle.
 * - Rewards victory significantly, but always gives learning effort XP on defeat.
 * - Speed bonus: up to +30% based on WPM.
 * - Accuracy bonus: up to +30% based on accuracy above 70%.
 * - Perfect Strike: flat +25 XP bonus if 0 errors.
 */
export function calculateBattleXp({
  victory,
  enemyLevel = 1,
  wpm,
  accuracy,
  totalErrors,
}: BattleXpParams): BattleXpResult {
  const safeEnemyLevel = Math.max(1, enemyLevel)
  const baseXp = safeEnemyLevel * 30

  if (!victory) {
    // Defeat: give learning effort XP based on accuracy (never useless, encourages practice)
    const accuracyFactor = Math.min(1, Math.max(0.1, accuracy / 100))
    const defeatXp = Math.max(10, Math.round(baseXp * 0.35 * accuracyFactor))

    return {
      totalXp: defeatXp,
      baseXp,
      speedBonusXp: 0,
      accuracyBonusXp: 0,
      perfectBonusXp: 0,
      isVictory: false,
    }
  }

  // Speed bonus: up to +30% (capped at 100 WPM)
  const speedRatio = Math.min(1, Math.max(0, wpm / 100))
  const speedBonusMultiplier = speedRatio * 0.3
  const speedBonusXp = Math.round(baseXp * speedBonusMultiplier)

  // Accuracy bonus: up to +30% (scales from 70% to 100%)
  const accuracyRatio = Math.min(1, Math.max(0, (accuracy - 70) / 30))
  const accuracyBonusMultiplier = accuracyRatio * 0.3
  const accuracyBonusXp = Math.round(baseXp * accuracyBonusMultiplier)

  // Perfect strike bonus: +25 XP if zero errors
  const perfectBonusXp = totalErrors === 0 ? 25 : 0

  const totalXp = Math.max(40, baseXp + speedBonusXp + accuracyBonusXp + perfectBonusXp)

  return {
    totalXp,
    baseXp,
    speedBonusXp,
    accuracyBonusXp,
    perfectBonusXp,
    isVictory: true,
  }
}

/**
 * Calculates XP earned from a Training session.
 */
export function calculateTrainingXp(accuracy: number, drillsCompleted = 5): number {
  const safeAcc = Math.min(100, Math.max(0, accuracy))
  const base = 15
  const performance = Math.round((safeAcc / 100) * 15 * (Math.min(drillsCompleted, 5) / 5))
  return base + performance // 15–30 XP
}

/**
 * Calculates XP earned from an Academy Lesson.
 * First completion gives substantial XP (60 XP).
 * Repeat attempts give nominal practice XP (10 XP) to prevent infinite farming.
 */
export function calculateAcademyXp(isFirstCompletion: boolean, accuracy: number): number {
  if (isFirstCompletion) {
    const accuracyBonus = accuracy >= 95 ? 15 : 0
    return 50 + accuracyBonus // 50–65 XP
  }
  // Repeat completion gives fixed small reward
  return 10
}
