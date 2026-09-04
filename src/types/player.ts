export type PlayerRank = "E" | "D" | "C" | "B" | "A" | "S" | "SS" | "SSS"

export interface PlayerAttributes {
  speed: number // 0–100 rating based on WPM
  accuracy: number // 0–100 rating based on historical accuracy
  technique: number // 0–100 rating based on academy/training/finger discipline
  combo: number // 0–100 rating based on combo consistency
  overall: number // weighted composite rating
}

export interface PlayerStats {
  battlesPlayed: number
  battlesWon: number
  battlesLost: number

  totalTypingTime: number // seconds of active typing
  totalCharactersTyped: number
  totalCorrectCharacters: number
  totalErrors: number

  averageWpm: number
  bestWpm: number
  averageAccuracy: number
  bestCombo: number

  enemiesDefeated: number
  trainingSessions: number
  academyLessonsCompleted: number
}

export interface AcademyLessonProgress {
  completed: boolean
  attempts: number
  bestAccuracy: number
  bestWpm: number
  lastCompletedAt?: string
}

export interface StageScore {
  bestWpm: number
  bestAccuracy: number
  bestCombo: number
  completedAt: string
}

export interface CampaignWorldProgress {
  unlocked: boolean
  completed: boolean
  currentStage: number // 1 to 8
  completedStages: number[]
  defeatedEnemies: string[]
  bestScores: Record<string, StageScore>
  firstClearClaimed: Record<string, boolean>
}

export interface PlayerProfile {
  id: string
  username: string

  level: number
  xp: number
  totalXp: number

  rank: PlayerRank
  attributes: PlayerAttributes

  stats: PlayerStats
  academyProgress?: Record<string, AcademyLessonProgress>
  campaignProgress: Record<string, CampaignWorldProgress>
  achievements?: string[]

  createdAt: string
  updatedAt: string
}

export function createDefaultNarutoWorldProgress(): CampaignWorldProgress {
  return {
    unlocked: true,
    completed: false,
    currentStage: 1,
    completedStages: [],
    defeatedEnemies: [],
    bestScores: {},
    firstClearClaimed: {},
  }
}

export function createDefaultCampaignProgress(): Record<string, CampaignWorldProgress> {
  return {
    naruto: createDefaultNarutoWorldProgress(),
  }
}

export function createDefaultPlayerProfile(username = "Player"): PlayerProfile {
  const now = new Date().toISOString()
  return {
    id: "player_local",
    username,
    level: 1,
    xp: 0,
    totalXp: 0,
    rank: "E",
    attributes: {
      speed: 0,
      accuracy: 100,
      technique: 0,
      combo: 0,
      overall: 20,
    },
    stats: {
      battlesPlayed: 0,
      battlesWon: 0,
      battlesLost: 0,
      totalTypingTime: 0,
      totalCharactersTyped: 0,
      totalCorrectCharacters: 0,
      totalErrors: 0,
      averageWpm: 0,
      bestWpm: 0,
      averageAccuracy: 100,
      bestCombo: 0,
      enemiesDefeated: 0,
      trainingSessions: 0,
      academyLessonsCompleted: 0,
    },
    campaignProgress: createDefaultCampaignProgress(),
    achievements: [],
    createdAt: now,
    updatedAt: now,
  }
}
