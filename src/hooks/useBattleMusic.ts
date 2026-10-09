"use client"

import { useEffect } from "react"
import { getBattleMusic, BATTLE_MUSIC_FALLBACK } from "@/lib/audio/battleMusic"
import { musicManager } from "@/lib/audio/musicManager"
import { soundManager } from "@/lib/audio/soundManager"

export function useBattleMusic(enemyId: string, result: boolean) {
  useEffect(() => {
    musicManager.play(getBattleMusic(enemyId), BATTLE_MUSIC_FALLBACK)
    return () => musicManager.stop(document.hidden ? 0 : 500)
  }, [enemyId])
  useEffect(() => { musicManager.setResultMode(result) }, [result])
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
      soundManager.suspend()
    }
  }, [])
}
