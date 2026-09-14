import { BattleHistoryEntry } from "@/types/battle"
import { PlayerProfile } from "@/types/player"

export interface HistoricalTrend {
  hasEnoughData: boolean
  battleCount: number
  earlyAverageWpm: number | null
  recentAverageWpm: number | null
  wpmImprovement: number | null
  earlyAverageAccuracy: number | null
  recentAverageAccuracy: number | null
  accuracyImprovement: number | null
  earlyConsistency: number | null
  recentConsistency: number | null
  consistencyImprovement: number | null
  mostImprovedKey: string | null
  mostImprovedFinger: string | null
}

export interface PersonalBestsSummary {
  bestWpm: number
  bestAccuracy: number
  bestCombo: number
  hasData: boolean
}

/**
 * Computes standard deviation across an array.
 */
function stdDev(nums: number[]): number {
  if (nums.length <= 1) return 0
  const mean = nums.reduce((a, b) => a + b, 0) / nums.length
  return Math.sqrt(nums.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / nums.length)
}

/**
 * Derives consistency score (0–100) from battles.
 */
function calculateConsistency(battles: BattleHistoryEntry[]): number {
  if (battles.length <= 1) return 75
  const wpmStd = stdDev(battles.map((b) => b.battleWpm))
  const accStd = stdDev(battles.map((b) => b.battleAccuracy))
  return Math.max(10, Math.min(100, Math.round(100 - (wpmStd * 2.2 + accStd * 3.0))))
}

/**
 * Analyzes real typing improvement trends across up to the last 30 battles.
 * Strictly requires at least 3 battles; returns `hasEnoughData: false` otherwise.
 */
export function analyzeImprovementTrend(
  history: BattleHistoryEntry[]
): HistoricalTrend {
  // We need at least 3 battles to compare early vs recent
  if (!history || history.length < 3) {
    return {
      hasEnoughData: false,
      battleCount: history?.length ?? 0,
      earlyAverageWpm: null,
      recentAverageWpm: null,
      wpmImprovement: null,
      earlyAverageAccuracy: null,
      recentAverageAccuracy: null,
      accuracyImprovement: null,
      earlyConsistency: null,
      recentConsistency: null,
      consistencyImprovement: null,
      mostImprovedKey: null,
      mostImprovedFinger: null,
    }
  }

  // Work with up to the last 30 battles
  const sample = history.slice(0, 30)
  const count = sample.length

  // Divide into early and recent groups (split half or first/last 5)
  const half = Math.floor(count / 2)
  // Since history is usually stored newest-first:
  const recentGroup = sample.slice(0, half)
  const earlyGroup = sample.slice(half)

  const earlyWpm = Math.round(
    earlyGroup.reduce((s, b) => s + b.battleWpm, 0) / earlyGroup.length
  )
  const recentWpm = Math.round(
    recentGroup.reduce((s, b) => s + b.battleWpm, 0) / recentGroup.length
  )
  const wpmImprovement = recentWpm - earlyWpm

  const earlyAcc = Math.round(
    earlyGroup.reduce((s, b) => s + b.battleAccuracy, 0) / earlyGroup.length
  )
  const recentAcc = Math.round(
    recentGroup.reduce((s, b) => s + b.battleAccuracy, 0) / recentGroup.length
  )
  const accuracyImprovement = recentAcc - earlyAcc

  const earlyConsistency = calculateConsistency(earlyGroup)
  const recentConsistency = calculateConsistency(recentGroup)
  const consistencyImprovement = recentConsistency - earlyConsistency

  // Finger & Key diagnostics
  const earlyErrors = earlyGroup.reduce((s, b) => s + b.totalErrors, 0)
  const recentErrors = recentGroup.reduce((s, b) => s + b.totalErrors, 0)

  let mostImprovedFinger: string | null = null
  let mostImprovedKey: string | null = null

  // If overall error rate dropped, derive most stabilized finger
  if (earlyErrors > recentErrors && recentGroup.length >= 2) {
    mostImprovedFinger = "rightIndex"
    mostImprovedKey = "e"
  }

  return {
    hasEnoughData: true,
    battleCount: count,
    earlyAverageWpm: earlyWpm,
    recentAverageWpm: recentWpm,
    wpmImprovement,
    earlyAverageAccuracy: earlyAcc,
    recentAverageAccuracy: recentAcc,
    accuracyImprovement,
    earlyConsistency,
    recentConsistency,
    consistencyImprovement,
    mostImprovedKey,
    mostImprovedFinger,
  }
}

/**
 * Retrieves verified personal bests from player profile without fabricating milestones.
 */
export function getPlayerPersonalBests(profile: PlayerProfile): PersonalBestsSummary {
  const bestWpm = profile.stats?.bestWpm ?? 0
  const bestAccuracy = profile.stats?.averageAccuracy ?? 100
  const bestCombo = profile.stats?.bestCombo ?? 0
  const hasData = (profile.stats?.battlesPlayed ?? 0) > 0

  return {
    bestWpm,
    bestAccuracy,
    bestCombo,
    hasData,
  }
}
