"use client"

import { useEffect, useRef } from "react"
import { getBattleMusic, BATTLE_MUSIC_FALLBACK } from "@/lib/audio/battleMusic"
import { selectBattleMusic } from "@/lib/audio/officialBattleMusic"
import { musicManager } from "@/lib/audio/musicManager"
import { soundManager } from "@/lib/audio/soundManager"
import { localBattleTracks } from "@/lib/audio/localBattleTracks"

export function useBattleMusic(enemyId: string, result: boolean) {
  const resultRef = useRef(result)
  useEffect(() => {
    let active = true, revision = 0
    const select = async () => {
      const request = ++revision
      const local = await localBattleTracks.get(enemyId)
      if (!active || request !== revision) return
      const licensed = getBattleMusic(enemyId)
      const selection = selectBattleMusic(enemyId)
      if (local) {
        const url = URL.createObjectURL(local.file)
        musicManager.play({ kind: "local", enemyId, name: local.name, file: url, dispose: () => URL.revokeObjectURL(url) }, licensed)
      } else musicManager.play(selection.primary, selection.fallback ?? BATTLE_MUSIC_FALLBACK)
      musicManager.setResultMode(resultRef.current)
      if (document.hidden) musicManager.pause()
    }
    void select()
    const unsubscribe = localBattleTracks.subscribe(id => { if (id === enemyId) void select() })
    return () => { active = false; unsubscribe() }
  }, [enemyId])
  useEffect(() => { resultRef.current = result; musicManager.setResultMode(result) }, [result])
  useEffect(() => {
    const visibility = () => {
      if (document.hidden) { musicManager.pause(); soundManager.suspend() }
      else musicManager.resume()
    }
    const close = () => { musicManager.cleanup(); soundManager.suspend() }
    document.addEventListener("visibilitychange", visibility)
    window.addEventListener("pagehide", close)
    return () => {
      document.removeEventListener("visibilitychange", visibility)
      window.removeEventListener("pagehide", close)
      musicManager.cleanup()
      soundManager.suspend()
    }
  }, [])
}
