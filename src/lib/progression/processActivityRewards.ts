import { TypingStats } from "@/types/typing"
import { AcademyLessonProgress, PlayerProfile, PlayerRank, PlayerStats } from "@/types/player"
import { loadPlayerProfile, savePlayerProfile } from "@/lib/storage/playerStorage"
import { getStoredUser } from "@/lib/auth/authService"
import { saveCloudPlayerProfile } from "@/lib/storage/cloudPlayerStorage"
import { calculateAcademyXp, calculateTrainingXp } from "./calculateXp"
import { applyXpGain, LevelProgressionResult } from "./calculateLevel"
import { calculatePlayerAttributes } from "./calculateAttributes"
import { calculateRankFromAttributes, isRankUp } from "./calculateRank"

export interface ActivityRewardSummary {
  xpGained: number
  levelResult: LevelProgressionResult
  prevLevel: number
  newLevel: number
  didLevelUp: boolean
  levelsGained: number
  prevRank: PlayerRank
  newRank: PlayerRank
  didRankUp: boolean
  updatedProfile: PlayerProfile
}

/**
 * Processes rewards for completing a Weak Key Training session.
 * Increments trainingSessions, rewards training XP, updates technique attribute.
 */
export function processTrainingRewards(
  stats: TypingStats,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _targetKeys?: string[]
): ActivityRewardSummary {
  const currentProfile = loadPlayerProfile()

  const xpGained = calculateTrainingXp(stats.battleAccuracy, 5)
  const prevLevel = currentProfile.level
  const prevXp = currentProfile.xp
  const levelResult = applyXpGain(prevLevel, prevXp, xpGained)

  const updatedStats: PlayerStats = {
    ...currentProfile.stats,
    trainingSessions: currentProfile.stats.trainingSessions + 1,
    totalCharactersTyped:
      currentProfile.stats.totalCharactersTyped + stats.totalTypingAttempts,
    totalCorrectCharacters:
      currentProfile.stats.totalCorrectCharacters + stats.totalCorrectCharacters,
    totalErrors: currentProfile.stats.totalErrors + stats.totalErrors,
    bestWpm: Math.max(currentProfile.stats.bestWpm, stats.battleWpm || stats.currentWpm),
    bestCombo: Math.max(currentProfile.stats.bestCombo, stats.bestCombo),
  }

  const newAttributes = calculatePlayerAttributes(updatedStats)
  const prevRank = currentProfile.rank
  const newRank = calculateRankFromAttributes(newAttributes)
  const didRankUp = isRankUp(prevRank, newRank)

  const updatedProfile: PlayerProfile = {
    ...currentProfile,
    level: levelResult.newLevel,
    xp: levelResult.newXp,
    totalXp: currentProfile.totalXp + xpGained,
    rank: newRank,
    attributes: newAttributes,
    stats: updatedStats,
    updatedAt: new Date().toISOString(),
  }

  savePlayerProfile(updatedProfile)

  const authUser = getStoredUser()
  if (authUser && !authUser.isGuest && authUser.id) {
    saveCloudPlayerProfile(authUser.id, updatedProfile).catch((err) =>
      console.warn("[TrainingRewards] Failed to sync profile to cloud:", err)
    )
  }

  return {
    xpGained,
    levelResult,
    prevLevel,
    newLevel: levelResult.newLevel,
    didLevelUp: levelResult.didLevelUp,
    levelsGained: levelResult.levelsGained,
    prevRank,
    newRank,
    didRankUp,
    updatedProfile,
  }
}

/**
 * Processes rewards for completing an Academy Lesson.
 * Awards major XP for first 95%+ completion, tracks lesson completion in academyProgress,
 * increments academyLessonsCompleted and updates technique attribute.
 */
export function processAcademyLessonRewards(
  lessonId: string,
  stats: TypingStats
): ActivityRewardSummary {
  const currentProfile = loadPlayerProfile()

  const prevProgress = currentProfile.academyProgress?.[lessonId]
  const wasCompleted = prevProgress?.completed ?? false
  const isPassed = stats.battleAccuracy >= 95
  const isFirstCompletion = !wasCompleted && isPassed

  const xpGained = calculateAcademyXp(isFirstCompletion, stats.battleAccuracy)
  const prevLevel = currentProfile.level
  const prevXp = currentProfile.xp
  const levelResult = applyXpGain(prevLevel, prevXp, xpGained)

  const newProgress: AcademyLessonProgress = {
    completed: wasCompleted || isPassed,
    attempts: (prevProgress?.attempts ?? 0) + 1,
    bestAccuracy: Math.max(prevProgress?.bestAccuracy ?? 0, stats.battleAccuracy),
    bestWpm: Math.max(prevProgress?.bestWpm ?? 0, stats.battleWpm || stats.currentWpm),
    lastCompletedAt: isPassed ? new Date().toISOString() : prevProgress?.lastCompletedAt,
  }

  const updatedAcademyProgress = {
    ...(currentProfile.academyProgress ?? {}),
    [lessonId]: newProgress,
  }

  const newLessonsCompleted =
    currentProfile.stats.academyLessonsCompleted + (isFirstCompletion ? 1 : 0)

  const updatedStats: PlayerStats = {
    ...currentProfile.stats,
    academyLessonsCompleted: newLessonsCompleted,
    totalCharactersTyped:
      currentProfile.stats.totalCharactersTyped + stats.totalTypingAttempts,
    totalCorrectCharacters:
      currentProfile.stats.totalCorrectCharacters + stats.totalCorrectCharacters,
    totalErrors: currentProfile.stats.totalErrors + stats.totalErrors,
    bestWpm: Math.max(currentProfile.stats.bestWpm, stats.battleWpm || stats.currentWpm),
    bestCombo: Math.max(currentProfile.stats.bestCombo, stats.bestCombo),
  }

  const newAttributes = calculatePlayerAttributes(updatedStats)
  const prevRank = currentProfile.rank
  const newRank = calculateRankFromAttributes(newAttributes)
  const didRankUp = isRankUp(prevRank, newRank)

  const updatedProfile: PlayerProfile = {
    ...currentProfile,
    level: levelResult.newLevel,
    xp: levelResult.newXp,
    totalXp: currentProfile.totalXp + xpGained,
    rank: newRank,
    attributes: newAttributes,
    stats: updatedStats,
    academyProgress: updatedAcademyProgress,
    updatedAt: new Date().toISOString(),
  }

  savePlayerProfile(updatedProfile)

  const authUser = getStoredUser()
  if (authUser && !authUser.isGuest && authUser.id) {
    saveCloudPlayerProfile(authUser.id, updatedProfile).catch((err) =>
      console.warn("[AcademyRewards] Failed to sync profile to cloud:", err)
    )
  }

  return {
    xpGained,
    levelResult,
    prevLevel,
    newLevel: levelResult.newLevel,
    didLevelUp: levelResult.didLevelUp,
    levelsGained: levelResult.levelsGained,
    prevRank,
    newRank,
    didRankUp,
    updatedProfile,
  }
}
