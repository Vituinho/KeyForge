"use client"

import { useState, useEffect, useRef, useMemo, useCallback, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Swords,
  Zap,
  ArrowLeft,
  RotateCcw,
  Trophy,
  AlertTriangle,
  Sparkles,
  Heart,
  Activity,
} from "lucide-react"
import { MultiplayerAuthGuard } from "@/components/multiplayer/MultiplayerAuthGuard"
import { useAuth } from "@/lib/auth/authContext"
import { usePlayer } from "@/hooks/usePlayer"
import { useI18n } from "@/lib/i18n/i18nContext"
import { generateMatchWords } from "@/lib/multiplayer/wordGenerator"
import {
  DEFAULT_MULTIPLAYER_CONFIG,
  calculateWordDamage,
  calculateNextUltimate,
} from "@/lib/multiplayer/matchConfig"

function hashStringToSeed(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash) || 42
}

function ArenaContent() {
  const searchParams = useSearchParams()
  const roomParam = searchParams.get("room") || "KF-DEMO"

  const { user } = useAuth()
  const { player } = usePlayer()
  const { t, locale } = useI18n()

  const seed = useMemo(() => hashStringToSeed(roomParam), [roomParam])
  const matchWords = useMemo(
    () => generateMatchWords(seed, DEFAULT_MULTIPLAYER_CONFIG.wordsPerMatch, locale),
    [seed, locale]
  )

  // Game Phase
  const [phase, setPhase] = useState<"COUNTDOWN" | "BATTLE" | "FINISHED">("COUNTDOWN")
  const [countdown, setCountdown] = useState(3)
  const [outcome, setOutcome] = useState<"VICTORY" | "DEFEAT" | "DRAW">("VICTORY")

  // Player 1 (Local)
  const [p1WordIndex, setP1WordIndex] = useState(0)
  const [typedInput, setTypedInput] = useState("")
  const [p1Hp, setP1Hp] = useState(DEFAULT_MULTIPLAYER_CONFIG.initialHealth)
  const [p1Combo, setP1Combo] = useState(0)
  const [p1MaxCombo, setP1MaxCombo] = useState(0)
  const [p1Ultimate, setP1Ultimate] = useState(0)
  const [p1DamageDealt, setP1DamageDealt] = useState(0)
  const [p1CorrectChars, setP1CorrectChars] = useState(0)
  const [p1TotalChars, setP1TotalChars] = useState(0)
  const [isRecoilActive, setIsRecoilActive] = useState(false)

  // Player 2 (Rival Shinobi Sparring Bot)
  const [p2WordIndex, setP2WordIndex] = useState(0)
  const [p2Hp, setP2Hp] = useState(DEFAULT_MULTIPLAYER_CONFIG.initialHealth)
  const [p2Combo, setP2Combo] = useState(0)
  const [p2Ultimate, setP2Ultimate] = useState(0)

  // Floating Damage Indicators
  const [p1LastHit, setP1LastHit] = useState<{ amount: number; id: number } | null>(null)
  const [p2LastHit, setP2LastHit] = useState<{ amount: number; id: number } | null>(null)

  // Final Telemetry Result
  const [finalStats, setFinalStats] = useState({ wpm: 0, accuracy: 100 })
  const [startTime, setStartTime] = useState<number | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)

  const finishMatch = useCallback(
    (result: "VICTORY" | "DEFEAT") => {
      const now = Date.now()
      setOutcome(result)
      setPhase("FINISHED")
      const start = startTime || now
      const elapsedMinutes = Math.max(0.05, (now - start) / 60000)
      const wpm = Math.round(p1CorrectChars / 5 / elapsedMinutes) || 0
      const accuracy = p1TotalChars > 0 ? Math.round((p1CorrectChars / p1TotalChars) * 100) : 100
      setFinalStats({ wpm, accuracy })
    },
    [startTime, p1CorrectChars, p1TotalChars]
  )

  // Countdown timer without synchronous effect set-state
  useEffect(() => {
    if (phase !== "COUNTDOWN") return
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          setPhase("BATTLE")
          setStartTime(Date.now())
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [phase])

  // Focus input during battle
  useEffect(() => {
    if (phase === "BATTLE") {
      inputRef.current?.focus()
    }
  }, [phase])

  // Simulated Rival AI Behavior
  useEffect(() => {
    if (phase !== "BATTLE") return

    // Rival types a word every 1.7s
    const rivalInterval = setInterval(() => {
      setP2WordIndex((curr) => {
        if (curr >= matchWords.length - 1) return curr
        return curr + 1
      })

      setP2Combo((prevCombo) => {
        const nextCombo = prevCombo + 1
        const dmg = calculateWordDamage(nextCombo)

        setP1Hp((currHp) => {
          const nextHp = Math.max(0, currHp - dmg)
          if (nextHp <= 0) {
            finishMatch("DEFEAT")
          }
          return nextHp
        })

        setP1LastHit({ amount: dmg, id: Date.now() })
        return nextCombo
      })

      setP2Ultimate((curr) => calculateNextUltimate(curr))
    }, 1700)

    return () => clearInterval(rivalInterval)
  }, [phase, matchWords.length, finishMatch])

  // Current Target Word
  const currentTargetWord = matchWords[p1WordIndex] || ""

  // Handle Input Typing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (phase !== "BATTLE" || isRecoilActive) return

    const val = e.target.value
    setP1TotalChars((c) => c + 1)

    // Check if valid prefix of target word
    if (currentTargetWord.startsWith(val)) {
      setTypedInput(val)
      setP1CorrectChars((c) => c + 1)

      // Word Complete!
      if (val === currentTargetWord) {
        const newCombo = p1Combo + 1
        setP1Combo(newCombo)
        setP1MaxCombo((m) => Math.max(m, newCombo))

        const dmg = calculateWordDamage(newCombo)
        setP1DamageDealt((d) => d + dmg)
        setP2LastHit({ amount: dmg, id: Date.now() })

        const nextUlt = calculateNextUltimate(p1Ultimate)
        setP1Ultimate(nextUlt)

        // Deal damage to rival
        setP2Hp((curr) => {
          const next = Math.max(0, curr - dmg)
          if (next <= 0) {
            finishMatch("VICTORY")
          }
          return next
        })

        // Check if finished words
        if (p1WordIndex + 1 >= matchWords.length) {
          finishMatch("VICTORY")
        } else {
          setP1WordIndex((idx) => idx + 1)
          setTypedInput("")
        }
      }
    } else {
      // Recoil typo penalty
      setIsRecoilActive(true)
      setTimeout(() => setIsRecoilActive(false), DEFAULT_MULTIPLAYER_CONFIG.errorChakraRecoilMs)
      setP1Combo(0)
      // Apply chip health penalty
      setP1Hp((curr) => Math.max(0, curr - DEFAULT_MULTIPLAYER_CONFIG.errorHealthPenalty))
      setTypedInput("")
    }
  }

  // Trigger Ultimate Skill Blast
  const triggerUltimateJutsu = () => {
    if (phase !== "BATTLE" || p1Ultimate < 100) return
    const ultDamage = 180
    setP1Ultimate(0)
    setP1DamageDealt((d) => d + ultDamage)
    setP2LastHit({ amount: ultDamage, id: Date.now() })
    setP2Hp((curr) => {
      const next = Math.max(0, curr - ultDamage)
      if (next <= 0) {
        finishMatch("VICTORY")
      }
      return next
    })
  }

  // Reset Match for Rematch
  const handleRematch = () => {
    setPhase("COUNTDOWN")
    setCountdown(3)
    setP1Hp(DEFAULT_MULTIPLAYER_CONFIG.initialHealth)
    setP2Hp(DEFAULT_MULTIPLAYER_CONFIG.initialHealth)
    setP1WordIndex(0)
    setP2WordIndex(0)
    setTypedInput("")
    setP1Combo(0)
    setP1MaxCombo(0)
    setP1Ultimate(0)
    setP2Combo(0)
    setP2Ultimate(0)
    setP1DamageDealt(0)
    setP1CorrectChars(0)
    setP1TotalChars(0)
    setIsRecoilActive(false)
    setStartTime(null)
    setFinalStats({ wpm: 0, accuracy: 100 })
    setP1LastHit(null)
    setP2LastHit(null)
  }

  const p1HpPercent = Math.max(0, (p1Hp / DEFAULT_MULTIPLAYER_CONFIG.initialHealth) * 100)
  const p2HpPercent = Math.max(0, (p2Hp / DEFAULT_MULTIPLAYER_CONFIG.initialHealth) * 100)

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between relative overflow-hidden select-none">
      {/* Dynamic Arena Auras */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[500px] bg-orange-600/10 blur-[160px] pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-[600px] h-[500px] bg-purple-600/10 blur-[160px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[300px] bg-gradient-to-t from-orange-950/20 via-black/80 to-transparent pointer-events-none" />

      {/* Arena Top Navigation & HUD */}
      <header className="relative z-20 w-full max-w-6xl mx-auto px-4 py-4 flex items-center justify-between border-b border-white/10 bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link
            href="/multiplayer"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors border border-white/10"
            title={t("multiplayerArena.backToHub")}
          >
            <ArrowLeft size={16} />
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-black text-sm uppercase tracking-wider text-orange-400 font-mono">
              ROOM: {roomParam}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-[10px] font-bold text-orange-300 font-mono">
              {t("multiplayerArena.prototypeBadge")}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-white/50">
          <Activity size={14} className="text-emerald-400" />
          <span>60 FPS</span>
          <span>•</span>
          <span className="text-white/80">SEED: {seed}</span>
        </div>
      </header>

      {/* Main Dual Combat Arena */}
      <main className="relative z-10 w-full max-w-6xl mx-auto px-4 py-4 flex-1 flex flex-col justify-center space-y-6">
        {/* VS Status Header (Split Screen Combatants) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
          {/* Central VS Badge */}
          <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/90 border border-orange-500/40 items-center justify-center shadow-[0_0_25px_rgba(249,115,22,0.4)]">
            <Swords size={20} className="text-orange-400" />
          </div>

          {/* PLAYER 1 CARD (Local Shinobi) */}
          <div
            className={`p-5 rounded-3xl border transition-all relative overflow-hidden backdrop-blur-xl ${
              isRecoilActive
                ? "border-red-500/60 bg-red-950/20 shadow-[0_0_30px_rgba(239,68,68,0.3)] animate-shake"
                : "border-orange-500/30 bg-orange-950/10 shadow-[0_0_20px_rgba(249,115,22,0.1)]"
            }`}
          >
            {/* Ambient Player Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center font-black text-black text-lg shadow-lg">
                  {user?.username ? user.username.charAt(0).toUpperCase() : "S"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-base text-white tracking-wide">
                      {user?.username || player.username}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-orange-500/20 border border-orange-500/40 text-orange-400 font-mono text-[10px] font-bold">
                      {t("multiplayerArena.localPlayer")}
                    </span>
                  </div>
                  <span className="text-xs text-white/50 font-mono">
                    Lv. {player.level} · Rank {player.rank}
                  </span>
                </div>
              </div>

              {/* Combo Counter Badge */}
              <div className="text-right">
                <div className="flex items-center gap-1 text-orange-400 font-black text-xl font-mono">
                  <Zap size={16} />
                  <span>{p1Combo}x</span>
                </div>
                <span className="text-[10px] uppercase font-mono text-white/40 tracking-wider">
                  {t("multiplayerArena.combo")}
                </span>
              </div>
            </div>

            {/* Health Bar (1000 HP) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-white/60 flex items-center gap-1.5">
                  <Heart size={13} className="text-red-400" />
                  {t("multiplayerArena.hp")}
                </span>
                <span className="font-bold text-white">
                  {p1Hp} / {DEFAULT_MULTIPLAYER_CONFIG.initialHealth}
                </span>
              </div>
              <div className="h-3.5 rounded-full bg-neutral-900 border border-white/10 overflow-hidden p-0.5">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-lime-500 to-green-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                  initial={false}
                  animate={{ width: `${p1HpPercent}%` }}
                  transition={{ duration: 0.2 }}
                />
              </div>
            </div>

            {/* Ultimate Gauge Bar */}
            <div className="space-y-1.5 mt-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-amber-400/90 flex items-center gap-1.5 font-bold">
                  <Sparkles size={13} className="text-amber-400" />
                  {t("multiplayerArena.ultimate")}
                </span>
                <span className="font-bold text-amber-400">{p1Ultimate}%</span>
              </div>
              <div className="h-2 rounded-full bg-neutral-900 border border-white/10 overflow-hidden p-0.5">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 shadow-[0_0_10px_rgba(245,158,11,0.6)]"
                  initial={false}
                  animate={{ width: `${p1Ultimate}%` }}
                  transition={{ duration: 0.2 }}
                />
              </div>
            </div>

            {/* Ultimate Activation Trigger */}
            {p1Ultimate >= 100 && phase === "BATTLE" && (
              <motion.button
                type="button"
                onClick={triggerUltimateJutsu}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="w-full mt-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-orange-500 text-black font-black text-xs uppercase tracking-widest shadow-[0_0_25px_rgba(245,158,11,0.6)] cursor-pointer"
              >
                ⚡ RASENGAN BURST! (180 DMG)
              </motion.button>
            )}

            {/* Damage Indicator Floating */}
            <AnimatePresence>
              {p1LastHit && (
                <motion.div
                  key={p1LastHit.id}
                  initial={{ opacity: 1, y: 0, scale: 1.2 }}
                  animate={{ opacity: 0, y: -40, scale: 0.9 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                  className="absolute top-10 right-10 text-red-500 font-black text-2xl font-mono pointer-events-none drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]"
                >
                  -{p1LastHit.amount}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* PLAYER 2 CARD (Rival Shinobi) */}
          <div className="p-5 rounded-3xl border border-purple-500/30 bg-purple-950/10 backdrop-blur-xl relative overflow-hidden shadow-[0_0_20px_rgba(168,85,247,0.1)]">
            <div className="absolute top-0 left-0 w-32 h-32 bg-purple-500/10 blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center font-black text-white text-lg shadow-lg">
                  R
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-base text-white tracking-wide">
                      {t("multiplayerArena.rivalPlayer")}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-purple-500/20 border border-purple-500/40 text-purple-300 font-mono text-[10px] font-bold">
                      BOT
                    </span>
                  </div>
                  <span className="text-xs text-white/50 font-mono">Lv. {player.level} · Jonin</span>
                </div>
              </div>

              {/* Rival Combo Badge */}
              <div className="text-right">
                <div className="flex items-center gap-1 text-purple-400 font-black text-xl font-mono">
                  <Zap size={16} />
                  <span>{p2Combo}x</span>
                </div>
                <span className="text-[10px] uppercase font-mono text-white/40 tracking-wider">
                  {t("multiplayerArena.combo")}
                </span>
              </div>
            </div>

            {/* Health Bar (1000 HP) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-white/60 flex items-center gap-1.5">
                  <Heart size={13} className="text-red-400" />
                  {t("multiplayerArena.hp")}
                </span>
                <span className="font-bold text-white">
                  {p2Hp} / {DEFAULT_MULTIPLAYER_CONFIG.initialHealth}
                </span>
              </div>
              <div className="h-3.5 rounded-full bg-neutral-900 border border-white/10 overflow-hidden p-0.5">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-red-600 via-purple-600 to-indigo-600 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                  initial={false}
                  animate={{ width: `${p2HpPercent}%` }}
                  transition={{ duration: 0.2 }}
                />
              </div>
            </div>

            {/* Ultimate Gauge Bar */}
            <div className="space-y-1.5 mt-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-purple-400 flex items-center gap-1.5 font-bold">
                  <Sparkles size={13} className="text-purple-400" />
                  {t("multiplayerArena.ultimate")}
                </span>
                <span className="font-bold text-purple-400">{p2Ultimate}%</span>
              </div>
              <div className="h-2 rounded-full bg-neutral-900 border border-white/10 overflow-hidden p-0.5">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500"
                  initial={false}
                  animate={{ width: `${p2Ultimate}%` }}
                  transition={{ duration: 0.2 }}
                />
              </div>
            </div>

            {/* Rival Typing Progress Indicator */}
            <div className="mt-3 text-xs font-mono text-white/40 flex items-center justify-between">
              <span>{t("multiplayerArena.wordsCompleted")}:</span>
              <span className="text-purple-300 font-bold">
                {p2WordIndex} / {matchWords.length}
              </span>
            </div>

            {/* Damage Indicator Floating on Rival */}
            <AnimatePresence>
              {p2LastHit && (
                <motion.div
                  key={p2LastHit.id}
                  initial={{ opacity: 1, y: 0, scale: 1.3 }}
                  animate={{ opacity: 0, y: -40, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                  className="absolute top-10 left-10 text-orange-400 font-black text-2xl font-mono pointer-events-none drop-shadow-[0_0_10px_rgba(249,115,22,0.9)]"
                >
                  -{p2LastHit.amount}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ACTIVE TYPING BATTLE ZONE */}
        <div className="relative p-6 rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-2xl shadow-2xl flex flex-col items-center justify-center space-y-5">
          {/* Recoil Alert Warning */}
          <AnimatePresence>
            {isRecoilActive && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="py-1.5 px-4 rounded-full bg-red-500/20 border border-red-500/50 text-red-400 text-xs font-mono font-bold flex items-center gap-2"
              >
                <AlertTriangle size={14} />
                <span>{t("multiplayerArena.chakraRecoil")} (0.5s)</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Target Word Stream Ribbon */}
          <div className="flex items-center justify-center gap-3 overflow-hidden max-w-full py-2">
            {matchWords.slice(Math.max(0, p1WordIndex - 1), p1WordIndex + 4).map((w, idx) => {
              const actualIndex = Math.max(0, p1WordIndex - 1) + idx
              const isCurrent = actualIndex === p1WordIndex
              const isPassed = actualIndex < p1WordIndex

              return (
                <div
                  key={`${w}-${actualIndex}`}
                  className={`px-4 py-2 rounded-2xl font-mono font-bold text-lg transition-all ${
                    isCurrent
                      ? "bg-orange-500/20 border-2 border-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.4)] scale-110"
                      : isPassed
                      ? "text-white/20 text-sm line-through"
                      : "text-white/40 text-sm"
                  }`}
                >
                  {w}
                </div>
              )
            })}
          </div>

          {/* Target Word Letter Breakdown */}
          <div className="text-3xl sm:text-5xl font-mono font-black tracking-widest py-3 flex items-center justify-center">
            {currentTargetWord.split("").map((letter, i) => {
              const typedChar = typedInput[i]
              let colorClass = "text-white/30"
              if (typedChar !== undefined) {
                colorClass = typedChar === letter ? "text-emerald-400" : "text-red-500"
              } else if (i === typedInput.length) {
                colorClass = "text-orange-400 underline decoration-orange-500 animate-pulse"
              }
              return (
                <span key={i} className={colorClass}>
                  {letter}
                </span>
              )
            })}
          </div>

          {/* Interactive Keyboard Input */}
          <div className="w-full max-w-md relative">
            <input
              ref={inputRef}
              type="text"
              value={typedInput}
              onChange={handleInputChange}
              disabled={phase !== "BATTLE" || isRecoilActive}
              placeholder={
                phase === "BATTLE" ? t("multiplayerArena.typeWordPlaceholder") : "..."
              }
              className="w-full py-3 px-5 rounded-2xl bg-white/5 border border-white/20 text-center font-mono text-xl text-white placeholder:text-white/20 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 transition-all disabled:opacity-50"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck="false"
            />
          </div>

          {/* Telemetry Live Bar */}
          <div className="flex items-center gap-6 text-xs font-mono text-white/50 pt-2">
            <span>
              {t("multiplayerArena.wordsCompleted")}:{" "}
              <strong className="text-white">
                {p1WordIndex} / {matchWords.length}
              </strong>
            </span>
            <span>•</span>
            <span>
              {t("multiplayerArena.damageDealt")}:{" "}
              <strong className="text-orange-400">{p1DamageDealt} DMG</strong>
            </span>
          </div>
        </div>
      </main>

      {/* COUNTDOWN OVERLAY */}
      <AnimatePresence>
        {phase === "COUNTDOWN" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center"
          >
            <motion.div
              key={countdown}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="text-center space-y-4"
            >
              <div className="text-7xl sm:text-9xl font-black font-mono tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-500 drop-shadow-[0_0_35px_rgba(249,115,22,0.8)]">
                {countdown > 0 ? countdown : t("multiplayerArena.fight")}
              </div>
              <p className="text-xs uppercase tracking-widest text-white/60 font-mono">
                {t("multiplayerArena.roundStartIn")}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MATCH FINISHED RESULT MODAL */}
      <AnimatePresence>
        {phase === "FINISHED" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-lg p-6 sm:p-8 rounded-3xl border border-white/10 bg-neutral-950/90 shadow-[0_0_60px_rgba(0,0,0,0.9)] space-y-6 text-center relative overflow-hidden"
            >
              <div
                className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center shadow-xl ${
                  outcome === "VICTORY"
                    ? "bg-gradient-to-br from-amber-400 to-orange-500 text-black shadow-orange-500/30"
                    : "bg-gradient-to-br from-red-600 to-neutral-800 text-white shadow-red-500/30"
                }`}
              >
                {outcome === "VICTORY" ? <Trophy size={40} /> : <AlertTriangle size={40} />}
              </div>

              <div className="space-y-2">
                <h2
                  className={`text-4xl sm:text-5xl font-black tracking-tight ${
                    outcome === "VICTORY" ? "text-orange-400" : "text-red-500"
                  }`}
                >
                  {outcome === "VICTORY"
                    ? t("multiplayerArena.victoryTitle")
                    : t("multiplayerArena.defeatTitle")}
                </h2>
                <p className="text-xs sm:text-sm text-white/60 max-w-sm mx-auto">
                  {outcome === "VICTORY"
                    ? t("multiplayerArena.victorySubtitle")
                    : t("multiplayerArena.defeatSubtitle")}
                </p>
              </div>

              {/* Combat Telemetry Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                  <span className="text-[10px] font-mono uppercase text-white/40 block">
                    {t("multiplayerArena.wpm")}
                  </span>
                  <span className="text-xl font-black font-mono text-white">{finalStats.wpm}</span>
                </div>
                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                  <span className="text-[10px] font-mono uppercase text-white/40 block">
                    {t("multiplayerArena.accuracy")}
                  </span>
                  <span className="text-xl font-black font-mono text-emerald-400">
                    {finalStats.accuracy}%
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                  <span className="text-[10px] font-mono uppercase text-white/40 block">
                    {t("multiplayerArena.combo")}
                  </span>
                  <span className="text-xl font-black font-mono text-amber-400">
                    {p1MaxCombo}x
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleRematch}
                  className="flex-1 py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-black font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(249,115,22,0.4)] active:scale-95"
                >
                  <RotateCcw size={16} />
                  <span>{t("multiplayerArena.playAgain")}</span>
                </button>
                <Link
                  href="/multiplayer"
                  className="flex-1 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 border border-white/10"
                >
                  <ArrowLeft size={16} />
                  <span>{t("multiplayerArena.backToHub")}</span>
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function MultiplayerDemoPage() {
  return (
    <MultiplayerAuthGuard>
      <Suspense
        fallback={
          <div className="min-h-screen bg-black text-white flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
          </div>
        }
      >
        <ArenaContent />
      </Suspense>
    </MultiplayerAuthGuard>
  )
}
