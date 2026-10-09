"use client"

import { memo, useCallback, useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
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
import { TypingKeyboard } from "@/components/keyboard/TypingKeyboard"
import { useI18n } from "@/lib/i18n/i18nContext"
import { usePlayer } from "@/hooks/usePlayer"
import { formatMechanicEffect, formatPhaseName } from "@/lib/battle/formatMechanics"
import { evaluatePersonalBests } from "@/lib/progression/personalBestEngine"
import { PersonalBestMilestone, CombatFeedbackEvent } from "@/types/progression"
import { PersonalBestBanner } from "./PersonalBestBanner"
import { CombatFeedbackToast } from "./CombatFeedbackToast"
import { BossPhaseBanner } from "@/components/campaign/BossPhaseBanner"
import { soundManager } from "@/lib/audio/soundManager"
import { useBattleMusic } from "@/hooks/useBattleMusic"
import { BattleAudioControls } from "./BattleAudioControls"
import Link from "next/link"

const StableEnemyCard = memo(EnemyCard)
const StablePlayerCard = memo(PlayerCard)
const SampledBattleHud = memo(BattleHud)

interface BattleArenaProps {
  enemy: Enemy
  texts: string[]
  onRematch?: () => void
}

export function BattleArena({ enemy, texts, onRematch }: BattleArenaProps) {
  const { t, locale } = useI18n()
  const { player, updatePlayer } = usePlayer()
  const [enemyUnderAttack, setEnemyUnderAttack] = useState(false)
  const [playerUnderAttack, setPlayerUnderAttack] = useState(false)
  const nextRoundRef = useRef<((text: string) => void) | null>(null)
  const [showTouchGuide, setShowTouchGuide] = useState(false)
  const [activeMilestone, setActiveMilestone] = useState<PersonalBestMilestone | null>(null)
  const [combatFeedback, setCombatFeedback] = useState<CombatFeedbackEvent | null>(null)
  const lastFeedbackTimeRef = useRef<number>(0)

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
      const exercises = generateTrainingExercises(weakKeys, 5, locale)

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

  const previousPhase = useRef(1)
  useEffect(() => {
    if (battleState.currentPhase > previousPhase.current) soundManager.playBossPhaseShift()
    previousPhase.current = battleState.currentPhase
  }, [battleState.currentPhase])

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

      // Step 2 & 3 & 4 & 5 & 6: Calculate & apply round damage, emit animations
      const { isEnemyDefeated } = applyRoundDamage(roundStats)
      setEnemyUnderAttack(true)
      if (!isEnemyDefeated) {
        nextRoundRef.current?.(texts[(battleState.currentTextIndex + 1) % texts.length])
        advanceToNextSentence()
      }

      // Evaluate real Personal Bests
      const milestones = evaluatePersonalBests(
        player,
        roundStats,
        enemy.stage ? `stage_${enemy.stage}` : enemy.id,
        enemy.world
      )

      if (milestones.length > 0) {
        const topMilestone = milestones[0]
        setActiveMilestone(topMilestone)
        soundManager.playPersonalBest()
        setTimeout(() => setActiveMilestone(null), 3500)

        updatePlayer((prev) => {
          const next = { ...prev }
          const stats = { ...next.stats }
          for (const m of milestones) {
            if (m.type === "wpm" && m.newValue > (next.bestWpm ?? stats.bestWpm ?? 0)) {
              next.bestWpm = m.newValue
              stats.bestWpm = m.newValue
            }
            if (m.type === "accuracy" && m.newValue > (next.bestAccuracy ?? stats.averageAccuracy ?? 0)) {
              next.bestAccuracy = m.newValue
              stats.averageAccuracy = m.newValue
            }
            if (m.type === "combo" && m.newValue > (next.bestCombo ?? stats.bestCombo ?? 0)) {
              next.bestCombo = m.newValue
              stats.bestCombo = m.newValue
            }
          }
          next.stats = stats
          return next
        })
      } else {
        soundManager.playSentenceComplete()
        // Prioritized Combat Feedback (1.5s cooldown guard)
        const now = Date.now()
        if (now - lastFeedbackTimeRef.current >= 1500) {
          if (roundStats.currentErrors === 0 && roundStats.currentAccuracy === 100) {
            lastFeedbackTimeRef.current = now
            setCombatFeedback({
              id: `fb-${now}`,
              priority: 3,
              type: "perfect_sentence",
              title: t("battle.feedback.perfectSentence"),
              durationMs: 1400,
              timestamp: now,
            })
            setTimeout(() => setCombatFeedback(null), 1400)
          } else if (roundStats.currentWpm >= enemy.recommendedWpm + 15) {
            lastFeedbackTimeRef.current = now
            setCombatFeedback({
              id: `fb-${now}`,
              priority: 5,
              type: "speed_surge",
              title: t("battle.feedback.speedSurge"),
              subtitle: `${roundStats.currentWpm} WPM`,
              durationMs: 1400,
              timestamp: now,
            })
            setTimeout(() => setCombatFeedback(null), 1400)
          } else if (roundStats.combo >= 20 && roundStats.combo % 10 === 0) {
            lastFeedbackTimeRef.current = now
            setCombatFeedback({
              id: `fb-${now}`,
              priority: 4,
              type: "combo_milestone",
              title: t("battle.feedback.comboMilestone", { combo: roundStats.combo }),
              durationMs: 1400,
              timestamp: now,
            })
            setTimeout(() => setCombatFeedback(null), 1400)
          }
        }
      }

      // Combat feedback runs independently from sentence/input progression.
      setTimeout(() => setEnemyUnderAttack(false), 600)
    },
    [advanceToNextSentence, applyRoundDamage, battleState.currentTextIndex, texts, enemy, player, t, updatePlayer]
  )

  // Typing engine instance
  const {
    chars,
    stats,
    inputRef,
    nextRound,
    focus,
    expectedKey,
    pressedKey,
    lastErrorKey,
  } = useTypingEngine({
    text: currentText,
    enabled: phase === "fighting",
    statsUpdateIntervalMs: 100,
    onComplete: handleRoundComplete,
    onAttempt: attempt => {
      if (attempt.correct) soundManager.playKeystroke()
      else soundManager.playTypo()
    },
  })

  useBattleMusic(enemy.id, phase === "victory" || phase === "defeat")

  // Keep latestStatsRef fresh on any typing update
  useEffect(() => {
    latestStatsRef.current = stats
  }, [stats])

  useEffect(() => {
    nextRoundRef.current = nextRound
  }, [nextRound])

  // Render battle result if battle has completed
  if (battleResultData !== null && (phase === "victory" || phase === "defeat")) {
    return (
      <div><div className="flex justify-between items-center max-w-4xl mx-auto px-4 pt-3"><Link href="/game" className="kf-nav-link">KEYFORGE</Link><BattleAudioControls /></div><BattleResult
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
      /></div>
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

      <div className="relative z-10 flex flex-col min-h-screen sm:h-screen justify-between max-w-4xl mx-auto w-full px-4 py-4 sm:py-6 gap-4">
        <header className="flex items-center justify-between gap-3"><Link href={enemy.world ? `/anime-world/${enemy.world}` : "/game"} className="text-xs font-semibold text-white/55 hover:text-white">← {t("battle.preBattle.exitBattle")}</Link><BattleAudioControls /></header>
        {/* Top row: Enemy card + HUD + Player card */}
        <div className="grid grid-cols-2 sm:grid-cols-[auto_1fr_auto] items-start gap-3">
          <StableEnemyCard
            enemy={enemy}
            currentHp={battleState.enemyHp}
            maxHp={battleState.maxEnemyHp}
            isUnderAttack={enemyUnderAttack}
            phaseInfo={
              battleState.totalPhases > 1
                ? {
                    currentPhase: battleState.currentPhase,
                    totalPhases: battleState.totalPhases,
                    phaseName: battleState.phaseName
                      ? formatPhaseName(battleState.phaseName, t)
                      : undefined,
                  }
                : undefined
            }
          />

          {/* Center HUD */}
          <div className="order-last sm:order-none col-span-2 sm:col-span-1 flex flex-col items-center justify-center gap-2 pt-2">
            {phase === "fighting" && (
              <SampledBattleHud
                wpm={stats.currentWpm}
                accuracy={stats.currentAccuracy}
                combo={stats.combo}
                errors={stats.currentErrors}
                themeColor={enemy.themeColor}
              />
            )}
            {phase === "pre-battle" && (
              <div className="text-center">
                <p className="text-white/30 text-sm">{t("battle.hud.getReady")}</p>
              </div>
            )}
          </div>

          <StablePlayerCard
            currentHp={battleState.playerHp}
            maxHp={battleState.maxPlayerHp}
            isUnderAttack={playerUnderAttack}
          />
        </div>

        {/* Personal Best Banner & Combat Feedback Toast */}
        <PersonalBestBanner milestone={activeMilestone} />
        <CombatFeedbackToast event={combatFeedback} />

        {/* Phase Transition Banner Overlay */}
        <BossPhaseBanner
          bannerText={battleState.phaseTransitionBanner ?? null}
          themeColor={enemy.themeColor}
        />

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
                  {formatMechanicEffect(effect, t)}
                </motion.span>
              ))}
            </div>
          )}

            <div className="min-h-32">
              <TypingArea
                chars={chars}
                inputRef={inputRef}
                onFocus={focus}
                themeColor={enemy.themeColor}
              />
            </div>

          {/* Gameplay Visual Keyboard & Touch Typing Guide below TypingArea */}
          {phase === "fighting" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center pt-2 gap-2"
            >
              {/* Touch Guide Toggle Button */}
              <div className="flex items-center justify-end w-full max-w-xl px-2">
                <button
                  type="button"
                  onClick={() => setShowTouchGuide((prev) => !prev)}
                  title={t("battle.hud.touchGuideToggle")}
                  className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border transition-all flex items-center gap-1.5 ${
                    showTouchGuide
                      ? "bg-white/10 text-white/80 border-white/20 hover:bg-white/15"
                      : "bg-white/5 text-white/40 border-white/5 hover:text-white/60"
                  }`}
                >
                  <span className={showTouchGuide ? "text-emerald-400" : "text-white/30"}>✋</span>
                  <span>{showTouchGuide ? t("battle.hud.touchGuideOn") : t("battle.hud.touchGuideOff")}</span>
                </button>
              </div>

              <TypingKeyboard
                expectedKey={expectedKey}
                pressedKey={pressedKey}
                lastErrorKey={lastErrorKey}
                layout={locale === "en" ? "en" : "pt-BR"}
                highlightFinger={showTouchGuide}
                fingerColors={showTouchGuide ? "subtle" : "off"}
                showHandsGuide={showTouchGuide}
                handGuideMode="subtle"
                size="sm"
                className="scale-90 sm:scale-95"
              />
            </motion.div>
          )}

          {/* Round counter & transition indicator */}
          {phase === "fighting" && (
            <div className="text-center text-white/20 text-xs flex items-center justify-center gap-2">
              <span>
                {t("battle.hud.round", { current: battleState.roundHistory.length + 1, total: texts.length })}
              </span>
              {enemyUnderAttack && (
                <span className="text-orange-400 font-bold animate-pulse">
                  · {t("battle.hud.strikeInProgress")}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Enemy attack indicator */}
        {phase === "fighting" && (
          <div className="text-center text-white/20 text-xs pb-2">
            {t("battle.hud.attacksEvery", { name: enemy.name, seconds: enemy.attackInterval / 1000 })}
          </div>
        )}
      </div>
    </div>
  )
}
