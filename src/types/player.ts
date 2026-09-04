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

  createdAt: string
  updatedAt: string
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
    createdAt: now,
    updatedAt: now,
  }
}
