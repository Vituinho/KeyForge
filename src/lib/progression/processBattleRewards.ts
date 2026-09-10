import { Enemy } from "@/types/character"
import { BattleResult as BattleResultType } from "@/types/battle"
import {
  PlayerProfile,
  PlayerRank,
  PlayerStats,
  CampaignWorldProgress,
  createDefaultNarutoWorldProgress,
  syncCampaignSummary,
} from "@/types/player"
import { loadPlayerProfile, savePlayerProfile } from "@/lib/storage/playerStorage"
import { addBattleHistoryEntry } from "@/lib/storage/battleHistoryStorage"
import { getStoredUser } from "@/lib/auth/authService"
import { saveCloudPlayerProfile, saveCloudBattleHistory } from "@/lib/storage/cloudPlayerStorage"
import { addCratesDirectly } from "@/lib/storage/cosmeticsStorage"
import { updateCrateCloud } from "@/lib/storage/cloudCosmeticsStorage"
import { calculateBattleXp, BattleXpResult } from "./calculateXp"
import { applyXpGain, LevelProgressionResult } from "./calculateLevel"
import { calculatePlayerAttributes } from "./calculateAttributes"
import { calculateRankFromAttributes, isRankUp } from "./calculateRank"
import { getStageByEnemyId, getWorldById, ANIME_WORLD_ORDER } from "@/data/worlds"
import { AnimeWorldId } from "@/types/world"

export interface AwardedCrateReward {
  crateId: string
  count: number
  reason: string
}

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
  campaignMastered?: boolean
  stageUnlocked?: number
  unlockedTitle?: string
  awardedCrates?: AwardedCrateReward[]
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
  let worldBonusXp = 0
  let campaignCompleted = false
  let campaignMastered = false
  let stageUnlocked: number | undefined = undefined
  let unlockedTitle: string | undefined = undefined
  const awardedCrates: AwardedCrateReward[] = []

  const updatedCampaignProgress: Record<string, CampaignWorldProgress> = {
    ...(currentProfile.campaignProgress ?? {}),
  }

  const updatedAchievements = [...(currentProfile.achievements ?? [])]
  const updatedTitles = [...(currentProfile.titles ?? [])]
  let currentTitle = currentProfile.title

  if (victory && enemy.world) {
    const worldKey = enemy.world as AnimeWorldId
    const stageLookup = getStageByEnemyId(enemy.id)
    const worldConfig = stageLookup?.world ?? getWorldById(worldKey)
    const stageConfig =
      stageLookup?.stage ??
      worldConfig?.stages.find(
        (s) => s.id === enemy.id || s.enemyId === enemy.id || s.stageNumber === enemy.stage
      )

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
      firstClearBonus =
        stageConfig?.firstClearRewards?.bonusXp ?? enemy.firstClearBonusXp ?? 0

      // Stage first clear crate reward
      if (stageConfig?.firstClearRewards?.crateId) {
        awardedCrates.push({
          crateId: stageConfig.firstClearRewards.crateId,
          count: 1,
          reason: `${enemy.name} First Clear`,
        })
      }

      // Stage first clear title reward
      if (stageConfig?.firstClearRewards?.title) {
        const stageTitle = stageConfig.firstClearRewards.title
        if (!updatedTitles.includes(stageTitle)) {
          updatedTitles.push(stageTitle)
          unlockedTitle = stageTitle
          currentTitle = stageTitle
        }
      }
    }

    const newFirstClearClaimed = {
      ...existingWorldProgress.firstClearClaimed,
      [enemy.id]: true,
    }

    // Stage progression
    const stageNum = enemy.stage ?? stageConfig?.stageNumber ?? 1
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

    // Calculate mastery stars for this stage (1 to 3 stars)
    let stageStars = 1 // Star 1: Completed victory
    const accTarget =
      stageConfig?.masteryObjectives?.[1]?.minAccuracy ?? stageConfig?.recommendedAccuracy ?? 90
    if (finalStats.battleAccuracy >= accTarget) stageStars += 1
    const wpmTarget =
      stageConfig?.masteryObjectives?.[2]?.minWpm ?? stageConfig?.recommendedWpm ?? 30
    if (finalStats.battleWpm >= wpmTarget) stageStars += 1

    // Best scores update
    const prevBest = existingWorldProgress.bestScores?.[enemy.id]
    const bestStars = Math.max(prevBest?.stars ?? 0, stageStars)
    const newBestScores = {
      ...existingWorldProgress.bestScores,
      [enemy.id]: {
        bestWpm: Math.max(prevBest?.bestWpm ?? 0, finalStats.battleWpm),
        bestAccuracy: Math.max(prevBest?.bestAccuracy ?? 0, finalStats.battleAccuracy),
        bestCombo: Math.max(prevBest?.bestCombo ?? 0, finalStats.bestCombo),
        completedAt: new Date().toISOString(),
        stars: bestStars,
      },
    }

    // Calculate total stars earned across world stages
    let totalWorldStars = 0
    for (const score of Object.values(newBestScores)) {
      totalWorldStars += score.stars ?? 1
    }

    // Check boss defeat & campaign completion
    const isBossCleared = enemy.isBoss === true || stageNum >= (worldConfig?.stages.length ?? 8)
    const isWorldCompleted = existingWorldProgress.completed || isBossCleared

    if (isBossCleared) {
      campaignCompleted = true
      const completionAchievement = `${worldKey}_world_completed`
      if (!updatedAchievements.includes(completionAchievement)) {
        updatedAchievements.push(completionAchievement)
      }

      // Claim world completion rewards if not yet claimed
      if (!existingWorldProgress.claimedWorldReward && worldConfig?.completionReward) {
        if (worldConfig.completionReward.title) {
          const compTitle = worldConfig.completionReward.title
          if (!updatedTitles.includes(compTitle)) {
            updatedTitles.push(compTitle)
            unlockedTitle = compTitle
            currentTitle = compTitle
          }
        }
        if (worldConfig.completionReward.crateId) {
          awardedCrates.push({
            crateId: worldConfig.completionReward.crateId,
            count: 1,
            reason: `${worldConfig.series} World Completion`,
          })
        }
        if (worldConfig.completionReward.xp) {
          worldBonusXp += worldConfig.completionReward.xp
        }
      }

      // Unlock next world in progression sequence
      const worldIndex = ANIME_WORLD_ORDER.indexOf(worldKey)
      if (worldIndex >= 0 && worldIndex < ANIME_WORLD_ORDER.length - 1) {
        const nextWorldId = ANIME_WORLD_ORDER[worldIndex + 1]
        if (!updatedCampaignProgress[nextWorldId]) {
          updatedCampaignProgress[nextWorldId] = {
            unlocked: true,
            completed: false,
            currentStage: 1,
            completedStages: [],
            defeatedEnemies: [],
            bestScores: {},
            firstClearClaimed: {},
          }
        } else {
          updatedCampaignProgress[nextWorldId] = {
            ...updatedCampaignProgress[nextWorldId],
            unlocked: true,
          }
        }
      }
    }

    // Check world mastery (all stages cleared with high stars >= 95% of max)
    const totalPossibleStars = (worldConfig?.stages.length ?? 8) * 3
    const isWorldMastered =
      existingWorldProgress.mastered ||
      (isWorldCompleted && totalWorldStars >= Math.floor(totalPossibleStars * 0.95))

    if (isWorldMastered) {
      campaignMastered = true
      const masteryAchievement = `${worldKey}_world_mastered`
      if (!updatedAchievements.includes(masteryAchievement)) {
        updatedAchievements.push(masteryAchievement)
      }

      // Claim world mastery rewards if not yet claimed
      if (!existingWorldProgress.claimedMasteryReward && worldConfig?.masteryReward) {
        if (worldConfig.masteryReward.title) {
          const mastTitle = worldConfig.masteryReward.title
          if (!updatedTitles.includes(mastTitle)) {
            updatedTitles.push(mastTitle)
            unlockedTitle = mastTitle
            currentTitle = mastTitle
          }
        }
        if (worldConfig.masteryReward.crateId) {
          awardedCrates.push({
            crateId: worldConfig.masteryReward.crateId,
            count: 1,
            reason: `${worldConfig.series} World Mastery`,
          })
        }
        if (worldConfig.masteryReward.xp) {
          worldBonusXp += worldConfig.masteryReward.xp
        }
      }
    }

    updatedCampaignProgress[worldKey] = {
      ...existingWorldProgress,
      unlocked: true,
      completed: isWorldCompleted,
      mastered: isWorldMastered,
      currentStage: nextStage,
      completedStages: newCompletedStages,
      defeatedEnemies: newDefeatedEnemies,
      bestScores: newBestScores,
      firstClearClaimed: newFirstClearClaimed,
      claimedWorldReward: existingWorldProgress.claimedWorldReward || isWorldCompleted,
      claimedMasteryReward: existingWorldProgress.claimedMasteryReward || isWorldMastered,
      masteryStars: totalWorldStars,
    }
  }

  // 2. Track weak keys from battle
  const updatedKeyErrors: Record<string, number> = {
    ...(currentProfile.keyErrors ?? {}),
  }
  if (result.weakKeys && result.weakKeys.length > 0) {
    for (const wk of result.weakKeys) {
      if (wk.key) {
        const k = wk.key.toLowerCase()
        updatedKeyErrors[k] = (updatedKeyErrors[k] ?? 0) + (wk.errors || 1)
      }
    }
  }

  // 3. Calculate XP earned
  const totalFirstClearAndBonusXp = firstClearBonus + worldBonusXp
  const xpResult = calculateBattleXp({
    victory,
    enemyLevel: enemy.level,
    wpm: finalStats.battleWpm,
    accuracy: finalStats.battleAccuracy,
    totalErrors: finalStats.totalErrors,
    bestCombo: finalStats.bestCombo,
    baseXpOverride: enemy.xpReward,
    firstClearBonus: totalFirstClearAndBonusXp,
  })

  // 4. Apply Level progression and XP overflow
  const prevLevel = currentProfile.level
  const prevXp = currentProfile.xp
  const levelResult = applyXpGain(prevLevel, prevXp, xpResult.totalXp)

  // 5. Update lifetime player stats
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

  // 6. Recalculate performance ratings and rank
  const newAttributes = calculatePlayerAttributes(updatedStats)
  const prevRank = currentProfile.rank
  const newRank = calculateRankFromAttributes(newAttributes)
  const didRankUp = isRankUp(prevRank, newRank)

  const updatedProfile: PlayerProfile = syncCampaignSummary({
    ...currentProfile,
    level: levelResult.newLevel,
    xp: levelResult.newXp,
    totalXp: currentProfile.totalXp + xpResult.totalXp,
    rank: newRank,
    attributes: newAttributes,
    stats: updatedStats,
    campaignProgress: updatedCampaignProgress,
    keyErrors: updatedKeyErrors,
    achievements: updatedAchievements,
    title: currentTitle,
    titles: updatedTitles,
    updatedAt: new Date().toISOString(),
  })

  // 7. Persist to storage
  savePlayerProfile(updatedProfile)

  // 8. Record into persistent battle history
  const historyEntry = addBattleHistoryEntry({
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

  // 9. Asynchronous Cloud Synchronization (non-blocking for animations)
  const authUser = getStoredUser()
  if (authUser && !authUser.isGuest && authUser.id) {
    saveCloudPlayerProfile(authUser.id, updatedProfile).catch((err) =>
      console.warn("[BattleRewards] Failed to sync profile to cloud:", err)
    )
    const weakKeyStrings = result.weakKeys?.map((w) => w.key) ?? []
    saveCloudBattleHistory(authUser.id, historyEntry, weakKeyStrings).catch((err) =>
      console.warn("[BattleRewards] Failed to sync battle history to cloud:", err)
    )
  }

  // 10. Crate Milestone Rewards (Cosmetics Progression)
  if (victory) {
    if (isFirstClear) {
      const stageNum = enemy.stage ?? 1
      if (stageNum === 2) {
        awardedCrates.push({ crateId: "basic_crate", count: 1, reason: "Stage 2 First Clear" })
      } else if (stageNum === 4) {
        awardedCrates.push({ crateId: "shinobi_crate", count: 1, reason: "Stage 4 First Clear" })
      } else if (stageNum === 6) {
        awardedCrates.push({ crateId: "shinobi_crate", count: 1, reason: "Stage 6 First Clear" })
      }
      if (enemy.isBoss || stageNum >= 8) {
        awardedCrates.push({ crateId: "elite_crate", count: 1, reason: "Boss Defeat First Clear" })
      }
    }

    // Level milestones crossed
    if (levelResult.newLevel > prevLevel) {
      if (prevLevel < 5 && levelResult.newLevel >= 5) {
        awardedCrates.push({ crateId: "basic_crate", count: 1, reason: "Reached Level 5" })
      }
      if (prevLevel < 10 && levelResult.newLevel >= 10) {
        awardedCrates.push({ crateId: "shinobi_crate", count: 1, reason: "Reached Level 10" })
      }
      if (prevLevel < 20 && levelResult.newLevel >= 20) {
        awardedCrates.push({ crateId: "elite_crate", count: 1, reason: "Reached Level 20" })
      }
      if (prevLevel < 30 && levelResult.newLevel >= 30) {
        awardedCrates.push({ crateId: "mythic_crate", count: 1, reason: "Reached Level 30" })
      }
    }
  }

  // Grant crates locally and queue cloud sync
  if (awardedCrates.length > 0) {
    for (const reward of awardedCrates) {
      const updatedCosmetics = addCratesDirectly(reward.crateId, reward.count)
      if (authUser && !authUser.isGuest && authUser.id) {
        const newTotal = updatedCosmetics.crates[reward.crateId] || 0
        updateCrateCloud(authUser.id, reward.crateId, newTotal).catch((err) =>
          console.warn("[BattleRewards] Failed to sync crate to cloud:", err)
        )
      }
    }
  }

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
    campaignMastered,
    stageUnlocked,
    unlockedTitle,
    awardedCrates: awardedCrates.length > 0 ? awardedCrates : undefined,
  }
}
