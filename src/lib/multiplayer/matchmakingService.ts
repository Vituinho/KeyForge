import { backend } from "@/lib/backend/client"
import { getStoredUser } from "@/lib/auth/authService"
import { createMatch, saveLocalMatch } from "@/lib/multiplayer/matchService"

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
 * Checks for waiting human players via backend RPC or local fallback.
 */
export async function enterMatchmakingQueue(
  params: QueueEntryParams
): Promise<MatchmakingResult> {
  if(!getStoredUser().isGuest) {try {return await backend<MatchmakingResult>('queue',{action:'enter',language:params.language})} catch(error) {return {status:'error',error:error instanceof Error?error.message:'Matchmaking unavailable'}}}

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
  if(!getStoredUser().isGuest) {try {await backend('queue',{action:'leave'})} catch {}}
  localQueueStore.delete(userId)
}

/**
 * Creates an immediate match against a balanced Shadow Shinobi.
 */
export async function createShadowMatch(
  params: QueueEntryParams
): Promise<MatchmakingResult> {
  // Atomically close searching: a human match won by the queue must not be replaced by a bot.
  if(!getStoredUser().isGuest) {const result=await backend<MatchmakingResult>('queue',{action:'practice'});if(result.status==='matched') return result}
  const shadow = createShadowOpponent(params)

  const match = await createMatch({
    localPractice: true,
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

  let cancelled=false,busy=false,elapsed=0
  onStatusChange({status:'searching',elapsedSeconds:0})
  const timer=setInterval(async()=>{
    if(cancelled||busy) return
    busy=true;elapsed++
    try {
      const result=elapsed>=timeoutSeconds?await createShadowMatch(queueParams):!getStoredUser().isGuest?await backend<MatchmakingResult>('queue',{action:'check'}):localQueueStore.get(userId)?.matchedMatchId?{status:'matched',matchId:localQueueStore.get(userId)?.matchedMatchId} as MatchmakingResult:{status:'searching'} as MatchmakingResult
      if(cancelled) return
      if(result.status==='matched') {cancelled=true;clearInterval(timer);onStatusChange({status:'matched',matchedMatchId:result.matchId,opponent:result.opponent,elapsedSeconds:elapsed})}
      else onStatusChange({status:'searching',elapsedSeconds:elapsed})
    } catch(error) {if(!cancelled) onStatusChange({status:'error',error:error instanceof Error?error.message:'Matchmaking unavailable',elapsedSeconds:elapsed})}
    finally {busy=false}
  },1000)
  return()=>{cancelled=true;clearInterval(timer);void leaveMatchmakingQueue(userId)}
}
