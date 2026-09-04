import { BattleHistoryEntry } from "@/types/battle"

export const BATTLE_HISTORY_STORAGE_KEY = "keyforge_battle_history_v1"
export const BATTLE_HISTORY_UPDATE_EVENT = "keyforge:battle-history-updated"
export const MAX_BATTLE_HISTORY_ENTRIES = 50

function isBrowser(): boolean {
  return typeof window !== "undefined"
}

/**
 * Load battle history from localStorage.
 * Returns array ordered newest-first.
 */
export function loadBattleHistory(): BattleHistoryEntry[] {
  if (!isBrowser()) return []

  try {
    const raw = localStorage.getItem(BATTLE_HISTORY_STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (item): item is BattleHistoryEntry =>
          item &&
          typeof item === "object" &&
          typeof item.id === "string" &&
          typeof item.enemyName === "string" &&
          typeof item.victory === "boolean" &&
          typeof item.battleWpm === "number"
      )
    }
    return []
  } catch (error) {
    console.error("[KeyForge History] Failed to load battle history:", error)
    return []
  }
}

/**
 * Adds a new battle to the persistent history.
 * Caps list to MAX_BATTLE_HISTORY_ENTRIES (50).
 */
export function addBattleHistoryEntry(
  entry: Omit<BattleHistoryEntry, "id" | "timestamp"> &
    Partial<Pick<BattleHistoryEntry, "id" | "timestamp">>
): BattleHistoryEntry {
  const fullEntry: BattleHistoryEntry = {
    ...entry,
    id: entry.id ?? `battle_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: entry.timestamp ?? new Date().toISOString(),
  }

  if (!isBrowser()) return fullEntry

  try {
    const current = loadBattleHistory()
    const updated = [fullEntry, ...current].slice(0, MAX_BATTLE_HISTORY_ENTRIES)

    localStorage.setItem(BATTLE_HISTORY_STORAGE_KEY, JSON.stringify(updated))

    window.dispatchEvent(
      new CustomEvent(BATTLE_HISTORY_UPDATE_EVENT, { detail: updated })
    )
  } catch (error) {
    console.error("[KeyForge History] Failed to save battle entry:", error)
  }

  return fullEntry
}

/**
 * Clears all battle history.
 */
export function clearBattleHistory(): void {
  if (!isBrowser()) return

  try {
    localStorage.removeItem(BATTLE_HISTORY_STORAGE_KEY)
    window.dispatchEvent(
      new CustomEvent(BATTLE_HISTORY_UPDATE_EVENT, { detail: [] })
    )
  } catch (error) {
    console.error("[KeyForge History] Failed to clear battle history:", error)
  }
}
