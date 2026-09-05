"use client"

import { useSyncExternalStore, useCallback, useEffect } from "react"
import { PlayerProfile, createDefaultPlayerProfile } from "@/types/player"
import {
  loadPlayerProfile,
  savePlayerProfile,
  resetPlayerProfile,
  STORAGE_KEY,
  PLAYER_UPDATE_EVENT,
} from "@/lib/storage/playerStorage"
import { useAuth } from "@/lib/auth/authContext"
import { fetchCloudPlayerProfile, saveCloudPlayerProfile } from "@/lib/storage/cloudPlayerStorage"

function subscribe(callback: () => void) {
  window.addEventListener(PLAYER_UPDATE_EVENT, callback)
  window.addEventListener("storage", callback)
  return () => {
    window.removeEventListener(PLAYER_UPDATE_EVENT, callback)
    window.removeEventListener("storage", callback)
  }
}

// Memoized cache for getSnapshot to maintain referential stability
let cachedProfile: PlayerProfile | null = null
let cachedRaw: string | null = null

function getSnapshot(): PlayerProfile {
  if (typeof window === "undefined") {
    return createDefaultPlayerProfile()
  }
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw !== cachedRaw || !cachedProfile) {
    cachedRaw = raw
    cachedProfile = loadPlayerProfile()
  }
  return cachedProfile
}

function getServerSnapshot(): PlayerProfile {
  return createDefaultPlayerProfile()
}

export function usePlayer() {
  const player = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const { user, isAuthenticated } = useAuth()

  // Fetch cloud profile upon mounting or user change if authenticated
  useEffect(() => {
    if (!isAuthenticated || !user || user.isGuest) return

    let cancelled = false

    fetchCloudPlayerProfile(user.id)
      .then((cloudProfile) => {
        if (cancelled || !cloudProfile) return
        savePlayerProfile(cloudProfile)
      })
      .catch((err) => {
        console.warn("[usePlayer] Failed to load cloud profile:", err)
      })

    return () => {
      cancelled = true
    }
  }, [user, isAuthenticated])

  const updatePlayer = useCallback(
    (updater: (prev: PlayerProfile) => PlayerProfile) => {
      const current = loadPlayerProfile()
      const next = updater(current)
      savePlayerProfile(next)

      if (isAuthenticated && user && !user.isGuest) {
        saveCloudPlayerProfile(user.id, next).catch((err) => {
          console.warn("[usePlayer] Failed to sync update to cloud:", err)
        })
      }
    },
    [isAuthenticated, user]
  )

  const reset = useCallback(() => {
    return resetPlayerProfile()
  }, [])

  return { player, isLoaded: true, updatePlayer, reset }
}
