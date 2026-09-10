import {
  AnimeWorld,
  AnimeWorldId,
  WorldStage,
  WorldStatus,
  WorldProgressSummary,
} from "@/types/world"
import { PlayerProfile } from "@/types/player"
import { NARUTO_WORLD } from "./naruto"
import { JUJUTSU_WORLD } from "./jujutsu"
import { DRAGON_WORLD } from "./dragon"
import { PIRATE_WORLD } from "./pirate"
import { HUNTER_WORLD } from "./hunter"

// Ordered progression list of all 7 Anime Worlds
export const ANIME_WORLD_ORDER: AnimeWorldId[] = [
  "naruto",
  "jujutsu",
  "dragon",
  "pirate",
  "hunter",
  "demon",
  "nexus",
]

// Registry map of all anime worlds
export const WORLD_REGISTRY: Record<AnimeWorldId, AnimeWorld> = {
  naruto: NARUTO_WORLD,
  jujutsu: JUJUTSU_WORLD,
  dragon: DRAGON_WORLD,
  pirate: PIRATE_WORLD,
  hunter: HUNTER_WORLD,
  demon: {
    id: "demon",
    order: 6,
    nameKey: "animeWorld.worlds.demon.name",
    series: "Demon Slayer",
    descriptionKey: "animeWorld.worlds.demon.desc",
    taglineKey: "animeWorld.worlds.demon.tagline",
    theme: {
      primaryColor: "#ef4444",
      secondaryColor: "#dc2626",
      accentColor: "#f97316",
      glowColor: "rgba(239, 68, 68, 0.4)",
      bgGradient: "from-red-950/40 via-neutral-950/80 to-black",
      cardGradient: "from-red-500/20 via-neutral-900/90 to-neutral-950",
      badgeClass: "bg-red-500/10 text-red-400 border-red-500/30",
      borderClass: "border-red-500/30 hover:border-red-500/60",
    },
    focus: "touch-typing",
    focusKey: "animeWorld.focus.touchTyping",
    baseDifficulty: 8,
    unlockRequirement: {
      previousWorldId: "hunter",
      requiredStagesCleared: 8,
      descriptionKey: "animeWorld.unlock.defeatHunterBoss",
    },
    stages: [],
    completionReward: {
      xp: 1750,
      title: "HASHIRA BLADE",
      crateId: "crate_divine_celestial",
      badgeKey: "animeWorld.badges.demonChampion",
    },
    masteryReward: {
      xp: 3500,
      title: "SUN BREATHING MASTER",
      crateId: "crate_divine_celestial",
      badgeKey: "animeWorld.badges.demonMaster",
    },
  },
  nexus: {
    id: "nexus",
    order: 7,
    nameKey: "animeWorld.worlds.nexus.name",
    series: "KeyForge Original",
    descriptionKey: "animeWorld.worlds.nexus.desc",
    taglineKey: "animeWorld.worlds.nexus.tagline",
    theme: {
      primaryColor: "#f97316",
      secondaryColor: "#eab308",
      accentColor: "#a855f7",
      glowColor: "rgba(249, 115, 22, 0.5)",
      bgGradient: "from-amber-950/50 via-purple-950/30 to-black",
      cardGradient: "from-orange-500/25 via-purple-900/30 to-neutral-950",
      badgeClass: "bg-gradient-to-r from-orange-500/20 to-purple-500/20 text-orange-300 border-orange-500/40",
      borderClass: "border-orange-500/40 hover:border-orange-400",
    },
    focus: "mastery",
    focusKey: "animeWorld.focus.mastery",
    baseDifficulty: 10,
    unlockRequirement: {
      previousWorldId: "demon",
      requiredStagesCleared: 8,
      descriptionKey: "animeWorld.unlock.defeatDemonBoss",
    },
    stages: [],
    completionReward: {
      xp: 2500,
      title: "KEYFORGE MASTER",
      crateId: "crate_divine_celestial",
      badgeKey: "animeWorld.badges.nexusChampion",
    },
    masteryReward: {
      xp: 5000,
      title: "FORGED LEGEND",
      crateId: "crate_divine_celestial",
      badgeKey: "animeWorld.badges.nexusMaster",
    },
  },
}

/**
 * Returns all anime worlds sorted by canonical progression order.
 */
export function getAllWorlds(): AnimeWorld[] {
  return ANIME_WORLD_ORDER.map((id) => WORLD_REGISTRY[id]).filter(Boolean)
}

/**
 * Retrieves a specific world configuration by ID.
 */
export function getWorldById(worldId: string): AnimeWorld | undefined {
  if (!worldId) return undefined
  return WORLD_REGISTRY[worldId as AnimeWorldId]
}

/**
 * Retrieves a specific stage configuration by world and stage ID.
 */
export function getStageById(
  worldId: string,
  stageId: string
): WorldStage | undefined {
  const world = getWorldById(worldId)
  if (!world) return undefined
  return world.stages.find((s) => s.id === stageId || s.enemyId === stageId)
}

/**
 * Finds which world and stage contains a given enemy ID.
 */
export function getStageByEnemyId(
  enemyId: string
): { world: AnimeWorld; stage: WorldStage } | undefined {
  for (const world of getAllWorlds()) {
    const stage = world.stages.find(
      (s) => s.enemyId === enemyId || s.id === enemyId
    )
    if (stage) {
      return { world, stage }
    }
  }
  return undefined
}

/**
 * Determines whether an anime world is unlocked for the current player.
 * Naruto World is always unlocked. Subsequent worlds unlock when the previous
 * world's final boss is defeated or if explicitly marked unlocked in saved state.
 */
export function isWorldUnlocked(
  worldId: AnimeWorldId,
  profile: PlayerProfile
): boolean {
  if (worldId === "naruto") return true

  const worldProgress = profile?.campaignProgress?.[worldId]
  if (worldProgress?.unlocked) return true

  const world = WORLD_REGISTRY[worldId]
  if (!world || !world.unlockRequirement.previousWorldId) return false

  const prevWorldId = world.unlockRequirement.previousWorldId
  const prevProgress = profile?.campaignProgress?.[prevWorldId]
  if (!prevProgress) return false

  // If previous world was marked completed, or its final boss was defeated
  if (prevProgress.completed) return true

  // Check required stages count if defined
  const reqStages = world.unlockRequirement.requiredStagesCleared ?? 8
  return (prevProgress.completedStages?.length ?? 0) >= reqStages
}

/**
 * Calculates current progress summary and status for a world.
 */
export function getWorldProgress(
  worldId: AnimeWorldId,
  profile: PlayerProfile
): WorldProgressSummary {
  const world = WORLD_REGISTRY[worldId]
  const stages = world?.stages ?? []
  const totalStages = Math.max(stages.length, 8)
  const savedProgress = profile?.campaignProgress?.[worldId]

  const unlocked = isWorldUnlocked(worldId, profile)
  const completedStages = savedProgress?.completedStages ?? []
  const stagesClearedCount = completedStages.length
  const progressPercent = Math.min(
    100,
    Math.round((stagesClearedCount / totalStages) * 100)
  )

  const isCompleted = Boolean(savedProgress?.completed || stagesClearedCount >= totalStages)

  let bestWpm = 0
  let bestAccuracy = 0
  let masteryStarsCount = 0

  if (savedProgress?.bestScores) {
    for (const score of Object.values(savedProgress.bestScores)) {
      if (score.bestWpm > bestWpm) bestWpm = score.bestWpm
      if (score.bestAccuracy > bestAccuracy) bestAccuracy = score.bestAccuracy
    }
  }

  // Calculate mastery stars (up to 3 per stage)
  stages.forEach((stage) => {
    const score = savedProgress?.bestScores?.[stage.id]
    if (score) {
      // Star 1: Cleared
      masteryStarsCount += 1
      // Star 2: Accuracy target
      const accTarget = stage.masteryObjectives?.[1]?.minAccuracy ?? stage.recommendedAccuracy
      if (score.bestAccuracy >= accTarget) masteryStarsCount += 1
      // Star 3: WPM or Combo target
      const wpmTarget = stage.masteryObjectives?.[2]?.minWpm ?? stage.recommendedWpm
      if (score.bestWpm >= wpmTarget) masteryStarsCount += 1
    }
  })

  const totalMasteryStars = totalStages * 3
  const isMastered = isCompleted && masteryStarsCount >= totalMasteryStars * 0.95

  let status: WorldStatus = "locked"
  if (isMastered) {
    status = "mastered"
  } else if (isCompleted) {
    status = "completed"
  } else if (unlocked) {
    status = "available"
  }

  return {
    worldId,
    status,
    unlocked,
    completed: isCompleted,
    mastered: isMastered,
    currentStageNumber: savedProgress?.currentStage ?? 1,
    totalStages,
    stagesClearedCount,
    progressPercent,
    bestWpm,
    bestAccuracy,
    masteryStarsCount,
    totalMasteryStars,
  }
}

/**
 * Returns the recommended next stage for the player across the campaign.
 */
export function getRecommendedNextStage(
  profile: PlayerProfile
): { world: AnimeWorld; stage: WorldStage } | undefined {
  const worlds = getAllWorlds()

  for (const world of worlds) {
    if (!isWorldUnlocked(world.id, profile)) continue

    const progress = profile?.campaignProgress?.[world.id]
    const completedStages = progress?.completedStages ?? []

    // Look for first uncompleted stage in this world
    const nextStage = world.stages.find(
      (s) => !completedStages.includes(s.stageNumber)
    )
    if (nextStage) {
      return { world, stage: nextStage }
    }
  }

  // If all unlocked stages are completed, default to Naruto stage 1 or boss
  const naruto = WORLD_REGISTRY.naruto
  return naruto?.stages[0] ? { world: naruto, stage: naruto.stages[0] } : undefined
}
