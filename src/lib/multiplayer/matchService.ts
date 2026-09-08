import { getSupabaseClient } from "@/lib/supabase/client"
import { MultiplayerMatchRow, MultiplayerMatchResultRow } from "@/types/database"
import { getWordsForMatch } from "@/lib/multiplayer/wordGenerator"
import { validateWordSubmission, cleanupMatchRateLimits } from "@/lib/multiplayer/antiCheatService"

export interface CreateMatchParams {
  mode: "quick" | "private"
  roomCode?: string
  language?: "pt-BR" | "en"
  seed?: number
  skinId?: string
  wordCount?: number
  guestPlayerId?: string
}

export interface JoinMatchParams {
  roomCode: string
  skinId?: string
  guestPlayerId?: string
}

export interface SetReadyParams {
  matchId: string
  isReady: boolean
  playerId?: string
}

export interface SubmitWordParams {
  matchId: string
  eventId: string
  wordIndex: number
  wordText: string
  wpm: number
  accuracy: number
  combo: number
  playerId?: string
}

export interface TriggerUltimateParams {
  matchId: string
  playerId?: string
}

export interface ForfeitMatchParams {
  matchId: string
  playerId?: string
}

export interface CancelMatchParams {
  matchId: string
  playerId?: string
}

/**
 * In-memory / local fallback store for matches when Supabase is offline or in Guest Mode.
 * Implements identical server-authoritative rules deterministically.
 */
const localMatchesStore = new Map<string, MultiplayerMatchRow>()
const localMatchEventsStore = new Set<string>() // composite: matchId:eventId
const localResultsStore = new Map<string, MultiplayerMatchResultRow>()

/**
 * Records an authoritative match result locally when a match finishes.
 */
function recordLocalMatchResult(
  match: MultiplayerMatchRow,
  now: string
): MultiplayerMatchResultRow {
  const startedTime = match.started_at
    ? new Date(match.started_at).getTime()
    : new Date(match.created_at).getTime()
  const duration = Math.max(1, Math.round((new Date(now).getTime() - startedTime) / 1000))

  const p1Xp = match.winner_id === match.player_1_id ? 120 : match.is_draw ? 75 : 40
  const p2Xp = match.winner_id === match.player_2_id ? 120 : match.is_draw ? 75 : 40

  const loserId = match.winner_id
    ? match.winner_id === match.player_1_id
      ? match.player_2_id
      : match.player_1_id
    : null

  const result: MultiplayerMatchResultRow = {
    id: `res_${match.id}`,
    match_id: match.id,
    mode: match.mode,
    winner_id: match.winner_id,
    loser_id: loserId,
    is_draw: match.is_draw,
    duration_seconds: duration,
    player_1_id: match.player_1_id,
    player_1_stats: {
      wpm: match.player_1_wpm,
      accuracy: match.player_1_accuracy,
      hp: match.player_1_hp,
      combo: match.player_1_combo,
      word_index: match.player_1_word_index,
    },
    player_1_xp_earned: p1Xp,
    player_2_id: match.player_2_id,
    player_2_stats: {
      wpm: match.player_2_wpm,
      accuracy: match.player_2_accuracy,
      hp: match.player_2_hp,
      combo: match.player_2_combo,
      word_index: match.player_2_word_index,
    },
    player_2_xp_earned: p2Xp,
    created_at: now,
  }

  localResultsStore.set(match.id, result)
  return result
}

/**
 * Creates an authoritative multiplayer match record.
 */
export async function createMatch(
  params: CreateMatchParams
): Promise<MultiplayerMatchRow> {
  const supabase = getSupabaseClient()
  const mode = params.mode
  const language = params.language || "pt-BR"
  const seed = params.seed ?? Math.floor(Math.random() * 1000000)
  const skinId = params.skinId || "default_forge"
  const wordCount = params.wordCount || 30
  const roomCode =
    params.roomCode ||
    (mode === "private"
      ? `KF-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
      : null)

  if (supabase) {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session?.user?.id) {
        const { data, error } = await supabase.rpc("create_multiplayer_match", {
          p_mode: mode,
          p_room_code: roomCode,
          p_language: language,
          p_seed: seed,
          p_skin_id: skinId,
          p_word_count: wordCount,
        })

        if (!error && data) {
          return data as MultiplayerMatchRow
        }
      }
    } catch (err) {
      console.warn("[MatchService] Supabase create_multiplayer_match failed, using local fallback:", err)
    }
  }

  // Local fallback (Guest or Offline)
  const hostId = params.guestPlayerId || "guest_player_1"
  const matchId = `match_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  const now = new Date().toISOString()

  const match: MultiplayerMatchRow = {
    id: matchId,
    room_code: roomCode,
    mode,
    status: "waiting",
    language,
    seed,
    word_count: wordCount,
    player_1_id: hostId,
    player_2_id: null,
    player_1_ready: false,
    player_2_ready: false,
    player_1_hp: 1000,
    player_2_hp: 1000,
    player_1_word_index: 0,
    player_2_word_index: 0,
    player_1_combo: 0,
    player_2_combo: 0,
    player_1_attack_energy: 0,
    player_2_attack_energy: 0,
    player_1_ultimate_energy: 0,
    player_2_ultimate_energy: 0,
    player_1_wpm: 0,
    player_2_wpm: 0,
    player_1_accuracy: 100,
    player_2_accuracy: 100,
    player_1_skin_id: skinId,
    player_2_skin_id: "default_forge",
    winner_id: null,
    is_draw: false,
    countdown_starts_at: null,
    started_at: null,
    finished_at: null,
    player_1_last_active_at: now,
    player_2_last_active_at: null,
    created_at: now,
    updated_at: now,
  }

  localMatchesStore.set(matchId, match)
  if (roomCode) {
    localMatchesStore.set(roomCode.toUpperCase(), match)
  }
  return match
}

/**
 * Joins an existing multiplayer match by room code.
 */
export async function joinMatch(
  params: JoinMatchParams
): Promise<MultiplayerMatchRow> {
  const supabase = getSupabaseClient()
  const normCode = params.roomCode.trim().toUpperCase()
  const skinId = params.skinId || "default_forge"

  if (supabase) {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session?.user?.id) {
        const { data, error } = await supabase.rpc("join_multiplayer_match", {
          p_room_code: normCode,
          p_skin_id: skinId,
        })

        if (!error && data) {
          return data as MultiplayerMatchRow
        }
      }
    } catch (err) {
      console.warn("[MatchService] Supabase join_multiplayer_match failed, checking local store:", err)
    }
  }

  // Local fallback
  const existing = localMatchesStore.get(normCode)
  if (!existing) {
    throw new Error(`Room ${normCode} not found`)
  }
  if (existing.status !== "waiting" || existing.player_2_id) {
    throw new Error(`Room ${normCode} is not available to join`)
  }

  const guestId = params.guestPlayerId || "guest_player_2"
  const updated: MultiplayerMatchRow = {
    ...existing,
    player_2_id: guestId,
    player_2_skin_id: skinId,
    player_2_last_active_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  localMatchesStore.set(existing.id, updated)
  localMatchesStore.set(normCode, updated)
  return updated
}

/**
 * Sets player ready state and computes countdown if both are ready.
 */
export async function setPlayerReady(
  params: SetReadyParams
): Promise<MultiplayerMatchRow> {
  const supabase = getSupabaseClient()

  if (supabase) {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session?.user?.id) {
        const { data, error } = await supabase.rpc("set_player_ready", {
          p_match_id: params.matchId,
          p_ready: params.isReady,
        })

        if (!error && data) {
          return data as MultiplayerMatchRow
        }
      }
    } catch (err) {
      console.warn("[MatchService] Supabase set_player_ready failed, using local fallback:", err)
    }
  }

  // Local fallback
  const match =
    localMatchesStore.get(params.matchId) ||
    localMatchesStore.get(params.matchId.trim().toUpperCase())
  if (!match) {
    throw new Error("Match not found")
  }

  const playerId = params.playerId || match.player_1_id
  const isP1 = match.player_1_id === playerId
  const p1Ready = isP1 ? params.isReady : match.player_1_ready
  const p2Ready = !isP1 ? params.isReady : match.player_2_ready
  const bothReady = p1Ready && p2Ready

  const now = new Date()
  const countdownStartsAt = bothReady ? now.toISOString() : null
  const startsAt = bothReady ? new Date(now.getTime() + 3000).toISOString() : null

  const updated: MultiplayerMatchRow = {
    ...match,
    player_1_ready: p1Ready,
    player_2_ready: p2Ready,
    status: bothReady ? "countdown" : "waiting",
    countdown_starts_at: countdownStartsAt,
    started_at: startsAt,
    updated_at: now.toISOString(),
  }

  localMatchesStore.set(match.id, updated)
  if (match.room_code) {
    localMatchesStore.set(match.room_code.toUpperCase(), updated)
  }
  return updated
}

/**
 * Submits word completion with authoritative energy, attack and damage calculation.
 */
export async function submitWordCompletion(
  params: SubmitWordParams
): Promise<MultiplayerMatchRow> {
  const supabase = getSupabaseClient()

  if (supabase) {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session?.user?.id) {
        const { data, error } = await supabase.rpc("submit_word_completion", {
          p_match_id: params.matchId,
          p_event_id: params.eventId,
          p_word_index: params.wordIndex,
          p_word_text: params.wordText,
          p_wpm: params.wpm,
          p_accuracy: params.accuracy,
          p_combo: params.combo,
        })

        if (!error && data) {
          return data as MultiplayerMatchRow
        }
      }
    } catch (err) {
      console.warn("[MatchService] Supabase submit_word_completion failed, using local fallback:", err)
    }
  }

  // Local fallback
  const match = localMatchesStore.get(params.matchId)
  if (!match) {
    throw new Error("Match not found")
  }

  // Idempotency
  const eventKey = `${params.matchId}:${params.eventId}`
  if (localMatchEventsStore.has(eventKey)) {
    return match
  }
  localMatchEventsStore.add(eventKey)

  const playerId = params.playerId || match.player_1_id
  const isP1 = match.player_1_id === playerId

  // Authoritative Anti-Cheat & Deterministic Word Validation
  const validation = validateWordSubmission(match, {
    matchId: params.matchId,
    wordIndex: params.wordIndex,
    wordText: params.wordText,
    wpm: params.wpm,
    accuracy: params.accuracy,
    combo: params.combo,
    playerId,
  })

  if (!validation.isValid) {
    console.warn(`[AntiCheat] Word submission rejected for player ${playerId}: ${validation.reason}`)
    return match
  }

  const effectiveWpm = validation.sanitizedWpm
  const effectiveAccuracy = validation.sanitizedAccuracy
  const effectiveCombo = validation.sanitizedCombo

  // Energy Gain calculation
  let energyGain = 25
  if (effectiveAccuracy >= 98) energyGain += 5
  if (effectiveCombo >= 10) energyGain += 5

  const currentEnergy = isP1 ? match.player_1_attack_energy : match.player_2_attack_energy
  let newEnergy = currentEnergy + energyGain
  let damage = 0

  // Attack resolution at 100 Energy
  if (newEnergy >= 100) {
    const comboMult = 1.0 + Math.min(1.5, effectiveCombo * 0.05)
    const accRatio = Math.max(0.5, effectiveAccuracy / 100)
    damage = Math.round(70 * comboMult * accRatio)
    newEnergy -= 100
  }

  const now = new Date().toISOString()
  const oppHp = Math.max(0, (isP1 ? match.player_2_hp : match.player_1_hp) - damage)

  const p1Hp = isP1 ? match.player_1_hp : oppHp
  const p2Hp = isP1 ? oppHp : match.player_2_hp
  const p1Energy = isP1 ? newEnergy : match.player_1_attack_energy
  const p2Energy = isP1 ? match.player_2_attack_energy : newEnergy
  const p1Ult = isP1 ? Math.min(100, match.player_1_ultimate_energy + 5) : match.player_1_ultimate_energy
  const p2Ult = isP1 ? match.player_2_ultimate_energy : Math.min(100, match.player_2_ultimate_energy + 5)

  let isFinished = oppHp <= 0 || (params.wordIndex + 1) >= match.word_count
  let winnerId: string | null = null

  if (oppHp <= 0) {
    winnerId = playerId
    isFinished = true
  } else if ((params.wordIndex + 1) >= match.word_count) {
    isFinished = true
    if (p1Hp > p2Hp) winnerId = match.player_1_id
    else if (p2Hp > p1Hp) winnerId = match.player_2_id
    else winnerId = null
  }

  if (isFinished) {
    cleanupMatchRateLimits(match.id)
  }

  const updated: MultiplayerMatchRow = {
    ...match,
    status: isFinished ? "finished" : "playing",
    winner_id: isFinished ? winnerId : null,
    is_draw: isFinished && winnerId === null,
    finished_at: isFinished ? now : null,
    player_1_hp: p1Hp,
    player_2_hp: p2Hp,
    player_1_word_index: isP1 ? params.wordIndex + 1 : match.player_1_word_index,
    player_2_word_index: !isP1 ? params.wordIndex + 1 : match.player_2_word_index,
    player_1_combo: isP1 ? effectiveCombo : match.player_1_combo,
    player_2_combo: !isP1 ? effectiveCombo : match.player_2_combo,
    player_1_attack_energy: p1Energy,
    player_2_attack_energy: p2Energy,
    player_1_ultimate_energy: p1Ult,
    player_2_ultimate_energy: p2Ult,
    player_1_wpm: isP1 ? effectiveWpm : match.player_1_wpm,
    player_2_wpm: !isP1 ? effectiveWpm : match.player_2_wpm,
    player_1_accuracy: isP1 ? effectiveAccuracy : match.player_1_accuracy,
    player_2_accuracy: !isP1 ? effectiveAccuracy : match.player_2_accuracy,
    player_1_last_active_at: isP1 ? now : match.player_1_last_active_at,
    player_2_last_active_at: !isP1 ? now : match.player_2_last_active_at,
    updated_at: now,
  }

  localMatchesStore.set(match.id, updated)
  if (match.room_code) {
    localMatchesStore.set(match.room_code.toUpperCase(), updated)
  }

  if (isFinished) {
    recordLocalMatchResult(updated, now)
  }

  return updated
}

/**
 * Triggers an ultimate attack when the gauge is 100%.
 */
export async function triggerUltimate(
  params: TriggerUltimateParams
): Promise<MultiplayerMatchRow> {
  const supabase = getSupabaseClient()

  if (supabase) {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session?.user?.id) {
        const { data, error } = await supabase.rpc("trigger_ultimate", {
          p_match_id: params.matchId,
        })

        if (!error && data) {
          return data as MultiplayerMatchRow
        }
      }
    } catch (err) {
      console.warn("[MatchService] Supabase trigger_ultimate failed, using local fallback:", err)
    }
  }

  // Local fallback
  const match = localMatchesStore.get(params.matchId)
  if (!match) throw new Error("Match not found")

  const playerId = params.playerId || match.player_1_id
  const isP1 = match.player_1_id === playerId
  const ultEnergy = isP1 ? match.player_1_ultimate_energy : match.player_2_ultimate_energy

  if (ultEnergy < 100) {
    throw new Error("Ultimate gauge not fully charged")
  }

  const damage = 160
  const oppHp = Math.max(0, (isP1 ? match.player_2_hp : match.player_1_hp) - damage)
  const isFinished = oppHp <= 0
  const now = new Date().toISOString()

  const updated: MultiplayerMatchRow = {
    ...match,
    player_1_ultimate_energy: isP1 ? 0 : match.player_1_ultimate_energy,
    player_2_ultimate_energy: !isP1 ? 0 : match.player_2_ultimate_energy,
    player_1_hp: isP1 ? match.player_1_hp : oppHp,
    player_2_hp: isP1 ? oppHp : match.player_2_hp,
    status: isFinished ? "finished" : match.status,
    winner_id: isFinished ? playerId : match.winner_id,
    finished_at: isFinished ? now : match.finished_at,
    updated_at: now,
  }

  localMatchesStore.set(match.id, updated)
  if (isFinished) {
    recordLocalMatchResult(updated, now)
  }

  return updated
}

/**
 * Forfeits a match, automatically crowning the opponent.
 */
export async function forfeitMatch(
  params: ForfeitMatchParams
): Promise<MultiplayerMatchRow> {
  const supabase = getSupabaseClient()

  if (supabase) {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session?.user?.id) {
        const { data, error } = await supabase.rpc("forfeit_match", {
          p_match_id: params.matchId,
        })

        if (!error && data) {
          return data as MultiplayerMatchRow
        }
      }
    } catch (err) {
      console.warn("[MatchService] Supabase forfeit_match failed, using local fallback:", err)
    }
  }

  const match = localMatchesStore.get(params.matchId)
  if (!match) throw new Error("Match not found")

  const playerId = params.playerId || match.player_1_id
  const winnerId = match.player_1_id === playerId ? match.player_2_id : match.player_1_id
  const now = new Date().toISOString()

  const updated: MultiplayerMatchRow = {
    ...match,
    status: "finished",
    winner_id: winnerId,
    is_draw: false,
    finished_at: now,
    updated_at: now,
  }

  localMatchesStore.set(match.id, updated)
  recordLocalMatchResult(updated, now)
  cleanupMatchRateLimits(params.matchId)
  return updated
}

/**
 * Authoritatively awards forfeit victory when opponent disconnects and fails to return within grace period.
 */
export async function claimDisconnectForfeit(
  params: ForfeitMatchParams
): Promise<MultiplayerMatchRow> {
  const supabase = getSupabaseClient()

  if (supabase) {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session?.user?.id) {
        const { data, error } = await supabase.rpc("claim_disconnect_forfeit", {
          p_match_id: params.matchId,
        })

        if (!error && data) {
          cleanupMatchRateLimits(params.matchId)
          return data as MultiplayerMatchRow
        }
      }
    } catch (err) {
      console.warn("[MatchService] Supabase claim_disconnect_forfeit failed, using local fallback:", err)
    }
  }

  const match = localMatchesStore.get(params.matchId)
  if (!match) throw new Error("Match not found")

  const winnerId = params.playerId || match.player_1_id
  const now = new Date().toISOString()

  const updated: MultiplayerMatchRow = {
    ...match,
    status: "finished",
    winner_id: winnerId,
    is_draw: false,
    finished_at: now,
    updated_at: now,
  }

  localMatchesStore.set(match.id, updated)
  recordLocalMatchResult(updated, now)
  cleanupMatchRateLimits(params.matchId)
  return updated
}


/**
 * Retrieves the authoritative match result record.
 */
export async function getMatchResult(
  matchId: string
): Promise<MultiplayerMatchResultRow | null> {
  const supabase = getSupabaseClient()

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("multiplayer_match_results")
        .select("*")
        .eq("match_id", matchId)
        .maybeSingle()

      if (!error && data) {
        return data as MultiplayerMatchResultRow
      }
    } catch (err) {
      console.warn("[MatchService] Supabase getMatchResult failed, checking local store:", err)
    }
  }

  return localResultsStore.get(matchId) || null
}

/**
 * Cancels a match before it starts.
 */
export async function cancelMatch(
  params: CancelMatchParams
): Promise<MultiplayerMatchRow> {
  const supabase = getSupabaseClient()

  if (supabase) {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session?.user?.id) {
        const { data, error } = await supabase.rpc("cancel_match", {
          p_match_id: params.matchId,
        })

        if (!error && data) {
          return data as MultiplayerMatchRow
        }
      }
    } catch (err) {
      console.warn("[MatchService] Supabase cancel_match failed, using local fallback:", err)
    }
  }

  const match = localMatchesStore.get(params.matchId)
  if (!match) throw new Error("Match not found")

  const now = new Date().toISOString()
  const updated: MultiplayerMatchRow = {
    ...match,
    status: "cancelled",
    finished_at: now,
    updated_at: now,
  }

  localMatchesStore.set(match.id, updated)
  cleanupMatchRateLimits(params.matchId)
  return updated
}

/**
 * Retrieves match by ID from Supabase or local store.
 */
export async function getMatchById(
  matchId: string
): Promise<MultiplayerMatchRow | null> {
  const supabase = getSupabaseClient()

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("multiplayer_matches")
        .select("*")
        .eq("id", matchId)
        .single()

      if (!error && data) {
        return data as MultiplayerMatchRow
      }
    } catch {
      // Fallback
    }
  }

  return localMatchesStore.get(matchId) || null
}

/**
 * Saves or updates a match in the local matches store.
 */
export function saveLocalMatch(match: MultiplayerMatchRow): void {
  localMatchesStore.set(match.id, match)
  if (match.room_code) {
    localMatchesStore.set(match.room_code.toUpperCase(), match)
  }
}

/**
 * Retrieves match by room code from Supabase or local store.
 */
export async function getMatchByCode(
  roomCode: string
): Promise<MultiplayerMatchRow | null> {
  const supabase = getSupabaseClient()
  const norm = roomCode.trim().toUpperCase()

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("multiplayer_matches")
        .select("*")
        .eq("room_code", norm)
        .single()

      if (!error && data) {
        return data as MultiplayerMatchRow
      }
    } catch {
      // Fallback
    }
  }

  return localMatchesStore.get(norm) || null
}

/**
 * Convenience method to get the full deterministic word list for a match record.
 */
export function getMatchWords(match: MultiplayerMatchRow): string[] {
  return getWordsForMatch({
    seed: match.seed,
    word_count: match.word_count,
    language: match.language,
  })
}

export interface MatchTelemetryPayload {
  playerId: string
  wordIndex: number
  wpm: number
  accuracy: number
  combo: number
  attackEnergy: number
  ultimateEnergy: number
  hp: number
}

export interface MatchBattleCallbacks {
  onMatchUpdate?: (match: MultiplayerMatchRow) => void
  onOpponentTelemetry?: (telemetry: MatchTelemetryPayload) => void
  onAttackEvent?: (event: { attackerId: string; damage: number; isUlt?: boolean }) => void
  onMatchFinished?: (event: { winnerId: string | null; isDraw: boolean }) => void
  onOpponentPresenceChange?: (isOnline: boolean) => void
}

/**
 * Subscribes to real-time PvP match telemetry, presence, and combat events.
 */
export function subscribeToMatchBattle(
  matchId: string,
  callbacks: MatchBattleCallbacks,
  currentUserId?: string
): {
  broadcastTelemetry: (telemetry: MatchTelemetryPayload) => Promise<void>
  broadcastAttack: (attackerId: string, damage: number, isUlt?: boolean) => Promise<void>
  broadcastMatchFinished: (winnerId: string | null, isDraw: boolean) => Promise<void>
  unsubscribe: () => void
} {
  const supabase = getSupabaseClient()

  if (!supabase) {
    return {
      broadcastTelemetry: async () => {},
      broadcastAttack: async () => {},
      broadcastMatchFinished: async () => {},
      unsubscribe: () => {},
    }
  }

  const channel = supabase.channel(`match:${matchId}`, {
    config: {
      broadcast: { self: false },
      presence: { key: currentUserId || "anon" },
    },
  })

  // Telemetry stream
  channel.on("broadcast", { event: "telemetry" }, ({ payload }) => {
    if (payload && callbacks.onOpponentTelemetry) {
      callbacks.onOpponentTelemetry(payload as MatchTelemetryPayload)
    }
  })

  // Live attack animations
  channel.on("broadcast", { event: "attack" }, ({ payload }) => {
    if (payload && callbacks.onAttackEvent) {
      callbacks.onAttackEvent(payload as { attackerId: string; damage: number; isUlt?: boolean })
    }
  })

  // Match finished broadcast
  channel.on("broadcast", { event: "finished" }, ({ payload }) => {
    if (payload && callbacks.onMatchFinished) {
      callbacks.onMatchFinished(payload as { winnerId: string | null; isDraw: boolean })
    }
  })

  // Authoritative Postgres DB table changes
  channel.on(
    "postgres_changes",
    {
      event: "UPDATE",
      schema: "public",
      table: "multiplayer_matches",
      filter: `id=eq.${matchId}`,
    },
    (payload) => {
      if (payload.new && callbacks.onMatchUpdate) {
        callbacks.onMatchUpdate(payload.new as MultiplayerMatchRow)
      }
    }
  )

  // Presence tracking for opponent disconnect detection
  channel.on("presence", { event: "sync" }, () => {
    const presenceState = channel.presenceState()
    let oppFound = false
    for (const key in presenceState) {
      const presences = presenceState[key] as Array<{ playerId?: string }>
      if (presences.some((p) => p.playerId && p.playerId !== currentUserId)) {
        oppFound = true
        break
      }
    }
    callbacks.onOpponentPresenceChange?.(oppFound)
  })

  channel.on("presence", { event: "join" }, ({ newPresences }) => {
    const oppJoined = (newPresences as Array<{ playerId?: string }>).some(
      (p) => p.playerId && p.playerId !== currentUserId
    )
    if (oppJoined) {
      callbacks.onOpponentPresenceChange?.(true)
    }
  })

  channel.on("presence", { event: "leave" }, ({ leftPresences }) => {
    const oppLeft = (leftPresences as Array<{ playerId?: string }>).some(
      (p) => p.playerId && p.playerId !== currentUserId
    )
    if (oppLeft) {
      callbacks.onOpponentPresenceChange?.(false)
    }
  })

  channel.subscribe(async (status) => {
    if (status === "SUBSCRIBED" && currentUserId) {
      try {
        await channel.track({
          playerId: currentUserId,
          onlineAt: new Date().toISOString(),
        })
      } catch {
        // Suppress presence track error
      }
    }
  })


  const broadcastTelemetry = async (telemetry: MatchTelemetryPayload) => {
    try {
      await channel.send({
        type: "broadcast",
        event: "telemetry",
        payload: telemetry,
      })
    } catch {
      // Ignore broadcast errors
    }
  }

  const broadcastAttack = async (attackerId: string, damage: number, isUlt = false) => {
    try {
      await channel.send({
        type: "broadcast",
        event: "attack",
        payload: { attackerId, damage, isUlt },
      })
    } catch {
      // Ignore broadcast errors
    }
  }

  const broadcastMatchFinished = async (winnerId: string | null, isDraw: boolean) => {
    try {
      await channel.send({
        type: "broadcast",
        event: "finished",
        payload: { winnerId, isDraw },
      })
    } catch {
      // Ignore broadcast errors
    }
  }

  const unsubscribe = () => {
    try {
      supabase.removeChannel(channel)
    } catch {
      // Ignore
    }
  }

  return {
    broadcastTelemetry,
    broadcastAttack,
    broadcastMatchFinished,
    unsubscribe,
  }
}

