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
  equipped_keyboard_skin?: string
  forge_shards?: number
  keyboard_settings?: {
    showKeyboard?: boolean
    effectIntensity?: string
    showHandsGuide?: boolean
    showHomeRowAnchors?: boolean
  }
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

export interface UserCosmeticRow {
  id: string
  user_id: string
  cosmetic_id: string
  cosmetic_type: string
  unlocked_at: string
}

export interface PlayerCrateRow {
  id: string
  user_id: string
  crate_id: string
  quantity: number
  updated_at: string
}

export interface MultiplayerMatchRow {
  id: string
  room_code: string | null
  mode: "quick" | "private"
  status: "waiting" | "ready" | "countdown" | "playing" | "finished" | "cancelled"
  language: "pt-BR" | "en"
  seed: number
  word_count: number
  player_1_id: string
  player_2_id: string | null
  player_1_ready: boolean
  player_2_ready: boolean
  player_1_hp: number
  player_2_hp: number
  player_1_word_index: number
  player_2_word_index: number
  player_1_combo: number
  player_2_combo: number
  player_1_attack_energy: number
  player_2_attack_energy: number
  /** @deprecated Ultimate system removed in v3.2 — field kept for DB backward compat only */
  player_1_ultimate_energy: number
  /** @deprecated Ultimate system removed in v3.2 — field kept for DB backward compat only */
  player_2_ultimate_energy: number
  player_1_wpm: number
  player_2_wpm: number
  player_1_accuracy: number
  player_2_accuracy: number
  player_1_skin_id: string
  player_2_skin_id: string
  winner_id: string | null
  is_draw: boolean
  countdown_starts_at: string | null
  started_at: string | null
  finished_at: string | null
  player_1_last_active_at: string
  player_2_last_active_at: string | null
  created_at: string
  updated_at: string
}

export interface MultiplayerMatchEventRow {
  id: string
  match_id: string
  player_id: string
  event_id: string
  event_type:
    | "WORD_COMPLETED"
    | "ATTACK_RESOLVED"
    | "TYPO_PENALTY"
    | "PLAYER_DISCONNECTED"
    | "PLAYER_RECONNECTED"
    | "FORFEIT"
  word_index: number | null
  word_text: string | null
  accuracy: number | null
  wpm: number | null
  combo: number | null
  damage_dealt: number
  payload: Record<string, unknown>
  created_at: string
}

export interface MultiplayerMatchResultRow {
  id: string
  match_id: string
  mode: string
  winner_id: string | null
  loser_id: string | null
  is_draw: boolean
  duration_seconds: number
  player_1_id: string
  player_1_stats: Record<string, unknown>
  player_1_xp_earned: number
  player_2_id: string | null
  player_2_stats: Record<string, unknown>
  player_2_xp_earned: number
  created_at: string
}

export interface MultiplayerQueueRow {
  id: string
  user_id: string
  username: string
  level: number
  rank: string
  language: "pt-BR" | "en"
  skin_id: string
  status: "searching" | "matched" | "cancelled"
  matched_match_id: string | null
  queued_at: string
  updated_at: string
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
      user_cosmetics: {
        Row: UserCosmeticRow
        Insert: Partial<UserCosmeticRow> & { user_id: string; cosmetic_id: string }
        Update: Partial<UserCosmeticRow>
      }
      player_crates: {
        Row: PlayerCrateRow
        Insert: Partial<PlayerCrateRow> & { user_id: string; crate_id: string }
        Update: Partial<PlayerCrateRow>
      }
      multiplayer_matches: {
        Row: MultiplayerMatchRow
        Insert: Partial<MultiplayerMatchRow> & { player_1_id: string; seed: number; mode: "quick" | "private" }
        Update: Partial<MultiplayerMatchRow>
      }
      multiplayer_match_events: {
        Row: MultiplayerMatchEventRow
        Insert: Omit<MultiplayerMatchEventRow, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<MultiplayerMatchEventRow>
      }
      multiplayer_match_results: {
        Row: MultiplayerMatchResultRow
        Insert: Omit<MultiplayerMatchResultRow, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<MultiplayerMatchResultRow>
      }
      multiplayer_queue: {
        Row: MultiplayerQueueRow
        Insert: Partial<MultiplayerQueueRow> & { user_id: string; username: string }
        Update: Partial<MultiplayerQueueRow>
      }
    }
  }
}

