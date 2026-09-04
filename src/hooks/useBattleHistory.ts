"use client"

import { useSyncExternalStore, useCallback } from "react"
import { BattleHistoryEntry } from "@/types/battle"
import {
  loadBattleHistory,
  clearBattleHistory,
  BATTLE_HISTORY_STORAGE_KEY,
  BATTLE_HISTORY_UPDATE_EVENT,
} from "@/lib/storage/battleHistoryStorage"

function subscribe(callback: () => void) {
  window.addEventListener(BATTLE_HISTORY_UPDATE_EVENT, callback)
  window.addEventListener("storage", callback)
  return () => {
    window.removeEventListener(BATTLE_HISTORY_UPDATE_EVENT, callback)
    window.removeEventListener("storage", callback)
  }
}

let cachedHistory: BattleHistoryEntry[] = []
let cachedRaw: string | null = null

function getSnapshot(): BattleHistoryEntry[] {
  if (typeof window === "undefined") return []
  const raw = localStorage.getItem(BATTLE_HISTORY_STORAGE_KEY)
  if (raw !== cachedRaw) {
    cachedRaw = raw
    cachedHistory = loadBattleHistory()
  }
  return cachedHistory
}

const SERVER_SNAPSHOT: BattleHistoryEntry[] = []

function getServerSnapshot(): BattleHistoryEntry[] {
  return SERVER_SNAPSHOT
}

export function useBattleHistory() {
  const history = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const clear = useCallback(() => {
    clearBattleHistory()
  }, [])

  return {
    history,
    clear,
  }
}
