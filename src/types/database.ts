/**
 * Supabase Database TypeScript Schema Definitions for KeyForge
 */

export interface ProfileRow {
  id: string
  username: string
  level: number
  xp: number
  total_xp: number
  rank: string
  title: string | null
  attributes: {
    speed: number
    accuracy: number
    technique: number
    combo: number
    overall: number
  }
  achievements: string[]
  language: string
  created_at: string
  updated_at: string
}

export interface PlayerStatsRow {
  user_id: string
  battles_played: number
  battles_won: number
  battles_lost: number
  enemies_defeated: number
  total_typing_time: number
  total_characters_typed: number
  total_correct_characters: number
  total_errors: number
  average_wpm: number
  best_wpm: number
  average_accuracy: number
  best_combo: number
  training_sessions: number
  academy_lessons_completed: number
  updated_at: string
}

export interface CampaignProgressRow {
  id: string
  user_id: string
  world_id: string
  current_stage: number
  completed_stages: number[]
  completed: boolean
  unlocked_at: string
  completed_at: string | null
  updated_at: string
}

export interface BattleHistoryRow {
  id: string
  user_id: string
  enemy_id: string
  enemy_name: string
  enemy_anime: string
  victory: boolean
  battle_wpm: number
  best_wpm: number
  battle_accuracy: number
  best_combo: number
  damage_dealt: number
  damage_taken: number
  duration_seconds: number
  xp_earned: number
  weak_keys: string[]
  played_at: string
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow
        Insert: Partial<ProfileRow> & { id: string; username: string }
        Update: Partial<ProfileRow>
      }
      player_stats: {
        Row: PlayerStatsRow
        Insert: Partial<PlayerStatsRow> & { user_id: string }
        Update: Partial<PlayerStatsRow>
      }
      campaign_progress: {
        Row: CampaignProgressRow
        Insert: Partial<CampaignProgressRow> & { user_id: string; world_id: string }
        Update: Partial<CampaignProgressRow>
      }
      battle_history: {
        Row: BattleHistoryRow
        Insert: Omit<BattleHistoryRow, 'id' | 'played_at'> & { id?: string; played_at?: string }
        Update: Partial<BattleHistoryRow>
      }
    }
  }
}
