"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { BattlePhase, BattleState, DamageEvent, RoundResult } from "@/types/battle"
import { TypingStats } from "@/types/typing"
import { Enemy } from "@/types/character"
import { calculateDamage, DamageCalculationResult } from "@/lib/battle/calculateDamage"
import { evaluateEnemyMechanics } from "@/lib/battle/mechanicsEngine"
import { MultiPhaseConfig } from "@/types/mechanics"

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
  const multiPhaseMech = enemy.mechanics?.find(
    (m) => m.type === "multi-phase" || m.type === "multi-phase-boss"
  ) as MultiPhaseConfig | undefined

  const totalPhases = multiPhaseMech ? multiPhaseMech.totalPhases : 1
  const initialPhaseName = multiPhaseMech ? multiPhaseMech.phaseNames[0] : undefined

  const getPhaseHp = useCallback(
    (phaseNum: number) => {
      if (!multiPhaseMech) return enemy.maxHp
      const ratio = multiPhaseMech.phaseHpRatios[phaseNum - 1] ?? 1 / totalPhases
      return Math.round(enemy.maxHp * ratio)
    },
    [enemy.maxHp, multiPhaseMech, totalPhases]
  )

  const initialHp = getPhaseHp(1)

  const [battleState, setBattleState] = useState<BattleState>({
    phase: autoStart ? "fighting" : "pre-battle",
    enemyHp: initialHp,
    playerHp: playerMaxHp,
    maxEnemyHp: initialHp,
    maxPlayerHp: playerMaxHp,
    currentTextIndex: 0,
    roundHistory: [],
    damageEvents: [],
    battleStartTime: null,
    battleEndTime: null,
    currentPhase: 1,
    totalPhases,
    phaseName: initialPhaseName,
    phaseTransitionBanner: null,
    activeMechanicEffects: [],
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
    const firstPhaseHp = getPhaseHp(1)
    setBattleState({
      phase: "fighting",
      enemyHp: firstPhaseHp,
      playerHp: playerMaxHp,
      maxEnemyHp: firstPhaseHp,
      maxPlayerHp: playerMaxHp,
      currentTextIndex: 0,
      roundHistory: [],
      damageEvents: [],
      battleStartTime: now,
      battleEndTime: null,
      currentPhase: 1,
      totalPhases,
      phaseName: initialPhaseName,
      phaseTransitionBanner: null,
      activeMechanicEffects: [],
    })
    startEnemyAttack()
  }, [getPhaseHp, initialPhaseName, playerMaxHp, startEnemyAttack, stopEnemyAttack, totalPhases])

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
   * Calculates and applies round damage to enemy, incorporating all character mechanics.
   * Returns calculation details and whether the enemy was defeated.
   */
  const applyRoundDamage = useCallback(
    (roundStats: TypingStats) => {
      const state = battleStateRef.current
      const now = Date.now()

      const baseResult = calculateDamage({
        wpm: roundStats.currentWpm,
        accuracy: roundStats.currentAccuracy,
        combo: roundStats.bestCombo,
        errors: roundStats.currentErrors,
        baseDamage: 30,
      })

      const mechanicEval = evaluateEnemyMechanics({
        roundStats,
        enemy,
        roundHistory: state.roundHistory,
        baseCalculatedDamage: baseResult.damage,
        currentPhase: state.currentPhase,
      })

      const finalDamage = mechanicEval.modifiedDamage
      const newEnemyHp = Math.max(0, state.enemyHp - finalDamage)

      let newPlayerHp = state.playerHp
      const extraDamageEvents: DamageEvent[] = []

      // If enemy mechanic inflicted counter damage (e.g. Sasuke Sharingan break)
      if (mechanicEval.extraPlayerDamageTaken > 0) {
        newPlayerHp = Math.max(0, newPlayerHp - mechanicEval.extraPlayerDamageTaken)
        extraDamageEvents.push({
          id: `counter-${now}-${Math.random().toString(36).slice(2, 7)}`,
          amount: mechanicEval.extraPlayerDamageTaken,
          strikeType: "miss",
          timestamp: now,
          targetIsEnemy: false,
        })
      }

      const playerDamageEvent: DamageEvent = {
        id: `player-${now}-${Math.random().toString(36).slice(2, 7)}`,
        amount: finalDamage,
        strikeType: baseResult.strikeType,
        timestamp: now,
        targetIsEnemy: true,
      }

      const roundResult: RoundResult = {
        wpm: roundStats.currentWpm,
        accuracy: roundStats.currentAccuracy,
        combo: roundStats.bestCombo,
        errors: roundStats.currentErrors,
        damage: finalDamage,
        strikeType: baseResult.strikeType,
        text: texts[state.currentTextIndex] ?? "",
        activeEffects: mechanicEval.activeEffects,
      }

      // Check if player died from counter-attack
      if (newPlayerHp <= 0) {
        stopEnemyAttack()
        setBattleState((prev) => ({
          ...prev,
          playerHp: 0,
          enemyHp: newEnemyHp,
          phase: "defeat",
          battleEndTime: now,
          roundHistory: [...prev.roundHistory, roundResult],
          damageEvents: [...prev.damageEvents, playerDamageEvent, ...extraDamageEvents],
          activeMechanicEffects: mechanicEval.activeEffects,
        }))
        onBattleEnd?.(false)
        return {
          damageResult: { ...baseResult, damage: finalDamage },
          isEnemyDefeated: false,
        }
      }

      // Check if enemy was defeated or transitions to next phase
      if (newEnemyHp <= 0) {
        if (state.currentPhase < state.totalPhases) {
          // Transition to next phase!
          const nextPhase = state.currentPhase + 1
          const nextPhaseHp = getPhaseHp(nextPhase)
          const nextPhaseName =
            multiPhaseMech?.phaseNames[nextPhase - 1] ?? `Phase ${nextPhase}`
          const banner = `${nextPhaseName.toUpperCase()}!`

          setBattleState((prev) => ({
            ...prev,
            playerHp: newPlayerHp,
            enemyHp: nextPhaseHp,
            maxEnemyHp: nextPhaseHp,
            currentPhase: nextPhase,
            phaseName: nextPhaseName,
            phaseTransitionBanner: banner,
            roundHistory: [...prev.roundHistory, roundResult],
            damageEvents: [...prev.damageEvents, playerDamageEvent, ...extraDamageEvents],
            activeMechanicEffects: [
              ...mechanicEval.activeEffects,
              `ADVANCED TO PHASE ${nextPhase}`,
            ],
          }))

          setTimeout(() => {
            setBattleState((prev) => ({ ...prev, phaseTransitionBanner: null }))
          }, 3000)

          return {
            damageResult: { ...baseResult, damage: finalDamage },
            isEnemyDefeated: false,
          }
        } else {
          // Final phase: Victory!
          stopEnemyAttack()
          setBattleState((prev) => ({
            ...prev,
            playerHp: newPlayerHp,
            enemyHp: 0,
            phase: "victory",
            battleEndTime: now,
            roundHistory: [...prev.roundHistory, roundResult],
            damageEvents: [...prev.damageEvents, playerDamageEvent, ...extraDamageEvents],
            activeMechanicEffects: mechanicEval.activeEffects,
          }))
          onBattleEnd?.(true)
          return {
            damageResult: { ...baseResult, damage: finalDamage },
            isEnemyDefeated: true,
          }
        }
      } else {
        // Normal round completion
        setBattleState((prev) => ({
          ...prev,
          playerHp: newPlayerHp,
          enemyHp: newEnemyHp,
          roundHistory: [...prev.roundHistory, roundResult],
          damageEvents: [...prev.damageEvents, playerDamageEvent, ...extraDamageEvents],
          activeMechanicEffects: mechanicEval.activeEffects,
        }))

        return {
          damageResult: { ...baseResult, damage: finalDamage },
          isEnemyDefeated: false,
        }
      }
    },
    [enemy, getPhaseHp, multiPhaseMech?.phaseNames, onBattleEnd, stopEnemyAttack, texts]
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
