import { getSupabaseClient } from "@/lib/supabase/client"
import { createMatch, saveLocalMatch } from "@/lib/multiplayer/matchService"
import type { RealtimeChannel } from "@supabase/supabase-js"

export interface QueueEntryParams {
  userId: string
  username: string
  level: number
  rank: string
  language: "pt-BR" | "en"
  skinId: string
  bestWpm?: number
}

export interface MatchedOpponent {
  id: string
  username: string
  level: number
  rank: string
  skinId: string
  isShadow?: boolean
  targetWpm?: number
}

export interface MatchmakingStatus {
  status: "idle" | "searching" | "matched" | "cancelled" | "error"
  matchedMatchId?: string
  opponent?: MatchedOpponent
  elapsedSeconds: number
  error?: string
}

export interface MatchmakingResult {
  status: "searching" | "matched" | "cancelled" | "error"
  matchId?: string
  opponent?: MatchedOpponent
  error?: string
}

interface LocalQueueEntry extends QueueEntryParams {
  status: "searching" | "matched" | "cancelled"
  matchedMatchId?: string
  queuedAt: number
}

/**
 * Local in-memory queue fallback for guest/offline matchmaking.
 */
const localQueueStore = new Map<string, LocalQueueEntry>()

/**
 * Roster of balanced Shadow Shinobi bots for casual quick match fallback.
 */
export const SHADOW_SHINOBI_ROSTER = [
  { name: "Shadow Sasuke", skinId: "sharingan_crimson", wpmMult: 1.04 },
  { name: "Shadow Neji", skinId: "byakugan_pure", wpmMult: 0.98 },
  { name: "Shadow Gaara", skinId: "sand_gourd", wpmMult: 0.94 },
  { name: "Shadow Kakashi", skinId: "lightning_blade", wpmMult: 1.08 },
  { name: "Shadow Itachi", skinId: "akatsuki_cloud", wpmMult: 1.06 },
  { name: "Shadow Minato", skinId: "rasengan_blue", wpmMult: 1.12 },
  { name: "Shadow Temari", skinId: "wind_scythe", wpmMult: 0.92 },
  { name: "Shadow Rock Lee", skinId: "eight_gates", wpmMult: 1.1 },
  { name: "Shadow Shikamaru", skinId: "shadow_blade", wpmMult: 0.96 },
  { name: "Shadow Jiraiya", skinId: "sage_flame", wpmMult: 1.02 },
]

/**
 * Generates a balanced Shadow Shinobi opponent scaled to the player's level and WPM.
 */
export function createShadowOpponent(params: QueueEntryParams): MatchedOpponent {
  const template =
    SHADOW_SHINOBI_ROSTER[Math.floor(Math.random() * SHADOW_SHINOBI_ROSTER.length)]
  const baseWpm = params.bestWpm && params.bestWpm > 20 ? params.bestWpm : 50
  const randomJitter = 0.92 + Math.random() * 0.16
  const targetWpm = Math.max(35, Math.min(95, Math.round(baseWpm * template.wpmMult * randomJitter)))
  const botId = `shadow_${template.name.toLowerCase().replace(/\s+/g, "_")}`

  return {
    id: botId,
    username: template.name,
    level: Math.max(1, params.level),
    rank: params.rank,
    skinId: template.skinId,
    isShadow: true,
    targetWpm,
  }
}

/**
 * Enters the casual quick match queue.
 * Checks for waiting human players via Supabase RPC or local fallback.
 */
export async function enterMatchmakingQueue(
  params: QueueEntryParams
): Promise<MatchmakingResult> {
  const supabase = getSupabaseClient()

  if (supabase) {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user?.id) {
        const { data, error } = await supabase.rpc("find_or_create_quick_match", {
          p_language: params.language,
          p_skin_id: params.skinId,
        })

        if (!error && data) {
          const res = data as {
            status: string
            match_id?: string
            opponent_id?: string
            opponent_username?: string
          }
          if (res.status === "matched" && res.match_id) {
            return {
              status: "matched",
              matchId: res.match_id,
              opponent: {
                id: res.opponent_id || "opponent_player",
                username: res.opponent_username || "Shinobi Rival",
                level: params.level,
                rank: params.rank,
                skinId: "default_forge",
                isShadow: false,
              },
            }
          }
          return { status: "searching" }
        }
      }
    } catch (err) {
      console.warn("[Matchmaking] Supabase RPC failed, using local queue fallback:", err)
    }
  }

  // Local Queue Fallback
  for (const [waitingId, entry] of localQueueStore.entries()) {
    if (waitingId !== params.userId && entry.status === "searching") {
      // Form match
      const match = await createMatch({
        mode: "quick",
        language: params.language,
        skinId: entry.skinId,
        guestPlayerId: entry.userId,
      })

      const updated = {
        ...match,
        player_2_id: params.userId,
        player_2_skin_id: params.skinId,
        player_1_ready: true,
        player_2_ready: true,
        status: "playing" as const,
        started_at: new Date().toISOString(),
      }
      saveLocalMatch(updated)

      entry.status = "matched"
      entry.matchedMatchId = match.id

      localQueueStore.set(params.userId, {
        ...params,
        status: "matched",
        matchedMatchId: match.id,
        queuedAt: Date.now(),
      })

      return {
        status: "matched",
        matchId: match.id,
        opponent: {
          id: entry.userId,
          username: entry.username,
          level: entry.level,
          rank: entry.rank,
          skinId: entry.skinId,
          isShadow: false,
        },
      }
    }
  }

  // Add to local queue
  localQueueStore.set(params.userId, {
    ...params,
    status: "searching",
    queuedAt: Date.now(),
  })

  return { status: "searching" }
}

/**
 * Removes player from the matchmaking queue.
 */
export async function leaveMatchmakingQueue(userId: string): Promise<void> {
  const supabase = getSupabaseClient()

  if (supabase) {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user?.id) {
        await supabase.rpc("leave_multiplayer_queue")
      }
    } catch {
      // Suppress cleanup warning
    }
  }

  localQueueStore.delete(userId)
}

/**
 * Creates an immediate match against a balanced Shadow Shinobi.
 */
export async function createShadowMatch(
  params: QueueEntryParams
): Promise<MatchmakingResult> {
  const shadow = createShadowOpponent(params)

  const match = await createMatch({
    mode: "quick",
    language: params.language,
    skinId: params.skinId,
    guestPlayerId: params.userId,
  })

  const updatedMatch = {
    ...match,
    player_2_id: shadow.id,
    player_2_skin_id: shadow.skinId,
    player_1_ready: true,
    player_2_ready: true,
    status: "playing" as const,
    started_at: new Date().toISOString(),
  }

  saveLocalMatch(updatedMatch)

  // Remove from queue
  await leaveMatchmakingQueue(params.userId)

  return {
    status: "matched",
    matchId: match.id,
    opponent: shadow,
  }
}

export interface PollMatchParams {
  userId: string
  queueParams: QueueEntryParams
  timeoutSeconds?: number
  onStatusChange: (status: MatchmakingStatus) => void
}

/**
 * Polls and listens for match results, falling back to a Shadow Shinobi
 * if no human opponent is found within `timeoutSeconds` (default: 5 seconds).
 * Returns an unsubscribe callback to cancel searching.
 */
export function pollOrListenForMatch({
  userId,
  queueParams,
  timeoutSeconds = 5,
  onStatusChange,
}: PollMatchParams): () => void {
  let isCancelled = false
  let elapsed = 0
  const supabase = getSupabaseClient()

  // Initial searching notification
  onStatusChange({
    status: "searching",
    elapsedSeconds: 0,
  })

  // Realtime subscription if Supabase is active
  let realtimeChannel: RealtimeChannel | null = null
  if (supabase) {
    try {
      realtimeChannel = supabase
        .channel(`queue_${userId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "multiplayer_queue",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            if (isCancelled) return
            const row = payload.new as { status?: string; matched_match_id?: string }
            if (row.status === "matched" && row.matched_match_id) {
              isCancelled = true
              onStatusChange({
                status: "matched",
                matchedMatchId: row.matched_match_id,
                elapsedSeconds: elapsed,
              })
            }
          }
        )
        .subscribe()
    } catch {
      // Realtime fallback to polling
    }
  }

  // Interval timer: polls every 1000ms & enforces shadow timeout
  const timer = setInterval(async () => {
    if (isCancelled) return

    elapsed += 1

    // Check timeout for Shadow Shinobi fallback
    if (elapsed >= timeoutSeconds) {
      isCancelled = true
      clearInterval(timer)
      if (realtimeChannel && supabase) {
        supabase.removeChannel(realtimeChannel)
      }

      try {
        const shadowResult = await createShadowMatch(queueParams)
        onStatusChange({
          status: "matched",
          matchedMatchId: shadowResult.matchId,
          opponent: shadowResult.opponent,
          elapsedSeconds: elapsed,
        })
      } catch (err) {
        onStatusChange({
          status: "error",
          error: err instanceof Error ? err.message : "Match creation failed",
          elapsedSeconds: elapsed,
        })
      }
      return
    }

    // Check local queue status
    const localEntry = localQueueStore.get(userId)
    if (localEntry && localEntry.status === "matched" && localEntry.matchedMatchId) {
      isCancelled = true
      clearInterval(timer)
      if (realtimeChannel && supabase) {
        supabase.removeChannel(realtimeChannel)
      }
      onStatusChange({
        status: "matched",
        matchedMatchId: localEntry.matchedMatchId,
        elapsedSeconds: elapsed,
      })
      return
    }

    // Check Supabase RPC if active
    if (supabase) {
      try {
        const { data, error } = await supabase.rpc("check_multiplayer_queue")
        if (!error && data) {
          const res = data as { status?: string; matched_match_id?: string }
          if (res.status === "matched" && res.matched_match_id) {
            isCancelled = true
            clearInterval(timer)
            if (realtimeChannel && supabase) {
              supabase.removeChannel(realtimeChannel)
            }
            onStatusChange({
              status: "matched",
              matchedMatchId: res.matched_match_id,
              elapsedSeconds: elapsed,
            })
            return
          }
        }
      } catch {
        // Continue polling
      }
    }

    // Still searching: report tick
    onStatusChange({
      status: "searching",
      elapsedSeconds: elapsed,
    })
  }, 1000)

  // Return cancellation callback
  return () => {
    isCancelled = true
    clearInterval(timer)
    if (realtimeChannel && supabase) {
      supabase.removeChannel(realtimeChannel)
    }
    leaveMatchmakingQueue(userId).catch(() => {})
  }
}
