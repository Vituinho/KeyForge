"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { TypingStats } from "@/types/typing"
import { useTypingEngine } from "@/hooks/useTypingEngine"
import { TypingArea } from "@/components/battle/TypingArea"
import { BattleHud } from "@/components/battle/BattleHud"
import { generateWeakKeysSession } from "@/lib/typing/generateTraining"
import { TrainingResult } from "./TrainingResult"
import { Dumbbell, ArrowRight } from "lucide-react"
import { TypingKeyboard } from "@/components/keyboard/TypingKeyboard"
import { useI18n } from "@/lib/i18n/i18nContext"
import {
  getFingerForKey,
  FINGER_PALETTE,
  KeyboardLayoutId,
} from "@/lib/keyboard/fingerMap"

interface WeakKeyTrainingProps {
  targetKeys: string[]
  baselineAccuracies?: Record<string, number>
  onRestart?: () => void
}

export function WeakKeyTraining({
  targetKeys,
  baselineAccuracies = {},
  onRestart,
}: WeakKeyTrainingProps) {
  const { t, locale } = useI18n()

  // Generate sequence of drill sentences for the target keys
  const [exercises, setExercises] = useState<string[]>(() =>
    generateWeakKeysSession(targetKeys)
  )
  const [exerciseIndex, setExerciseIndex] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const [finalStats, setFinalStats] = useState<TypingStats | null>(null)
  const currentExercise = exercises[exerciseIndex] ?? exercises[0]

  const handleExerciseComplete = useCallback(
    (roundStats: TypingStats) => {
      setIsTransitioning(true)

      setTimeout(() => {
        if (exerciseIndex + 1 < exercises.length) {
          setExerciseIndex((prev) => prev + 1)
          setIsTransitioning(false)
        } else {
          // Completed all exercises
          setFinalStats(roundStats)
          setIsCompleted(true)
          setIsTransitioning(false)
        }
      }, 400)
    },
    [exerciseIndex, exercises.length]
  )

  // Reusing the exact same useTypingEngine as Battle
  const {
    chars,
    stats,
    inputRef,
    reset,
    focus,
    expectedKey,
    pressedKey,
    lastErrorKey,
  } = useTypingEngine({
    text: currentExercise,
    textId: `drill-${exerciseIndex}`,
    enabled: !isCompleted && !isTransitioning,
    onComplete: handleExerciseComplete,
  })

  // Synchronize next exercise text into engine while keeping cumulative stats
  const prevExerciseRef = useRef(currentExercise)
  useEffect(() => {
    if (currentExercise !== prevExerciseRef.current) {
      prevExerciseRef.current = currentExercise
      reset(currentExercise, true) // keep cumulative session data
      const t = setTimeout(() => focus(), 50)
      return () => clearTimeout(t)
    }
  }, [currentExercise, reset, focus])

  const handleRetry = useCallback(() => {
    if (onRestart) {
      onRestart()
    } else {
      setExercises(generateWeakKeysSession(targetKeys))
      setExerciseIndex(0)
      setIsCompleted(false)
      setIsTransitioning(false)
      reset(exercises[0], false)
    }
  }, [exercises, onRestart, reset, targetKeys])

  if (isCompleted && finalStats) {
    return (
      <TrainingResult
        stats={finalStats}
        targetKeys={targetKeys}
        baselineAccuracies={baselineAccuracies}
        onRetry={handleRetry}
      />
    )
  }

  const normalizedLayout: KeyboardLayoutId = locale === "en" ? "ANSI" : "ABNT2"
  const activeFingerInfo = getFingerForKey(expectedKey, normalizedLayout)
  const lang = locale === "en" ? "en" : "pt-BR"
  const activeFingerConfig = activeFingerInfo ? FINGER_PALETTE[activeFingerInfo.finger] : null

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Target keys pill bar with designated finger guidance */}
      <div className="flex items-center justify-between flex-wrap gap-3 p-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center">
            <Dumbbell size={20} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">{t("training.weakKeys.targetedKeys")}</h2>
            <div className="flex gap-2 mt-1.5 flex-wrap">
              {targetKeys.map((k) => {
                const fInfo = getFingerForKey(k, normalizedLayout)
                const fConfig = fInfo ? FINGER_PALETTE[fInfo.finger] : null
                return (
                  <span
                    key={k}
                    className="px-2.5 py-1 rounded-xl text-white font-mono font-bold text-xs uppercase flex items-center gap-1.5 border backdrop-blur-sm shadow-sm"
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      borderColor: fConfig ? `${fConfig.hex}60` : "rgba(249, 115, 22, 0.3)",
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: fConfig?.hex ?? "#f97316" }}
                    />
                    <span className="text-white font-black">{k}</span>
                    {fConfig && (
                      <span className="text-[10px] text-white/50 font-sans font-medium hidden sm:inline">
                        · {fConfig.name[lang]}
                      </span>
                    )}
                  </span>
                )
              })}
            </div>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 text-xs text-white/50">
          <span>{t("training.weakKeys.drill")}</span>
          <span className="font-mono font-bold text-white">
            {exerciseIndex + 1} / {exercises.length}
          </span>
        </div>
      </div>

      {/* Real-time stats HUD */}
      <BattleHud
        wpm={stats.currentWpm}
        accuracy={stats.currentAccuracy}
        combo={stats.combo}
        errors={stats.currentErrors}
        themeColor="#f97316"
      />

      {/* Typing area reusing the exact same component & engine */}
      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentExercise}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            <TypingArea
              chars={chars}
              inputRef={inputRef}
              onFocus={focus}
              themeColor="#f97316"
            />
          </motion.div>
        </AnimatePresence>

        {isTransitioning && (
          <div className="text-center text-xs text-orange-400 mt-2 font-bold animate-pulse flex items-center justify-center gap-1">
            <span>{t("training.weakKeys.nextDrill")}</span>
            <ArrowRight size={12} />
          </div>
        )}
      </div>

      {/* Active Finger Guidance HUD */}
      {activeFingerInfo && activeFingerConfig && (
        <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-neutral-900/90 border border-white/10 text-xs font-mono shadow-md max-w-lg mx-auto">
          <div className="flex items-center gap-2.5">
            <span
              className="w-3 h-3 rounded-full animate-pulse shrink-0"
              style={{
                backgroundColor: activeFingerConfig.hex,
                boxShadow: `0 0 10px ${activeFingerConfig.hex}`,
              }}
            />
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-white">
                {activeFingerInfo.hand === "left"
                  ? t("keyboard.handLeft")
                  : t("keyboard.handRight")}
                :
              </span>
              <span
                className="font-black"
                style={{ color: activeFingerConfig.hex }}
              >
                {activeFingerConfig.name[lang]}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-white/50">
            <span className="text-[11px] hidden sm:inline">{t("training.weakKeys.drill")}:</span>
            <span className="px-2 py-0.5 rounded-lg bg-white/15 text-white font-black text-sm border border-white/20">
              {activeFingerInfo.display ?? expectedKey?.toUpperCase()}
            </span>
          </div>
        </div>
      )}

      {/* Weak Keys Training Visual Keyboard with full fingerColors and handGuide */}
      <div className="flex justify-center pt-2">
        <TypingKeyboard
          expectedKey={expectedKey}
          pressedKey={pressedKey}
          lastErrorKey={lastErrorKey}
          weakKeys={targetKeys}
          layout={normalizedLayout}
          highlightFinger={true}
          fingerColors="full"
          showHandsGuide={true}
          handGuideMode="full"
          size="sm"
          className="scale-90 sm:scale-95"
        />
      </div>

      {/* Step instructions */}
      <div className="text-center text-xs text-white/30 space-y-1">
        <p>{t("training.weakKeys.instruction1")}</p>
        <p>{t("training.weakKeys.instruction2")}</p>
      </div>
    </div>
  )
}
