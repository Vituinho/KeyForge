/**
 * KeyForge useCosmetics Hook
 * Unifies local guest cosmetics with Supabase cloud persistence.
 * Reactive across components and tabs via useSyncExternalStore.
 */

"use client"

import { scopedStorageKey } from "@/lib/storage/progressionTrust"
import { useSyncExternalStore, useCallback, useEffect, useMemo, useRef } from "react"
import {
  PlayerCosmeticsState,
  KeyboardAccessibilitySettings,
  createDefaultCosmeticsState,
  DEFAULT_KEYBOARD_ACCESSIBILITY,
  KeyboardSkin,
  CosmeticUnlockResult,
} from "@/types/cosmetics"
import {
  loadCosmeticsState,
  saveCosmeticsState,
  loadKeyboardAccessibilitySettings,
  saveKeyboardAccessibilitySettings,
  COSMETICS_STORAGE_KEY,
  KEYBOARD_SETTINGS_STORAGE_KEY,
  COSMETICS_UPDATE_EVENT,
  KEYBOARD_SETTINGS_UPDATE_EVENT,
} from "@/lib/storage/cosmeticsStorage"
import {
  saveEquippedSkinCloud,
  saveAccessibilitySettingsCloud,
  unlockCosmeticCloud,
  updateCrateCloud,
  updateShardsCloud,
  syncLocalToCloud,
  openCrateCloud,
  fetchCloudCosmetics,
  purchaseCrateCloud,
} from "@/lib/storage/cloudCosmeticsStorage"
import { useAuth } from "@/lib/auth/authContext"
import { getSkinById } from "@/data/keyboardSkins"
import { ALL_CRATES, rollCrateDrop } from "@/data/crates"

// Cosmetics listeners
const cosmeticsListeners = new Set<() => void>()
function notifyCosmeticsSubscribers() {
  cosmeticsListeners.forEach((fn) => fn())
}

function subscribeCosmetics(callback: () => void) {
  cosmeticsListeners.add(callback)
  const handleCustom = () => callback()
  const handleStorage = (e: StorageEvent) => {
    if (e.key === COSMETICS_STORAGE_KEY) {
      callback()
    }
  }

  if (typeof window !== "undefined") {
    window.addEventListener(COSMETICS_UPDATE_EVENT, handleCustom)
    window.addEventListener("storage", handleStorage)
  }

  return () => {
    cosmeticsListeners.delete(callback)
    if (typeof window !== "undefined") {
      window.removeEventListener(COSMETICS_UPDATE_EVENT, handleCustom)
      window.removeEventListener("storage", handleStorage)
    }
  }
}

// Settings listeners
const settingsListeners = new Set<() => void>()
function subscribeSettings(callback: () => void) {
  settingsListeners.add(callback)
  const handleCustom = () => callback()
  const handleStorage = (e: StorageEvent) => {
    if (e.key === KEYBOARD_SETTINGS_STORAGE_KEY) {
      callback()
    }
  }

  if (typeof window !== "undefined") {
    window.addEventListener(KEYBOARD_SETTINGS_UPDATE_EVENT, handleCustom)
    window.addEventListener("storage", handleStorage)
  }

  return () => {
    settingsListeners.delete(callback)
    if (typeof window !== "undefined") {
      window.removeEventListener(KEYBOARD_SETTINGS_UPDATE_EVENT, handleCustom)
      window.removeEventListener("storage", handleStorage)
    }
  }
}

// Cache snapshots for referential stability
const serverCosmetics = createDefaultCosmeticsState()
let openingCrate = false // Shared across hook instances; only one inventory transaction at a time.
function readStorage(key: string): string | null {
  try { return localStorage.getItem(key) } catch { return null }
}
let cachedCosmetics: PlayerCosmeticsState | null = null
let cachedCosmeticsRaw: string | null = null
let cachedCosmeticsKey = ''

function getCosmeticsSnapshot(): PlayerCosmeticsState {
  if (typeof window === "undefined") {
    return serverCosmetics
  }
  const raw = readStorage(scopedStorageKey(COSMETICS_STORAGE_KEY))
  if (raw !== cachedCosmeticsRaw || !cachedCosmetics || cachedCosmeticsKey !== scopedStorageKey(COSMETICS_STORAGE_KEY)) {
    cachedCosmeticsKey = scopedStorageKey(COSMETICS_STORAGE_KEY)
    cachedCosmeticsRaw = raw
    cachedCosmetics = loadCosmeticsState()
  }
  return cachedCosmetics
}

let cachedSettings: KeyboardAccessibilitySettings | null = null
let cachedSettingsRaw: string | null = null

function getSettingsSnapshot(): KeyboardAccessibilitySettings {
  if (typeof window === "undefined") {
    return DEFAULT_KEYBOARD_ACCESSIBILITY
  }
  const raw = readStorage(KEYBOARD_SETTINGS_STORAGE_KEY)
  if (raw !== cachedSettingsRaw || !cachedSettings) {
    cachedSettingsRaw = raw
    cachedSettings = loadKeyboardAccessibilitySettings()
  }
  return cachedSettings
}

export function getServerCosmeticsSnapshot(): PlayerCosmeticsState {
  return serverCosmetics
}

function getServerSettingsSnapshot(): KeyboardAccessibilitySettings {
  return DEFAULT_KEYBOARD_ACCESSIBILITY
}

export function useCosmetics() {
  const cosmetics = useSyncExternalStore(
    subscribeCosmetics,
    getCosmeticsSnapshot,
    getServerCosmeticsSnapshot
  )

  const settings = useSyncExternalStore(
    subscribeSettings,
    getSettingsSnapshot,
    getServerSettingsSnapshot
  )

  const { user, isAuthenticated } = useAuth()
  const isGuest = !isAuthenticated || !user || user.isGuest
  const userId = user && !user.isGuest ? user.id : null
  const syncedUserIdRef = useRef<string | null>(null)

  // Cloud sync on user login or change
  useEffect(() => {
    if (userId && syncedUserIdRef.current !== userId) {
      syncedUserIdRef.current = userId
      syncLocalToCloud(userId, cosmetics)
        .then((merged) => {
          saveCosmeticsState(merged)
          notifyCosmeticsSubscribers()
        })
        .catch((err) => {
          console.warn("[useCosmetics] Cloud sync warning:", err)
        })
    }
  }, [userId, cosmetics])

  // Resolved equipped skin
  const equippedSkin = useMemo<KeyboardSkin>(() => {
    return getSkinById(cosmetics.equippedSkinId)
  }, [cosmetics.equippedSkinId])

  // Check if skin is unlocked
  const isSkinUnlocked = useCallback(
    (skinId: string): boolean => {
      return cosmetics.unlockedSkinIds.includes(skinId)
    },
    [cosmetics.unlockedSkinIds]
  )

  // Equip Skin
  const equipSkin = useCallback(
    async (skinId: string): Promise<boolean> => {
      const current = loadCosmeticsState()
      if (!current.unlockedSkinIds.includes(skinId)) {
        console.warn(`[useCosmetics] Cannot equip locked skin: ${skinId}`)
        return false
      }

      if (userId && !await saveEquippedSkinCloud(userId, skinId)) return false

      const next: PlayerCosmeticsState = {
        ...current,
        equippedSkinId: skinId,
        updatedAt: new Date().toISOString(),
      }

      saveCosmeticsState(next)
      notifyCosmeticsSubscribers()



      return true
    },
    [userId]
  )

  // Unlock Skin
  const unlockSkin = useCallback(
    async (skinId: string): Promise<boolean> => {
      if(userId) return false
      const current = loadCosmeticsState()
      if (current.unlockedSkinIds.includes(skinId)) {
        return false // already unlocked
      }

      const next: PlayerCosmeticsState = {
        ...current,
        unlockedSkinIds: [...current.unlockedSkinIds, skinId],
        updatedAt: new Date().toISOString(),
      }

      saveCosmeticsState(next)
      notifyCosmeticsSubscribers()

      if (userId) {
        unlockCosmeticCloud(userId, skinId).catch((err) => {
          console.warn("[useCosmetics] Failed to sync unlock to cloud:", err)
        })
      }

      return true
    },
    [userId]
  )

  // Add Crates
  const addCrates = useCallback(
    (crateId: string, count = 1) => {
      if(userId) return
      const current = loadCosmeticsState()
      const existing = current.crates[crateId] ?? 0
      const nextQuantity = existing + count

      const next: PlayerCosmeticsState = {
        ...current,
        crates: {
          ...current.crates,
          [crateId]: nextQuantity,
        },
        updatedAt: new Date().toISOString(),
      }

      saveCosmeticsState(next)
      notifyCosmeticsSubscribers()

      if (userId) {
        updateCrateCloud(userId, crateId, nextQuantity).catch((err) => {
          console.warn("[useCosmetics] Failed to sync crates to cloud:", err)
        })
      }
    },
    [userId]
  )

  // Consume a Crate
  const consumeCrate = useCallback(
    (crateId: string): boolean => {
      if(userId) return false
      const current = loadCosmeticsState()
      const existing = current.crates[crateId] ?? 0
      if (existing <= 0) return false

      const nextQuantity = existing - 1
      const updatedCrates = { ...current.crates }
      if (nextQuantity <= 0) {
        delete updatedCrates[crateId]
      } else {
        updatedCrates[crateId] = nextQuantity
      }

      const next: PlayerCosmeticsState = {
        ...current,
        crates: updatedCrates,
        updatedAt: new Date().toISOString(),
      }

      saveCosmeticsState(next)
      notifyCosmeticsSubscribers()

      if (userId) {
        updateCrateCloud(userId, crateId, nextQuantity).catch((err) => {
          console.warn("[useCosmetics] Failed to sync consumed crate to cloud:", err)
        })
      }

      return true
    },
    [userId]
  )

  // Add Forge Shards
  const addShards = useCallback(
    (amount: number) => {
      if(userId) return
      if (amount <= 0) return
      const current = loadCosmeticsState()
      const nextShards = current.forgeShards + amount

      const next: PlayerCosmeticsState = {
        ...current,
        forgeShards: nextShards,
        updatedAt: new Date().toISOString(),
      }

      saveCosmeticsState(next)
      notifyCosmeticsSubscribers()

      if (userId) {
        updateShardsCloud(userId, nextShards).catch((err) => {
          console.warn("[useCosmetics] Failed to sync shards to cloud:", err)
        })
      }
    },
    [userId]
  )

  // Update Settings
  const updateSettings = useCallback(
    (partial: Partial<KeyboardAccessibilitySettings>) => {
      const current = loadKeyboardAccessibilitySettings()
      const next: KeyboardAccessibilitySettings = {
        ...current,
        ...partial,
      }

      saveKeyboardAccessibilitySettings(next)

      if (userId) {
        saveAccessibilitySettingsCloud(userId, next).catch((err) => {
          console.warn("[useCosmetics] Failed to sync settings to cloud:", err)
        })
      }
    },
    [userId]
  )

  // Authenticated rewards require the server. Offline rolls are guest-only.
  const openCrate = useCallback(
    async (crateId: string): Promise<CosmeticUnlockResult | null> => {
      if (openingCrate) return null
      openingCrate = true
      try {
      const current = loadCosmeticsState()
      const existing = current.crates[crateId] ?? 0
      if (!userId && existing <= 0) return null

      if (userId) {
        // Try server-authoritative RPC
        const cloudResult = await openCrateCloud(crateId)
        if (cloudResult) {
          const cloud=await fetchCloudCosmetics(userId)
          if(cloud) {saveCosmeticsState(cloud);notifyCosmeticsSubscribers()}
          return cloudResult
        }
        return null
      }

      // Guest inventory is local and has no competitive authority.
      const drop = rollCrateDrop(crateId, current.unlockedSkinIds)

      const nextQuantity = existing - 1
      const updatedCrates = { ...current.crates }
      if (nextQuantity <= 0) {
        delete updatedCrates[crateId]
      } else {
        updatedCrates[crateId] = nextQuantity
      }

      const nextUnlocked = drop.isDuplicate
        ? current.unlockedSkinIds
        : [...current.unlockedSkinIds, drop.skin.id]

      const nextShards = current.forgeShards + drop.shardsAwarded

      const next: PlayerCosmeticsState = {
        ...current,
        unlockedSkinIds: nextUnlocked,
        crates: updatedCrates,
        forgeShards: nextShards,
        updatedAt: new Date().toISOString(),
      }

      saveCosmeticsState(next)
      notifyCosmeticsSubscribers()

      if (userId) {
        updateCrateCloud(userId, crateId, nextQuantity).catch(() => {})
        if (drop.isDuplicate && drop.shardsAwarded > 0) {
          updateShardsCloud(userId, nextShards).catch(() => {})
        } else if (!drop.isDuplicate) {
          unlockCosmeticCloud(userId, drop.skin.id).catch(() => {})
        }
      }

      return drop
      } finally {
        openingCrate = false
      }
    },
    [userId]
  )

  const forgeCrate=useCallback(async (crateId:string):Promise<boolean>=>{
    if(openingCrate) return false
    openingCrate=true
    try {
      const crate=ALL_CRATES.find(c=>c.id===crateId)
      if(!crate) return false
      if(userId) {
        if(!await purchaseCrateCloud(crateId)) return false
        const cloud=await fetchCloudCosmetics(userId)
        if(cloud) saveCosmeticsState(cloud)
      } else {
        const current=loadCosmeticsState()
        if(current.forgeShards<crate.costShards) return false
        saveCosmeticsState({...current,forgeShards:current.forgeShards-crate.costShards,crates:{...current.crates,[crateId]:(current.crates[crateId]??0)+1}})
      }
      notifyCosmeticsSubscribers()
      return true
    } finally {openingCrate=false}
  },[userId])

  return {
    forgeCrate,
    cosmetics,
    settings,
    equippedSkin,
    equippedSkinId: cosmetics.equippedSkinId,
    unlockedSkinIds: cosmetics.unlockedSkinIds,
    crates: cosmetics.crates,
    forgeShards: cosmetics.forgeShards,
    isSkinUnlocked,
    equipSkin,
    unlockSkin,
    addCrates,
    consumeCrate,
    openCrate,
    addShards,
    updateSettings,
    isGuest,
  }
}
