import { MultiplayerMatchRow } from "@/types/database"
import {
  PlayerProfile,
  PlayerRank,
  createDefaultMultiplayerStats,
} from "@/types/player"
import { loadPlayerProfile, savePlayerProfile } from "@/lib/storage/playerStorage"
import { saveCloudPlayerProfile } from "@/lib/storage/cloudPlayerStorage"
import { getStoredUser } from "@/lib/auth/authService"
import { addCratesDirectly, addShardsDirectly } from "@/lib/storage/cosmeticsStorage"
import { updateCrateCloud, updateShardsCloud } from "@/lib/storage/cloudCosmeticsStorage"
import { applyXpGain } from "@/lib/progression/calculateLevel"
import { calculatePlayerAttributes } from "@/lib/progression/calculateAttributes"
import { calculateRankFromAttributes, isRankUp } from "@/lib/progression/calculateRank"

export interface MultiplayerRewardSummary {
  baseXp: number
  bonusXp: number
  totalXp: number
  prevLevel: number
  newLevel: number
  prevXp: number
  newXp: number
  prevRank: PlayerRank
  newRank: PlayerRank
  didLevelUp: boolean
  didRankUp: boolean
  awardedCrate?: { crateId: string; name: string } | null
  shardsAwarded: number
  updatedProfile: PlayerProfile
}

// In-memory idempotency guard
const processedMatchIds = new Set<string>()

/**
 * Processes multiplayer match rewards, updates player profile stats,
 * and synchronizes to local storage and Supabase Cloud Save.
 * Idempotent per matchId.
 */
export function processMultiplayerRewards(
  match: MultiplayerMatchRow,
  currentUserId: string,
  myWpm: number,
  myAccuracy: number,
  myCombo: number
): MultiplayerRewardSummary | null {
  if (!match.id || processedMatchIds.has(match.id)) {
    return null
  }

  // Cancelled, waiting or invalid matches award 0 rewards
  if (match.status === "cancelled" || match.status === "waiting") {
    return null
  }

  // Anti-farm protection: matches under 5 seconds or with fewer than 3 words completed award no rewards
  const matchDuration = match.started_at && match.finished_at
    ? (new Date(match.finished_at).getTime() - new Date(match.started_at).getTime()) / 1000
    : 10
  const myCompletedWords = match.player_1_id === currentUserId ? match.player_1_word_index : match.player_2_word_index
  if (matchDuration < 5 || myCompletedWords < 3) {
    return null
  }

  // Private match anti-farm protection: private matches lasting under 6 seconds award 0 XP
  if (match.mode === "private" && (matchDuration < 6 || myCompletedWords < 5)) {
    return null
  }

  // Double check localStorage to avoid double-crediting across page reloads
  const storageGuardKey = `keyforge_mp_reward_${match.id}`
  if (typeof window !== "undefined" && localStorage.getItem(storageGuardKey)) {
    processedMatchIds.add(match.id)
    return null
  }

  processedMatchIds.add(match.id)
  if (typeof window !== "undefined") {
    localStorage.setItem(storageGuardKey, new Date().toISOString())
  }

  const currentProfile = loadPlayerProfile()
  const isP1 = match.player_1_id === currentUserId
  const isWinner = match.winner_id === currentUserId
  const isDraw = match.is_draw

  const myHp = isP1 ? match.player_1_hp : match.player_2_hp
  const oppHp = isP1 ? match.player_2_hp : match.player_1_hp

  // 1. Authoritative Base XP
  let baseXp = 40
  if (isWinner) {
    baseXp = 120
  } else if (isDraw) {
    baseXp = 75
  }

  // 2. Performance Bonuses
  let bonusXp = 0
  if (myAccuracy >= 95) bonusXp += 15
  if (myWpm >= 70) bonusXp += 15
  if (isWinner && oppHp <= 0 && myHp >= 700) bonusXp += 25 // Flawless knockout

  const prevMpStats = currentProfile.multiplayerStats || createDefaultMultiplayerStats()
  const currentStreak = isWinner ? (prevMpStats.currentWinStreak || 0) + 1 : 0
  if (currentStreak >= 3) bonusXp += 20 // Win streak bonus

  const totalXp = baseXp + bonusXp

  // 3. Update Multiplayer Stats
  const matchesPlayed = (prevMpStats.matchesPlayed || 0) + 1
  const wins = isWinner ? (prevMpStats.wins || 0) + 1 : (prevMpStats.wins || 0)
  const losses = !isWinner && !isDraw ? (prevMpStats.losses || 0) + 1 : (prevMpStats.losses || 0)
  const winRate = matchesPlayed > 0 ? Math.round((wins / matchesPlayed) * 100) : 0
  const bestWpm = Math.max(prevMpStats.bestWpm || 0, myWpm)
  const bestCombo = Math.max(prevMpStats.bestCombo || 0, myCombo)
  const bestWinStreak = Math.max(prevMpStats.bestWinStreak || 0, currentStreak)

  const updatedMpStats = {
    matchesPlayed,
    wins,
    losses,
    winRate,
    bestWpm,
    bestCombo,
    currentWinStreak: currentStreak,
    bestWinStreak,
  }

  // 4. Update General Typing Stats
  const updatedStats = {
    ...currentProfile.stats,
    battlesPlayed: (currentProfile.stats.battlesPlayed || 0) + 1,
    battlesWon: isWinner ? (currentProfile.stats.battlesWon || 0) + 1 : (currentProfile.stats.battlesWon || 0),
    battlesLost: !isWinner && !isDraw ? (currentProfile.stats.battlesLost || 0) + 1 : (currentProfile.stats.battlesLost || 0),
    bestWpm: Math.max(currentProfile.stats.bestWpm || 0, myWpm),
    bestCombo: Math.max(currentProfile.stats.bestCombo || 0, myCombo),
  }

  // 5. Level & Rank Progression
  const prevLevel = currentProfile.level
  const prevXp = currentProfile.xp
  const prevRank = currentProfile.rank

  const levelResult = applyXpGain(prevLevel, prevXp, totalXp)
  const updatedAttributes = calculatePlayerAttributes(updatedStats)
  const newRank = calculateRankFromAttributes(updatedAttributes)
  const didRankUp = isRankUp(prevRank, newRank)

  // 6. Crate & Forge Shards Rewards
  let awardedCrate: { crateId: string; name: string } | null = null
  let shardsAwarded = 0

  if (isWinner) {
    // 35% chance for a crate on victory (Quick match only - private rooms never drop crates to prevent collusion farming)
    const dropRoll = Math.random()
    if (match.mode !== "private" && dropRoll < 0.35) {
      if (currentStreak >= 3) {
        awardedCrate = { crateId: "shinobi_crate", name: "Shinobi Secret Crate" }
      } else {
        awardedCrate = { crateId: "basic_crate", name: "Basic Forged Crate" }
      }
    } else {
      shardsAwarded = 25
    }
  } else {
    shardsAwarded = 15 // Consolation forge shards
  }

  // 7. Save Profile
  const now = new Date().toISOString()
  const updatedProfile: PlayerProfile = {
    ...currentProfile,
    level: levelResult.newLevel,
    xp: levelResult.newXp,
    totalXp: (currentProfile.totalXp || 0) + totalXp,
    rank: newRank,
    attributes: updatedAttributes,
    stats: updatedStats,
    multiplayerStats: updatedMpStats,
    updatedAt: now,
  }

  savePlayerProfile(updatedProfile)

  // 8. Synchronize with Cloud Save & Cosmetics Storage
  const user = getStoredUser()
  if (user && !user.isGuest) {
    saveCloudPlayerProfile(user.id, updatedProfile).catch((err) => {
      console.warn("[MultiplayerRewards] Failed to sync profile to cloud:", err)
    })
  }

  if (awardedCrate) {
    try {
      addCratesDirectly(awardedCrate.crateId, 1)
      if (user && !user.isGuest) {
        updateCrateCloud(user.id, awardedCrate.crateId, 1).catch(() => {})
      }
    } catch (err) {
      console.warn("[MultiplayerRewards] Failed to credit crate:", err)
    }
  }

  if (shardsAwarded > 0) {
    try {
      addShardsDirectly(shardsAwarded)
      if (user && !user.isGuest) {
        updateShardsCloud(user.id, shardsAwarded).catch(() => {})
      }
    } catch (err) {
      console.warn("[MultiplayerRewards] Failed to credit shards:", err)
    }
  }

  return {
    baseXp,
    bonusXp,
    totalXp,
    prevLevel,
    newLevel: levelResult.newLevel,
    prevXp,
    newXp: levelResult.newXp,
    prevRank,
    newRank,
    didLevelUp: levelResult.didLevelUp,
    didRankUp,
    awardedCrate,
    shardsAwarded,
    updatedProfile,
  }
}
