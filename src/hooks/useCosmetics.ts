/**
 * KeyForge useCosmetics Hook
 * Unifies local guest cosmetics with Supabase cloud persistence.
 * Reactive across components and tabs via useSyncExternalStore.
 */

"use client"

import { useSyncExternalStore, useCallback, useEffect, useMemo, useRef } from "react"
import {
  PlayerCosmeticsState,
  KeyboardAccessibilitySettings,
  createDefaultCosmeticsState,
  DEFAULT_KEYBOARD_ACCESSIBILITY,
  KeyboardSkin,
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
} from "@/lib/storage/cloudCosmeticsStorage"
import { useAuth } from "@/lib/auth/authContext"
import { getSkinById } from "@/data/keyboardSkins"

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
let cachedCosmetics: PlayerCosmeticsState | null = null
let cachedCosmeticsRaw: string | null = null

function getCosmeticsSnapshot(): PlayerCosmeticsState {
  if (typeof window === "undefined") {
    return createDefaultCosmeticsState()
  }
  const raw = localStorage.getItem(COSMETICS_STORAGE_KEY)
  if (raw !== cachedCosmeticsRaw || !cachedCosmetics) {
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
  const raw = localStorage.getItem(KEYBOARD_SETTINGS_STORAGE_KEY)
  if (raw !== cachedSettingsRaw || !cachedSettings) {
    cachedSettingsRaw = raw
    cachedSettings = loadKeyboardAccessibilitySettings()
  }
  return cachedSettings
}

function getServerCosmeticsSnapshot(): PlayerCosmeticsState {
  return createDefaultCosmeticsState()
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

      const next: PlayerCosmeticsState = {
        ...current,
        equippedSkinId: skinId,
        updatedAt: new Date().toISOString(),
      }

      saveCosmeticsState(next)
      notifyCosmeticsSubscribers()

      if (userId) {
        saveEquippedSkinCloud(userId, skinId).catch((err) => {
          console.warn("[useCosmetics] Failed to sync equipped skin to cloud:", err)
        })
      }

      return true
    },
    [userId]
  )

  // Unlock Skin
  const unlockSkin = useCallback(
    async (skinId: string): Promise<boolean> => {
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

  return {
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
    addShards,
    updateSettings,
    isGuest,
  }
}
