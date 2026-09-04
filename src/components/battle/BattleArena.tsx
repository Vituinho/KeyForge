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
}

export function BattleArena({ enemy, texts }: BattleArenaProps) {
  const [enemyUnderAttack, setEnemyUnderAttack] = useState(false)
  const [playerUnderAttack, setPlayerUnderAttack] = useState(false)

  // Cumulative stats across all rounds — stored in refs (not render state)
  const cumulativeKeyStatsRef = useRef<TypingStats["keyStats"]>({})
  const cumulativeErrorLogRef = useRef<TypingStats["errorLog"]>([])
  const cumulativeStatsRef = useRef<TypingStats | null>(null)

  // battleResultData stores all computed result including weakKeys and exercises
  // so refs are NOT read during the render phase
  const [battleResultData, setBattleResultData] = useState<BattleResultType | null>(null)

  const { battleState, onRoundComplete, clearDamageEvent, phase } = useBattle({
    enemy,
    playerMaxHp: 100,
    texts,
    onBattleEnd: (victory) => {
      // This runs inside a setInterval callback (not during render).
      // battleEndTime is set by useBattle before calling onBattleEnd.
      const startTime = battleState.battleStartTime
      const endTime = battleState.battleEndTime
      const elapsed = startTime && endTime ? (endTime - startTime) / 1000 : 0

      const finalStats = cumulativeStatsRef.current ?? {
        wpm: 0, rawWpm: 0, accuracy: 100, combo: 0, bestCombo: 0,
        errors: 0, typedCharacters: 0, correctCharacters: 0, incorrectCharacters: 0,
        elapsedTime: 0, currentStreak: 0, bestStreak: 0,
        keyStats: cumulativeKeyStatsRef.current,
        errorLog: [],
        isCompleted: true, currentIndex: 0,
      }

      const weakKeys = analyzeWeakKeys(cumulativeKeyStatsRef.current)
      const exercises = generateTrainingExercises(weakKeys)

      setBattleResultData({
        victory,
        totalDamageDealt: battleState.roundHistory.reduce((s, r) => s + r.damage, 0),
        totalDamageTaken: battleState.maxPlayerHp - battleState.playerHp,
        finalStats,
        weakKeys,
        exercises,
        roundHistory: battleState.roundHistory,
        elapsedTime: elapsed,
      })
    },
  })

  // Derive current text directly from battleState — no separate state needed
  const currentText = texts[battleState.currentTextIndex] ?? texts[0]

  const handleRoundComplete = useCallback(
    (stats: TypingStats) => {
      // Merge key stats cumulatively (ref mutation — intentional)
      for (const [key, stat] of Object.entries(stats.keyStats)) {
        const ex = cumulativeKeyStatsRef.current[key]
        if (ex) {
          cumulativeKeyStatsRef.current[key] = {
            attempts: ex.attempts + stat.attempts,
            correct: ex.correct + stat.correct,
            errors: ex.errors + stat.errors,
            totalResponseTime: ex.totalResponseTime + stat.totalResponseTime,
          }
        } else {
          cumulativeKeyStatsRef.current[key] = { ...stat }
        }
      }
      cumulativeErrorLogRef.current.push(...stats.errorLog)
      cumulativeStatsRef.current = {
        ...stats,
        keyStats: { ...cumulativeKeyStatsRef.current },
        errorLog: [...cumulativeErrorLogRef.current],
      }

      onRoundComplete(stats)

      // Flash enemy card to indicate damage
      setEnemyUnderAttack(true)
      setTimeout(() => setEnemyUnderAttack(false), 500)
    },
    [onRoundComplete]
  )

  // Detect incoming enemy damage events to flash player card
  const prevEnemyDamageCountRef = useRef(0)
  useEffect(() => {
    const enemyEvents = battleState.damageEvents.filter((e) => !e.targetIsEnemy)
    if (enemyEvents.length > prevEnemyDamageCountRef.current) {
      prevEnemyDamageCountRef.current = enemyEvents.length
      setPlayerUnderAttack(true)
      const t = setTimeout(() => setPlayerUnderAttack(false), 500)
      return () => clearTimeout(t)
    }
  }, [battleState.damageEvents])

  const { chars, stats, inputRef, reset, focus } = useTypingEngine({
    text: currentText,
    enabled: phase === "fighting",
    onComplete: handleRoundComplete,
  })

  // Reset typing engine when the text changes (new round)
  const prevTextRef = useRef(currentText)
  useEffect(() => {
    if (currentText !== prevTextRef.current) {
      prevTextRef.current = currentText
      reset(currentText)
      const t = setTimeout(() => focus(), 50)
      return () => clearTimeout(t)
    }
  }, [currentText, reset, focus])

  // Show result screen after battle ends — all data is in battleResultData state (not refs)
  if (battleResultData !== null && (phase === "victory" || phase === "defeat")) {
    return (
      <BattleResult
        victory={battleResultData.victory}
        enemy={enemy}
        result={battleResultData}
        weakKeys={battleResultData.weakKeys}
        exercises={battleResultData.exercises}
        onRematch={() => {
          cumulativeKeyStatsRef.current = {}
          cumulativeErrorLogRef.current = []
          cumulativeStatsRef.current = null
          setBattleResultData(null)
          window.location.reload()
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
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <EnemyCard
            enemy={enemy}
            currentHp={battleState.enemyHp}
            isUnderAttack={enemyUnderAttack}
          />

          {/* Center HUD */}
          <div className="flex-1 flex flex-col items-center justify-center gap-2 pt-2">
            {phase === "fighting" && (
              <BattleHud
                wpm={stats.wpm}
                accuracy={stats.accuracy}
                combo={stats.combo}
                errors={stats.errors}
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

        {/* Typing area */}
        <div className="flex-1 flex flex-col justify-center gap-4 relative">
          <DamageIndicator events={battleState.damageEvents} onClear={clearDamageEvent} />

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

          {phase === "fighting" && (
            <div className="text-center text-white/20 text-xs">
              Round {battleState.roundHistory.length + 1} · {texts.length} sentences
            </div>
          )}
        </div>

        {phase === "fighting" && (
          <div className="text-center text-white/20 text-xs pb-2">
            {enemy.name} attacks every {enemy.attackInterval / 1000}s — type faster!
          </div>
        )}
      </div>
    </div>
  )
}
