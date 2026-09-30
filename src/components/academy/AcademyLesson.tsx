"use client"

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { TypingStats } from "@/types/typing"
import { useTypingEngine } from "@/hooks/useTypingEngine"
import { TypingArea } from "@/components/battle/TypingArea"
import { VirtualKeyboard } from "./VirtualKeyboard"
import { FingerGuide } from "./FingerGuide"
import { getHomeRowExercises } from "@/data/academyLessons"
import {
  Target,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  Zap,
  EyeOff,
  Crosshair,
  ArrowUpCircle,
} from "lucide-react"
import Link from "next/link"
import { processAcademyLessonRewards, ActivityRewardSummary } from "@/lib/progression/processActivityRewards"
import { RankUpModal } from "@/components/progression/RankUpModal"
import { useI18n } from "@/lib/i18n/i18nContext"
import {
  getFingerForKey,
  FINGER_PALETTE,
  KeyboardLayoutId,
} from "@/lib/keyboard/fingerMap"

interface AcademyLessonProps {
  moduleId: string
  onBack: () => void
  onSelectModule: (id: string) => void
}

export function AcademyLesson({ moduleId, onBack, onSelectModule }: AcademyLessonProps) {
  if (moduleId === "intro") {
    return <IntroLesson onComplete={() => onSelectModule("home-row")} onBack={onBack} />
  }

  return <HomeRowLesson onBack={onBack} />
}

// ----------------------------------------------------------------------------
// 1. Introduction Lesson Component
// ----------------------------------------------------------------------------
function IntroLesson({
  onComplete,
  onBack,
}: {
  onComplete: () => void
  onBack: () => void
}) {
  const { t } = useI18n()

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 space-y-8">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft size={16} />
        {t("academy.backToModules")}
      </button>

      {/* Hero */}
      <div className="text-center space-y-2">
        <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
          {t("academy.intro.tag")}
        </span>
        <h1 className="text-4xl font-black text-white tracking-tight">
          {t("academy.intro.headingPre")}{" "}
          <span className="text-emerald-400">{t("academy.intro.headingHighlight")}</span>
          {t("academy.intro.headingPost")}
        </h1>
        <p className="text-white/60 text-sm max-w-lg mx-auto">
          {t("academy.intro.desc")}
        </p>
      </div>

      {/* 4 Interactive Principle Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PrincipleCard
          icon={<Target className="text-emerald-400" size={22} />}
          title={t("academy.intro.p1Title")}
          subtitle={t("academy.intro.p1Sub")}
          description={t("academy.intro.p1Desc")}
        />

        <PrincipleCard
          icon={<Sparkles className="text-cyan-400" size={22} />}
          title={t("academy.intro.p2Title")}
          subtitle={t("academy.intro.p2Sub")}
          description={t("academy.intro.p2Desc")}
        />

        <PrincipleCard
          icon={<Crosshair className="text-amber-400" size={22} />}
          title={t("academy.intro.p3Title")}
          subtitle={t("academy.intro.p3Sub")}
          description={t("academy.intro.p3Desc")}
        />

        <PrincipleCard
          icon={<EyeOff className="text-rose-400" size={22} />}
          title={t("academy.intro.p4Title")}
          subtitle={t("academy.intro.p4Sub")}
          description={t("academy.intro.p4Desc")}
        />
      </div>

      {/* Interactive Virtual Keyboard Preview */}
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-white/40 text-center">
          {t("academy.intro.keyboardTitle")}
        </p>
        <VirtualKeyboard activeKey="f" />
      </div>

      {/* Navigation CTA */}
      <div className="text-center pt-4">
        <button
          onClick={onComplete}
          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm transition-all shadow-[0_0_25px_rgba(16,185,129,0.5)]"
        >
          <span>{t("academy.intro.proceedBtn")}</span>
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  )
}

function PrincipleCard({
  icon,
  title,
  subtitle,
  description,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  description: string
}) {
  return (
    <div className="p-5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm space-y-2 hover:border-white/20 transition-all">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
          {icon}
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">{title}</h3>
          <p className="text-[11px] text-white/40">{subtitle}</p>
        </div>
      </div>
      <p className="text-xs text-white/70 leading-relaxed pt-1">{description}</p>
    </div>
  )
}

// ----------------------------------------------------------------------------
// 2. Home Row Lesson & Practice Drill
// ----------------------------------------------------------------------------
function HomeRowLesson({ onBack }: { onBack: () => void }) {
  const { t, locale } = useI18n()
  const isEn = locale === "en"
  const [exercises] = useState(() => getHomeRowExercises(locale))
  const [exerciseIndex, setExerciseIndex] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const exerciseIndexRef = useRef(0)
  const nextRoundRef = useRef<((text: string, textId?: string) => void) | null>(null)
  const [finalStats, setFinalStats] = useState<TypingStats | null>(null)

  const currentExercise = exercises[exerciseIndex] ?? exercises[0]

  const handleCompleteRound = useCallback(
    (roundStats: TypingStats) => {
      const nextIndex = exerciseIndexRef.current + 1
      if (nextIndex < exercises.length) {
        exerciseIndexRef.current = nextIndex
        nextRoundRef.current?.(exercises[nextIndex], `academy-homerow-${nextIndex}`)
        setExerciseIndex(nextIndex)
      } else {
        setFinalStats(roundStats)
        setIsCompleted(true)
      }
    },
    [exercises]
  )

  // Reusing the exact same useTypingEngine
  const { chars, stats, inputRef, reset, nextRound, focus, expectedKey, pressedKey, lastErrorKey } = useTypingEngine({
    text: currentExercise,
    textId: `academy-homerow-${exerciseIndex}`,
    enabled: !isCompleted,
    statsUpdateIntervalMs: 100,
    onComplete: handleCompleteRound,
  })

  useLayoutEffect(() => { nextRoundRef.current = nextRound }, [nextRound])
  useEffect(() => { focus() }, [focus])

  const activeChar = expectedKey
  const normalizedLayout: KeyboardLayoutId = isEn ? "ANSI" : "ABNT2"
  const activeFingerInfo = getFingerForKey(activeChar, normalizedLayout)
  const lang = isEn ? "en" : "pt-BR"
  const activeFingerConfig = activeFingerInfo ? FINGER_PALETTE[activeFingerInfo.finger] : null

  const handleRetry = () => {
    setExerciseIndex(0)
    exerciseIndexRef.current = 0
    setIsCompleted(false)
    reset(exercises[0], false)
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft size={16} />
        {t("academy.backToModules")}
      </button>

      {/* Header */}
      <div className="text-center space-y-1">
        <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
          {t("academy.homeRow.tag")}
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          {isEn ? t("academy.homeRow.keysTitleEn") : t("academy.homeRow.keysTitlePt")}
        </h1>
        <p className="text-white/50 text-xs max-w-md mx-auto">
          {t("academy.homeRow.desc")}
        </p>
      </div>

      {/* Finger placement guide */}
      <FingerGuide />

      {/* Focus on Accuracy Highlight Banner */}
      <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
          <Target size={16} />
          <span>{t("academy.homeRow.focusTitle")}</span>
        </div>
        <div className="text-xs text-emerald-200/70">
          {t("academy.homeRow.goal")}
        </div>
      </div>

      {/* Result screen if completed */}
      {isCompleted && finalStats ? (
        <HomeRowLessonResult stats={finalStats} onRetry={handleRetry} />
      ) : (
        /* Active practice drill */
        <div className="space-y-4">
          {/* Academy Metrics Header - Accuracy Prominently Highlighted Above WPM */}
          <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
            {/* Accuracy Hero Card */}
            <div className="col-span-1 flex flex-col items-center justify-center p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 shadow-sm">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300 font-bold flex items-center gap-1">
                <Target size={12} />
                {t("common.accuracy")}
              </span>
              <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
                {stats.currentAccuracy}%
              </span>
              <span className="text-[9px] text-emerald-300/60 font-mono">
                {t("academy.homeRow.goal")}
              </span>
            </div>

            {/* WPM Metric Card */}
            <div className="col-span-1 flex flex-col items-center justify-center p-2.5 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 font-bold flex items-center gap-1">
                <Zap size={12} />
                {t("common.wpm")}
              </span>
              <span className="text-xl sm:text-2xl font-bold font-mono text-white">
                {stats.currentWpm}
              </span>
              <span className="text-[9px] text-white/40 font-mono">
                {t("academy.homeRow.drillOf", {
                  current: exerciseIndex + 1,
                  total: exercises.length,
                })}
              </span>
            </div>

            {/* Errors Metric Card */}
            <div className="col-span-1 flex flex-col items-center justify-center p-2.5 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 font-bold flex items-center gap-1">
                <AlertTriangle size={12} />
                {t("common.errors")}
              </span>
              <span
                className={`text-xl sm:text-2xl font-bold font-mono ${
                  stats.currentErrors > 0 ? "text-red-400" : "text-white/60"
                }`}
              >
                {stats.currentErrors}
              </span>
              <span className="text-[9px] text-white/40 font-mono">
                {stats.currentErrors === 0
                  ? t("academy.homeRow.perfectAccuracy")
                  : `${stats.currentErrors} ${t("common.errors").toLowerCase()}`}
              </span>
            </div>
          </div>

          {/* Active Finger & Hand Guidance Banner */}
          {activeFingerInfo && activeFingerConfig && (
            <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-neutral-900/90 border border-white/10 text-xs font-mono shadow-md">
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
                <span className="text-[11px] hidden sm:inline">{t("academy.homeRow.activeKeyGuide")}:</span>
                <span className="px-2 py-0.5 rounded-lg bg-white/15 text-white font-black text-sm border border-white/20">
                  {activeFingerInfo.display ?? activeChar?.toUpperCase()}
                </span>
              </div>
            </div>
          )}

          {/* Virtual Keyboard with real-time active key guidance, fingerColors full and handGuide full */}
          <VirtualKeyboard
            activeKey={activeChar}
            pressedKey={pressedKey}
            lastErrorKey={lastErrorKey}
            highlightFinger={true}
            showHandsGuide={true}
            fingerColors="full"
            handGuideMode="full"
            layout={normalizedLayout}
          />

          {/* Reusing TypingArea */}
          <TypingArea
            chars={chars}
            inputRef={inputRef}
            onFocus={focus}
            themeColor="#06b6d4"
          />

          <p className="text-center text-[11px] text-white/30">
            {t("academy.homeRow.instruction")}
          </p>
        </div>
      )}
    </div>
  )
}

function HomeRowLessonResult({
  stats,
  onRetry,
}: {
  stats: TypingStats
  onRetry: () => void
}) {
  const { t } = useI18n()
  const [rewardSummary] = useState<ActivityRewardSummary>(() =>
    processAcademyLessonRewards("home-row", stats)
  )
  const [showRankUpModal, setShowRankUpModal] = useState(
    () => rewardSummary.didRankUp
  )

  return (
    <motion.div
      className="p-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md text-center space-y-6"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      {/* Rank Up Celebration Modal */}
      <RankUpModal
        isOpen={showRankUpModal}
        prevRank={rewardSummary.prevRank}
        newRank={rewardSummary.newRank}
        onClose={() => setShowRankUpModal(false)}
      />

      {stats.battleAccuracy >= 95 ? (
        <div>
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center mb-3">
            <CheckCircle2 size={36} />
          </div>
          <h2 className="text-3xl font-black text-white">
            {t("academy.result.complete")}
          </h2>
          <p className="text-emerald-400 font-bold text-sm mt-1">
            {t("academy.result.metTitle", { acc: stats.battleAccuracy })}
          </p>
          <p className="text-white/40 text-xs mt-1">
            {t("academy.result.metDesc")}
          </p>
        </div>
      ) : (
        <div>
          <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 mx-auto flex items-center justify-center mb-3">
            <AlertTriangle size={36} />
          </div>
          <h2 className="text-3xl font-black text-white">
            {t("academy.result.effortTitle")}
          </h2>
          <p className="text-amber-400 font-bold text-sm mt-1">
            {t("academy.result.effortSub", {
              acc: stats.battleAccuracy,
              target: 95,
            })}
          </p>
          <p className="text-white/40 text-xs mt-1">
            {t("academy.result.effortDesc")}
          </p>
        </div>
      )}

      {/* XP & Level Up Badges */}
      <div className="flex items-center justify-center gap-2 flex-wrap">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold font-mono">
          <Sparkles size={14} />
          <span>{t("academy.result.xpEarned", { xp: rewardSummary.xpGained })}</span>
        </div>

        {rewardSummary.didLevelUp && (
          <motion.div
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-black"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <ArrowUpCircle size={14} />
            <span>
              {t("academy.result.levelUp", {
                prev: rewardSummary.prevLevel,
                next: rewardSummary.newLevel,
              })}
            </span>
          </motion.div>
        )}
      </div>

      {/* Stats pills */}
      <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
        <div className="p-3 rounded-xl bg-black/40 border border-white/10">
          <span className="text-[10px] uppercase text-white/40 block mb-0.5">
            {t("common.accuracy")}
          </span>
          <span
            className={`text-2xl font-black ${
              stats.battleAccuracy >= 95 ? "text-emerald-400" : "text-amber-400"
            }`}
          >
            {stats.battleAccuracy}%
          </span>
        </div>
        <div className="p-3 rounded-xl bg-black/40 border border-white/10">
          <span className="text-[10px] uppercase text-white/40 block mb-0.5">
            {t("common.wpm")}
          </span>
          <span className="text-2xl font-black text-white">
            {stats.battleWpm || stats.currentWpm}
          </span>
        </div>
        <div className="p-3 rounded-xl bg-black/40 border border-white/10">
          <span className="text-[10px] uppercase text-white/40 block mb-0.5">
            {t("common.errors")}
          </span>
          <span className="text-2xl font-black text-white">
            {stats.totalErrors}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3">
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold text-sm transition-colors"
        >
          <RotateCcw size={16} />
          {t("academy.result.tryAgain")}
        </button>
        <Link
          href="/battle"
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)]"
        >
          <Zap size={16} />
          {t("academy.result.testInBattle")}
        </Link>
      </div>
    </motion.div>
  )
}
