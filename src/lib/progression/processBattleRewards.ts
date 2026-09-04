import { Enemy } from "@/types/character"
import { BattleResult as BattleResultType } from "@/types/battle"
import { PlayerProfile, PlayerRank, PlayerStats } from "@/types/player"
import { loadPlayerProfile, savePlayerProfile } from "@/lib/storage/playerStorage"
import { addBattleHistoryEntry } from "@/lib/storage/battleHistoryStorage"
import { calculateBattleXp, BattleXpResult } from "./calculateXp"
import { applyXpGain, LevelProgressionResult } from "./calculateLevel"
import { calculatePlayerAttributes } from "./calculateAttributes"
import { calculateRankFromAttributes, isRankUp } from "./calculateRank"

export interface BattleRewardSummary {
  xpResult: BattleXpResult
  levelResult: LevelProgressionResult
  prevLevel: number
  prevXp: number
  prevRank: PlayerRank
  newRank: PlayerRank
  didRankUp: boolean
  updatedProfile: PlayerProfile
}

/**
 * Processes battle rewards and commits progression updates to local storage.
 * Strictly idempotent per call.
 */
export function processBattleRewards(
  result: BattleResultType,
  enemy: Enemy
): BattleRewardSummary {
  const currentProfile = loadPlayerProfile()
  const { finalStats, victory, elapsedTime } = result

  // 1. Calculate XP earned
  const xpResult = calculateBattleXp({
    victory,
    enemyLevel: enemy.level,
    wpm: finalStats.battleWpm,
    accuracy: finalStats.battleAccuracy,
    totalErrors: finalStats.totalErrors,
    bestCombo: finalStats.bestCombo,
  })

  // 2. Apply Level progression and XP overflow
  const prevLevel = currentProfile.level
  const prevXp = currentProfile.xp
  const levelResult = applyXpGain(prevLevel, prevXp, xpResult.totalXp)

  // 3. Update lifetime player stats
  const prevPlayed = currentProfile.stats.battlesPlayed
  const newBattlesPlayed = prevPlayed + 1
  const newAverageWpm =
    prevPlayed === 0
      ? finalStats.battleWpm
      : Math.round((currentProfile.stats.averageWpm * prevPlayed + finalStats.battleWpm) / newBattlesPlayed)

  const newAverageAccuracy =
    prevPlayed === 0
      ? finalStats.battleAccuracy
      : Math.round(
          (currentProfile.stats.averageAccuracy * prevPlayed + finalStats.battleAccuracy) /
            newBattlesPlayed
        )

  const updatedStats: PlayerStats = {
    ...currentProfile.stats,
    battlesPlayed: newBattlesPlayed,
    battlesWon: currentProfile.stats.battlesWon + (victory ? 1 : 0),
    battlesLost: currentProfile.stats.battlesLost + (victory ? 0 : 1),
    totalTypingTime: currentProfile.stats.totalTypingTime + Math.round(elapsedTime),
    totalCharactersTyped:
      currentProfile.stats.totalCharactersTyped + finalStats.totalTypingAttempts,
    totalCorrectCharacters:
      currentProfile.stats.totalCorrectCharacters + finalStats.totalCorrectCharacters,
    totalErrors: currentProfile.stats.totalErrors + finalStats.totalErrors,
    bestWpm: Math.max(currentProfile.stats.bestWpm, finalStats.bestWpm),
    bestCombo: Math.max(currentProfile.stats.bestCombo, finalStats.bestCombo),
    enemiesDefeated: currentProfile.stats.enemiesDefeated + (victory ? 1 : 0),
    averageWpm: newAverageWpm,
    averageAccuracy: newAverageAccuracy,
  }

  // 4. Recalculate performance ratings and rank
  const newAttributes = calculatePlayerAttributes(updatedStats)
  const prevRank = currentProfile.rank
  const newRank = calculateRankFromAttributes(newAttributes)
  const didRankUp = isRankUp(prevRank, newRank)

  const updatedProfile: PlayerProfile = {
    ...currentProfile,
    level: levelResult.newLevel,
    xp: levelResult.newXp,
    totalXp: currentProfile.totalXp + xpResult.totalXp,
    rank: newRank,
    attributes: newAttributes,
    stats: updatedStats,
    updatedAt: new Date().toISOString(),
  }

  // 5. Persist to storage
  savePlayerProfile(updatedProfile)

  // 6. Record into persistent battle history
  addBattleHistoryEntry({
    enemyId: enemy.id,
    enemyName: enemy.name,
    enemyAnime: enemy.anime,
    enemyLevel: enemy.level,
    themeColor: enemy.themeColor,
    victory,
    battleWpm: finalStats.battleWpm,
    battleAccuracy: finalStats.battleAccuracy,
    bestCombo: finalStats.bestCombo,
    totalErrors: finalStats.totalErrors,
    damageDealt: result.totalDamageDealt,
    damageTaken: result.totalDamageTaken,
    xpEarned: xpResult.totalXp,
    durationSeconds: Math.round(elapsedTime),
  })

  return {
    xpResult,
    levelResult,
    prevLevel,
    prevXp,
    prevRank,
    newRank,
    didRankUp,
    updatedProfile,
  }
}
