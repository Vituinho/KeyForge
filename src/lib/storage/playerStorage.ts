import { PlayerProfile, createDefaultPlayerProfile } from "@/types/player"

export const STORAGE_KEY = "keyforge_player_v1"
export const CURRENT_SAVE_VERSION = 1
export const PLAYER_UPDATE_EVENT = "keyforge:player-updated"

export interface PlayerSaveData {
  version: number
  player: PlayerProfile
}

function isBrowser(): boolean {
  return typeof window !== "undefined"
}

/**
 * Validates whether an object matches the minimal viable structure of PlayerProfile.
 */
function isValidProfileShape(obj: unknown): obj is PlayerProfile {
  if (!obj || typeof obj !== "object") return false
  const p = obj as Record<string, unknown>
  return (
    typeof p.id === "string" &&
    typeof p.username === "string" &&
    typeof p.level === "number" &&
    typeof p.xp === "number" &&
    typeof p.rank === "string" &&
    typeof p.stats === "object" &&
    p.stats !== null
  )
}

/**
 * Load the local player profile.
 * - Safely handles SSR.
 * - Auto-creates default profile on first visit.
 * - Gracefully recovers if localStorage data is corrupted, empty, or incomplete.
 */
export function loadPlayerProfile(): PlayerProfile {
  if (!isBrowser()) {
    return createDefaultPlayerProfile()
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const defaultProfile = createDefaultPlayerProfile()
      savePlayerProfile(defaultProfile)
      return defaultProfile
    }

    const parsed = JSON.parse(raw) as Partial<PlayerSaveData>

    // Check version and shape
    if (parsed && typeof parsed === "object" && parsed.player && isValidProfileShape(parsed.player)) {
      // Merge with default profile to ensure future schema additions are populated
      const defaultProfile = createDefaultPlayerProfile()
      return {
        ...defaultProfile,
        ...parsed.player,
        attributes: {
          ...defaultProfile.attributes,
          ...(parsed.player.attributes ?? {}),
        },
        stats: {
          ...defaultProfile.stats,
          ...(parsed.player.stats ?? {}),
        },
      }
    }

    // Invalid format — reset safely
    console.warn("[KeyForge Storage] Corrupted save data detected. Restoring safe default profile.")
    const fallback = createDefaultPlayerProfile()
    savePlayerProfile(fallback)
    return fallback
  } catch (error) {
    console.error("[KeyForge Storage] Failed to load player profile from localStorage:", error)
    const fallback = createDefaultPlayerProfile()
    savePlayerProfile(fallback)
    return fallback
  }
}

/**
 * Save player profile to localStorage.
 * Dispatches a custom window event for reactive UI updates across components.
 */
export function savePlayerProfile(profile: PlayerProfile): boolean {
  if (!isBrowser()) return false

  try {
    const updatedProfile: PlayerProfile = {
      ...profile,
      updatedAt: new Date().toISOString(),
    }

    const payload: PlayerSaveData = {
      version: CURRENT_SAVE_VERSION,
      player: updatedProfile,
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))

    // Notify listeners in other components
    window.dispatchEvent(
      new CustomEvent(PLAYER_UPDATE_EVENT, { detail: updatedProfile })
    )

    return true
  } catch (error) {
    console.error("[KeyForge Storage] Failed to save player profile to localStorage:", error)
    return false
  }
}

/**
 * Resets local player progress back to default.
 */
export function resetPlayerProfile(): PlayerProfile {
  const fresh = createDefaultPlayerProfile()
  savePlayerProfile(fresh)
  return fresh
}
