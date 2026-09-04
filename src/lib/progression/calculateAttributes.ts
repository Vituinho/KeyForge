import { PlayerAttributes, PlayerStats } from "@/types/player"

function clamp(val: number, min = 0, max = 100): number {
  if (!Number.isFinite(val) || Number.isNaN(val)) return min
  return Math.min(max, Math.max(min, Math.round(val)))
}

/**
 * SPEED (0–100)
 * Evaluates typing throughput.
 * Uses 70% average WPM and 30% peak WPM, normalized against 110 WPM elite benchmark.
 */
export function calculateSpeedRating(averageWpm: number, bestWpm: number): number {
  const safeAvg = Math.max(0, averageWpm || 0)
  const safeBest = Math.max(0, bestWpm || 0)

  if (safeAvg === 0 && safeBest === 0) return 0

  const effectiveWpm = safeAvg * 0.7 + safeBest * 0.3
  const rating = (effectiveWpm / 110) * 100
  return clamp(rating)
}

/**
 * ACCURACY (0–100)
 * Evaluates typing accuracy percentage directly.
 */
export function calculateAccuracyRating(averageAccuracy: number): number {
  if (!Number.isFinite(averageAccuracy) || averageAccuracy <= 0) return 0
  return clamp(averageAccuracy)
}

/**
 * COMBO (0–100)
 * Evaluates flow state and uninterrupted streak capability.
 * A combo of 60+ chars corresponds to high mastery.
 */
export function calculateComboRating(bestCombo: number, battlesWon: number): number {
  const safeCombo = Math.max(0, bestCombo || 0)
  const safeWins = Math.max(0, battlesWon || 0)

  if (safeCombo === 0) return 0

  const comboPart = (safeCombo / 60) * 80
  const consistencyPart = Math.min(20, safeWins * 2)
  return clamp(comboPart + consistencyPart)
}

/**
 * TECHNIQUE (0–100)
 * Strictly measures engagement with disciplined touch-typing training:
 * - Academy modules completed (up to 45 pts)
 * - Weak Key training sessions (up to 35 pts)
 * - Overall error suppression ratio (up to 20 pts)
 * Does NOT increase simply from playing normal battles.
 */
export function calculateTechniqueRating(
  academyLessonsCompleted: number,
  trainingSessions: number,
  totalCharactersTyped: number,
  totalErrors: number
): number {
  const safeLessons = Math.max(0, academyLessonsCompleted || 0)
  const safeSessions = Math.max(0, trainingSessions || 0)

  const academyScore = Math.min(45, safeLessons * 22.5)
  const trainingScore = Math.min(35, safeSessions * 7)

  let errorDisciplineScore = 0
  if (totalCharactersTyped > 20) {
    const errorRatio = totalErrors / totalCharactersTyped
    // Lower error ratio yields higher discipline points
    errorDisciplineScore = Math.max(0, Math.min(20, 20 - errorRatio * 150))
  }

  return clamp(academyScore + trainingScore + errorDisciplineScore)
}

/**
 * Overall Composite Rating (0–100)
 * Accuracy has the highest weight (35%) to ensure high speed with poor accuracy does not inflate rank.
 */
export function calculateOverallRating(
  attrs: Omit<PlayerAttributes, "overall">
): number {
  const composite =
    attrs.accuracy * 0.35 +
    attrs.speed * 0.3 +
    attrs.technique * 0.2 +
    attrs.combo * 0.15

  return clamp(composite)
}

/**
 * Computes the full set of player attributes from lifetime stats.
 */
export function calculatePlayerAttributes(stats: PlayerStats): PlayerAttributes {
  const speed = calculateSpeedRating(stats.averageWpm, stats.bestWpm)
  const accuracy = calculateAccuracyRating(stats.averageAccuracy)
  const combo = calculateComboRating(stats.bestCombo, stats.battlesWon)
  const technique = calculateTechniqueRating(
    stats.academyLessonsCompleted,
    stats.trainingSessions,
    stats.totalCharactersTyped,
    stats.totalErrors
  )

  const overall = calculateOverallRating({ speed, accuracy, combo, technique })

  return {
    speed,
    accuracy,
    technique,
    combo,
    overall,
  }
}
