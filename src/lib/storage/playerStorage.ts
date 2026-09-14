import {
  PlayerProfile,
  createDefaultPlayerProfile,
  createDefaultMultiplayerStats,
  syncCampaignSummary,
} from "@/types/player"

export const STORAGE_KEY_V1 = "keyforge_player_v1"
export const STORAGE_KEY_V2 = "keyforge_player_v2"
export const STORAGE_KEY = "keyforge_player_v3"
export const CURRENT_SAVE_VERSION = 3
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
function isValidProfileShape(obj: unknown): obj is Partial<PlayerProfile> {
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
 * - Safely migrates v1 and v2 saves to v3 without data loss.
 * - Gracefully recovers if localStorage data is corrupted, empty, or incomplete.
 */
export function loadPlayerProfile(): PlayerProfile {
  if (!isBrowser()) {
    return createDefaultPlayerProfile()
  }

  try {
    // 1. Try loading v3 save
    const rawV3 = localStorage.getItem(STORAGE_KEY)
    if (rawV3) {
      const parsedV3 = JSON.parse(rawV3) as Partial<PlayerSaveData>

      if (
        parsedV3 &&
        typeof parsedV3 === "object" &&
        parsedV3.player &&
        isValidProfileShape(parsedV3.player)
      ) {
        const defaultProfile = createDefaultPlayerProfile()
        const merged: PlayerProfile = {
          ...defaultProfile,
          ...parsedV3.player,
          attributes: {
            ...defaultProfile.attributes,
            ...(parsedV3.player.attributes ?? {}),
          },
          stats: {
            ...defaultProfile.stats,
            ...(parsedV3.player.stats ?? {}),
          },
          multiplayerStats: {
            ...createDefaultMultiplayerStats(),
            ...(parsedV3.player.multiplayerStats ?? {}),
          },
          campaignProgress: {
            ...defaultProfile.campaignProgress,
            ...(parsedV3.player.campaignProgress ?? {}),
          },
          keyErrors: {
            ...(parsedV3.player.keyErrors ?? {}),
          },
          achievements: parsedV3.player.achievements ?? defaultProfile.achievements ?? [],
          worldBaselines: parsedV3.player.worldBaselines ?? {},
          worldIntroSeen: parsedV3.player.worldIntroSeen ?? {},
          onboardingCompleted: parsedV3.player.onboardingCompleted ?? false,
          skillProfile: parsedV3.player.skillProfile,
        }
        return syncCampaignSummary(merged)
      }

      console.warn("[KeyForge Storage] Corrupted v3 save data detected. Attempting recovery...")
    }

    // 2. Migration: Check for v2 save data
    const rawV2 = localStorage.getItem(STORAGE_KEY_V2)
    if (rawV2) {
      try {
        const parsedV2 = JSON.parse(rawV2) as Partial<{ version: number; player: PlayerProfile }>
        if (
          parsedV2 &&
          typeof parsedV2 === "object" &&
          parsedV2.player &&
          isValidProfileShape(parsedV2.player)
        ) {
          console.info("[KeyForge Storage] Migrating save data from v2 to v3...")
          const defaultProfile = createDefaultPlayerProfile(parsedV2.player.username)

          const hasPlayed =
            (parsedV2.player.stats?.battlesPlayed ?? 0) > 0 ||
            (parsedV2.player.level ?? 1) > 1

          const migratedV2: PlayerProfile = syncCampaignSummary({
            ...defaultProfile,
            ...parsedV2.player,
            attributes: {
              ...defaultProfile.attributes,
              ...(parsedV2.player.attributes ?? {}),
            },
            stats: {
              ...defaultProfile.stats,
              ...(parsedV2.player.stats ?? {}),
            },
            multiplayerStats: {
              ...createDefaultMultiplayerStats(),
              ...(parsedV2.player.multiplayerStats ?? {}),
            },
            campaignProgress: {
              ...defaultProfile.campaignProgress,
              ...(parsedV2.player.campaignProgress ?? {}),
            },
            keyErrors: {
              ...(parsedV2.player.keyErrors ?? {}),
            },
            achievements: parsedV2.player.achievements ?? defaultProfile.achievements ?? [],
            worldBaselines: parsedV2.player.worldBaselines ?? {},
            worldIntroSeen: parsedV2.player.worldIntroSeen ?? {},
            // Existing players skip first-time onboarding
            onboardingCompleted: parsedV2.player.onboardingCompleted ?? hasPlayed,
            updatedAt: new Date().toISOString(),
          })

          savePlayerProfile(migratedV2)
          return migratedV2
        }
      } catch (mig2Error) {
        console.warn("[KeyForge Storage] Could not parse v2 save during migration:", mig2Error)
      }
    }

    // 3. Migration: Check for legacy v1 save data
    const rawV1 = localStorage.getItem(STORAGE_KEY_V1)
    if (rawV1) {
      try {
        const parsedV1 = JSON.parse(rawV1) as Partial<{ version: number; player: PlayerProfile }>

        if (
          parsedV1 &&
          typeof parsedV1 === "object" &&
          parsedV1.player &&
          isValidProfileShape(parsedV1.player)
        ) {
          console.info("[KeyForge Storage] Migrating save data from v1 to v3...")
          const defaultProfile = createDefaultPlayerProfile(parsedV1.player.username)

          const migratedProfile: PlayerProfile = syncCampaignSummary({
            ...defaultProfile,
            ...parsedV1.player,
            attributes: {
              ...defaultProfile.attributes,
              ...(parsedV1.player.attributes ?? {}),
            },
            stats: {
              ...defaultProfile.stats,
              ...(parsedV1.player.stats ?? {}),
            },
            academyProgress: parsedV1.player.academyProgress ?? {},
            campaignProgress: defaultProfile.campaignProgress,
            achievements: parsedV1.player.achievements ?? [],
            worldBaselines: {},
            worldIntroSeen: {},
            onboardingCompleted: true,
            updatedAt: new Date().toISOString(),
          })

          savePlayerProfile(migratedProfile)
          return migratedProfile
        }
      } catch (migError) {
        console.warn("[KeyForge Storage] Could not parse v1 save during migration:", migError)
      }
    }

    // 4. New player: create safe default v3 profile
    const defaultProfile = syncCampaignSummary(createDefaultPlayerProfile())
    savePlayerProfile(defaultProfile)
    return defaultProfile
  } catch (error) {
    console.error("[KeyForge Storage] Failed to load player profile from localStorage:", error)
    const fallback = syncCampaignSummary(createDefaultPlayerProfile())
    savePlayerProfile(fallback)
    return fallback
  }
}

/**
 * Save player profile to localStorage under v3 key.
 * Dispatches a custom window event for reactive UI updates across components.
 */
export function savePlayerProfile(profile: PlayerProfile): boolean {
  if (!isBrowser()) return false

  try {
    const updatedProfile: PlayerProfile = syncCampaignSummary({
      ...profile,
      updatedAt: new Date().toISOString(),
    })

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
 * Cleans v1, v2 and v3 keys.
 */
export function resetPlayerProfile(): PlayerProfile {
  if (isBrowser()) {
    localStorage.removeItem(STORAGE_KEY_V1)
    localStorage.removeItem(STORAGE_KEY_V2)
    localStorage.removeItem(STORAGE_KEY)
  }
  const fresh = createDefaultPlayerProfile()
  savePlayerProfile(fresh)
  return fresh
}
