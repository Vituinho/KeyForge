/**
 * KeyForge Multiplayer Domain Models & Real-Time Protocol Contracts
 */

export type MatchStatus =
  | "idle"
  | "searching"
  | "found"
  | "countdown"
  | "in_progress"
  | "finished"
  | "cancelled"

export type MatchMode = "quick" | "private" | "ranked"

export type AttackType = "basic" | "combo_bonus" | "jutsu" | "ultimate"

export interface MultiplayerPlayer {
  id: string
  username: string
  level: number
  rank: string
  avatar?: string
  ready: boolean
  isHost: boolean
  currentWpm: number
  progress: number // 0–100%
  errors: number
  combo: number
  currentStreak: number
  health: number // 0–100%
  isAlive: boolean
  lastActiveAt: string
}

export interface MatchAttack {
  attackerId: string
  targetId: string
  damage: number
  attackType: AttackType
  timestamp: string
}

export interface MatchWord {
  id: string
  text: string
  index: number
}

export interface MultiplayerMatch {
  id: string
  mode: MatchMode
  seed: number // deterministic PRNG seed for identical word sequences
  status: MatchStatus
  currentRound: number
  totalRounds: number
  words: string[]
  hostId: string
  guestId?: string
  players: Record<string, MultiplayerPlayer>
  winnerId?: string | null
  startedAt?: string | null
  finishedAt?: string | null
}

export interface RoomState {
  code: string // e.g. "KF-9X2Y"
  status: "waiting" | "ready" | "in_match" | "closed"
  host: MultiplayerPlayer
  guest?: MultiplayerPlayer | null
  createdAt: string
}

export interface QueueEntry {
  userId: string
  username: string
  level: number
  rank: string
  elo: number
  enteredAt: string
}

export interface MultiplayerStats {
  matchesPlayed: number
  wins: number
  losses: number
  winRate: number
  bestWpm: number
  bestCombo: number
  currentWinStreak: number
  bestWinStreak: number
}
