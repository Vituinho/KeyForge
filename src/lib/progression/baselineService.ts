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
  arg1: PlayerProfile | string,
  arg2?: PlayerProfile | string
): WorldEntryBaseline | undefined {
  const profile = typeof arg1 === "object" ? arg1 : (arg2 as PlayerProfile)
  const worldId = typeof arg1 === "string" ? arg1 : (arg2 as string)
  return profile?.worldBaselines?.[worldId]
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
  arg1: PlayerProfile | string,
  arg2: PlayerProfile | string,
  history: BattleHistoryEntry[] = []
): WorldEntryBaseline {
  const profile = typeof arg1 === "object" ? arg1 : (arg2 as PlayerProfile)
  const worldId = typeof arg1 === "string" ? arg1 : (arg2 as string)

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
      entryAvgWpm: 0,
      accuracy: 0,
      entryAvgAccuracy: 0,
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
      entryAvgWpm: avgWpm,
      accuracy: avgAccuracy,
      entryAvgAccuracy: avgAccuracy,
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
    const wpm = profile.stats.averageWpm || profile.stats.avgWpm || 0
    const accuracy = profile.stats.averageAccuracy || profile.stats.avgAccuracy || 100

    return {
      worldId,
      capturedAt: new Date().toISOString(),
      wpm,
      entryAvgWpm: wpm,
      accuracy,
      entryAvgAccuracy: accuracy,
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
    entryAvgWpm: 0,
    accuracy: 100,
    entryAvgAccuracy: 100,
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
  confidence: "high" | "moderate" | "low" | "uncalibrated"
  baselineUnavailable?: boolean
  baselineWpm: number | null
  startingWpm: number | null
  currentWpm: number
  wpmDelta: number | null
  wpmPercent: number | null
  baselineAccuracy: number | null
  startingAccuracy: number | null
  currentAccuracy: number
  accuracyDelta: number | null
  baselineConsistency: number | null
  startingConsistency: number | null
  currentConsistency: number
  consistencyDelta: number | null
}

/**
 * Calculates fair, like-for-like improvement between baseline average and current average.
 * Supports both (profile, worldId, history) and (baseline, currentMetrics).
 * If baseline is uncalibrated, returns null deltas to strictly prevent fake metrics.
 */
export function calculateImprovement(
  arg1: PlayerProfile | WorldEntryBaseline | null | undefined,
  arg2: string | { wpm: number; accuracy: number; consistency?: number },
  history: BattleHistoryEntry[] = []
): ImprovementComparison {
  let baseline: WorldEntryBaseline | null | undefined
  let currentMetrics: { wpm: number; accuracy: number; consistency?: number }

  if (typeof arg2 === "string") {
    // Signature: (profile: PlayerProfile, worldId: string, history?: BattleHistoryEntry[])
    const profile = arg1 as PlayerProfile
    const worldId = arg2
    baseline = profile.worldBaselines?.[worldId]

    // Check if legacy completed world without baseline
    if (!baseline && profile.campaignProgress?.[worldId]?.completed) {
      baseline = {
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

    const currentWpm =
      history.length > 0
        ? Math.round(history.slice(0, 5).reduce((s, b) => s + b.battleWpm, 0) / Math.min(5, history.length))
        : profile.stats.averageWpm || profile.stats.avgWpm || profile.bestWpm || 0

    const currentAccuracy =
      history.length > 0
        ? Math.round(history.slice(0, 5).reduce((s, b) => s + b.battleAccuracy, 0) / Math.min(5, history.length))
        : profile.stats.averageAccuracy || profile.stats.avgAccuracy || profile.bestAccuracy || 100

    currentMetrics = {
      wpm: currentWpm,
      accuracy: currentAccuracy,
      consistency: 75,
    }
  } else {
    // Signature: (baseline, currentMetrics)
    baseline = arg1 as WorldEntryBaseline | null | undefined
    currentMetrics = arg2
  }

  const isCalibrated = hasCalibratedBaseline(baseline)

  if (!isCalibrated || !baseline || baseline.baselineUnavailable) {
    return {
      isCalibrated: false,
      confidence: "uncalibrated",
      baselineUnavailable: true,
      baselineWpm: null,
      startingWpm: null,
      currentWpm: currentMetrics.wpm,
      wpmDelta: null,
      wpmPercent: null,
      baselineAccuracy: null,
      startingAccuracy: null,
      currentAccuracy: currentMetrics.accuracy,
      accuracyDelta: null,
      baselineConsistency: null,
      startingConsistency: null,
      currentConsistency: currentMetrics.consistency ?? 75,
      consistencyDelta: null,
    }
  }

  const baseWpm = baseline.wpm || baseline.entryAvgWpm || 0
  const baseAcc = baseline.accuracy || baseline.entryAvgAccuracy || 0
  const wpmDelta = currentMetrics.wpm - baseWpm
  const wpmPercent = baseWpm > 0 ? Math.round((wpmDelta / baseWpm) * 100) : 0
  const accuracyDelta = currentMetrics.accuracy - baseAcc
  const currentConsistency = currentMetrics.consistency ?? 75
  const consistencyDelta = currentConsistency - baseline.consistency

  return {
    isCalibrated: true,
    confidence: baseline.confidence,
    baselineUnavailable: false,
    baselineWpm: baseWpm,
    startingWpm: baseWpm,
    currentWpm: currentMetrics.wpm,
    wpmDelta,
    wpmPercent,
    baselineAccuracy: baseAcc,
    startingAccuracy: baseAcc,
    currentAccuracy: currentMetrics.accuracy,
    accuracyDelta,
    baselineConsistency: baseline.consistency,
    startingConsistency: baseline.consistency,
    currentConsistency,
    consistencyDelta,
  }
}
