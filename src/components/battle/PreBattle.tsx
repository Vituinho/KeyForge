"use client"

import { motion } from "framer-motion"
import { Enemy } from "@/types/character"
import { Swords, ChevronRight, ChevronLeft, Star, Award, Sparkles, Package } from "lucide-react"
import { usePlayer } from "@/hooks/usePlayer"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/i18nContext"
import { getStageByEnemyId } from "@/data/worlds"

interface PreBattleProps {
  enemy: Enemy
  onFight: () => void
}

export function PreBattle({ enemy, onFight }: PreBattleProps) {
  const { t } = useI18n()
  const { player } = usePlayer()

  const stageMatch = getStageByEnemyId(enemy.id)
  const stage = stageMatch?.stage
  const masteryWpm = stage?.masteryObjectives?.find((o) => o.minWpm !== undefined)?.minWpm
  const savedScore = enemy.world
    ? player.campaignProgress?.[enemy.world]?.bestScores?.[enemy.id]
    : undefined
  const isCleared = Boolean(savedScore)
  const starsEarned = savedScore?.stars ?? (isCleared ? 1 : 0)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4 py-16 sm:py-8">
      {/* Back button */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20">
        <Link
          href={enemy.world ? `/anime-world/${enemy.world}` : "/anime-world"}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-white/50 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10"
        >
          <ChevronLeft size={14} />
          <span>{t("battle.preBattle.exitBattle").toUpperCase()}</span>
        </Link>
      </div>

      {/* Background glow */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, ${enemy.themeColor} 0%, transparent 70%)`,
        }}
      />

      {/* Typing focus banner */}
      {enemy.typingFocus && (
        <motion.div
          className="relative z-10 mb-8 px-4 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-widest border"
          style={{
            backgroundColor: `${enemy.themeColor}15`,
            borderColor: `${enemy.themeColor}40`,
            color: enemy.themeColor,
          }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {t("battle.preBattle.stageTrial", {
            stage: enemy.stage ?? 1,
            focus: t(`battle.focusTypes.${enemy.typingFocus}` as Parameters<typeof t>[0]) || enemy.typingFocus,
          })}
        </motion.div>
      )}

      {/* VS Layout */}
      <motion.div
        className="relative z-10 flex items-center gap-8 sm:gap-16 flex-wrap justify-center"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "backOut" }}
      >
        {/* Player side */}
        <motion.div
          className="text-center"
          initial={{ x: -80, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-500 to-indigo-700 flex items-center justify-center text-3xl font-black mb-4 mx-auto border-2 border-violet-400/50 shadow-[0_0_30px_rgba(139,92,246,0.5)]">
            {player.username[0]?.toUpperCase() ?? "P"}
          </div>
          <p className="font-black text-xl tracking-wider text-white truncate max-w-[150px]">
            {player.username.toUpperCase()}
          </p>
          <p className="text-sm text-white/40 font-mono">
            {t("common.rank")} {player.rank} · {t("dashboard.quickWidget.level")} {player.level}
          </p>
        </motion.div>

        {/* VS */}
        <motion.div
          className="flex flex-col items-center"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4, type: "spring" }}
        >
          <Swords size={32} className="text-white/30 mb-2" />
          <span className="text-5xl font-black text-white/20 tracking-widest">VS</span>
        </motion.div>

        {/* Enemy side */}
        <motion.div
          className="text-center"
          initial={{ x: 80, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-black mb-4 mx-auto border-2"
            style={{
              background: `linear-gradient(135deg, ${enemy.themeColor}33, ${enemy.accentColor}33)`,
              borderColor: `${enemy.themeColor}66`,
              boxShadow: `0 0 30px ${enemy.themeColor}44`,
              color: enemy.themeColor,
            }}
          >
            {enemy.name[0]}
          </div>
          <p
            className="font-black text-xl tracking-wider"
            style={{ color: enemy.themeColor }}
          >
            {enemy.name.toUpperCase()}
          </p>
          <p className="text-sm text-white/40">{enemy.anime}</p>
        </motion.div>
      </motion.div>

      {/* Enemy stats */}
      <motion.div
        className="relative z-10 mt-12 flex gap-6"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <StatChip label={t("common.level").toUpperCase()} value={enemy.level} color={enemy.themeColor} />
        <StatChip label={t("animeWorld.recommendedSpeed").toUpperCase()} value={`${enemy.recommendedWpm} WPM`} color={enemy.themeColor} />
        <StatChip label={t("animeWorld.targetAcc").toUpperCase()} value={`${enemy.recommendedAccuracy}%`} color={enemy.themeColor} />
        {masteryWpm ? (
          <StatChip label={`${t("animeWorld.masteryTarget")} (3★)`.toUpperCase()} value={`${masteryWpm} WPM`} color="#f59e0b" />
        ) : (
          <StatChip label={t("animeWorld.combatFocus").toUpperCase()} value={enemy.difficulty} color={enemy.themeColor} />
        )}
      </motion.div>

      {/* Personal Best & Telemetry Info */}
      <motion.div
        className="relative z-10 mt-6 w-full max-w-lg grid grid-cols-1 sm:grid-cols-2 gap-3 px-2"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.4 }}
      >
        {/* Personal Best / Record */}
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono font-bold text-white/50 uppercase tracking-wider flex items-center gap-1.5">
              <Award size={14} className="text-amber-400" />
              {t("animeWorld.personalBestRecord")}
            </span>
            {/* Stars */}
            <div className="flex items-center gap-0.5">
              {[1, 2, 3].map((starIndex) => (
                <Star
                  key={starIndex}
                  size={14}
                  className={
                    starIndex <= starsEarned
                      ? "text-yellow-400 fill-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.5)]"
                      : "text-white/20"
                  }
                />
              ))}
            </div>
          </div>
          {savedScore ? (
            <div className="text-sm font-bold text-white font-mono">
              {savedScore.bestWpm} WPM · {savedScore.bestAccuracy}% ACC · {savedScore.bestCombo}x
            </div>
          ) : (
            <div className="text-xs text-amber-400/80 font-medium">
              {t("animeWorld.firstClearBonus", {
                xp: stage?.firstClearRewards?.bonusXp ?? enemy.firstClearBonusXp ?? 100,
              })}
            </div>
          )}
        </div>

        {/* Potential Rewards */}
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 flex flex-col justify-between">
          <span className="text-[11px] font-mono font-bold text-white/50 uppercase tracking-wider flex items-center gap-1.5 mb-2">
            <Sparkles size={14} className="text-emerald-400" />
            {t("animeWorld.standardReward", {
              xp: stage?.rewards?.xp ?? enemy.xpReward ?? 100,
            })}
          </span>
          <div className="flex items-center gap-2 text-xs font-mono text-white/80">
            {stage?.firstClearRewards?.crateId && !isCleared && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <Package size={12} />
                +1 Crate
              </span>
            )}
            {stage?.firstClearRewards?.title && !isCleared && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Title: {stage.firstClearRewards.title}
              </span>
            )}
            {isCleared && (
              <span className="text-white/40">{t("animeWorld.clearedBadge")}</span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Mechanic & Rule Briefing Card */}
      {stage && (
        <motion.div
          className="relative z-10 mt-4 w-full max-w-lg rounded-xl border border-white/10 bg-black/40 backdrop-blur-sm p-4 text-left"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.4 }}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border"
              style={{
                borderColor: `${enemy.themeColor}50`,
                backgroundColor: `${enemy.themeColor}15`,
                color: enemy.themeColor,
              }}
            >
              {stage.typingFocus.toUpperCase()}
            </span>
            <span className="text-xs font-black text-white">{stage.name}</span>
          </div>
          <p className="text-xs text-white/70 leading-relaxed">
            {t(stage.mechanicSummaryKey as Parameters<typeof t>[0]) ||
              stage.characterTitle ||
              enemy.description}
          </p>
        </motion.div>
      )}

      {/* Description quote */}
      {enemy.description && (
        <motion.p
          className="relative z-10 mt-4 max-w-md text-center text-white/40 text-sm italic px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          &ldquo;
          {t(`battle.characterDescriptions.${enemy.id.replace("-", "_")}` as Parameters<typeof t>[0]) ||
            enemy.description}
          &rdquo;
        </motion.p>
      )}

      {/* FIGHT button */}
      <motion.button
        className="relative z-10 mt-10 flex items-center gap-3 px-10 py-4 rounded-2xl font-black text-xl uppercase tracking-widest text-black transition-transform"
        style={{
          background: `linear-gradient(135deg, ${enemy.themeColor}, ${enemy.accentColor})`,
          boxShadow: `0 0 30px ${enemy.themeColor}66`,
        }}
        onClick={onFight}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.97 }}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1, duration: 0.4 }}
      >
        {t("battle.preBattle.startFight").toUpperCase()}
        <ChevronRight size={22} />
      </motion.button>
    </div>
  )
}

function StatChip({
  label,
  value,
  color,
}: {
  label: string
  value: string | number
  color: string
}) {
  return (
    <div
      className="flex flex-col items-center px-5 py-3 rounded-xl border"
      style={{
        borderColor: `${color}33`,
        background: `${color}0f`,
      }}
    >
      <span className="text-[10px] font-bold tracking-widest text-white/40 uppercase">
        {label}
      </span>
      <span className="text-lg font-black mt-0.5" style={{ color }}>
        {value}
      </span>
    </div>
  )
}
