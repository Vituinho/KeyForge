"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { BattlePhase, BattleState, DamageEvent, RoundResult } from "@/types/battle"
import { TypingStats } from "@/types/typing"
import { Enemy } from "@/types/character"
import { calculateDamage } from "@/lib/battle/calculateDamage"

interface UseBattleProps {
  enemy: Enemy
  playerMaxHp?: number
  texts: string[]
  onBattleEnd?: (victory: boolean) => void
}

interface UseBattleReturn {
  battleState: BattleState
  currentText: string
  onRoundComplete: (stats: TypingStats) => void
  clearDamageEvent: (id: string) => void
  phase: BattlePhase
  startBattle: () => void
}

export function useBattle({
  enemy,
  playerMaxHp = 100,
  texts,
  onBattleEnd,
}: UseBattleProps): UseBattleReturn {
  const [battleState, setBattleState] = useState<BattleState>({
    phase: "pre-battle",
    enemyHp: enemy.maxHp,
    playerHp: playerMaxHp,
    maxEnemyHp: enemy.maxHp,
    maxPlayerHp: playerMaxHp,
    currentTextIndex: 0,
    roundHistory: [],
    damageEvents: [],
    battleStartTime: null,
    battleEndTime: null,
  })

  const enemyAttackTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // Keep a ref to battle state for use inside setInterval callbacks
  // (updated via useEffect to stay in sync — not during render)
  const battleStateRef = useRef(battleState)

  useEffect(() => {
    battleStateRef.current = battleState
  })

  const stopEnemyAttack = useCallback(() => {
    if (enemyAttackTimerRef.current) {
      clearInterval(enemyAttackTimerRef.current)
      enemyAttackTimerRef.current = null
    }
  }, [])

  const startEnemyAttack = useCallback(() => {
    stopEnemyAttack()
    enemyAttackTimerRef.current = setInterval(() => {
      const state = battleStateRef.current
      if (state.phase !== "fighting") return

      const newPlayerHp = Math.max(0, state.playerHp - enemy.attack)
      const now = Date.now()
      const damageEvent: DamageEvent = {
        id: `enemy-${now}`,
        amount: enemy.attack,
        strikeType: "normal",
        timestamp: now,
        targetIsEnemy: false,
      }

      if (newPlayerHp <= 0) {
        stopEnemyAttack()
        setBattleState((prev) => ({
          ...prev,
          playerHp: 0,
          phase: "defeat",
          battleEndTime: Date.now(),
          damageEvents: [...prev.damageEvents, damageEvent],
        }))
        onBattleEnd?.(false)
      } else {
        setBattleState((prev) => ({
          ...prev,
          playerHp: newPlayerHp,
          damageEvents: [...prev.damageEvents, damageEvent],
        }))
      }
    }, enemy.attackInterval)
  }, [enemy.attack, enemy.attackInterval, onBattleEnd, stopEnemyAttack])

  const startBattle = useCallback(() => {
    setBattleState((prev) => ({
      ...prev,
      phase: "fighting",
      battleStartTime: Date.now(),
    }))
    startEnemyAttack()
  }, [startEnemyAttack])

  /**
   * Called by BattleArena when the player finishes typing a round.
   * Calculates damage, applies it, advances to next text or ends battle.
   */
  const onRoundComplete = useCallback(
    (stats: TypingStats) => {
      const state = battleStateRef.current
      if (state.phase !== "fighting") return

      const result = calculateDamage({
        wpm: stats.wpm,
        accuracy: stats.accuracy,
        combo: stats.bestCombo,
        errors: stats.errors,
        baseDamage: 30,
      })

      const newEnemyHp = Math.max(0, state.enemyHp - result.damage)
      const now = Date.now()

      const damageEvent: DamageEvent = {
        id: `player-${now}`,
        amount: result.damage,
        strikeType: result.strikeType,
        timestamp: now,
        targetIsEnemy: true,
      }

      const roundResult: RoundResult = {
        wpm: stats.wpm,
        accuracy: stats.accuracy,
        combo: stats.bestCombo,
        errors: stats.errors,
        damage: result.damage,
        strikeType: result.strikeType,
        text: texts[state.currentTextIndex] ?? "",
      }

      if (newEnemyHp <= 0) {
        stopEnemyAttack()
        setBattleState((prev) => ({
          ...prev,
          enemyHp: 0,
          phase: "victory",
          battleEndTime: Date.now(),
          roundHistory: [...prev.roundHistory, roundResult],
          damageEvents: [...prev.damageEvents, damageEvent],
        }))
        onBattleEnd?.(true)
      } else {
        const nextIndex = (state.currentTextIndex + 1) % texts.length
        setBattleState((prev) => ({
          ...prev,
          enemyHp: newEnemyHp,
          currentTextIndex: nextIndex,
          roundHistory: [...prev.roundHistory, roundResult],
          damageEvents: [...prev.damageEvents, damageEvent],
        }))
      }
    },
    [onBattleEnd, stopEnemyAttack, texts]
  )

  const clearDamageEvent = useCallback((id: string) => {
    setBattleState((prev) => ({
      ...prev,
      damageEvents: prev.damageEvents.filter((e) => e.id !== id),
    }))
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => stopEnemyAttack()
  }, [stopEnemyAttack])

  const currentText = texts[battleState.currentTextIndex] ?? texts[0]

  return {
    battleState,
    currentText,
    onRoundComplete,
    clearDamageEvent,
    phase: battleState.phase,
    startBattle,
  }
}
