import { Enemy } from "./character"

export type AnimeWorldId =
  | "naruto"
  | "jujutsu"
  | "dragon"
  | "pirate"
  | "hunter"
  | "demon"
  | "nexus"

export type WorldTypingFocus =
  | "fundamentals"
  | "precision"
  | "speed"
  | "consistency"
  | "weak-keys"
  | "touch-typing"
  | "mastery"

export type WorldStatus = "available" | "locked" | "completed" | "mastered"

export interface WorldMasteryObjective {
  id: string
  labelKey: string
  minAccuracy?: number
  minWpm?: number
  maxErrors?: number
  minCombo?: number
}

export interface StageRewardConfig {
  xp: number
  forgeShards?: number
  crateId?: string
}

export interface WorldStage {
  id: string
  enemyId: string
  stageNumber: number // 1 to 8
  name: string
  characterTitle?: string
  typingFocus: string
  difficulty: number // 1 to 100
  recommendedWpm: number
  recommendedAccuracy: number
  enemyConfig: Enemy
  mechanicKey: string
  mechanicSummaryKey: string
  rewards: StageRewardConfig
  firstClearRewards: StageRewardConfig & {
    bonusXp: number
    title?: string
  }
  isBoss: boolean
  masteryObjectives?: WorldMasteryObjective[]
}

export interface WorldThemeConfig {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  glowColor: string
  bgGradient: string
  cardGradient: string
  badgeClass: string
  borderClass: string
}

export interface WorldUnlockRequirement {
  previousWorldId?: AnimeWorldId
  requiredStagesCleared?: number
  requiredPlayerLevel?: number
  descriptionKey: string
}

export interface AnimeWorld {
  id: AnimeWorldId
  order: number
  nameKey: string
  series: string
  descriptionKey: string
  taglineKey: string
  theme: WorldThemeConfig
  focus: WorldTypingFocus
  focusKey: string
  baseDifficulty: number // 1 to 10
  unlockRequirement: WorldUnlockRequirement
  stages: WorldStage[]
  completionReward: {
    xp: number
    title: string
    crateId?: string
    badgeKey: string
  }
  masteryReward: {
    xp: number
    title: string
    crateId?: string
    badgeKey: string
  }
}

export interface WorldProgressSummary {
  worldId: AnimeWorldId
  status: WorldStatus
  unlocked: boolean
  completed: boolean
  mastered: boolean
  currentStageNumber: number
  totalStages: number
  stagesClearedCount: number
  progressPercent: number
  bestWpm: number
  bestAccuracy: number
  masteryStarsCount: number
  totalMasteryStars: number
}
