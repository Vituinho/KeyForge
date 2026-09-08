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
import { getSkinById, RARITY_DETAILS } from "@/data/keyboardSkins"
import { useI18n } from "@/lib/i18n/i18nContext"
import { MultiplayerRewardSummary } from "@/lib/multiplayer/processMultiplayerRewards"

export interface WeakKeyRecord {
  key: string
  count: number
}

export interface PostMatchAnalysisProps {
  match: MultiplayerMatchRow
  result?: MultiplayerMatchResultRow | null
  rewardSummary?: MultiplayerRewardSummary | null
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
  rewardSummary,
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
  const { locale, t } = useI18n()
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
    if (myHp <= 0 || oppHp <= 0) return t("multiplayerArena.knockoutReason")
    if (match.player_1_word_index >= match.word_count || match.player_2_word_index >= match.word_count) {
      return t("multiplayerArena.wordTargetReached")
    }
    return t("multiplayerArena.surrenderReason")
  }, [myHp, oppHp, match.player_1_word_index, match.player_2_word_index, match.word_count, t])

  // Tactical Shinobi Telemetry Insights
  const insights = useMemo(() => {
    const list: { title: string; desc: string; type: "positive" | "warning" | "neutral" }[] = []

    // 1. Speed Differential
    const wpmDiff = myWpm - oppWpm
    if (wpmDiff >= 12) {
      list.push({
        title: t("multiplayerArena.speedAdvantageTitle"),
        desc: t("multiplayerArena.speedAdvantageDesc"),
        type: "positive",
      })
    } else if (wpmDiff <= -10) {
      list.push({
        title: t("multiplayerArena.speedDeficitTitle"),
        desc: t("multiplayerArena.speedDeficitDesc"),
        type: "warning",
      })
    } else {
      list.push({
        title: t("multiplayerArena.evenPaceTitle"),
        desc: t("multiplayerArena.evenPaceDesc"),
        type: "neutral",
      })
    }

    // 2. Accuracy & Chakra Flow
    const accDiff = myAccuracy - oppAccuracy
    if (myAccuracy >= 97) {
      list.push({
        title: t("multiplayerArena.flawlessAccuracyTitle"),
        desc: t("multiplayerArena.flawlessAccuracyDesc"),
        type: "positive",
      })
    } else if (myAccuracy < 90) {
      list.push({
        title: t("multiplayerArena.typoWarningTitle"),
        desc: t("multiplayerArena.typoWarningDesc"),
        type: "warning",
      })
    } else if (accDiff > 5) {
      list.push({
        title: t("multiplayerArena.precisionEdgeTitle"),
        desc: t("multiplayerArena.precisionEdgeDesc", { diff: accDiff }),
        type: "positive",
      })
    }

    // 3. Combo Multiplier
    if (myMaxCombo >= 15) {
      list.push({
        title: t("multiplayerArena.comboDominanceTitle"),
        desc: t("multiplayerArena.comboDominanceDesc"),
        type: "positive",
      })
    } else if (myMaxCombo < 5) {
      list.push({
        title: t("multiplayerArena.rhythmDisruptedTitle"),
        desc: t("multiplayerArena.rhythmDisruptedDesc"),
        type: "warning",
      })
    }

    // 4. Perfect Words
    if (myPerfectWords >= 8) {
      list.push({
        title: t("multiplayerArena.flawlessWordsTitle"),
        desc: t("multiplayerArena.flawlessWordsDesc", { count: myPerfectWords }),
        type: "positive",
      })
    }

    return list
  }, [myWpm, oppWpm, myAccuracy, oppAccuracy, myMaxCombo, myPerfectWords, t])

  // Top Weak Keys (up to 4)
  const topWeakKeys = useMemo(() => {
    return [...weakKeys].sort((a, b) => b.count - a.count).slice(0, 4)
  }, [weakKeys])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div className="max-w-2xl w-full p-4 sm:p-8 rounded-3xl border border-white/15 bg-neutral-950/95 shadow-[0_0_80px_rgba(0,0,0,0.95)] text-center space-y-4 sm:space-y-6 my-auto">
        {/* Top Header Badge */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-white/10 pb-4 gap-3">
          <div className="flex items-center gap-3 text-left">
            <div
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shadow-lg shrink-0 ${
                isWinner
                  ? "bg-gradient-to-br from-yellow-400 to-amber-500 text-black shadow-[0_0_30px_rgba(245,158,11,0.5)]"
                  : isDraw
                  ? "bg-white/10 text-white"
                  : "bg-rose-500/20 border border-rose-500/40 text-rose-400 shadow-[0_0_25px_rgba(244,63,94,0.3)]"
              }`}
            >
              {isWinner ? <Trophy size={28} /> : <Swords size={24} />}
            </div>
            <div>
              <h2
                className={`text-xl sm:text-3xl font-black uppercase tracking-wider font-mono ${
                  isWinner ? "text-yellow-400" : isDraw ? "text-white" : "text-rose-400"
                }`}
              >
                {isWinner
                  ? t("multiplayerArena.shinobiVictory")
                  : isDraw
                  ? t("multiplayerArena.honorableDraw")
                  : t("multiplayerArena.chakraDepleted")}
              </h2>
              <div className="flex items-center gap-2 text-xs font-mono text-white/50 flex-wrap">
                <span className="text-orange-400 font-bold uppercase">{victoryReason}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {formattedTime}
                </span>
                <span>•</span>
                <span>{match.room_code || t("multiplayerHub.quickMatchTitle").toUpperCase()}</span>
              </div>
            </div>
          </div>

          <div className="text-left sm:text-right font-mono space-y-1 w-full sm:w-auto">
            <div className="flex items-center sm:justify-end gap-1.5">
              <span
                className={`text-sm font-black block px-3 py-1 rounded-xl border ${
                  isWinner
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                    : isDraw
                    ? "bg-white/10 border-white/20 text-white"
                    : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                }`}
              >
                +{rewardSummary ? rewardSummary.totalXp : xpEarned} XP
              </span>
              {rewardSummary && rewardSummary.bonusXp > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                  {t("multiplayerArena.bonusXp", { amount: rewardSummary.bonusXp })}
                </span>
              )}
            </div>

            {rewardSummary?.didLevelUp && (
              <span className="text-[10px] font-black text-yellow-400 block animate-pulse">
                {t("multiplayerArena.levelUpShort", { level: rewardSummary.newLevel })}
              </span>
            )}
            {rewardSummary?.awardedCrate && (
              <span className="text-[10px] font-bold text-emerald-400 block">
                📦 {rewardSummary.awardedCrate.name}
              </span>
            )}
            <span className="text-[9px] text-white/40 block">{t("multiplayerArena.cloudSavedNotice")}</span>
          </div>
        </div>

        {/* Head-to-Head Clash Comparative Matrix */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 text-left font-mono">
          <div className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-3 flex items-center gap-1.5">
            <Swords size={12} className="text-orange-400" />
            <span>{t("multiplayerArena.clashComparisonTitle")}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Left: You */}
            <div className="space-y-2 border-b sm:border-b-0 sm:border-r border-white/10 pb-3 sm:pb-0 sm:pr-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-white block">{t("multiplayerArena.localPlayer")}</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-orange-400 font-bold">{mySkin.name}</span>
                    <span
                      className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase leading-none ${
                        RARITY_DETAILS[mySkin.rarity].bgBadge
                      }`}
                    >
                      {RARITY_DETAILS[mySkin.rarity].name[locale === "pt-BR" ? "pt-BR" : "en"]}
                    </span>
                  </div>
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
                  <span className="text-white/40 block text-[9px]">{t("multiplayerArena.speedStat")}</span>
                  <span className="font-black text-white">{myWpm} WPM</span>
                </div>
                <div>
                  <span className="text-white/40 block text-[9px]">{t("multiplayerArena.accuracyStat")}</span>
                  <span className="font-black text-emerald-400">{myAccuracy}%</span>
                </div>
                <div>
                  <span className="text-white/40 block text-[9px]">{t("multiplayerArena.peakComboStat")}</span>
                  <span className="font-black text-amber-400">{myMaxCombo}x</span>
                </div>
                <div>
                  <span className="text-white/40 block text-[9px]">{t("multiplayerArena.damageStat")}</span>
                  <span className="font-black text-orange-400">{myDamageDealt}</span>
                </div>
              </div>
            </div>

            {/* Right: Rival */}
            <div className="space-y-2 pt-2 sm:pt-0 sm:pl-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-white block">{t("multiplayerArena.rivalPlayer")}</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-blue-400 font-bold">{oppSkin.name}</span>
                    <span
                      className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase leading-none ${
                        RARITY_DETAILS[oppSkin.rarity].bgBadge
                      }`}
                    >
                      {RARITY_DETAILS[oppSkin.rarity].name[locale === "pt-BR" ? "pt-BR" : "en"]}
                    </span>
                  </div>
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
                  <span className="text-white/40 block text-[9px]">{t("multiplayerArena.speedStat")}</span>
                  <span className="font-black text-white">{oppWpm} WPM</span>
                </div>
                <div>
                  <span className="text-white/40 block text-[9px]">{t("multiplayerArena.accuracyStat")}</span>
                  <span className="font-black text-blue-400">{oppAccuracy}%</span>
                </div>
                <div>
                  <span className="text-white/40 block text-[9px]">{t("multiplayerArena.perfectWordsStat")}</span>
                  <span className="font-black text-cyan-300">{myPerfectWords}</span>
                </div>
                <div>
                  <span className="text-white/40 block text-[9px]">{t("multiplayerArena.damageStat")}</span>
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
            <span>{t("multiplayerArena.tacticalInsightsTitle")}</span>
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
                <span>{t("multiplayerArena.weakKeyAnalysisTitle")}</span>
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
              <span>{t("multiplayerArena.sharpenAcademyBtn")}</span>
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
              <span>{t("multiplayerArena.backToSummary")}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onExit}
            className="flex-1 py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/15 text-xs font-bold font-mono text-white transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>{t("multiplayerArena.returnLobbyBtn")}</span>
          </button>

          {onRematch && (
            <button
              type="button"
              onClick={onRematch}
              className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-xs font-black font-mono text-black transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(249,115,22,0.4)]"
            >
              <RotateCcw size={16} />
              <span>{t("multiplayerArena.rematchBtn")}</span>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
