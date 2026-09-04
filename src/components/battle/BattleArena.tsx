"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Enemy } from "@/types/character"
import { TypingStats } from "@/types/typing"
import { BattleResult as BattleResultType } from "@/types/battle"
import { useTypingEngine } from "@/hooks/useTypingEngine"
import { useBattle } from "@/hooks/useBattle"
import { analyzeWeakKeys } from "@/lib/typing/analyzeErrors"
import { generateTrainingExercises } from "@/lib/typing/generateTraining"
import { EnemyCard } from "./EnemyCard"
import { PlayerCard } from "./PlayerCard"
import { BattleHud } from "./BattleHud"
import { TypingArea } from "./TypingArea"
import { DamageIndicator } from "./DamageIndicator"
import { BattleResult } from "./BattleResult"

interface BattleArenaProps {
  enemy: Enemy
  texts: string[]
  onRematch?: () => void
}

export function BattleArena({ enemy, texts, onRematch }: BattleArenaProps) {
  const [enemyUnderAttack, setEnemyUnderAttack] = useState(false)
  const [playerUnderAttack, setPlayerUnderAttack] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Track latest typing stats snapshot from engine
  const latestStatsRef = useRef<TypingStats | null>(null)

  // Computed result state for end-of-battle screen
  const [battleResultData, setBattleResultData] = useState<BattleResultType | null>(null)

  const {
    battleState,
    currentText,
    applyRoundDamage,
    advanceToNextSentence,
    clearDamageEvent,
    phase,
  } = useBattle({
    enemy,
    playerMaxHp: 100,
    texts,
    autoStart: true,
    onBattleEnd: (victory) => {
      const startTime = battleState.battleStartTime
      const endTime = battleState.battleEndTime
      const elapsed = startTime && endTime ? Math.max(0, (endTime - startTime) / 1000) : 0

      const stats = latestStatsRef.current ?? {
        currentWpm: 0,
        currentRawWpm: 0,
        currentAccuracy: 100,
        currentErrors: 0,
        currentStreak: 0,
        battleWpm: 0,
        battleAccuracy: 100,
        bestWpm: 0,
        totalTypingAttempts: 0,
        totalErrors: 0,
        combo: 0,
        bestCombo: 0,
        bestStreak: 0,
        typedCharacters: 0,
        correctCharacters: 0,
        incorrectCharacters: 0,
        totalCorrectCharacters: 0,
        totalIncorrectCharacters: 0,
        elapsedTime: 0,
        totalElapsedTime: elapsed,
        wpm: 0,
        rawWpm: 0,
        accuracy: 100,
        errors: 0,
        keyStats: {},
        errorLog: [],
        isCompleted: true,
        currentIndex: 0,
      }

      const weakKeys = analyzeWeakKeys(stats.keyStats)
      const exercises = generateTrainingExercises(weakKeys)

      setBattleResultData({
        victory,
        totalDamageDealt: battleState.roundHistory.reduce((s, r) => s + r.damage, 0),
        totalDamageTaken: battleState.maxPlayerHp - battleState.playerHp,
        finalStats: stats,
        weakKeys,
        exercises,
        roundHistory: battleState.roundHistory,
        elapsedTime: elapsed,
      })
    },
  })

  // Detect incoming enemy attacks to flash player card
  const prevEnemyDamageCountRef = useRef(0)
  useEffect(() => {
    const enemyEvents = battleState.damageEvents.filter((e) => !e.targetIsEnemy)
    if (enemyEvents.length > prevEnemyDamageCountRef.current) {
      prevEnemyDamageCountRef.current = enemyEvents.length
      setPlayerUnderAttack(true)
      const t = setTimeout(() => setPlayerUnderAttack(false), 400)
      return () => clearTimeout(t)
    }
  }, [battleState.damageEvents])

  // Sentence transition coordinator
  const handleRoundComplete = useCallback(
    (roundStats: TypingStats) => {
      latestStatsRef.current = roundStats

      // Step 1: Lock input immediately
      setIsTransitioning(true)

      // Step 2 & 3 & 4 & 5 & 6: Calculate & apply round damage, emit animations
      const { isEnemyDefeated } = applyRoundDamage(roundStats)
      setEnemyUnderAttack(true)

      // Animation duration: 600ms
      setTimeout(() => {
        setEnemyUnderAttack(false)

        // Step 7: Check victory
        if (isEnemyDefeated) {
          // Battle finished — victory phase takes over
          setIsTransitioning(false)
          return
        }

        // Step 8 & 9: Advance sentence & reset round state while preserving cumulative battle stats
        advanceToNextSentence()

        // Step 10: Unlock input
        setIsTransitioning(false)
      }, 600)
    },
    [advanceToNextSentence, applyRoundDamage]
  )

  // Typing engine instance
  const { chars, stats, inputRef, reset, focus } = useTypingEngine({
    text: currentText,
    enabled: phase === "fighting" && !isTransitioning,
    onComplete: handleRoundComplete,
  })

  // Keep latestStatsRef fresh on any typing update
  useEffect(() => {
    latestStatsRef.current = stats
  }, [stats])

  // Sync engine when currentText changes
  const prevTextRef = useRef(currentText)
  useEffect(() => {
    if (currentText !== prevTextRef.current) {
      prevTextRef.current = currentText
      reset(currentText, true) // Keep cumulative battle stats!
      const t = setTimeout(() => focus(), 50)
      return () => clearTimeout(t)
    }
  }, [currentText, reset, focus])

  // Render battle result if battle has completed
  if (battleResultData !== null && (phase === "victory" || phase === "defeat")) {
    return (
      <BattleResult
        victory={battleResultData.victory}
        enemy={enemy}
        result={battleResultData}
        weakKeys={battleResultData.weakKeys}
        exercises={battleResultData.exercises}
        onRematch={() => {
          if (onRematch) {
            onRematch()
          } else {
            window.location.reload()
          }
        }}
      />
    )
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Themed background */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at top, ${enemy.themeColor} 0%, transparent 60%)`,
        }}
      />

      <div className="relative z-10 flex flex-col h-screen max-w-4xl mx-auto w-full px-4 py-6 gap-4">
        {/* Top row: Enemy card + HUD + Player card */}
        {/* Top row: Enemy card + HUD + Player card */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <EnemyCard
            enemy={enemy}
            currentHp={battleState.enemyHp}
            maxHp={battleState.maxEnemyHp}
            isUnderAttack={enemyUnderAttack}
            phaseInfo={
              battleState.totalPhases > 1
                ? {
                    currentPhase: battleState.currentPhase,
                    totalPhases: battleState.totalPhases,
                    phaseName: battleState.phaseName,
                  }
                : undefined
            }
          />

          {/* Center HUD */}
          <div className="flex-1 flex flex-col items-center justify-center gap-2 pt-2">
            {phase === "fighting" && (
              <BattleHud
                wpm={stats.currentWpm}
                accuracy={stats.currentAccuracy}
                combo={stats.combo}
                errors={stats.currentErrors}
                themeColor={enemy.themeColor}
              />
            )}
            {phase === "pre-battle" && (
              <div className="text-center">
                <p className="text-white/30 text-sm">Get ready...</p>
              </div>
            )}
          </div>

          <PlayerCard
            currentHp={battleState.playerHp}
            maxHp={battleState.maxPlayerHp}
            isUnderAttack={playerUnderAttack}
          />
        </div>

        {/* Phase Transition Banner Overlay */}
        <AnimatePresence>
          {battleState.phaseTransitionBanner && (
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 px-8 py-5 rounded-3xl bg-black/95 border-2 border-red-500 text-center shadow-[0_0_60px_rgba(239,68,68,0.8)] backdrop-blur-md pointer-events-none"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1.05, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.35, ease: "backOut" }}
            >
              <span className="text-xs font-mono font-bold tracking-widest text-red-400 uppercase block mb-1">
                Boss Phase Shift
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wider">
                {battleState.phaseTransitionBanner}
              </h2>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Typing area & damage indicators */}
        <div className="flex-1 flex flex-col justify-center gap-4 relative">
          <DamageIndicator events={battleState.damageEvents} onClear={clearDamageEvent} />

          {/* Active Mechanic Feedback Chips */}
          {battleState.activeMechanicEffects && battleState.activeMechanicEffects.length > 0 && (
            <div className="flex items-center justify-center gap-2 flex-wrap min-h-[28px]">
              {battleState.activeMechanicEffects.map((effect, idx) => (
                <motion.span
                  key={`${effect}-${idx}`}
                  className="text-xs font-mono font-bold px-3 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/40 shadow-sm"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {effect}
                </motion.span>
              ))}
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={currentText}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <TypingArea
                chars={chars}
                inputRef={inputRef}
                onFocus={focus}
                themeColor={enemy.themeColor}
              />
            </motion.div>
          </AnimatePresence>

          {/* Round counter & transition indicator */}
          {phase === "fighting" && (
            <div className="text-center text-white/20 text-xs flex items-center justify-center gap-2">
              <span>
                Round {battleState.roundHistory.length + 1} · {texts.length} sentences
              </span>
              {isTransitioning && (
                <span className="text-orange-400 font-bold animate-pulse">
                  · Strike in progress...
                </span>
              )}
            </div>
          )}
        </div>

        {/* Enemy attack indicator */}
        {phase === "fighting" && (
          <div className="text-center text-white/20 text-xs pb-2">
            {enemy.name} attacks every {enemy.attackInterval / 1000}s — type faster!
          </div>
        )}
      </div>
    </div>
  )
}
