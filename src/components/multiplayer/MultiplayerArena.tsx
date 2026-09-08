"use client"

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react"
import Link from "next/link"
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
  Timer,
  BookOpen,
  TrendingUp,
  Check,
} from "lucide-react"
import { useAuth } from "@/lib/auth/authContext"
import { usePlayer } from "@/hooks/usePlayer"
import { useI18n } from "@/lib/i18n/i18nContext"
import { TypingKeyboard } from "@/components/keyboard/TypingKeyboard"
import { MultiplayerMatchRow, MultiplayerMatchResultRow } from "@/types/database"
import {
  getMatchWords,
  submitWordCompletion,
  triggerUltimate,
  forfeitMatch,
  claimDisconnectForfeit,
  subscribeToMatchBattle,
  getMatchResult,
  MatchTelemetryPayload,
} from "@/lib/multiplayer/matchService"
import { subscribeToRoomChannel } from "@/lib/multiplayer/roomManager"
import { getSkinById } from "@/data/keyboardSkins"
import { AttackEnergyGauge } from "./AttackEnergyGauge"
import { PostMatchAnalysis } from "./PostMatchAnalysis"
import {
  processMultiplayerRewards,
} from "@/lib/multiplayer/processMultiplayerRewards"

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
  const [ultimateActiveFlash, setUltimateActiveFlash] = useState(false)
  const [screenShake, setScreenShake] = useState(false)
  const [activeAttackBeam, setActiveAttackBeam] = useState<"p1_to_p2" | "p2_to_p1" | null>(null)
  const wordHadMistakeRef = useRef(false)
  const [weakKeyStats, setWeakKeyStats] = useState<{ key: string; count: number }[]>([])
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false)
  const [startTime, setStartTime] = useState<number | null>(null)

  // Damage float animations
  const [floatingDamages, setFloatingDamages] = useState<FloatingDamage[]>([])
  const damageIdRef = useRef(0)

  // Disconnect / Grace period
  const [showForfeitConfirm, setShowForfeitConfirm] = useState(false)
  const [isOpponentDisconnected, setIsOpponentDisconnected] = useState(false)
  const [disconnectGraceCountdown, setDisconnectGraceCountdown] = useState(15)
  const [reconnectedNotice, setReconnectedNotice] = useState(false)
  const [matchResult, setMatchResult] = useState<MultiplayerMatchResultRow | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const isTriggeringUltRef = useRef(false)
  const isForfeitingRef = useRef(false)

  // Health and energy variables
  const p1Hp = currentMatch.player_1_hp
  const p2Hp = currentMatch.player_2_hp
  const myHp = isP1 ? p1Hp : p2Hp
  const myUlt = isP1 ? currentMatch.player_1_ultimate_energy : currentMatch.player_2_ultimate_energy

  // Opponent Live Telemetry
  const oppWordIndex = isP1 ? currentMatch.player_2_word_index : currentMatch.player_1_word_index
  const oppWpm = isP1 ? currentMatch.player_2_wpm : currentMatch.player_1_wpm
  const oppAccuracy = isP1 ? currentMatch.player_2_accuracy : currentMatch.player_1_accuracy

  // Danger threshold (<25% HP)
  const isMyHpCritical = myHp > 0 && myHp <= 250

  // Cosmetics
  const p1Skin = getSkinById(currentMatch.player_1_skin_id || "default_forge")
  const p2Skin = getSkinById(currentMatch.player_2_skin_id || "default_forge")
  const mySkin = isP1 ? p1Skin : p2Skin

  // Shadow Shinobi Opponent Detection
  const isOpponentShadow = isP1
    ? Boolean(currentMatch.player_2_id?.startsWith("shadow_"))
    : Boolean(currentMatch.player_1_id?.startsWith("shadow_"))

  const opponentShadowName = useMemo(() => {
    const oppId = isP1 ? currentMatch.player_2_id : currentMatch.player_1_id
    if (!oppId || !oppId.startsWith("shadow_")) return null
    const raw = oppId.replace("shadow_", "").replace(/_/g, " ")
    return raw
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  }, [isP1, currentMatch.player_1_id, currentMatch.player_2_id])

  // Match timer for pure WPM calculation
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  useEffect(() => {
    if (currentMatch.status !== "playing") return
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [currentMatch.status])

  const isFinished = currentMatch.status === "finished"
  const isWinner = currentMatch.winner_id === currentUserId
  const isDraw = currentMatch.is_draw

  // Fetch authoritative match result upon match completion
  useEffect(() => {
    if (isFinished) {
      getMatchResult(currentMatch.id).then((res) => {
        if (res) setMatchResult(res)
      })
    }
  }, [isFinished, currentMatch.id])

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

  const broadcastRef = useRef<{
    broadcastTelemetry: (t: MatchTelemetryPayload) => Promise<void>
    broadcastAttack: (a: string, d: number, u?: boolean) => Promise<void>
    broadcastMatchFinished: (w: string | null, d: boolean) => Promise<void>
  } | null>(null)

  // Real-time PvP match subscription (telemetry, attacks, and Postgres DB state updates)
  useEffect(() => {
    const { broadcastTelemetry, broadcastAttack, broadcastMatchFinished, unsubscribe } = subscribeToMatchBattle(
      currentMatch.id,
      {
        onMatchUpdate: (updatedMatch) => {
          setCurrentMatch((prev) => ({
            ...prev,
            ...updatedMatch,
          }))
        },
        onMatchFinished: ({ winnerId, isDraw: draw }) => {
          setCurrentMatch((prev) => ({
            ...prev,
            status: "finished",
            winner_id: winnerId,
            is_draw: draw,
          }))
        },
        onOpponentTelemetry: (telemetry) => {
          if (telemetry.playerId === currentUserId) return

          // Authoritative client protection: sanitize telemetry bounds
          const safeWordIndex = Math.max(0, Math.min(currentMatch.word_count, telemetry.wordIndex))
          const safeWpm = Math.max(0, Math.min(260, telemetry.wpm))
          const safeAccuracy = Math.max(0, Math.min(100, telemetry.accuracy))
          const safeCombo = Math.max(0, Math.min(safeWordIndex + 1, telemetry.combo))
          const safeAttackEnergy = Math.max(0, Math.min(100, telemetry.attackEnergy))
          const safeUltEnergy = Math.max(0, Math.min(100, telemetry.ultimateEnergy))
          const safeHp = Math.max(0, Math.min(1000, telemetry.hp))

          setCurrentMatch((prev) => {
            const isOppP1 = prev.player_1_id === telemetry.playerId
            return {
              ...prev,
              player_1_word_index: isOppP1 ? safeWordIndex : prev.player_1_word_index,
              player_2_word_index: !isOppP1 ? safeWordIndex : prev.player_2_word_index,
              player_1_wpm: isOppP1 ? safeWpm : prev.player_1_wpm,
              player_2_wpm: !isOppP1 ? safeWpm : prev.player_2_wpm,
              player_1_accuracy: isOppP1 ? safeAccuracy : prev.player_1_accuracy,
              player_2_accuracy: !isOppP1 ? safeAccuracy : prev.player_2_accuracy,
              player_1_combo: isOppP1 ? safeCombo : prev.player_1_combo,
              player_2_combo: !isOppP1 ? safeCombo : prev.player_2_combo,
              player_1_attack_energy: isOppP1 ? safeAttackEnergy : prev.player_1_attack_energy,
              player_2_attack_energy: !isOppP1 ? safeAttackEnergy : prev.player_2_attack_energy,
              player_1_ultimate_energy: isOppP1 ? safeUltEnergy : prev.player_1_ultimate_energy,
              player_2_ultimate_energy: !isOppP1 ? safeUltEnergy : prev.player_2_ultimate_energy,
              player_1_hp: isOppP1 ? safeHp : prev.player_1_hp,
              player_2_hp: !isOppP1 ? safeHp : prev.player_2_hp,
            }
          })
        },
        onAttackEvent: (event) => {
          if (event.attackerId !== currentUserId) {
            triggerDamageFloat(
              event.damage,
              isP1 ? "p1" : "p2",
              event.isUlt,
              event.isUlt ? "OPPONENT ULTIMATE!" : "OPPONENT STRIKE!"
            )
            setActiveAttackBeam(isP1 ? "p2_to_p1" : "p1_to_p2")
            setTimeout(() => setActiveAttackBeam(null), 600)
            setScreenShake(true)
            setTimeout(() => setScreenShake(false), 400)
          }
        },
        onOpponentPresenceChange: (isOnline) => {
          if (isOpponentShadow) return
          if (!isOnline) {
            setIsOpponentDisconnected(true)
          } else {
            setIsOpponentDisconnected((prev) => {
              if (prev) {
                setReconnectedNotice(true)
                setTimeout(() => setReconnectedNotice(false), 3500)
              }
              return false
            })
            setDisconnectGraceCountdown(15)
          }
        },
      },
      currentUserId
    )

    broadcastRef.current = { broadcastTelemetry, broadcastAttack, broadcastMatchFinished }

    return () => {
      unsubscribe()
    }
  }, [currentMatch.id, currentMatch.word_count, currentUserId, isP1, isOpponentShadow, triggerDamageFloat])

  // Disconnect Grace Period Countdown & Forfeit Award
  useEffect(() => {
    if (!isOpponentDisconnected || currentMatch.status !== "playing" || isOpponentShadow) {
      return
    }

    const interval = setInterval(async () => {
      setDisconnectGraceCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          // Authoritatively claim forfeit victory due to opponent disconnect
          claimDisconnectForfeit({
            matchId: currentMatch.id,
            playerId: currentUserId,
          })
            .then((updated) => {
              broadcastRef.current?.broadcastMatchFinished(currentUserId, false)
              setCurrentMatch(updated)
            })
            .catch((err) => {
              console.warn("[Arena] Claim disconnect forfeit failed:", err)
            })
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isOpponentDisconnected, currentMatch.status, currentMatch.id, currentUserId, isOpponentShadow])


  // Shadow Shinobi AI autonomous simulation
  useEffect(() => {
    if (!isOpponentShadow || currentMatch.status !== "playing") return

    const shadowId = isP1 ? currentMatch.player_2_id! : currentMatch.player_1_id
    const targetWpm = Math.max(35, Math.min(85, Math.round(player.stats.bestWpm * 0.9) || 50))
    const wordDelay = Math.max(1200, Math.round((60 / targetWpm) * 1000))

    let isCancelled = false

    const timer = setInterval(() => {
      if (isCancelled) return

      setCurrentMatch((prev) => {
        if (prev.status !== "playing") return prev
        const currentOppWordIdx = isP1 ? prev.player_2_word_index : prev.player_1_word_index
        if (currentOppWordIdx >= words.length) return prev

        const wordText = words[currentOppWordIdx]
        const oppCombo = (isP1 ? prev.player_2_combo : prev.player_1_combo) + 1
        const oppUlt = isP1 ? prev.player_2_ultimate_energy : prev.player_1_ultimate_energy

        if (oppUlt >= 100) {
          triggerUltimate({
            matchId: prev.id,
            playerId: shadowId,
          })
            .then((updated) => {
              if (!isCancelled) {
                triggerDamageFloat(160, isP1 ? "p1" : "p2", true, "SHADOW ULTIMATE!")
                setActiveAttackBeam(isP1 ? "p2_to_p1" : "p1_to_p2")
                setTimeout(() => setActiveAttackBeam(null), 800)
                setScreenShake(true)
                setTimeout(() => setScreenShake(false), 400)
                setCurrentMatch(updated)
              }
            })
            .catch(() => {})
          return prev
        }

        const eventId = `shadow_evt_${Date.now()}_${currentOppWordIdx}`
        submitWordCompletion({
          matchId: prev.id,
          eventId,
          wordIndex: currentOppWordIdx,
          wordText,
          wpm: targetWpm,
          accuracy: 97,
          combo: oppCombo,
          playerId: shadowId,
        })
          .then((updated) => {
            if (!isCancelled) {
              const oldMyHp = isP1 ? prev.player_1_hp : prev.player_2_hp
              const newMyHp = isP1 ? updated.player_1_hp : updated.player_2_hp
              if (newMyHp < oldMyHp) {
                const diff = oldMyHp - newMyHp
                triggerDamageFloat(diff, isP1 ? "p1" : "p2", oppCombo >= 10, "OPPONENT STRIKE!")
                setActiveAttackBeam(isP1 ? "p2_to_p1" : "p1_to_p2")
                setTimeout(() => setActiveAttackBeam(null), 600)
                setScreenShake(true)
                setTimeout(() => setScreenShake(false), 400)
              }
              setCurrentMatch(updated)
            }
          })
          .catch(() => {})

        return prev
      })
    }, wordDelay)

    return () => {
      isCancelled = true
      clearInterval(timer)
    }
  }, [
    isOpponentShadow,
    currentMatch.status,
    currentMatch.id,
    currentMatch.player_1_id,
    currentMatch.player_2_id,
    isP1,
    words,
    player.stats.bestWpm,
    triggerDamageFloat,
  ])


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

  // Calculate live WPM and accuracy
  const elapsedMinutes = Math.max(0.05, elapsedSeconds / 60)
  const liveWpm = Math.round(correctChars / 5 / elapsedMinutes) || 0
  const liveAccuracy = totalChars > 0 ? Math.round((correctChars / totalChars) * 100) : 100

  // Authoritative multiplayer progression rewards computed on match finish
  const rewardSummary = useMemo(() => {
    if (!isFinished) return null
    return processMultiplayerRewards(
      currentMatch,
      currentUserId,
      liveWpm,
      liveAccuracy,
      maxCombo
    )
  }, [isFinished, currentMatch, currentUserId, liveWpm, liveAccuracy, maxCombo])

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
        const lowChar = lastChar.toLowerCase()
        setWeakKeyStats((prev) => {
          const idx = prev.findIndex((k) => k.key === lowChar)
          if (idx >= 0) {
            const next = [...prev]
            next[idx] = { key: lowChar, count: next[idx].count + 1 }
            return next
          }
          return [...prev, { key: lowChar, count: 1 }]
        })

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
          setActiveAttackBeam(isP1 ? "p1_to_p2" : "p2_to_p1")
          setTimeout(() => setActiveAttackBeam(null), 600)
          broadcastRef.current?.broadcastAttack(currentUserId, diff, false)
        }

        const oldMyHp = isP1 ? currentMatch.player_1_hp : currentMatch.player_2_hp
        const newMyHp = isP1 ? updated.player_1_hp : updated.player_2_hp
        if (newMyHp < oldMyHp) {
          setScreenShake(true)
          setTimeout(() => setScreenShake(false), 400)
        }

        // Broadcast real-time telemetry to opponent
        broadcastRef.current?.broadcastTelemetry({
          playerId: currentUserId,
          wordIndex: myWordIndex + 1,
          wpm: liveWpm,
          accuracy: liveAccuracy,
          combo: newCombo,
          attackEnergy: isP1 ? updated.player_1_attack_energy : updated.player_2_attack_energy,
          ultimateEnergy: isP1 ? updated.player_1_ultimate_energy : updated.player_2_ultimate_energy,
          hp: isP1 ? updated.player_1_hp : updated.player_2_hp,
        })

        if (updated.status === "finished") {
          broadcastRef.current?.broadcastMatchFinished(updated.winner_id, updated.is_draw)
        }

        setCurrentMatch(updated)
      } catch (err) {
        console.warn("[Arena] Submit word failed:", err)
      }
    }
  }

  // Handle Ultimate Activation
  const handleTriggerUltimate = useCallback(async () => {
    if (isTriggeringUltRef.current || myUlt < 100 || currentMatch.status !== "playing") return
    isTriggeringUltRef.current = true

    setUltimateActiveFlash(true)
    setTimeout(() => setUltimateActiveFlash(false), 1200)

    try {
      const updated = await triggerUltimate({
        matchId: currentMatch.id,
        playerId: currentUserId,
      })

      triggerDamageFloat(160, isP1 ? "p2" : "p1", true, "SHINOBI ULTIMATE!")
      setActiveAttackBeam(isP1 ? "p1_to_p2" : "p2_to_p1")
      setTimeout(() => setActiveAttackBeam(null), 800)
      broadcastRef.current?.broadcastAttack(currentUserId, 160, true)
      broadcastRef.current?.broadcastTelemetry({
        playerId: currentUserId,
        wordIndex: myWordIndex,
        wpm: liveWpm,
        accuracy: liveAccuracy,
        combo: localCombo,
        attackEnergy: isP1 ? updated.player_1_attack_energy : updated.player_2_attack_energy,
        ultimateEnergy: 0,
        hp: isP1 ? updated.player_1_hp : updated.player_2_hp,
      })

      if (updated.status === "finished") {
        broadcastRef.current?.broadcastMatchFinished(updated.winner_id, updated.is_draw)
      }

      setCurrentMatch(updated)
    } catch (err) {
      console.warn("[Arena] Ultimate failed:", err)
    } finally {
      setTimeout(() => {
        isTriggeringUltRef.current = false
      }, 1500)
    }
  }, [myUlt, currentMatch.status, currentMatch.id, currentUserId, isP1, triggerDamageFloat, myWordIndex, liveWpm, liveAccuracy, localCombo])

  // Keyboard shortcut: Tab triggers ultimate
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab" && myUlt >= 100 && currentMatch.status === "playing") {
        e.preventDefault()
        handleTriggerUltimate()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [myUlt, currentMatch.status, handleTriggerUltimate])

  // Handle Forfeit
  const handleForfeit = async () => {
    if (isForfeitingRef.current) return
    isForfeitingRef.current = true
    try {
      const updated = await forfeitMatch({
        matchId: currentMatch.id,
        playerId: currentUserId,
      })
      broadcastRef.current?.broadcastMatchFinished(updated.winner_id, false)
      setCurrentMatch(updated)
      setShowForfeitConfirm(false)
    } catch (err) {
      console.warn("[Arena] Forfeit failed:", err)
    } finally {
      setTimeout(() => {
        isForfeitingRef.current = false
      }, 2000)
    }
  }

  // Active word details
  const currentWord = words[myWordIndex] || ""
  const nextWords = words.slice(myWordIndex + 1, myWordIndex + 4)
  const expectedKey = currentWord[typedInput.length] || null

  return (
    <motion.div
      animate={screenShake ? { x: [-8, 8, -5, 5, -2, 2, 0] } : {}}
      transition={{ duration: 0.35 }}
      className="relative min-h-screen bg-black text-white flex flex-col justify-between overflow-hidden selection:bg-orange-500/30 selection:text-orange-200"
    >
      {/* Dynamic Background Anime Ambience */}
      <div
        className={`absolute top-0 left-1/4 w-[650px] h-[400px] transition-all duration-700 blur-[150px] pointer-events-none ${
          isMyHpCritical
            ? "bg-red-600/35 animate-pulse"
            : myUlt >= 100
            ? "bg-purple-600/35 animate-pulse"
            : localCombo >= 10
            ? "bg-amber-500/30 animate-pulse"
            : "bg-orange-600/10"
        }`}
      />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-600/10 blur-[130px] pointer-events-none" />

      {/* Danger Vignette Overlay (<25% HP) */}
      {isMyHpCritical && (
        <div className="fixed inset-0 pointer-events-none z-40 border-[6px] border-red-600/40 shadow-[inset_0_0_90px_rgba(220,38,38,0.6)] animate-pulse" />
      )}

      {/* Jutsu Attack Beam Effect */}
      <AnimatePresence>
        {activeAttackBeam && (
          <motion.div
            initial={{ scaleX: 0, opacity: 1, x: activeAttackBeam === "p1_to_p2" ? "-50%" : "50%" }}
            animate={{ scaleX: 1, opacity: [1, 0.9, 0], x: activeAttackBeam === "p1_to_p2" ? "50%" : "-50%" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="absolute top-1/2 left-0 right-0 h-3 bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 shadow-[0_0_35px_rgba(249,115,22,1)] z-40 pointer-events-none origin-center"
          />
        )}
      </AnimatePresence>

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
                      {isP1 ? (user?.username || player.username) : (opponentShadowName || "Host Shinobi")}
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
                      {!isP1 ? (user?.username || player.username) : (opponentShadowName || "Rival Shinobi")}
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

        {/* Opponent Live Progress Bar */}
        <div className="w-full max-w-xl space-y-1.5 px-3.5 py-2 rounded-2xl bg-white/[0.02] border border-white/10">
          <div className="flex items-center justify-between text-[10px] font-mono text-white/50">
            <span className="flex items-center gap-1.5 text-blue-400 font-bold">
              <span>👤 OPPONENT:</span>
              <span className="text-white font-bold">
                Word {oppWordIndex} of {currentMatch.word_count}
              </span>
            </span>
            <span className="font-bold">
              {oppWpm} WPM • {oppAccuracy}% Acc
            </span>
          </div>
          <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden border border-white/5">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
              animate={{
                width: `${Math.min(100, Math.max(0, (oppWordIndex / Math.max(1, currentMatch.word_count)) * 100))}%`,
              }}
              transition={{ duration: 0.3 }}
            />
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
            <span>{myUlt >= 100 ? "[TAB] UNLEASH ULTIMATE! (READY)" : `ULTIMATE (${myUlt}%)`}</span>
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

      {/* OPPONENT DISCONNECTED GRACE PERIOD BANNER */}
      <AnimatePresence>
        {isOpponentDisconnected && currentMatch.status === "playing" && (
          <motion.div
            initial={{ opacity: 0, y: -25, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -25, scale: 0.95 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 pointer-events-auto"
          >
            <div className="p-4 rounded-3xl bg-neutral-950/95 border-2 border-amber-500/80 shadow-[0_0_40px_rgba(245,158,11,0.4)] backdrop-blur-2xl text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                <span className="text-xs font-black font-mono uppercase tracking-wider text-amber-400">
                  {t("multiplayerArena.opponentDisconnected")}
                </span>
              </div>
              <p className="text-[11px] font-mono text-white/70">
                {t("multiplayerArena.disconnectGraceDesc")}
              </p>
              <div className="text-3xl font-black font-mono text-amber-400 tracking-wider">
                00:{disconnectGraceCountdown.toString().padStart(2, "0")}
              </div>
              <p className="text-[10px] font-mono text-white/40">
                {t("multiplayerArena.forfeitNotice")}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RECONNECTED BANNER */}
      <AnimatePresence>
        {reconnectedNotice && currentMatch.status === "playing" && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl bg-emerald-950/90 border border-emerald-500/60 shadow-[0_0_25px_rgba(16,185,129,0.3)] backdrop-blur-xl text-center pointer-events-none"
          >
            <span className="text-xs font-black font-mono text-emerald-300 flex items-center gap-2">
              <Check size={14} className="text-emerald-400" />
              <span>{t("multiplayerArena.opponentReconnected")}</span>
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ANIME ULTIMATE CUT-IN OVERLAY */}
      <AnimatePresence>
        {ultimateActiveFlash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center overflow-hidden"
          >
            <div className="absolute inset-0 bg-purple-950/75 backdrop-blur-sm" />

            <motion.div
              initial={{ x: "-100%", skewX: -12 }}
              animate={{ x: "0%", skewX: -12 }}
              exit={{ x: "100%", skewX: -12 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              className="relative w-full py-10 bg-gradient-to-r from-purple-950 via-pink-600 to-amber-500 border-y-4 border-yellow-400 shadow-[0_0_60px_rgba(234,179,8,0.8)] text-center"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.25 }}
                className="space-y-1"
              >
                <span className="text-xs sm:text-sm font-mono font-black uppercase tracking-widest text-yellow-300 drop-shadow-[0_0_12px_rgba(253,224,71,1)]">
                  奥義 • FORGE ULTIMATE JUTSU
                </span>
                <h1 className="text-4xl sm:text-6xl font-black font-mono tracking-wider text-white drop-shadow-[0_0_30px_rgba(0,0,0,0.9)]">
                  CHAKRA OVERDRIVE BURST!
                </h1>
                <span className="text-xs font-mono text-white/90 font-bold uppercase tracking-widest">
                  DEVASTATING 160 DMG IMPACT
                </span>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* POST-MATCH AUTHORITATIVE RESOLUTION OVERLAY */}
      <AnimatePresence>
        {isFinished && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 overflow-y-auto"
          >
            <div className="max-w-lg w-full p-6 sm:p-8 rounded-3xl border border-white/15 bg-neutral-950/90 shadow-[0_0_80px_rgba(0,0,0,0.9)] text-center space-y-5 my-auto">
              {/* Animated Emblem */}
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 220, damping: 14 }}
                className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center shadow-2xl ${
                  isWinner
                    ? "bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 text-black shadow-[0_0_45px_rgba(245,158,11,0.8)] ring-4 ring-yellow-400/30"
                    : isDraw
                    ? "bg-gradient-to-br from-neutral-200 to-neutral-400 text-black shadow-[0_0_35px_rgba(255,255,255,0.4)]"
                    : "bg-rose-500/20 border border-rose-500/50 text-rose-400 shadow-[0_0_35px_rgba(244,63,94,0.3)]"
                }`}
              >
                {isWinner ? <Trophy size={42} /> : isDraw ? <Swords size={38} /> : <Swords size={38} className="opacity-70" />}
              </motion.div>

              {/* Title & Reason */}
              <div className="space-y-1">
                <h2
                  className={`text-3xl sm:text-4xl font-black uppercase tracking-wider font-mono ${
                    isWinner
                      ? "text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-400 drop-shadow-[0_0_20px_rgba(245,158,11,0.5)]"
                      : isDraw
                      ? "text-white"
                      : "text-rose-400"
                  }`}
                >
                  {isWinner ? "SHINOBI VICTORY!" : isDraw ? "HONORABLE DRAW" : "CHAKRA DEPLETED"}
                </h2>

                <div className="flex items-center justify-center gap-2 text-[11px] font-mono font-bold text-white/50 uppercase tracking-wider">
                  <span className="text-orange-400">
                    {p1Hp <= 0 || p2Hp <= 0
                      ? "KNOCKOUT (0 HP)"
                      : currentMatch.player_1_word_index >= currentMatch.word_count || currentMatch.player_2_word_index >= currentMatch.word_count
                      ? "WORD TARGET REACHED"
                      : "SURRENDER / FORFEIT"}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Timer size={12} />
                    {`${Math.floor((matchResult?.duration_seconds ?? elapsedSeconds) / 60)
                      .toString()
                      .padStart(2, "0")}:${((matchResult?.duration_seconds ?? elapsedSeconds) % 60)
                      .toString()
                      .padStart(2, "0")}`}
                  </span>
                </div>
              </div>

              {/* XP Award & Progression Banner */}
              <div
                className={`p-3.5 rounded-2xl border font-mono text-center transition-all space-y-1 ${
                  isWinner
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.15)]"
                    : isDraw
                    ? "bg-white/5 border-white/15 text-white/90"
                    : "bg-rose-500/10 border-rose-500/20 text-rose-300"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-sm font-black tracking-wide">
                    {rewardSummary
                      ? `+${rewardSummary.totalXp} XP EARNED`
                      : isWinner
                      ? "+120 XP EARNED"
                      : isDraw
                      ? "+75 XP EARNED"
                      : "+40 XP EARNED"}
                  </span>
                  {rewardSummary && rewardSummary.bonusXp > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                      +{rewardSummary.bonusXp} BONUS
                    </span>
                  )}
                </div>

                {/* Level / Rank-up indicators */}
                {rewardSummary?.didLevelUp && (
                  <span className="text-xs font-black text-yellow-400 flex items-center justify-center gap-1 animate-pulse">
                    <Sparkles size={13} />
                    <span>LEVEL UP! Advanced to Level {rewardSummary.newLevel}!</span>
                  </span>
                )}
                {rewardSummary?.didRankUp && (
                  <span className="text-xs font-black text-orange-400 flex items-center justify-center gap-1">
                    <Trophy size={13} />
                    <span>RANK UP! Promoted to Rank {rewardSummary.newRank}!</span>
                  </span>
                )}

                {/* Crate or Shards Drop */}
                {rewardSummary?.awardedCrate ? (
                  <span className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1">
                    <span>📦 LOOT DROP: {rewardSummary.awardedCrate.name} Unlocked!</span>
                  </span>
                ) : rewardSummary?.shardsAwarded ? (
                  <span className="text-[11px] text-white/60 flex items-center justify-center gap-1">
                    <span>✨ +{rewardSummary.shardsAwarded} Forge Shards Added</span>
                  </span>
                ) : null}

                <span className="text-[9px] text-white/40 block">Authoritative result synchronized to Cloud Save</span>
              </div>

              {/* Head-to-Head Clash Comparison */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 text-left font-mono text-xs">
                {/* Player 1 card */}
                <div className="space-y-1.5 border-r border-white/10 pr-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-white truncate max-w-[120px]">
                      {isP1 ? (user?.username || player.username) : "Host Shinobi"}
                    </span>
                    <span className="text-[10px] text-orange-400 font-bold">{p1Hp} HP</span>
                  </div>
                  <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${p1Hp <= 0 ? "bg-white/20" : "bg-emerald-400"}`}
                      style={{ width: `${Math.max(0, Math.min(100, (p1Hp / 1000) * 100))}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-white/50 flex justify-between">
                    <span>{isP1 ? liveWpm : currentMatch.player_1_wpm} WPM</span>
                    <span>{isP1 ? liveAccuracy : currentMatch.player_1_accuracy}% ACC</span>
                  </div>
                </div>

                {/* Player 2 card */}
                <div className="space-y-1.5 pl-1">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-white truncate max-w-[120px]">
                      {!isP1 ? (user?.username || player.username) : "Rival Shinobi"}
                    </span>
                    <span className="text-[10px] text-blue-400 font-bold">{p2Hp} HP</span>
                  </div>
                  <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${p2Hp <= 0 ? "bg-white/20" : "bg-blue-400"}`}
                      style={{ width: `${Math.max(0, Math.min(100, (p2Hp / 1000) * 100))}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-white/50 flex justify-between">
                    <span>{!isP1 ? liveWpm : currentMatch.player_2_wpm} WPM</span>
                    <span>{!isP1 ? liveAccuracy : currentMatch.player_2_accuracy}% ACC</span>
                  </div>
                </div>
              </div>

              {/* Personal Performance Stats Grid */}
              <div className="grid grid-cols-4 gap-2 p-3 rounded-2xl bg-white/[0.03] border border-white/10 text-center font-mono">
                <div>
                  <span className="text-[9px] text-white/40 block uppercase">WPM</span>
                  <span className="text-base font-black text-white">{liveWpm}</span>
                </div>
                <div>
                  <span className="text-[9px] text-white/40 block uppercase">Accuracy</span>
                  <span className="text-base font-black text-emerald-400">{liveAccuracy}%</span>
                </div>
                <div>
                  <span className="text-[9px] text-white/40 block uppercase">Max Combo</span>
                  <span className="text-base font-black text-amber-400">{maxCombo}x</span>
                </div>
                <div>
                  <span className="text-[9px] text-white/40 block uppercase">Perfect</span>
                  <span className="text-base font-black text-cyan-300">{perfectWords}</span>
                </div>
              </div>

              {/* Combat Telemetry Breakdown Button */}
              <button
                type="button"
                onClick={() => setShowDetailedAnalysis(true)}
                className="w-full py-2.5 px-4 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-mono font-bold text-amber-400 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.1)]"
              >
                <TrendingUp size={14} />
                <span>View Combat Telemetry Breakdown</span>
              </button>

              {/* Academy Weak Key CTA */}
              <Link
                href="/academy"
                className="w-full py-2.5 px-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-mono font-bold text-white/80 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <BookOpen size={14} className="text-orange-400" />
                <span>Sharpen Weak Keys in Academy</span>
              </Link>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-1">
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

      {/* DETAILED COMBAT TELEMETRY BREAKDOWN MODAL */}
      <AnimatePresence>
        {showDetailedAnalysis && (
          <PostMatchAnalysis
            match={currentMatch}
            result={matchResult}
            rewardSummary={rewardSummary}
            currentUserId={currentUserId}
            myWpm={liveWpm}
            myAccuracy={liveAccuracy}
            myMaxCombo={maxCombo}
            myPerfectWords={perfectWords}
            myDamageDealt={Math.max(0, 1000 - (isP1 ? currentMatch.player_2_hp : currentMatch.player_1_hp))}
            oppWpm={oppWpm}
            oppAccuracy={oppAccuracy}
            oppDamageDealt={Math.max(0, 1000 - (isP1 ? currentMatch.player_1_hp : currentMatch.player_2_hp))}
            weakKeys={weakKeyStats}
            durationSeconds={matchResult?.duration_seconds ?? elapsedSeconds}
            onClose={() => setShowDetailedAnalysis(false)}
            onRematch={onRematch}
            onExit={onExit}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
