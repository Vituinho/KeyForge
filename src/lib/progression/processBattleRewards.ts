import { Enemy } from "@/types/character"
import { BattleResult as BattleResultType } from "@/types/battle"
import {
  PlayerProfile,
  PlayerRank,
  PlayerStats,
  CampaignWorldProgress,
  createDefaultNarutoWorldProgress,
} from "@/types/player"
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
  isFirstClear?: boolean
  firstClearBonusXp?: number
  campaignCompleted?: boolean
  stageUnlocked?: number
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

  // 1. Campaign Progression Tracking & First Clear Detection
  let isFirstClear = false
  let firstClearBonus = 0
  let campaignCompleted = false
  let stageUnlocked: number | undefined = undefined

  const updatedCampaignProgress: Record<string, CampaignWorldProgress> = {
    ...(currentProfile.campaignProgress ?? {}),
  }

  const updatedAchievements = [...(currentProfile.achievements ?? [])]

  if (victory && enemy.world) {
    const worldKey = enemy.world
    const existingWorldProgress: CampaignWorldProgress =
      updatedCampaignProgress[worldKey] ??
      (worldKey === "naruto"
        ? createDefaultNarutoWorldProgress()
        : {
            unlocked: true,
            completed: false,
            currentStage: 1,
            completedStages: [],
            defeatedEnemies: [],
            bestScores: {},
            firstClearClaimed: {},
          })

    // Check first clear bonus
    const alreadyClaimed = existingWorldProgress.firstClearClaimed?.[enemy.id] ?? false
    if (!alreadyClaimed) {
      isFirstClear = true
      firstClearBonus = enemy.firstClearBonusXp ?? 0
    }

    const newFirstClearClaimed = {
      ...existingWorldProgress.firstClearClaimed,
      [enemy.id]: true,
    }

    // Stage progression
    const stageNum = enemy.stage ?? 1
    const newCompletedStages = existingWorldProgress.completedStages.includes(stageNum)
      ? existingWorldProgress.completedStages
      : [...existingWorldProgress.completedStages, stageNum].sort((a, b) => a - b)

    const newDefeatedEnemies = existingWorldProgress.defeatedEnemies.includes(enemy.id)
      ? existingWorldProgress.defeatedEnemies
      : [...existingWorldProgress.defeatedEnemies, enemy.id]

    const nextStage = Math.max(existingWorldProgress.currentStage, stageNum + 1)
    if (nextStage > existingWorldProgress.currentStage) {
      stageUnlocked = nextStage
    }

    // Best scores update
    const prevBest = existingWorldProgress.bestScores?.[enemy.id]
    const newBestScores = {
      ...existingWorldProgress.bestScores,
      [enemy.id]: {
        bestWpm: Math.max(prevBest?.bestWpm ?? 0, finalStats.battleWpm),
        bestAccuracy: Math.max(prevBest?.bestAccuracy ?? 0, finalStats.battleAccuracy),
        bestCombo: Math.max(prevBest?.bestCombo ?? 0, finalStats.bestCombo),
        completedAt: new Date().toISOString(),
      },
    }

    // Check boss defeat & campaign completion
    const isBossCleared = enemy.isBoss === true
    const isWorldCompleted = existingWorldProgress.completed || isBossCleared
    if (isBossCleared) {
      campaignCompleted = true
      if (!updatedAchievements.includes("naruto_world_completed")) {
        updatedAchievements.push("naruto_world_completed")
      }
    }

    updatedCampaignProgress[worldKey] = {
      ...existingWorldProgress,
      unlocked: true,
      completed: isWorldCompleted,
      currentStage: nextStage,
      completedStages: newCompletedStages,
      defeatedEnemies: newDefeatedEnemies,
      bestScores: newBestScores,
      firstClearClaimed: newFirstClearClaimed,
    }
  }

  // 2. Calculate XP earned
  const xpResult = calculateBattleXp({
    victory,
    enemyLevel: enemy.level,
    wpm: finalStats.battleWpm,
    accuracy: finalStats.battleAccuracy,
    totalErrors: finalStats.totalErrors,
    bestCombo: finalStats.bestCombo,
    baseXpOverride: enemy.xpReward,
    firstClearBonus,
  })

  // 3. Apply Level progression and XP overflow
  const prevLevel = currentProfile.level
  const prevXp = currentProfile.xp
  const levelResult = applyXpGain(prevLevel, prevXp, xpResult.totalXp)

  // 4. Update lifetime player stats
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
    bestWpm: Math.max(currentProfile.stats.bestWpm, finalStats.battleWpm),
    bestCombo: Math.max(currentProfile.stats.bestCombo, finalStats.bestCombo),
    enemiesDefeated: currentProfile.stats.enemiesDefeated + (victory ? 1 : 0),
    averageWpm: newAverageWpm,
    averageAccuracy: newAverageAccuracy,
  }

  // 5. Recalculate performance ratings and rank
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
    campaignProgress: updatedCampaignProgress,
    achievements: updatedAchievements,
    updatedAt: new Date().toISOString(),
  }

  // 6. Persist to storage
  savePlayerProfile(updatedProfile)

  // 7. Record into persistent battle history
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
    isFirstClear,
    firstClearBonusXp: firstClearBonus > 0 ? firstClearBonus : undefined,
    campaignCompleted,
    stageUnlocked,
  }
}
