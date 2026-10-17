import { backend } from "../backend/client"
import type { MultiplayerMatchRow } from "../../types/database"

type Participants = Pick<MultiplayerMatchRow, "id" | "player_1_id" | "player_2_id">

/** Resolve public names through the existing authenticated, shared-match endpoint. */
export async function loadArenaUsernames(match: Participants): Promise<Record<string, string>> {
  if (match.id.startsWith("match_")) return {}
  const ids = [...new Set([match.player_1_id, match.player_2_id])]
    .filter((id): id is string => typeof id === "string" && Boolean(id) && !id.startsWith("shadow_") && !id.startsWith("guest_"))
  const names: Record<string, string> = {}
  await Promise.all(ids.map(async id => {
    try {
      const identity = await backend<{ id: string; username: string }>(`players/${encodeURIComponent(id)}`)
      if (identity.id === id && typeof identity.username === "string" && identity.username.trim()) names[id] = identity.username
    } catch { /* Keep safe labels if the session or identity lookup is unavailable. */ }
  }))
  return names
}

export function arenaPlayerName(id: string | null, names: Record<string, string>, fallback: string): string {
  if (id?.startsWith("shadow_")) {
    const name = id.slice("shadow_".length).replace(/_/g, " ").trim()
    return name ? name.split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ") : fallback
  }
  return (id && names[id]) || fallback
}
