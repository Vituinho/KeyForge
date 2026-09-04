"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { TypingStats } from "@/types/typing"
import { useTypingEngine } from "@/hooks/useTypingEngine"
import { TypingArea } from "@/components/battle/TypingArea"
import { VirtualKeyboard } from "./VirtualKeyboard"
import { FingerGuide } from "./FingerGuide"
import { HOME_ROW_EXERCISES } from "@/data/academyLessons"
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
} from "lucide-react"
import Link from "next/link"

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
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 space-y-8">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Modules
      </button>

      {/* Hero */}
      <div className="text-center space-y-2">
        <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
          Lesson 1 · Fundamentals
        </span>
        <h1 className="text-4xl font-black text-white tracking-tight">
          O QUE É <span className="text-emerald-400">TOUCH TYPING</span>?
        </h1>
        <p className="text-white/60 text-sm max-w-lg mx-auto">
          Touch Typing é a técnica de digitar utilizando todos os dedos sem precisar olhar constantemente para o teclado.
        </p>
      </div>

      {/* 4 Interactive Principle Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PrincipleCard
          icon={<Target className="text-emerald-400" size={22} />}
          title="1. Precisão Antes da Velocidade"
          subtitle="Speed is a consequence of precision"
          description="Nunca force digitar rápido no início. Digite de forma deliberada e rítmica. A velocidade é uma consequência natural da ausência de erros."
        />

        <PrincipleCard
          icon={<Sparkles className="text-cyan-400" size={22} />}
          title="2. Todos os Dedos Têm Sua Função"
          subtitle="Stop typing with just two fingers"
          description="A maioria das pessoas digita usando apenas 2 a 4 dedos. No Touch Typing, cada dedo é responsável por uma coluna específica de teclas."
        />

        <PrincipleCard
          icon={<Crosshair className="text-amber-400" size={22} />}
          title="3. A Posição Base (Home Row)"
          subtitle="Always return home"
          description="Seus dedos descansam na linha central (A S D F — J K L Ç). Após pressionar qualquer tecla distante, retorne imediatamente à posição base."
        />

        <PrincipleCard
          icon={<EyeOff className="text-rose-400" size={22} />}
          title="4. Evite Olhar para o Teclado"
          subtitle="Trust muscle memory"
          description="Olhar para o teclado impede seu cérebro de criar conexões táteis. Confie nas marcas físicas das teclas F e J para se orientar no escuro."
        />
      </div>

      {/* Interactive Virtual Keyboard Preview */}
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-white/40 text-center">
          O Teclado como uma Extensão do seu Cérebro
        </p>
        <VirtualKeyboard activeKey="f" />
      </div>

      {/* Navigation CTA */}
      <div className="text-center pt-4">
        <button
          onClick={onComplete}
          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm transition-all shadow-[0_0_25px_rgba(16,185,129,0.5)]"
        >
          <span>PROCEED TO HOME ROW LESSON</span>
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
  const [exercises] = useState(HOME_ROW_EXERCISES)
  const [exerciseIndex, setExerciseIndex] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [finalStats, setFinalStats] = useState<TypingStats | null>(null)

  const currentExercise = exercises[exerciseIndex] ?? exercises[0]

  const handleCompleteRound = useCallback(
    (roundStats: TypingStats) => {
      setIsTransitioning(true)

      setTimeout(() => {
        if (exerciseIndex + 1 < exercises.length) {
          setExerciseIndex((prev) => prev + 1)
          setIsTransitioning(false)
        } else {
          setFinalStats(roundStats)
          setIsCompleted(true)
          setIsTransitioning(false)
        }
      }, 400)
    },
    [exerciseIndex, exercises.length]
  )

  // Reusing the exact same useTypingEngine
  const { chars, stats, inputRef, reset, focus } = useTypingEngine({
    text: currentExercise,
    textId: `academy-homerow-${exerciseIndex}`,
    enabled: !isCompleted && !isTransitioning,
    onComplete: handleCompleteRound,
  })

  // Synchronize next exercise text
  const prevExerciseRef = useRef(currentExercise)
  useEffect(() => {
    if (currentExercise !== prevExerciseRef.current) {
      prevExerciseRef.current = currentExercise
      reset(currentExercise, true)
      const t = setTimeout(() => focus(), 50)
      return () => clearTimeout(t)
    }
  }, [currentExercise, reset, focus])

  const activeChar = chars[stats.currentIndex]?.char ?? null

  const handleRetry = () => {
    setExerciseIndex(0)
    setIsCompleted(false)
    setIsTransitioning(false)
    reset(exercises[0], false)
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Modules
      </button>

      {/* Header */}
      <div className="text-center space-y-1">
        <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
          Lesson 2 · Home Row Masterclass
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          A S D F — J K L Ç
        </h1>
        <p className="text-white/50 text-xs max-w-md mx-auto">
          Posicione seus dedos nas teclas centrais. Note as pequenas saliências físicas (bumps) nas teclas F e J.
        </p>
      </div>

      {/* Finger placement guide */}
      <FingerGuide />

      {/* Focus on Accuracy Highlight Banner */}
      <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
          <Target size={16} />
          <span>FOCUS ON ACCURACY</span>
        </div>
        <div className="text-xs text-emerald-200/70">
          Objetivo da Aula: <span className="font-mono font-bold text-white">≥ 95% Accuracy</span>
        </div>
      </div>

      {/* Result screen if completed */}
      {isCompleted && finalStats ? (
        <motion.div
          className="p-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md text-center space-y-6"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          {finalStats.battleAccuracy >= 95 ? (
            <div>
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center mb-3">
                <CheckCircle2 size={36} />
              </div>
              <h2 className="text-3xl font-black text-white">LESSON COMPLETE</h2>
              <p className="text-emerald-400 font-bold text-sm mt-1">
                Accuracy Target Met ({finalStats.battleAccuracy}%)!
              </p>
              <p className="text-white/40 text-xs mt-1">
                You maintained great finger discipline across the Home Row.
              </p>
            </div>
          ) : (
            <div>
              <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 mx-auto flex items-center justify-center mb-3">
                <AlertTriangle size={36} />
              </div>
              <h2 className="text-3xl font-black text-white">GOOD EFFORT</h2>
              <p className="text-amber-400 font-bold text-sm mt-1">
                Accuracy was {finalStats.battleAccuracy}% (Target: 95%)
              </p>
              <p className="text-white/40 text-xs mt-1">
                Take your time to feel the bumps on F and J before pressing.
              </p>
            </div>
          )}

          {/* Stats pills */}
          <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
            <div className="p-3 rounded-xl bg-black/40 border border-white/10">
              <span className="text-[10px] uppercase text-white/40 block mb-0.5">Accuracy</span>
              <span
                className={`text-2xl font-black ${
                  finalStats.battleAccuracy >= 95 ? "text-emerald-400" : "text-amber-400"
                }`}
              >
                {finalStats.battleAccuracy}%
              </span>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/10">
              <span className="text-[10px] uppercase text-white/40 block mb-0.5">WPM</span>
              <span className="text-2xl font-black text-white">
                {finalStats.battleWpm || finalStats.currentWpm}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/10">
              <span className="text-[10px] uppercase text-white/40 block mb-0.5">Errors</span>
              <span className="text-2xl font-black text-white">
                {finalStats.totalErrors}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleRetry}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold text-sm transition-colors"
            >
              <RotateCcw size={16} />
              TRY AGAIN
            </button>
            <Link
              href="/battle"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)]"
            >
              <Zap size={16} />
              TEST IN BATTLE
            </Link>
          </div>
        </motion.div>
      ) : (
        /* Active practice drill */
        <div className="space-y-4">
          {/* Virtual Keyboard with real-time active key guidance */}
          <VirtualKeyboard activeKey={activeChar} highlightFinger={true} />

          {/* Drill progress and live metrics */}
          <div className="flex items-center justify-between text-xs text-white/50 px-1">
            <span>
              Drill {exerciseIndex + 1} of {exercises.length}
            </span>
            <div className="flex gap-4">
              <span>
                Accuracy:{" "}
                <strong className="text-emerald-400 font-mono">
                  {stats.currentAccuracy}%
                </strong>
              </span>
              <span>
                WPM:{" "}
                <strong className="text-white font-mono">
                  {stats.currentWpm}
                </strong>
              </span>
              <span>
                Errors:{" "}
                <strong className="text-red-400 font-mono">
                  {stats.currentErrors}
                </strong>
              </span>
            </div>
          </div>

          {/* Reusing TypingArea */}
          <TypingArea
            chars={chars}
            inputRef={inputRef}
            onFocus={focus}
            themeColor="#06b6d4"
          />

          <p className="text-center text-[11px] text-white/30">
            Olhe para a tela e sinta as teclas com os dedos. Use o teclado virtual como referência visual.
          </p>
        </div>
      )}
    </div>
  )
}
