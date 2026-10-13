import { randomInt, randomUUID } from "node:crypto"
import { json, transaction, type Database, type Transaction } from "./database"
import { player, inventoryOf, exact, uuid } from "./players"
import { binding } from "./progression"
import { applyArenaTypingKey, createArenaTypingState } from "../src/lib/multiplayer/arenaTyping"
import { getWordsForMatch } from "../src/lib/multiplayer/wordGenerator"
import type { MultiplayerMatchRow, MultiplayerMatchResultRow } from "../src/types/database"
export const stateOf = (row: { state: unknown }) => row.state as MultiplayerMatchRow
export function member(match: MultiplayerMatchRow, userId: string) {
  if (![match.player_1_id, match.player_2_id].includes(userId)) throw Object.assign(new Error("Not a participant"), { statusCode: 403 })
  return match.player_1_id === userId ? "player_1" : "player_2"
}
export async function matchFor(tx: Transaction, id: string, userId: string) {
  if (!uuid(id)) throw new Error("Invalid match")
  const match = stateOf(await tx.match.findUniqueOrThrow({ where: { id } }))
  member(match, userId)
  // Derive the elapsed countdown on reads without overwriting concurrent combat state.
  if (match.status === "countdown" && match.started_at && Date.parse(match.started_at) <= Date.now()) match.status = "playing"
  return match
}
export async function saveMatch(tx: Transaction, match: MultiplayerMatchRow) {
  match.updated_at = new Date().toISOString()
  await tx.match.update({ where: { id: match.id }, data: { state: json(match), player2: match.player_2_id } })
  return match
}
async function create(tx: Transaction, userId: string, mode: "quick" | "private", language: "en" | "pt-BR") {
  const own = await player(tx, userId)
  const now = new Date().toISOString()
  const id = randomUUID()
  const match: MultiplayerMatchRow = {
    id, room_code: mode === "private" ? `KF-${randomInt(0x1000000).toString(16).toUpperCase().padStart(6, "0")}` : null,
    mode, status: "waiting", language, seed: randomInt(1000000), word_count: 30,
    player_1_id: userId, player_2_id: null, player_1_ready: false, player_2_ready: false,
    player_1_hp: 1000, player_2_hp: 1000, player_1_word_index: 0, player_2_word_index: 0,
    player_1_combo: 0, player_2_combo: 0, player_1_attack_energy: 0, player_2_attack_energy: 0,
    player_1_ultimate_energy: 0, player_2_ultimate_energy: 0,
    player_1_wpm: 0, player_2_wpm: 0, player_1_accuracy: 100, player_2_accuracy: 100,
    player_1_skin_id: inventoryOf(own).equippedSkinId, player_2_skin_id: "default_forge",
    winner_id: null, is_draw: false, countdown_starts_at: null, started_at: null, finished_at: null,
    player_1_last_active_at: now, player_2_last_active_at: null, created_at: now, updated_at: now,
  }
  await tx.match.create({ data: { id, roomCode: match.room_code, player1: userId, state: json(match) } })
  return match
}
function start(match: MultiplayerMatchRow) {
  match.status = "countdown"
  match.countdown_starts_at = new Date().toISOString()
  match.started_at = new Date(Date.now() + 3000).toISOString()
}
function finish(match: MultiplayerMatchRow, winner: string | null) {
  match.status = "finished"
  match.winner_id = winner
  match.is_draw = winner === null
  match.finished_at = new Date().toISOString()
}
export function resultOf(match: MultiplayerMatchRow): MultiplayerMatchResultRow | null {
  if (match.status !== "finished") return null
  return { id: match.id, match_id: match.id, mode: match.mode, winner_id: match.winner_id, loser_id: match.winner_id === match.player_1_id ? match.player_2_id : match.winner_id === match.player_2_id ? match.player_1_id : null, is_draw: match.is_draw,
    duration_seconds: Math.max(0, Math.round((Date.parse(match.finished_at!) - Date.parse(match.started_at!)) / 1000)),
    player_1_id: match.player_1_id, player_2_id: match.player_2_id,
    player_1_stats: { wpm: match.player_1_wpm, accuracy: match.player_1_accuracy, hp: match.player_1_hp, combo: match.player_1_combo, word_index: match.player_1_word_index },
    player_2_stats: { wpm: match.player_2_wpm, accuracy: match.player_2_accuracy, hp: match.player_2_hp, combo: match.player_2_combo, word_index: match.player_2_word_index },
    player_1_xp_earned: match.winner_id === match.player_1_id ? 120 : match.is_draw ? 75 : 40,
    player_2_xp_earned: match.winner_id === match.player_2_id ? 120 : match.is_draw ? 75 : 40, created_at: match.finished_at! }
}
export async function matchAction(db: Database, userId: string, input: unknown) {
  exact(input, ["action", "matchId", "roomCode", "mode", "language", "isReady", "eventId", "wordIndex", "attempts"])
  return transaction(db, async tx => {
    if (input.action === "create") {
      exact(input, ["action", "mode", "language"])
      if (!["quick", "private"].includes(String(input.mode)) || !["en", "pt-BR"].includes(String(input.language))) throw new Error("Invalid match")
      return create(tx, userId, input.mode as "quick" | "private", input.language as "en" | "pt-BR")
    }
    if (input.action === "join") {
      exact(input, ["action", "roomCode"])
      if (typeof input.roomCode !== "string" || !/^KF-[A-Z0-9]{4,8}$/.test(input.roomCode)) throw new Error("Invalid room")
      const row = await tx.match.findUniqueOrThrow({ where: { roomCode: input.roomCode } })
      const match = stateOf(row)
      if (match.player_1_id === userId || match.player_2_id === userId) return match
      if (match.status !== "waiting" || match.player_2_id) throw new Error("Room unavailable")
      const own = await player(tx, userId)
      match.player_2_id = userId
      match.player_2_skin_id = inventoryOf(own).equippedSkinId
      match.player_2_last_active_at = new Date().toISOString()
      return saveMatch(tx, match)
    }
    const match = await matchFor(tx, String(input.matchId), userId)
    const side = member(match, userId)
    const opponent = side === "player_1" ? "player_2" : "player_1"
    const now = new Date().toISOString()
    if (input.action === "word") {
      exact(input, ["action", "matchId", "eventId", "wordIndex", "attempts"])
      if (typeof input.eventId !== "string" || input.eventId.length < 1 || input.eventId.length > 100 || !Number.isInteger(input.wordIndex) || !Array.isArray(input.attempts) || input.attempts.length > 256 || input.attempts.some(key => typeof key !== "string" || (key !== "Backspace" && (Array.from(key).length !== 1 || /\p{C}/u.test(key))))) throw new Error("Invalid attempts")
      const digest = binding(input)
      const cached = await tx.matchEvent.findUnique({ where: { matchId_userId_eventId: { matchId: match.id, userId, eventId: input.eventId } } })
      if (cached) { if (cached.binding !== digest) throw new Error("Replay changed"); return match }
      if (match.status === "countdown" && Date.parse(match.started_at!) <= Date.now()) match.status = "playing"
      if (match.status !== "playing" || input.wordIndex !== match[`${side}_word_index`]) throw new Error("Invalid sequence")
      const word = getWordsForMatch(match)[input.wordIndex as number]
      if (!word) throw new Error("No word")
      const previous = await tx.matchEvent.findMany({ where: { matchId: match.id, userId } })
      const prior = previous.map(event => event.data as Record<string, number>)
      let typed = { ...createArenaTypingState(), combo: match[`${side}_combo`] }
      for (const key of input.attempts as string[]) {
        if (typed.completed) throw new Error("Extra attempts")
        typed = applyArenaTypingKey(typed, word, key)
      }
      if (!typed.completed) throw new Error("Incomplete word")
      const attempts = typed.totalChars + prior.reduce((sum, data) => sum + data.attempts, 0)
      const correct = typed.correctChars + prior.reduce((sum, data) => sum + data.correct, 0)
      const elapsed = Math.max(0, Date.now() - Date.parse(match.started_at!))
      // Cumulative server time accepts packet bursts without trusting client timing.
      if (attempts > 26 * (elapsed / 1000 + 0.5)) throw new Error("Impossible typing speed")
      const wpm = Math.round(correct * 12 / Math.max(3, elapsed / 1000))
      if (wpm > 260) throw new Error("Impossible typing speed")
      const accuracy = Math.round(correct / Math.max(1, attempts) * 100)
      const energy = match[`${side}_attack_energy`] + 25 + (accuracy >= 98 ? 5 : 0) + (typed.combo >= 10 ? 5 : 0)
      const damage = energy >= 100 ? Math.round(70 * (1 + Math.min(1.5, typed.combo * .05)) * Math.max(.5, accuracy / 100)) : 0
      match[`${side}_attack_energy`] = energy >= 100 ? energy - 100 : energy
      match[`${opponent}_hp`] = Math.max(0, match[`${opponent}_hp`] - damage)
      match[`${side}_word_index`]++
      match[`${side}_combo`] = typed.combo
      match[`${side}_wpm`] = wpm
      match[`${side}_accuracy`] = accuracy
      match[`${side}_last_active_at`] = now
      await tx.matchEvent.create({ data: { matchId: match.id, userId, eventId: input.eventId, binding: digest, data: json({ attempts: typed.totalChars, correct: typed.correctChars, errors: typed.errors, combo: typed.combo, damage, wordIndex: input.wordIndex, keys: input.attempts }) } })
      if (match[`${opponent}_hp`] === 0) finish(match, userId)
      else if (match[`${side}_word_index`] >= match.word_count) finish(match, match.player_1_hp === match.player_2_hp ? null : match.player_1_hp > match.player_2_hp ? match.player_1_id : match.player_2_id)
    } else if (input.action === "ready") {
      exact(input, ["action", "matchId", "isReady"])
      if (typeof input.isReady !== "boolean" || !["waiting", "ready"].includes(match.status)) throw new Error("Invalid ready")
      match[`${side}_ready`] = input.isReady
      if (match.player_1_ready && match.player_2_ready && match.player_2_id) start(match)
    } else {
      exact(input, ["action", "matchId"])
      if (input.action === "heartbeat") {
        if (!["finished", "cancelled"].includes(match.status)) match[`${side}_last_active_at`] = now
        if (match.status === "countdown" && Date.parse(match.started_at!) <= Date.now()) match.status = "playing"
      } else if (input.action === "forfeit") {
        if (["playing", "countdown"].includes(match.status) && match.player_2_id) finish(match, match[`${opponent}_id`])
        else if (!["finished", "cancelled"].includes(match.status)) {
          if (side === "player_2") { match.player_2_id = null; match.player_2_ready = false; match.player_1_ready = false; match.player_2_last_active_at = null; match.status = "waiting" }
          else match.status = "cancelled"
        }
      } else if (input.action === "disconnect") {
        if (!["playing", "countdown"].includes(match.status) || !match[`${opponent}_last_active_at`] || Date.now() - Date.parse(match[`${opponent}_last_active_at`]!) < 15000) throw new Error("Opponent still active")
        finish(match, userId)
      } else if (input.action === "cancel") {
        if (match.player_1_id !== userId || !["waiting", "ready"].includes(match.status)) throw new Error("Cannot cancel")
        match.status = "cancelled"
      } else throw new Error("Unknown action")
    }
    return saveMatch(tx, match)
  })
}
export async function queueAction(db: Database, userId: string, input: unknown) {
  exact(input, ["action", "language"])
  return transaction(db, async tx => {
    // Serialize pairing, cancellation and bot handoff across processes.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(743612)`
    const own = await tx.queue.findUnique({ where: { userId } })
    if (own?.matchId) {
      const linked = await tx.match.findUnique({ where: { id: own.matchId } })
      if (linked && !["finished", "cancelled"].includes(stateOf(linked).status)) {
        if (input.action === "leave") await tx.queue.delete({ where: { userId } })
        return { status: "matched", matchId: own.matchId }
      }
      await tx.queue.delete({ where: { userId } })
    }
    if (input.action === "leave" || input.action === "practice") {
      await tx.queue.deleteMany({ where: { userId } }); return { status: "searching" }
    }
    if (input.action === "check") return { status: "searching" }
    if (input.action !== "enter" || !["en", "pt-BR"].includes(String(input.language))) throw new Error("Invalid queue")
    await tx.queue.deleteMany({ where: { updatedAt: { lt: new Date(Date.now() - 30000) }, matchId: null } })
    const waiting = await tx.queue.findFirst({ where: { userId: { not: userId }, language: String(input.language), matchId: null }, orderBy: { updatedAt: "asc" } })
    if (waiting) {
      const match = await create(tx, waiting.userId, "quick", input.language as "en" | "pt-BR")
      const row = await player(tx, userId)
      match.player_2_id = userId; match.player_2_skin_id = inventoryOf(row).equippedSkinId
      match.player_1_ready = true; match.player_2_ready = true; match.player_2_last_active_at = new Date().toISOString()
      match.status = "playing"; match.started_at = new Date().toISOString()
      await saveMatch(tx, match)
      await tx.queue.update({ where: { userId: waiting.userId }, data: { matchId: match.id } })
      await tx.queue.upsert({ where: { userId }, create: { userId, language: match.language, matchId: match.id }, update: { matchId: match.id } })
      return { status: "matched", matchId: match.id }
    }
    await tx.queue.upsert({ where: { userId }, create: { userId, language: String(input.language) }, update: { language: String(input.language) } })
    return { status: "searching" }
  })
}
