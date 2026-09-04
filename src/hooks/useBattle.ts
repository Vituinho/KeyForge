"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { BattlePhase, BattleState, DamageEvent, RoundResult } from "@/types/battle"
import { TypingStats } from "@/types/typing"
import { Enemy } from "@/types/character"
import { calculateDamage, DamageCalculationResult } from "@/lib/battle/calculateDamage"

interface UseBattleProps {
  enemy: Enemy
  playerMaxHp?: number
  texts: string[]
  autoStart?: boolean
  onBattleEnd?: (victory: boolean) => void
}

interface UseBattleReturn {
  battleState: BattleState
  currentText: string
  applyRoundDamage: (roundStats: TypingStats) => {
    damageResult: DamageCalculationResult
    isEnemyDefeated: boolean
  }
  advanceToNextSentence: () => void
  clearDamageEvent: (id: string) => void
  phase: BattlePhase
  startBattle: () => void
  stopBattle: () => void
  resetBattle: () => void
}

export function useBattle({
  enemy,
  playerMaxHp = 100,
  texts,
  autoStart = true,
  onBattleEnd,
}: UseBattleProps): UseBattleReturn {
  const [battleState, setBattleState] = useState<BattleState>({
    phase: autoStart ? "fighting" : "pre-battle",
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
  const battleStateRef = useRef(battleState)

  // Keep battleStateRef synced via effect to avoid reading uncommitted state in timers
  useEffect(() => {
    battleStateRef.current = battleState
  }, [battleState])

  // Clear enemy attack interval completely
  const stopEnemyAttack = useCallback(() => {
    if (enemyAttackTimerRef.current !== null) {
      clearInterval(enemyAttackTimerRef.current)
      enemyAttackTimerRef.current = null
    }
  }, [])

  // Start periodic enemy attacks — strictly guarded
  const startEnemyAttack = useCallback(() => {
    // Always clear existing interval first to prevent duplicate timers
    stopEnemyAttack()

    enemyAttackTimerRef.current = setInterval(() => {
      const state = battleStateRef.current

      // Strict validation: stop immediately if not in fighting phase or if either participant is dead
      if (
        state.phase !== "fighting" ||
        state.enemyHp <= 0 ||
        state.playerHp <= 0
      ) {
        stopEnemyAttack()
        return
      }

      const newPlayerHp = Math.max(0, state.playerHp - enemy.attack)
      const now = Date.now()
      const damageEvent: DamageEvent = {
        id: `enemy-${now}-${Math.random().toString(36).slice(2, 7)}`,
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
          battleEndTime: now,
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

  // Explicit start
  const startBattle = useCallback(() => {
    const now = Date.now()
    setBattleState((prev) => ({
      ...prev,
      phase: "fighting",
      battleStartTime: now,
    }))
    startEnemyAttack()
  }, [startEnemyAttack])

  // Stop battle manually
  const stopBattle = useCallback(() => {
    stopEnemyAttack()
  }, [stopEnemyAttack])

  // Reset battle to initial state
  const resetBattle = useCallback(() => {
    stopEnemyAttack()
    const now = Date.now()
    setBattleState({
      phase: "fighting",
      enemyHp: enemy.maxHp,
      playerHp: playerMaxHp,
      maxEnemyHp: enemy.maxHp,
      maxPlayerHp: playerMaxHp,
      currentTextIndex: 0,
      roundHistory: [],
      damageEvents: [],
      battleStartTime: now,
      battleEndTime: null,
    })
    startEnemyAttack()
  }, [enemy.maxHp, playerMaxHp, startEnemyAttack, stopEnemyAttack])

  // Start attack timer on mount if autoStart is true
  useEffect(() => {
    if (autoStart) {
      startEnemyAttack()
    }
    return () => {
      stopEnemyAttack()
    }
  }, [autoStart, startEnemyAttack, stopEnemyAttack])

  /**
   * Calculates and applies round damage to enemy.
   * Returns calculation details and whether the enemy was defeated.
   */
  const applyRoundDamage = useCallback(
    (roundStats: TypingStats) => {
      const state = battleStateRef.current
      const now = Date.now()

      const damageResult = calculateDamage({
        wpm: roundStats.currentWpm,
        accuracy: roundStats.currentAccuracy,
        combo: roundStats.bestCombo,
        errors: roundStats.currentErrors,
        baseDamage: 30,
      })

      const newEnemyHp = Math.max(0, state.enemyHp - damageResult.damage)
      const isDefeated = newEnemyHp <= 0

      const damageEvent: DamageEvent = {
        id: `player-${now}-${Math.random().toString(36).slice(2, 7)}`,
        amount: damageResult.damage,
        strikeType: damageResult.strikeType,
        timestamp: now,
        targetIsEnemy: true,
      }

      const roundResult: RoundResult = {
        wpm: roundStats.currentWpm,
        accuracy: roundStats.currentAccuracy,
        combo: roundStats.bestCombo,
        errors: roundStats.currentErrors,
        damage: damageResult.damage,
        strikeType: damageResult.strikeType,
        text: texts[state.currentTextIndex] ?? "",
      }

      if (isDefeated) {
        stopEnemyAttack()
        setBattleState((prev) => ({
          ...prev,
          enemyHp: 0,
          phase: "victory",
          battleEndTime: now,
          roundHistory: [...prev.roundHistory, roundResult],
          damageEvents: [...prev.damageEvents, damageEvent],
        }))
        onBattleEnd?.(true)
      } else {
        setBattleState((prev) => ({
          ...prev,
          enemyHp: newEnemyHp,
          roundHistory: [...prev.roundHistory, roundResult],
          damageEvents: [...prev.damageEvents, damageEvent],
        }))
      }

      return { damageResult, isEnemyDefeated: isDefeated }
    },
    [onBattleEnd, stopEnemyAttack, texts]
  )

  /**
   * Advances the battle to the next sentence.
   */
  const advanceToNextSentence = useCallback(() => {
    setBattleState((prev) => ({
      ...prev,
      currentTextIndex: (prev.currentTextIndex + 1) % texts.length,
    }))
  }, [texts.length])

  const clearDamageEvent = useCallback((id: string) => {
    setBattleState((prev) => ({
      ...prev,
      damageEvents: prev.damageEvents.filter((e) => e.id !== id),
    }))
  }, [])

  const currentText = texts[battleState.currentTextIndex] ?? texts[0]

  return {
    battleState,
    currentText,
    applyRoundDamage,
    advanceToNextSentence,
    clearDamageEvent,
    phase: battleState.phase,
    startBattle,
    stopBattle,
    resetBattle,
  }
}
