"use client"

import React, { useMemo } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Trophy,
  Swords,
  Target,
  Clock,
  Sparkles,
  BookOpen,
  ArrowLeft,
  RotateCcw,
  TrendingUp,
  AlertCircle,
  Shield,
} from "lucide-react"
import { MultiplayerMatchRow, MultiplayerMatchResultRow } from "@/types/database"
import { getSkinById } from "@/data/keyboardSkins"

export interface WeakKeyRecord {
  key: string
  count: number
}

export interface PostMatchAnalysisProps {
  match: MultiplayerMatchRow
  result?: MultiplayerMatchResultRow | null
  currentUserId: string
  myWpm: number
  myAccuracy: number
  myMaxCombo: number
  myPerfectWords: number
  myDamageDealt: number
  oppWpm: number
  oppAccuracy: number
  oppDamageDealt: number
  weakKeys: WeakKeyRecord[]
  durationSeconds: number
  onClose?: () => void
  onRematch?: () => void
  onExit: () => void
}

export function PostMatchAnalysis({
  match,
  result,
  currentUserId,
  myWpm,
  myAccuracy,
  myMaxCombo,
  myPerfectWords,
  myDamageDealt,
  oppWpm,
  oppAccuracy,
  oppDamageDealt,
  weakKeys,
  durationSeconds,
  onClose,
  onRematch,
  onExit,
}: PostMatchAnalysisProps) {
  const isP1 = match.player_1_id === currentUserId
  const isWinner = match.winner_id === currentUserId
  const isDraw = match.is_draw

  const p1Skin = getSkinById(match.player_1_skin_id || "default_forge")
  const p2Skin = getSkinById(match.player_2_skin_id || "default_forge")
  const mySkin = isP1 ? p1Skin : p2Skin
  const oppSkin = isP1 ? p2Skin : p1Skin

  const p1Hp = match.player_1_hp
  const p2Hp = match.player_2_hp
  const myHp = isP1 ? p1Hp : p2Hp
  const oppHp = isP1 ? p2Hp : p1Hp

  // XP calculation
  const xpEarned = result
    ? isP1
      ? result.player_1_xp_earned
      : result.player_2_xp_earned
    : isWinner
    ? 120
    : isDraw
    ? 75
    : 40

  // Format Duration
  const mins = Math.floor(durationSeconds / 60)
  const secs = durationSeconds % 60
  const formattedTime = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`

  // Match ending cause
  const victoryReason = useMemo(() => {
    if (myHp <= 0 || oppHp <= 0) return "KNOCKOUT (0 HP REACHED)"
    if (match.player_1_word_index >= match.word_count || match.player_2_word_index >= match.word_count) {
      return "ALL WORDS CONQUERED"
    }
    return "SURRENDER / FORFEIT"
  }, [myHp, oppHp, match.player_1_word_index, match.player_2_word_index, match.word_count])

  // Tactical Shinobi Telemetry Insights
  const insights = useMemo(() => {
    const list: { title: string; desc: string; type: "positive" | "warning" | "neutral" }[] = []

    // 1. Speed Differential
    const wpmDiff = myWpm - oppWpm
    if (wpmDiff >= 12) {
      list.push({
        title: "Decisive Speed Advantage",
        desc: `Your typing speed (+${wpmDiff} WPM advantage) overwhelmed the rival's energy charging rate.`,
        type: "positive",
      })
    } else if (wpmDiff <= -10) {
      list.push({
        title: "Speed Pressure Deficit",
        desc: `Your rival maintained a +${Math.abs(wpmDiff)} WPM advantage, dealing damage faster than your counter-attacks.`,
        type: "warning",
      })
    } else {
      list.push({
        title: "Even Combat Pace",
        desc: "Both shinobi traded blows with closely matched typing velocity.",
        type: "neutral",
      })
    }

    // 2. Accuracy & Chakra Flow
    const accDiff = myAccuracy - oppAccuracy
    if (myAccuracy >= 97) {
      list.push({
        title: "Immaculate Precision",
        desc: `${myAccuracy}% accuracy ensured zero wasted chakra, maximizing attack frequency without combo penalties.`,
        type: "positive",
      })
    } else if (myAccuracy < 90) {
      list.push({
        title: "Chakra Instability (Typos)",
        desc: `${myAccuracy}% accuracy caused frequent combo resets, losing valuable damage scaling.`,
        type: "warning",
      })
    } else if (accDiff > 5) {
      list.push({
        title: "Precision Edge",
        desc: `Your +${accDiff}% higher accuracy gave you cleaner multiplier bonuses across all words.`,
        type: "positive",
      })
    }

    // 3. Combo Multiplier
    if (myMaxCombo >= 15) {
      list.push({
        title: "Jutsu Chain Mastery",
        desc: `Peak ${myMaxCombo}x combo pushed damage amplification up to 1.75x–2.0x base strikes.`,
        type: "positive",
      })
    } else if (myMaxCombo < 5) {
      list.push({
        title: "Low Combo Sustainability",
        desc: "Max combo remained under 5x. Sustained keystrokes are vital to unleash high-damage strikes.",
        type: "warning",
      })
    }

    // 4. Perfect Words
    if (myPerfectWords >= 8) {
      list.push({
        title: "Flawless Word Casts",
        desc: `${myPerfectWords} perfect words provided instant +30 Attack Energy bursts!`,
        type: "positive",
      })
    }

    return list
  }, [myWpm, oppWpm, myAccuracy, oppAccuracy, myMaxCombo, myPerfectWords])

  // Top Weak Keys (up to 4)
  const topWeakKeys = useMemo(() => {
    return [...weakKeys].sort((a, b) => b.count - a.count).slice(0, 4)
  }, [weakKeys])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="max-w-2xl w-full p-6 sm:p-8 rounded-3xl border border-white/15 bg-neutral-950/95 shadow-[0_0_80px_rgba(0,0,0,0.95)] text-center space-y-6 my-auto">
        {/* Top Header Badge */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3 text-left">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
                isWinner
                  ? "bg-gradient-to-br from-yellow-400 to-amber-500 text-black shadow-[0_0_30px_rgba(245,158,11,0.5)]"
                  : isDraw
                  ? "bg-white/10 text-white"
                  : "bg-rose-500/20 border border-rose-500/40 text-rose-400 shadow-[0_0_25px_rgba(244,63,94,0.3)]"
              }`}
            >
              {isWinner ? <Trophy size={32} /> : <Swords size={28} />}
            </div>
            <div>
              <h2
                className={`text-2xl sm:text-3xl font-black uppercase tracking-wider font-mono ${
                  isWinner ? "text-yellow-400" : isDraw ? "text-white" : "text-rose-400"
                }`}
              >
                {isWinner ? "SHINOBI VICTORY" : isDraw ? "HONORABLE DRAW" : "CHAKRA DEPLETED"}
              </h2>
              <div className="flex items-center gap-2 text-xs font-mono text-white/50">
                <span className="text-orange-400 font-bold uppercase">{victoryReason}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {formattedTime}
                </span>
                <span>•</span>
                <span>{match.room_code || "QUICK MATCH"}</span>
              </div>
            </div>
          </div>

          <div className="text-right font-mono">
            <span
              className={`text-sm font-black block px-3 py-1 rounded-xl border ${
                isWinner
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                  : isDraw
                  ? "bg-white/10 border-white/20 text-white"
                  : "bg-rose-500/10 border-rose-500/20 text-rose-400"
              }`}
            >
              +{xpEarned} XP
            </span>
            <span className="text-[9px] text-white/40 block mt-1">Cloud Saved</span>
          </div>
        </div>

        {/* Head-to-Head Clash Comparative Matrix */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 text-left font-mono">
          <div className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-3 flex items-center gap-1.5">
            <Swords size={12} className="text-orange-400" />
            <span>Shinobi Clash Comparison</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Left: You */}
            <div className="space-y-2 border-r border-white/10 pr-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-white block">You</span>
                  <span className="text-[10px] text-orange-400/80">{mySkin.name}</span>
                </div>
                <span
                  className={`text-xs font-black px-2 py-0.5 rounded-md ${
                    myHp <= 0 ? "bg-white/10 text-white/40" : "bg-emerald-500/20 text-emerald-400"
                  }`}
                >
                  {myHp} HP
                </span>
              </div>

              {/* HP Progress */}
              <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden">
                <div
                  className={`h-full ${myHp <= 0 ? "bg-white/20" : "bg-emerald-400"}`}
                  style={{ width: `${Math.max(0, Math.min(100, (myHp / 1000) * 100))}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-1 text-[11px] pt-1">
                <div>
                  <span className="text-white/40 block text-[9px]">SPEED</span>
                  <span className="font-black text-white">{myWpm} WPM</span>
                </div>
                <div>
                  <span className="text-white/40 block text-[9px]">ACCURACY</span>
                  <span className="font-black text-emerald-400">{myAccuracy}%</span>
                </div>
                <div>
                  <span className="text-white/40 block text-[9px]">PEAK COMBO</span>
                  <span className="font-black text-amber-400">{myMaxCombo}x</span>
                </div>
                <div>
                  <span className="text-white/40 block text-[9px]">DAMAGE</span>
                  <span className="font-black text-orange-400">{myDamageDealt}</span>
                </div>
              </div>
            </div>

            {/* Right: Rival */}
            <div className="space-y-2 pl-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-white block">Rival</span>
                  <span className="text-[10px] text-blue-400/80">{oppSkin.name}</span>
                </div>
                <span
                  className={`text-xs font-black px-2 py-0.5 rounded-md ${
                    oppHp <= 0 ? "bg-white/10 text-white/40" : "bg-blue-500/20 text-blue-400"
                  }`}
                >
                  {oppHp} HP
                </span>
              </div>

              {/* HP Progress */}
              <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden">
                <div
                  className={`h-full ${oppHp <= 0 ? "bg-white/20" : "bg-blue-400"}`}
                  style={{ width: `${Math.max(0, Math.min(100, (oppHp / 1000) * 100))}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-1 text-[11px] pt-1">
                <div>
                  <span className="text-white/40 block text-[9px]">SPEED</span>
                  <span className="font-black text-white">{oppWpm} WPM</span>
                </div>
                <div>
                  <span className="text-white/40 block text-[9px]">ACCURACY</span>
                  <span className="font-black text-blue-400">{oppAccuracy}%</span>
                </div>
                <div>
                  <span className="text-white/40 block text-[9px]">PERFECT WORDS</span>
                  <span className="font-black text-cyan-300">{myPerfectWords}</span>
                </div>
                <div>
                  <span className="text-white/40 block text-[9px]">DAMAGE</span>
                  <span className="font-black text-orange-400">{oppDamageDealt}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tactical Shinobi Insights */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 text-left font-mono space-y-2.5">
          <div className="text-[10px] uppercase tracking-widest text-white/40 font-bold flex items-center gap-1.5">
            <TrendingUp size={12} className="text-amber-400" />
            <span>Combat Telemetry Insights</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {insights.map((item, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border text-xs leading-relaxed ${
                  item.type === "positive"
                    ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-300"
                    : item.type === "warning"
                    ? "bg-rose-500/5 border-rose-500/20 text-rose-300"
                    : "bg-white/5 border-white/10 text-white/70"
                }`}
              >
                <div className="font-bold flex items-center gap-1.5 mb-0.5">
                  {item.type === "positive" ? (
                    <Sparkles size={13} className="text-emerald-400 shrink-0" />
                  ) : item.type === "warning" ? (
                    <AlertCircle size={13} className="text-rose-400 shrink-0" />
                  ) : (
                    <Shield size={13} className="text-white/60 shrink-0" />
                  )}
                  <span>{item.title}</span>
                </div>
                <p className="text-[11px] opacity-80">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Weak Keys & Academy CTA */}
        {topWeakKeys.length > 0 && (
          <div className="p-4 rounded-2xl bg-amber-500/[0.04] border border-amber-500/20 text-left font-mono flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="space-y-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-amber-400 text-xs font-bold">
                <Target size={14} />
                <span>Identified Keystroke Vulnerabilities</span>
              </div>
              <div className="flex items-center gap-2 pt-0.5">
                {topWeakKeys.map(({ key, count }) => (
                  <span
                    key={key}
                    className="px-2 py-0.5 rounded-lg bg-white/10 border border-white/15 text-xs font-bold text-white uppercase tracking-wider"
                  >
                    {key} <span className="text-[10px] text-rose-400 font-normal">({count}x)</span>
                  </span>
                ))}
              </div>
            </div>

            <Link
              href={`/academy?keys=${encodeURIComponent(topWeakKeys.map((k) => k.key).join(","))}`}
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black font-black text-xs font-mono transition-colors flex items-center gap-2 shadow-[0_0_20px_rgba(249,115,22,0.4)] shrink-0"
            >
              <BookOpen size={14} />
              <span>Train in Academy</span>
            </Link>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/15 text-xs font-bold font-mono text-white transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft size={16} />
              <span>Back to Summary</span>
            </button>
          )}

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
  )
}
