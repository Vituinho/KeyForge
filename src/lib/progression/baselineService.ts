import { PlayerProfile } from "@/types/player"
import { BattleHistoryEntry } from "@/types/battle"
import { WorldEntryBaseline } from "@/types/progression"

/**
 * Computes standard deviation across an array of numbers.
 */
function computeStdDev(values: number[]): number {
  if (values.length <= 1) return 0
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length
  const variance =
    values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (values.length - 1)
  return Math.sqrt(variance)
}

/**
 * Derives a consistency score (0–100) from WPM and accuracy standard deviations.
 * Lower variance produces a higher consistency rating.
 */
function deriveConsistencyFromHistory(battles: BattleHistoryEntry[]): number {
  if (battles.length <= 1) return 75 // Neutral baseline

  const wpms = battles.map((b) => b.battleWpm)
  const accs = battles.map((b) => b.battleAccuracy)

  const wpmStd = computeStdDev(wpms)
  const accStd = computeStdDev(accs)

  // Standard deviation of 0 -> 100 consistency
  // Standard deviation of 15 WPM + 5% acc -> ~55 consistency
  const penalty = wpmStd * 2.2 + accStd * 3.0
  return Math.max(10, Math.min(100, Math.round(100 - penalty)))
}

/**
 * Checks whether an entry baseline is genuinely calibrated with sufficient history.
 */
export function hasCalibratedBaseline(
  baseline: WorldEntryBaseline | null | undefined
): boolean {
  if (!baseline) return false
  if (baseline.baselineUnavailable) return false
  if (baseline.confidence === "uncalibrated") return false
  return baseline.sampleSize > 0 && baseline.wpm > 0
}

/**
 * Retrieves the stored world entry baseline for a specific anime world.
 */
export function getWorldEntryBaseline(
  worldId: string,
  profile: PlayerProfile
): WorldEntryBaseline | undefined {
  return profile.worldBaselines?.[worldId]
}

/**
 * Captures an immutable world entry snapshot for the given world.
 *
 * RULES ENFORCED:
 * 1. IMMUTABILITY: If a baseline already exists for this world, it is NEVER recalculated.
 * 2. NO RETROACTIVE FABRICATION: If a player already completed this world before v3.4,
 *    we flag `baselineUnavailable: true` and `confidence: "uncalibrated"` rather than
 *    treating their current end-game stats as an entry baseline.
 * 3. ROLLING AVERAGE: For newly entered worlds, averages the last 5–10 battles to prevent
 *    single-battle flukes or outliers from skewing the player's true baseline.
 */
export function captureWorldEntryBaseline(
  worldId: string,
  profile: PlayerProfile,
  history: BattleHistoryEntry[] = []
): WorldEntryBaseline {
  // 1. Invariant: Immutability / Idempotence
  const existing = profile.worldBaselines?.[worldId]
  if (existing) {
    return existing
  }

  // 2. Invariant: Legacy Completed Worlds (Never fabricate false baseline)
  const worldProgress = profile.campaignProgress?.[worldId]
  if (worldProgress && worldProgress.completed) {
    return {
      worldId,
      capturedAt: new Date().toISOString(),
      wpm: 0,
      accuracy: 0,
      consistency: 0,
      keyErrors: {},
      sampleSize: 0,
      source: "recent_battles",
      confidence: "uncalibrated",
      baselineUnavailable: true,
    }
  }

  // 3. Invariant: Rolling average over recent reliable battles (up to last 10)
  if (history && history.length > 0) {
    // History is chronological or latest-first; take up to 10 recent battles
    const recent = history.slice(0, 10)
    const sampleSize = recent.length

    const avgWpm = Math.round(
      recent.reduce((sum, b) => sum + b.battleWpm, 0) / sampleSize
    )
    const avgAccuracy = Math.round(
      recent.reduce((sum, b) => sum + b.battleAccuracy, 0) / sampleSize
    )
    const consistency = deriveConsistencyFromHistory(recent)

    const confidence =
      sampleSize >= 5 ? "high" : sampleSize >= 3 ? "moderate" : "low"

    return {
      worldId,
      capturedAt: new Date().toISOString(),
      wpm: avgWpm,
      accuracy: avgAccuracy,
      consistency,
      keyErrors: { ...(profile.keyErrors ?? {}) },
      sampleSize,
      source: "recent_battles",
      confidence,
      baselineUnavailable: false,
    }
  }

  // 4. Fallback: Aggregated profile stats if battles were played
  if (profile.stats && profile.stats.battlesPlayed > 0) {
    const sampleSize = Math.min(10, profile.stats.battlesPlayed)
    const confidence = sampleSize >= 3 ? "moderate" : "low"

    return {
      worldId,
      capturedAt: new Date().toISOString(),
      wpm: profile.stats.averageWpm,
      accuracy: profile.stats.averageAccuracy,
      consistency: 70,
      keyErrors: { ...(profile.keyErrors ?? {}) },
      sampleSize,
      source: "aggregated_profile",
      confidence,
      baselineUnavailable: false,
    }
  }

  // 5. Brand new player (0 battles ever played)
  return {
    worldId,
    capturedAt: new Date().toISOString(),
    wpm: 0,
    accuracy: 100,
    consistency: 75,
    keyErrors: {},
    sampleSize: 0,
    source: "initial_session",
    confidence: "uncalibrated",
    baselineUnavailable: false,
  }
}

export interface ImprovementComparison {
  isCalibrated: boolean
  startingWpm: number | null
  currentWpm: number
  wpmDelta: number | null
  wpmPercent: number | null
  startingAccuracy: number | null
  currentAccuracy: number
  accuracyDelta: number | null
  startingConsistency: number | null
  currentConsistency: number
  consistencyDelta: number | null
}

/**
 * Calculates fair, like-for-like improvement between baseline average and current average.
 * If baseline is uncalibrated, returns null deltas to strictly prevent fake metrics.
 */
export function calculateImprovement(
  baseline: WorldEntryBaseline | null | undefined,
  currentMetrics: { wpm: number; accuracy: number; consistency?: number }
): ImprovementComparison {
  const isCalibrated = hasCalibratedBaseline(baseline)

  if (!isCalibrated || !baseline) {
    return {
      isCalibrated: false,
      startingWpm: null,
      currentWpm: currentMetrics.wpm,
      wpmDelta: null,
      wpmPercent: null,
      startingAccuracy: null,
      currentAccuracy: currentMetrics.accuracy,
      accuracyDelta: null,
      startingConsistency: null,
      currentConsistency: currentMetrics.consistency ?? 75,
      consistencyDelta: null,
    }
  }

  const wpmDelta = currentMetrics.wpm - baseline.wpm
  const wpmPercent =
    baseline.wpm > 0 ? Math.round((wpmDelta / baseline.wpm) * 100) : 0
  const accuracyDelta = currentMetrics.accuracy - baseline.accuracy
  const currentConsistency = currentMetrics.consistency ?? 75
  const consistencyDelta = currentConsistency - baseline.consistency

  return {
    isCalibrated: true,
    startingWpm: baseline.wpm,
    currentWpm: currentMetrics.wpm,
    wpmDelta,
    wpmPercent,
    startingAccuracy: baseline.accuracy,
    currentAccuracy: currentMetrics.accuracy,
    accuracyDelta,
    startingConsistency: baseline.consistency,
    currentConsistency,
    consistencyDelta,
  }
}
