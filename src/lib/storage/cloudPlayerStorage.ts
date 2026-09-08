import { getSupabaseClient } from "@/lib/supabase/client"
import { PlayerProfile, createDefaultPlayerProfile, PlayerRank } from "@/types/player"
import { ProfileRow, PlayerStatsRow, CampaignProgressRow } from "@/types/database"
import { BattleHistoryEntry } from "@/types/battle"

/**
 * Fetches player profile, stats, and campaign progress from Supabase.
 * Returns null if Supabase is unavailable, user has no cloud profile, or an error occurs.
 */
export async function fetchCloudPlayerProfile(userId: string): Promise<PlayerProfile | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  try {
    // 1. Fetch Profile
    const { data: profileRow, error: profileErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle()

    if (profileErr || !profileRow) {
      if (profileErr) console.warn("[CloudStorage] Profile fetch error:", profileErr)
      return null
    }

    const p = profileRow as ProfileRow

    // 2. Fetch Player Stats
    const { data: statsRow, error: statsErr } = await supabase
      .from("player_stats")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle()

    if (statsErr) {
      console.warn("[CloudStorage] Stats fetch error:", statsErr)
    }

    const s = statsRow as PlayerStatsRow | null

    // 3. Fetch Campaign Progress (Naruto)
    const { data: campaignRow, error: campaignErr } = await supabase
      .from("campaign_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("world_id", "naruto")
      .maybeSingle()

    if (campaignErr) {
      console.warn("[CloudStorage] Campaign fetch error:", campaignErr)
    }

    const c = campaignRow as CampaignProgressRow | null

    // Assemble PlayerProfile
    const base = createDefaultPlayerProfile(p.username)
    const completedStagesList = c?.completed_stages ?? []

    const cloudProfile: PlayerProfile = {
      ...base,
      id: p.id,
      username: p.username,
      level: p.level ?? 1,
      xp: p.xp ?? 0,
      totalXp: p.total_xp ?? 0,
      rank: (p.rank as PlayerRank) ?? "E",
      title: p.title || base.title,
      attributes: {
        speed: p.attributes?.speed ?? base.attributes.speed,
        accuracy: p.attributes?.accuracy ?? base.attributes.accuracy,
        technique: p.attributes?.technique ?? base.attributes.technique,
        combo: p.attributes?.combo ?? base.attributes.combo,
        overall: p.attributes?.overall ?? base.attributes.overall,
      },
      achievements: p.achievements ?? [],
      stats: {
        battlesPlayed: s?.battles_played ?? base.stats.battlesPlayed,
        battlesWon: s?.battles_won ?? base.stats.battlesWon,
        battlesLost: s?.battles_lost ?? base.stats.battlesLost,
        enemiesDefeated: s?.enemies_defeated ?? base.stats.enemiesDefeated,
        totalTypingTime: s?.total_typing_time ?? base.stats.totalTypingTime,
        totalCharactersTyped: s?.total_characters_typed ?? base.stats.totalCharactersTyped,
        totalCorrectCharacters: s?.total_correct_characters ?? base.stats.totalCorrectCharacters,
        totalErrors: s?.total_errors ?? base.stats.totalErrors,
        averageWpm: s?.average_wpm ?? base.stats.averageWpm,
        bestWpm: s?.best_wpm ?? base.stats.bestWpm,
        averageAccuracy: s?.average_accuracy ?? base.stats.averageAccuracy,
        bestCombo: s?.best_combo ?? base.stats.bestCombo,
        trainingSessions: s?.training_sessions ?? base.stats.trainingSessions,
        academyLessonsCompleted: s?.academy_lessons_completed ?? base.stats.academyLessonsCompleted,
      },
      campaignProgress: {
        ...base.campaignProgress,
        naruto: {
          ...base.campaignProgress.naruto,
          currentStage: c?.current_stage ?? 1,
          completedStages: completedStagesList,
          completed: c?.completed ?? false,
        },
      },
      createdAt: p.created_at ?? base.createdAt,
      updatedAt: p.updated_at ?? new Date().toISOString(),
    }

    return cloudProfile
  } catch (error) {
    console.error("[CloudStorage] Unexpected error fetching cloud profile:", error)
    return null
  }
}

/**
 * Saves/upserts player profile, stats, and campaign progress to Supabase asynchronously.
 */
export async function saveCloudPlayerProfile(userId: string, profile: PlayerProfile): Promise<boolean> {
  const supabase = getSupabaseClient()
  if (!supabase) return false

  try {
    const now = new Date().toISOString()

    // 1. Update Profile
    const { error: profileErr } = await supabase
      .from("profiles")
      .update({
        username: profile.username,
        level: profile.level,
        xp: profile.xp,
        total_xp: profile.totalXp,
        rank: profile.rank,
        title: profile.title ?? null,
        attributes: profile.attributes,
        achievements: profile.achievements ?? [],
        updated_at: now,
      })
      .eq("id", userId)

    if (profileErr) {
      console.warn("[CloudStorage] Profile update error:", profileErr)
    }

    // 2. Upsert Player Stats
    const statsPayload: Partial<PlayerStatsRow> & { user_id: string } = {
      user_id: userId,
      battles_played: profile.stats.battlesPlayed,
      battles_won: profile.stats.battlesWon,
      battles_lost: profile.stats.battlesLost,
      enemies_defeated: profile.stats.enemiesDefeated,
      total_typing_time: Math.round(profile.stats.totalTypingTime),
      total_characters_typed: profile.stats.totalCharactersTyped,
      total_correct_characters: profile.stats.totalCorrectCharacters,
      total_errors: profile.stats.totalErrors,
      average_wpm: Math.round(profile.stats.averageWpm),
      best_wpm: Math.round(profile.stats.bestWpm),
      average_accuracy: Math.round(profile.stats.averageAccuracy),
      best_combo: profile.stats.bestCombo,
      training_sessions: profile.stats.trainingSessions,
      academy_lessons_completed: profile.stats.academyLessonsCompleted,
      updated_at: now,
    }

    const { error: statsErr } = await supabase
      .from("player_stats")
      .upsert(statsPayload)

    if (statsErr) {
      console.warn("[CloudStorage] Stats upsert error:", statsErr)
    }

    // 3. Upsert Campaign Progress (Naruto)
    const naruto = profile.campaignProgress?.naruto
    if (naruto) {
      const { error: campErr } = await supabase
        .from("campaign_progress")
        .upsert(
          {
            user_id: userId,
            world_id: "naruto",
            current_stage: naruto.currentStage,
            completed_stages: naruto.completedStages ?? [],
            completed: naruto.completed,
            updated_at: now,
          },
          { onConflict: "user_id,world_id" }
        )

      if (campErr) {
        console.warn("[CloudStorage] Campaign upsert error:", campErr)
      }
    }

    return true
  } catch (error) {
    console.error("[CloudStorage] Unexpected error syncing to cloud:", error)
    return false
  }
}

/**
 * Saves a completed battle into the Supabase battle_history table.
 */
export async function saveCloudBattleHistory(
  userId: string,
  entry: BattleHistoryEntry,
  weakKeys: string[] = []
): Promise<boolean> {
  const supabase = getSupabaseClient()
  if (!supabase) return false

  try {
    const { error } = await supabase.from("battle_history").insert({
      user_id: userId,
      enemy_id: entry.enemyId,
      enemy_name: entry.enemyName,
      enemy_anime: entry.enemyAnime,
      victory: entry.victory,
      battle_wpm: Math.round(entry.battleWpm),
      best_wpm: Math.round(entry.battleWpm),
      battle_accuracy: Math.round(entry.battleAccuracy),
      best_combo: entry.bestCombo,
      damage_dealt: Math.round(entry.damageDealt),
      damage_taken: Math.round(entry.damageTaken),
      duration_seconds: entry.durationSeconds,
      xp_earned: entry.xpEarned,
      weak_keys: weakKeys,
      played_at: entry.timestamp || new Date().toISOString(),
    })

    if (error) {
      console.warn("[CloudStorage] Battle history insert error:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("[CloudStorage] Unexpected error saving battle history to cloud:", error)
    return false
  }
}
