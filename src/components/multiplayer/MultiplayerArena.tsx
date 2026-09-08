"use client"

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Swords,
  ArrowLeft,
  RotateCcw,
  Trophy,
  AlertTriangle,
  Sparkles,
  Flame,
  Flag,
} from "lucide-react"
import { useAuth } from "@/lib/auth/authContext"
import { usePlayer } from "@/hooks/usePlayer"
import { useI18n } from "@/lib/i18n/i18nContext"
import { TypingKeyboard } from "@/components/keyboard/TypingKeyboard"
import { MultiplayerMatchRow } from "@/types/database"
import {
  getMatchWords,
  submitWordCompletion,
  triggerUltimate,
  forfeitMatch,
} from "@/lib/multiplayer/matchService"
import { subscribeToRoomChannel } from "@/lib/multiplayer/roomManager"
import { getSkinById } from "@/data/keyboardSkins"
import { AttackEnergyGauge } from "./AttackEnergyGauge"

interface FloatingDamage {
  id: number
  amount: number
  target: "p1" | "p2"
  isCrit?: boolean
  label?: string
}

export interface MultiplayerArenaProps {
  match: MultiplayerMatchRow
  onExit: () => void
  onRematch?: () => void
}

export function MultiplayerArena({
  match: initialMatch,
  onExit,
  onRematch,
}: MultiplayerArenaProps) {
  const { user } = useAuth()
  const { player } = usePlayer()
  const { t } = useI18n()

  const [currentMatch, setCurrentMatch] = useState<MultiplayerMatchRow>(initialMatch)
  const isP1 = !currentMatch.player_2_id || currentMatch.player_1_id === (user?.id || "guest_player_1")
  const currentUserId = user?.id || (isP1 ? "guest_player_1" : "guest_player_2")

  // Word sequence
  const words = useMemo(() => getMatchWords(currentMatch), [currentMatch])

  // Local typing state
  const myWordIndex = isP1 ? currentMatch.player_1_word_index : currentMatch.player_2_word_index
  const [typedInput, setTypedInput] = useState("")
  const [lastPressedKey, setLastPressedKey] = useState<string | null>(null)
  const [lastErrorKey, setLastErrorKey] = useState<string | null>(null)
  const [isRecoilActive, setIsRecoilActive] = useState(false)

  // Local telemetry & combo tracking
  const [correctChars, setCorrectChars] = useState(0)
  const [totalChars, setTotalChars] = useState(0)
  const [localCombo, setLocalCombo] = useState(0)
  const [maxCombo, setMaxCombo] = useState(0)
  const [perfectWords, setPerfectWords] = useState(0)
  const [lastWordPerfect, setLastWordPerfect] = useState(false)
  const [comboBreak, setComboBreak] = useState(false)
  const wordHadMistakeRef = useRef(false)
  const [startTime, setStartTime] = useState<number | null>(null)

  // Damage float animations
  const [floatingDamages, setFloatingDamages] = useState<FloatingDamage[]>([])
  const damageIdRef = useRef(0)

  // Disconnect / Grace period
  const [showForfeitConfirm, setShowForfeitConfirm] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Health and energy variables
  const p1Hp = currentMatch.player_1_hp
  const p2Hp = currentMatch.player_2_hp
  const myHp = isP1 ? p1Hp : p2Hp
  const myUlt = isP1 ? currentMatch.player_1_ultimate_energy : currentMatch.player_2_ultimate_energy

  // Danger threshold (<25% HP)
  const isMyHpCritical = myHp > 0 && myHp <= 250

  // Cosmetics
  const p1Skin = getSkinById(currentMatch.player_1_skin_id || "default_forge")
  const p2Skin = getSkinById(currentMatch.player_2_skin_id || "default_forge")
  const mySkin = isP1 ? p1Skin : p2Skin

  // Match timer for pure WPM calculation
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  useEffect(() => {
    if (currentMatch.status !== "playing") return
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [currentMatch.status])

  // Live match synchronization via broadcast channel if room_code exists
  useEffect(() => {
    if (!currentMatch.room_code) return

    const { unsubscribe } = subscribeToRoomChannel(
      currentMatch.room_code,
      () => {},
      (eventPayload) => {
        if (eventPayload.event === "MATCH_START" && eventPayload.extra?.match) {
          setCurrentMatch(eventPayload.extra.match as MultiplayerMatchRow)
        }
      }
    )

    return () => {
      unsubscribe()
    }
  }, [currentMatch.room_code])

  // Focus input automatically
  useEffect(() => {
    if (currentMatch.status === "playing") {
      inputRef.current?.focus()
    }
  }, [currentMatch.status])

  // Spawn floating damage effect
  const triggerDamageFloat = useCallback((amount: number, target: "p1" | "p2", isCrit = false, label?: string) => {
    damageIdRef.current += 1
    const newDamage: FloatingDamage = {
      id: damageIdRef.current,
      amount,
      target,
      isCrit,
      label,
    }
    setFloatingDamages((prev) => [...prev.slice(-8), newDamage])
    setTimeout(() => {
      setFloatingDamages((prev) => prev.filter((d) => d.id !== newDamage.id))
    }, 1200)
  }, [])

  // Calculate live WPM and accuracy
  const elapsedMinutes = Math.max(0.05, elapsedSeconds / 60)
  const liveWpm = Math.round(correctChars / 5 / elapsedMinutes) || 0
  const liveAccuracy = totalChars > 0 ? Math.round((correctChars / totalChars) * 100) : 100

  // Handle typing input
  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (currentMatch.status !== "playing" || isRecoilActive) return

    if (!startTime) {
      setStartTime(Date.now())
    }

    const value = e.target.value
    const currentWord = words[myWordIndex] || ""
    setTypedInput(value)

    if (value.length > 0) {
      const lastChar = value[value.length - 1]
      setLastPressedKey(lastChar)

      // Character check
      const expectedChar = currentWord[value.length - 1]
      if (lastChar === expectedChar) {
        setCorrectChars((prev) => prev + 1)
        setTotalChars((prev) => prev + 1)
        setLastErrorKey(null)
      } else {
        setTotalChars((prev) => prev + 1)
        setLastErrorKey(lastChar)
        wordHadMistakeRef.current = true

        if (localCombo > 0) {
          setComboBreak(true)
          setTimeout(() => setComboBreak(false), 800)
        }
        setLocalCombo(0)

        // Typo recoil lockout (300ms)
        setIsRecoilActive(true)
        setTimeout(() => setIsRecoilActive(false), 300)
        return
      }
    }

    // Word completed successfully
    if (value === currentWord || (value.trim() === currentWord && value.endsWith(" "))) {
      const isPerfect = !wordHadMistakeRef.current
      wordHadMistakeRef.current = false

      if (isPerfect) {
        setPerfectWords((prev) => prev + 1)
        setLastWordPerfect(true)
        setTimeout(() => setLastWordPerfect(false), 1000)
      }

      const newCombo = localCombo + 1
      setLocalCombo(newCombo)
      if (newCombo > maxCombo) {
        setMaxCombo(newCombo)
      }

      setTypedInput("")
      setLastErrorKey(null)

      // Submit authoritative word completion to server/service
      const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
      try {
        const updated = await submitWordCompletion({
          matchId: currentMatch.id,
          eventId,
          wordIndex: myWordIndex,
          wordText: currentWord,
          wpm: liveWpm,
          accuracy: liveAccuracy,
          combo: newCombo,
          playerId: currentUserId,
        })

        // Check if an attack resolved
        const oldOppHp = isP1 ? currentMatch.player_2_hp : currentMatch.player_1_hp
        const newOppHp = isP1 ? updated.player_2_hp : updated.player_1_hp
        if (newOppHp < oldOppHp) {
          const diff = oldOppHp - newOppHp
          triggerDamageFloat(diff, isP1 ? "p2" : "p1", newCombo >= 10, `${newCombo}x COMBO!`)
        }

        setCurrentMatch(updated)
      } catch (err) {
        console.warn("[Arena] Submit word failed:", err)
      }
    }
  }

  // Handle Ultimate Activation
  const handleTriggerUltimate = async () => {
    if (myUlt < 100 || currentMatch.status !== "playing") return

    try {
      const updated = await triggerUltimate({
        matchId: currentMatch.id,
        playerId: currentUserId,
      })

      triggerDamageFloat(160, isP1 ? "p2" : "p1", true, "SHINOBI ULTIMATE!")
      setCurrentMatch(updated)
    } catch (err) {
      console.warn("[Arena] Ultimate failed:", err)
    }
  }

  // Handle Forfeit
  const handleForfeit = async () => {
    try {
      const updated = await forfeitMatch({
        matchId: currentMatch.id,
        playerId: currentUserId,
      })
      setCurrentMatch(updated)
      setShowForfeitConfirm(false)
    } catch (err) {
      console.warn("[Arena] Forfeit failed:", err)
    }
  }

  // Active word details
  const currentWord = words[myWordIndex] || ""
  const nextWords = words.slice(myWordIndex + 1, myWordIndex + 4)
  const expectedKey = currentWord[typedInput.length] || null

  const isFinished = currentMatch.status === "finished"
  const isWinner = currentMatch.winner_id === currentUserId
  const isDraw = currentMatch.is_draw

  return (
    <div className="relative min-h-screen bg-black text-white flex flex-col justify-between overflow-hidden selection:bg-orange-500/30 selection:text-orange-200">
      {/* Background Anime Ambience */}
      <div
        className={`absolute top-0 left-1/4 w-[600px] h-[350px] transition-all duration-700 blur-[140px] pointer-events-none ${
          isMyHpCritical ? "bg-red-600/25 animate-pulse" : "bg-orange-600/10"
        }`}
      />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-600/10 blur-[130px] pointer-events-none" />

      {/* TOP COMBAT HUD */}
      <header className="relative z-20 w-full max-w-6xl mx-auto px-4 pt-4 pb-2">
        <div className="p-4 rounded-3xl border border-white/10 bg-neutral-950/70 backdrop-blur-xl shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
            {/* PLAYER 1 HUD (Left 3 cols) */}
            <div className="md:col-span-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center font-black text-xs text-black shadow-md">
                    1
                  </div>
                  <div>
                    <span className="text-sm font-black text-white block leading-tight">
                      {isP1 ? (user?.username || player.username) : "Host Shinobi"}
                    </span>
                    <span className="text-[10px] font-mono text-orange-400 font-bold">
                      Lv. {player.level} • {p1Skin.name}
                    </span>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <span
                    className={`text-lg font-black transition-colors ${
                      p1Hp <= 250 ? "text-rose-500 animate-pulse" : "text-white"
                    }`}
                  >
                    {p1Hp}
                  </span>
                  <span className="text-xs text-white/40 font-bold"> / 1000 HP</span>
                </div>
              </div>

              {/* P1 HP Bar */}
              <div className="w-full h-3.5 bg-neutral-900 rounded-full overflow-hidden border border-white/10 relative">
                <motion.div
                  className={`h-full rounded-full transition-all duration-300 ${
                    p1Hp <= 250
                      ? "bg-gradient-to-r from-red-600 to-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.8)]"
                      : "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                  }`}
                  animate={{ width: `${Math.max(0, Math.min(100, (p1Hp / 1000) * 100))}%` }}
                />
              </div>

              {/* P1 Attack Energy & Ultimate Bar */}
              <div className="grid grid-cols-2 gap-2 pt-1 text-[10px] font-mono">
                <AttackEnergyGauge
                  energy={currentMatch.player_1_attack_energy}
                  isPlayer1={true}
                />

                <div>
                  <div className="flex justify-between text-white/60 mb-0.5">
                    <span>ULTIMATE</span>
                    <span className="text-purple-400 font-bold">{currentMatch.player_1_ultimate_energy}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-neutral-900 rounded-full overflow-hidden border border-white/10 p-[1px]">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-200"
                      style={{ width: `${currentMatch.player_1_ultimate_energy}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* CENTER MATCH STATUS (1 col) */}
            <div className="md:col-span-1 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shadow-lg">
                <Swords size={18} className="text-orange-400" />
              </div>
              <span className="text-[10px] font-mono font-bold text-white/50 tracking-widest uppercase mt-1">
                {currentMatch.room_code || "QUICK"}
              </span>
              <span className="text-[9px] font-mono text-orange-400/80 font-bold">
                {myWordIndex} / {currentMatch.word_count}
              </span>
            </div>

            {/* PLAYER 2 HUD (Right 3 cols) */}
            <div className="md:col-span-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-mono">
                  <span
                    className={`text-lg font-black transition-colors ${
                      p2Hp <= 250 ? "text-rose-500 animate-pulse" : "text-white"
                    }`}
                  >
                    {p2Hp}
                  </span>
                  <span className="text-xs text-white/40 font-bold"> / 1000 HP</span>
                </div>

                <div className="flex items-center gap-2 text-right">
                  <div>
                    <span className="text-sm font-black text-white block leading-tight">
                      {!isP1 ? (user?.username || player.username) : "Rival Shinobi"}
                    </span>
                    <span className="text-[10px] font-mono text-blue-400 font-bold">
                      {p2Skin.name}
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center font-black text-xs text-black shadow-md">
                    2
                  </div>
                </div>
              </div>

              {/* P2 HP Bar */}
              <div className="w-full h-3.5 bg-neutral-900 rounded-full overflow-hidden border border-white/10 relative">
                <motion.div
                  className={`h-full rounded-full transition-all duration-300 ${
                    p2Hp <= 250
                      ? "bg-gradient-to-r from-red-600 to-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.8)]"
                      : "bg-gradient-to-r from-blue-500 to-cyan-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                  }`}
                  animate={{ width: `${Math.max(0, Math.min(100, (p2Hp / 1000) * 100))}%` }}
                />
              </div>

              {/* P2 Attack Energy & Ultimate Bar */}
              <div className="grid grid-cols-2 gap-2 pt-1 text-[10px] font-mono">
                <AttackEnergyGauge
                  energy={currentMatch.player_2_attack_energy}
                  isPlayer1={false}
                />

                <div>
                  <div className="flex justify-between text-white/60 mb-0.5">
                    <span>ULTIMATE</span>
                    <span className="text-pink-400 font-bold">{currentMatch.player_2_ultimate_energy}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-neutral-900 rounded-full overflow-hidden border border-white/10 p-[1px]">
                    <div
                      className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full transition-all duration-200"
                      style={{ width: `${currentMatch.player_2_ultimate_energy}%` }}
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </header>

      {/* FLOATING DAMAGE INDICATORS OVERLAY */}
      <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center overflow-hidden">
        <AnimatePresence>
          {floatingDamages.map((dmg) => (
            <motion.div
              key={dmg.id}
              initial={{ opacity: 0, y: 0, scale: 0.5 }}
              animate={{ opacity: 1, y: -80, scale: dmg.isCrit ? 1.4 : 1.1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={`absolute font-black font-mono tracking-wider drop-shadow-[0_0_15px_rgba(0,0,0,0.9)] ${
                dmg.target === "p1" ? "left-1/4" : "right-1/4"
              } ${dmg.isCrit ? "text-yellow-400 text-3xl sm:text-4xl" : "text-rose-500 text-2xl sm:text-3xl"}`}
            >
              -{dmg.amount} DMG
              {dmg.label && (
                <div className="text-xs text-white uppercase tracking-widest font-bold block">
                  {dmg.label}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* MIDDLE TYPING BATTLEGROUND */}
      <main className="relative z-10 w-full max-w-4xl mx-auto px-4 py-4 flex flex-col items-center justify-center space-y-6 flex-1">
        {/* Combo & Telemetry Ribbon */}
        <div className="flex items-center justify-between w-full max-w-xl px-4 py-2 rounded-2xl bg-white/[0.03] border border-white/10 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-orange-400 font-bold">{t("game.wpm")}:</span>
            <span className="text-white font-black text-sm">{liveWpm}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-bold">{t("game.accuracy")}:</span>
            <span className="text-white font-black text-sm">{liveAccuracy}%</span>
          </div>

          <div className="flex items-center gap-2">
            <Flame
              size={14}
              className={`${
                localCombo >= 10 ? "text-amber-400 animate-bounce" : "text-white/40"
              }`}
            />
            <span className="text-white/60 font-bold">COMBO:</span>
            {localCombo >= 30 ? (
              <span className="text-cyan-300 font-black text-sm animate-pulse">
                {localCombo}x LEGENDARY!
              </span>
            ) : localCombo >= 20 ? (
              <span className="text-purple-400 font-black text-sm animate-pulse">
                {localCombo}x EPIC!
              </span>
            ) : localCombo >= 10 ? (
              <span className="text-amber-400 font-black text-sm animate-pulse">
                {localCombo}x GREAT!
              </span>
            ) : localCombo >= 5 ? (
              <span className="text-orange-400 font-black text-sm">{localCombo}x</span>
            ) : (
              <span className="text-white font-black text-sm">{localCombo}x</span>
            )}
          </div>
        </div>

        {/* Word Display Stream */}
        <div className="w-full max-w-xl p-8 rounded-3xl bg-neutral-950/80 border border-white/15 backdrop-blur-xl shadow-2xl text-center relative overflow-hidden">
          {/* Typo Recoil Lockout Glow */}
          {isRecoilActive && (
            <motion.div
              initial={{ opacity: 0.8 }}
              animate={{ opacity: 0 }}
              className="absolute inset-0 bg-red-600/20 pointer-events-none"
            />
          )}

          {/* Perfect Word Flash / Combo Break Notification */}
          <div className="h-6 flex items-center justify-center mb-1">
            <AnimatePresence>
              {lastWordPerfect && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.7, y: 5 }}
                  animate={{ opacity: 1, scale: [0.7, 1.15, 1], y: 0 }}
                  exit={{ opacity: 0, scale: 1.2 }}
                  className="text-xs font-black font-mono tracking-widest text-cyan-300 drop-shadow-[0_0_12px_rgba(6,182,212,0.9)]"
                >
                  ✨ PERFECT WORD! +30 ENERGY
                </motion.span>
              )}
              {comboBreak && (
                <motion.span
                  initial={{ opacity: 1, y: 0 }}
                  animate={{ opacity: 0, y: -10 }}
                  className="text-xs font-bold font-mono tracking-wider text-rose-500"
                >
                  💥 COMBO BROKEN!
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* Current Target Word */}
          <div className="mb-4">
            <span className="text-xs font-mono uppercase tracking-widest text-orange-400/80 font-bold block mb-2">
              TARGET WORD #{myWordIndex + 1}
            </span>

            <div className="text-4xl sm:text-5xl font-black font-mono tracking-wider flex justify-center items-center gap-1">
              {currentWord.split("").map((char, idx) => {
                const typedChar = typedInput[idx]
                let colorClass = "text-white/30"
                if (typedChar !== undefined) {
                  colorClass = typedChar === char ? "text-emerald-400" : "text-rose-500 underline"
                } else if (idx === typedInput.length) {
                  colorClass = "text-orange-400 underline animate-pulse"
                }

                return (
                  <span key={idx} className={`${colorClass} transition-colors`}>
                    {char}
                  </span>
                )
              })}
            </div>
          </div>

          {/* Upcoming Words Carousel */}
          <div className="flex items-center justify-center gap-3 pt-3 border-t border-white/10 text-xs font-mono text-white/40">
            <span>NEXT:</span>
            {nextWords.map((nw, i) => (
              <span key={i} className="px-2 py-0.5 rounded bg-white/5 border border-white/5">
                {nw}
              </span>
            ))}
          </div>

          {/* Hidden Typable Input */}
          <input
            ref={inputRef}
            type="text"
            value={typedInput}
            onChange={handleInputChange}
            disabled={isFinished}
            autoFocus
            className="opacity-0 absolute inset-0 w-full h-full cursor-default"
          />
        </div>

        {/* Combat Action Controls */}
        <div className="flex items-center justify-between w-full max-w-xl gap-4">
          {/* Ultimate Trigger Button */}
          <button
            type="button"
            disabled={myUlt < 100 || isFinished}
            onClick={handleTriggerUltimate}
            className={`flex-1 py-3 px-4 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
              myUlt >= 100
                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-[0_0_25px_rgba(168,85,247,0.6)] animate-pulse"
                : "bg-white/5 border border-white/10 text-white/30 cursor-not-allowed"
            }`}
          >
            <Sparkles size={16} />
            <span>{myUlt >= 100 ? "UNLEASH ULTIMATE! (READY)" : `ULTIMATE (${myUlt}%)`}</span>
          </button>

          {/* Forfeit Safeguard */}
          <button
            type="button"
            onClick={() => setShowForfeitConfirm(true)}
            className="py-3 px-4 rounded-2xl bg-white/5 hover:bg-rose-500/20 hover:text-rose-300 border border-white/10 text-xs font-mono font-bold text-white/60 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Forfeit match"
          >
            <Flag size={14} />
            <span>FORFEIT</span>
          </button>
        </div>
      </main>

      {/* BOTTOM VISUAL KEYBOARD */}
      <footer className="relative z-10 w-full max-w-4xl mx-auto px-4 pb-4">
        <div className="p-3 rounded-3xl bg-neutral-950/70 border border-white/10 backdrop-blur-xl shadow-xl">
          <TypingKeyboard
            expectedKey={expectedKey}
            pressedKey={lastPressedKey}
            lastErrorKey={lastErrorKey}
            layout={currentMatch.language === "en" ? "en" : "pt-BR"}
            size="sm"
            skinVisual={mySkin.visual}
          />
        </div>
      </footer>

      {/* FORFEIT CONFIRMATION MODAL */}
      <AnimatePresence>
        {showForfeitConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="p-6 rounded-3xl bg-neutral-950 border border-white/10 max-w-sm w-full space-y-4 text-center">
              <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
              <h3 className="text-lg font-black text-white">Forfeit Match?</h3>
              <p className="text-xs text-white/60">
                Are you sure you want to forfeit? Your opponent will be awarded victory.
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForfeitConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold font-mono text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleForfeit}
                  className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-xs font-bold font-mono text-black transition-colors"
                >
                  Confirm Forfeit
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* POST-MATCH RESOLUTION OVERLAY */}
      <AnimatePresence>
        {isFinished && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto"
          >
            <div className="max-w-md w-full p-8 rounded-3xl border border-white/15 bg-neutral-950 shadow-2xl text-center space-y-6 my-auto">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center shadow-2xl ${
                  isWinner
                    ? "bg-gradient-to-br from-yellow-400 to-amber-500 text-black shadow-[0_0_35px_rgba(245,158,11,0.7)]"
                    : isDraw
                    ? "bg-white/10 text-white"
                    : "bg-rose-500/20 border border-rose-500/40 text-rose-400"
                }`}
              >
                {isWinner ? <Trophy size={40} /> : <Swords size={36} />}
              </motion.div>

              <div>
                <h2
                  className={`text-3xl font-black uppercase tracking-wider ${
                    isWinner ? "text-yellow-400" : isDraw ? "text-white" : "text-rose-400"
                  }`}
                >
                  {isWinner ? "SHINOBI VICTORY!" : isDraw ? "HONORABLE DRAW" : "DEFEAT"}
                </h2>
                <p className="text-xs text-white/50 font-mono mt-1">
                  {isWinner ? "+120 XP EARNED • RANK PROGRESSION" : "+40 XP EARNED • BATTLE COMPLETED"}
                </p>
              </div>

              {/* Performance Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-left font-mono">
                <div>
                  <span className="text-[10px] text-white/40 block">WPM</span>
                  <span className="text-lg font-black text-white">{liveWpm}</span>
                </div>
                <div>
                  <span className="text-[10px] text-white/40 block">ACCURACY</span>
                  <span className="text-lg font-black text-emerald-400">{liveAccuracy}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-white/40 block">MAX COMBO</span>
                  <span className="text-lg font-black text-amber-400">{maxCombo}x</span>
                </div>
                <div>
                  <span className="text-[10px] text-white/40 block">PERFECT</span>
                  <span className="text-lg font-black text-cyan-300">{perfectWords}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onExit}
                  className="flex-1 py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/15 text-xs font-bold font-mono text-white transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ArrowLeft size={16} />
                  <span>Return to Lobby</span>
                </button>

                {onRematch && (
                  <button
                    type="button"
                    onClick={onRematch}
                    className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-xs font-black font-mono text-black transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(249,115,22,0.4)]"
                  >
                    <RotateCcw size={16} />
                    <span>Rematch</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
