"use client"
 
import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { BattleResult as BattleResultType } from "@/types/battle"
import { WeakKey, TrainingExercise } from "@/types/typing"
import { Enemy } from "@/types/character"
import {
  Trophy,
  Skull,
  Zap,
  Target,
  Flame,
  Clock,
  ChevronRight,
  RotateCcw,
  Dumbbell,
  Swords,
  ShieldAlert,
  Gauge,
  Sparkles,
  ArrowUpCircle,
  MapPin,
  Lightbulb,
  Package,
} from "lucide-react"
import Link from "next/link"
import { processBattleRewards, BattleRewardSummary } from "@/lib/progression/processBattleRewards"
import { RankUpModal } from "@/components/progression/RankUpModal"
import { getDefeatAdvice, DefeatAdvice } from "@/lib/battle/defeatAdvice"
import { useI18n } from "@/lib/i18n/i18nContext"
import { getCrateById } from "@/data/crates"

interface BattleResultProps {
  victory: boolean
  enemy: Enemy
  result: BattleResultType
  weakKeys: WeakKey[]
  exercises: TrainingExercise[]
  onRematch: () => void
}

export function BattleResult({
  victory,
  enemy,
  result,
  weakKeys,
  exercises,
  onRematch,
}: BattleResultProps) {
  const { t } = useI18n()
  const { finalStats } = result

  // Process rewards strictly once upon initial mount
  const [rewardSummary] = useState<BattleRewardSummary>(() =>
    processBattleRewards(result, enemy)
  )
  const [showRankUpModal, setShowRankUpModal] = useState(
    () => rewardSummary.didRankUp
  )

  const defeatAdvice: DefeatAdvice = useMemo(
    () => getDefeatAdvice(enemy, finalStats),
    [enemy, finalStats]
  )

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 relative overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          background: victory
            ? "radial-gradient(ellipse at center, #22c55e 0%, transparent 70%)"
            : `radial-gradient(ellipse at center, ${enemy.themeColor} 0%, transparent 70%)`,
        }}
      />

      <motion.div
        className="relative z-10 w-full max-w-2xl px-4 space-y-6"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <div className="text-center">
          {victory ? (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
              >
                <Trophy size={64} className="mx-auto text-yellow-400 mb-3" />
              </motion.div>
              <h1 className="text-5xl font-black tracking-wider text-white">
                {t("battleResult.victory")}
              </h1>
              <p className="text-white/50 mt-2">
                {t("battleResult.victorySub", { name: enemy.name })}
              </p>
            </>
          ) : (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
              >
                <Skull size={64} className="mx-auto text-red-400 mb-3" />
              </motion.div>
              <h1 className="text-5xl font-black tracking-wider text-red-400">
                {t("battleResult.defeat")}
              </h1>
              <p className="text-white/50 mt-2">
                {t("battleResult.defeatSub", { name: enemy.name })}
              </p>
            </>
          )}
        </div>

        {/* Campaign Completion Banner */}
        {victory && rewardSummary?.campaignCompleted && (
          <motion.div
            className="rounded-3xl border-2 border-yellow-500/50 bg-gradient-to-br from-yellow-500/20 via-orange-500/15 to-red-500/20 p-6 text-center space-y-3 shadow-[0_0_50px_rgba(234,179,8,0.3)] backdrop-blur-md"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", delay: 0.25 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-400/20 border border-yellow-400/40 text-yellow-300 font-mono font-black text-xs uppercase tracking-widest">
              <Trophy size={14} />
              {t("battleResult.campaignCompletedTag").toUpperCase()}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
              {t("battleResult.campaignCompletedTitle").toUpperCase()}
            </h2>
            <p className="text-sm text-white/70 max-w-lg mx-auto">
              {t("battleResult.campaignCompletedDesc")}
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap pt-2">
              <div className="px-4 py-2 rounded-2xl bg-black/50 border border-yellow-400/30 text-yellow-300 text-xs font-mono font-black flex items-center gap-2">
                <Sparkles size={14} />
                <span>{t("battleResult.titleUnlocked").toUpperCase()}</span>
              </div>
              <div className="px-4 py-2 rounded-2xl bg-black/50 border border-emerald-400/30 text-emerald-300 text-xs font-mono font-black flex items-center gap-2">
                <Trophy size={14} />
                <span>{t("battleResult.achievementUnlocked")}</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stage Unlocked Banner */}
        {victory && !rewardSummary?.campaignCompleted && rewardSummary?.stageUnlocked && (
          <motion.div
            className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-center justify-between flex-wrap gap-3 backdrop-blur-sm"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                <Trophy size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  {t("battleResult.stageUnlockedTitle", { stage: rewardSummary.stageUnlocked })}
                </h3>
                <p className="text-xs text-white/50">{t("battleResult.stageUnlockedSub")}</p>
              </div>
            </div>
            <Link
              href={`/anime-world/${enemy.world ?? "naruto"}`}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider transition-colors"
            >
              {t("common.continueMap")} →
            </Link>
          </motion.div>
        )}

        {/* Crate Reward Drops Banner */}
        {victory && rewardSummary?.awardedCrates && rewardSummary.awardedCrates.length > 0 && (
          <motion.div
            className="rounded-3xl border border-purple-500/40 bg-gradient-to-r from-purple-950/40 via-purple-900/30 to-indigo-950/40 p-5 shadow-[0_0_30px_rgba(168,85,247,0.2)] backdrop-blur-md space-y-3"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.28 }}
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  <Package size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span>{t("battleResult.crateRewardTitle")}</span>
                    <Sparkles size={14} className="text-yellow-400" />
                  </h3>
                  <p className="text-xs text-white/50">{t("battleResult.crateRewardSub")}</p>
                </div>
              </div>

              <Link
                href="/locker/crates"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-purple-500/20 flex items-center gap-1.5"
              >
                <span>{t("battleResult.openCratesBtn")}</span>
                <ChevronRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {rewardSummary.awardedCrates.map((crateReward, idx) => {
                const crateInfo = getCrateById(crateReward.crateId)
                return (
                  <div
                    key={`${crateReward.crateId}-${idx}`}
                    className="flex items-center justify-between p-3 rounded-2xl bg-black/40 border border-purple-500/20"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{crateInfo.icon}</span>
                      <div>
                        <div className="text-xs font-black text-white">{crateInfo.name}</div>
                        <div className="text-[10px] text-purple-300/80 font-mono">{crateReward.reason}</div>
                      </div>
                    </div>
                    <span className="text-xs font-black font-mono px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-200">
                      +{crateReward.count}
                    </span>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* XP Progression Card */}
        {rewardSummary && (
          <motion.div
            className="rounded-2xl border border-amber-500/20 bg-amber-500/5 backdrop-blur-sm p-5 space-y-3"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-bold uppercase text-amber-400 flex items-center gap-1.5">
                  <Sparkles size={14} />
                  {t("common.level")} {rewardSummary.levelResult.newLevel}
                </span>

                {rewardSummary.levelResult.didLevelUp && (
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px] uppercase animate-pulse border border-emerald-500/30 flex items-center gap-1">
                    <ArrowUpCircle size={10} />
                    {t("battleResult.levelUp", { levels: rewardSummary.levelResult.levelsGained }).toUpperCase()}
                  </span>
                )}

                {rewardSummary.didRankUp && (
                  <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 font-bold text-[10px] uppercase border border-orange-500/30">
                    {t("battleResult.rankUp", { prev: rewardSummary.prevRank, next: rewardSummary.newRank }).toUpperCase()}
                  </span>
                )}

                {rewardSummary.isFirstClear && rewardSummary.firstClearBonusXp && (
                  <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-300 font-bold text-[10px] uppercase border border-yellow-500/40 flex items-center gap-1">
                    <Sparkles size={10} />
                    {t("battleResult.firstClear", { xp: rewardSummary.firstClearBonusXp }).toUpperCase()}
                  </span>
                )}
              </div>

              <span className="text-sm font-black text-amber-400 font-mono">
                +{rewardSummary.xpResult.totalXp} XP
              </span>
            </div>

            {/* XP Progress Bar */}
            <div>
              <div className="h-3 w-full rounded-full bg-black/60 overflow-hidden border border-white/10 p-0.5">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]"
                  initial={{
                    width: `${Math.min(
                      100,
                      (rewardSummary.prevXp / rewardSummary.levelResult.xpRequired) * 100
                    )}%`,
                  }}
                  animate={{
                    width: `${Math.min(
                      100,
                      (rewardSummary.levelResult.newXp / rewardSummary.levelResult.xpRequired) *
                        100
                    )}%`,
                  }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-white/40 mt-1 font-mono">
                <span>{t("dashboard.quickWidget.xpToNext")}</span>
                <span>
                  {rewardSummary.levelResult.newXp} / {rewardSummary.levelResult.xpRequired} XP
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Battle Stats — Across the entire battle */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5">
          <h2 className="text-xs font-bold tracking-widest text-white/40 uppercase mb-4">
            {t("battleResult.performanceHeader")}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatBox
              icon={<Gauge size={14} />}
              label={t("battleResult.battleWpm")}
              value={finalStats.battleWpm}
              color={enemy.themeColor}
            />
            <StatBox
              icon={<Zap size={14} />}
              label={t("battleResult.bestWpm")}
              value={finalStats.bestWpm}
              color="#38bdf8"
            />
            <StatBox
              icon={<Target size={14} />}
              label={t("battleResult.accuracy")}
              value={`${finalStats.battleAccuracy}%`}
              color={
                finalStats.battleAccuracy >= 95
                  ? "#22c55e"
                  : finalStats.battleAccuracy >= 80
                    ? "#eab308"
                    : "#ef4444"
              }
            />
            <StatBox
              icon={<Clock size={14} />}
              label={t("battleResult.errors")}
              value={finalStats.totalErrors}
              color={
                finalStats.totalErrors === 0
                  ? "#22c55e"
                  : finalStats.totalErrors > 15
                    ? "#ef4444"
                    : "#eab308"
              }
            />
            <StatBox
              icon={<Flame size={14} />}
              label={t("battleResult.bestCombo")}
              value={`×${finalStats.bestCombo}`}
              color="#f59e0b"
            />
            <StatBox
              icon={<Clock size={14} />}
              label={t("battleResult.battleTime")}
              value={`${Math.round(result.elapsedTime)}s`}
            />
            <StatBox
              icon={<Swords size={14} />}
              label={t("battleResult.damageDealt")}
              value={result.totalDamageDealt}
              color="#a855f7"
            />
            <StatBox
              icon={<ShieldAlert size={14} />}
              label={t("battleResult.damageTaken")}
              value={result.totalDamageTaken}
              color="#f87171"
            />
          </div>
        </div>

        {/* Character Tactical Coaching Advice — on defeat */}
        {!victory && defeatAdvice && (
          <motion.div
            className="rounded-2xl border border-orange-500/30 bg-orange-500/5 backdrop-blur-sm p-5 space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-orange-500/20 text-orange-400">
                  <Lightbulb size={16} />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-orange-400/80 font-bold uppercase tracking-wider block">
                    Tactical Analysis vs {enemy.name}
                  </span>
                  <h3 className="text-sm font-black text-white">{defeatAdvice.title}</h3>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-white/40">{defeatAdvice.focusMetric.label}:</span>
                <span
                  className={`font-black px-2 py-0.5 rounded border ${
                    defeatAdvice.focusMetric.status === "pass"
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      : "bg-red-500/20 text-red-400 border-red-500/30"
                  }`}
                >
                  {defeatAdvice.focusMetric.current} (Target: {defeatAdvice.focusMetric.required})
                </span>
              </div>
            </div>

            <p className="text-xs text-white/70 leading-relaxed">{defeatAdvice.analysis}</p>

            <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-start gap-2.5">
              <Sparkles size={14} className="text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-amber-300">Tactical Drill: </span>
                <span className="text-white/80">{defeatAdvice.tacticalTip}</span>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Link
                href={defeatAdvice.recommendedLink}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-400 hover:text-orange-300 transition-colors"
              >
                <span>{defeatAdvice.recommendedLinkText}</span>
                <ChevronRight size={14} />
              </Link>
            </div>
          </motion.div>
        )}

        {/* Weakness Analysis — only on defeat */}
        {!victory && weakKeys.length > 0 && (
          <motion.div
            className="rounded-2xl border border-red-500/20 bg-red-500/5 backdrop-blur-sm p-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold tracking-widest text-red-400 uppercase flex items-center gap-1.5">
                <Target size={14} />
                {t("battleResult.weaknessesHeader").toUpperCase()}
              </h2>
              <span className="text-[10px] text-white/40 uppercase tracking-wider">
                {t("battleResult.weaknessesSub", { count: Math.min(3, weakKeys.length) })}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {weakKeys.slice(0, 3).map((wk, index) => (
                <div
                  key={wk.key}
                  className="rounded-xl border border-red-500/20 bg-black/40 p-4 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-red-400/60">
                      {index + 1}.
                    </span>
                    <span className="text-3xl font-black text-red-400">
                      {wk.key.toUpperCase()}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-white/70">
                      <span>{t("common.accuracy")}:</span>
                      <span className="font-bold text-white">
                        {Math.round((1 - wk.errorRate) * 100)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-white/70">
                      <span>{t("common.errors")}:</span>
                      <span className="font-bold text-red-400">{wk.errors}</span>
                    </div>
                    <div className="flex justify-between text-white/70">
                      <span>{t("battleResult.avgResponse")}</span>
                      <span className="font-bold text-white">
                        {Math.round(wk.averageResponseTime)}ms
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Training Exercises */}
        {!victory && exercises.length > 0 && (
          <motion.div
            className="rounded-2xl border border-violet-500/20 bg-violet-500/5 backdrop-blur-sm p-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <h2 className="text-xs font-bold tracking-widest text-violet-400 uppercase mb-3 flex items-center gap-2">
              <Dumbbell size={14} />
              How to Improve
            </h2>
            {exercises.slice(0, 1).map((ex) => (
              <div key={ex.targetKey}>
                <p className="text-sm text-white/50 mb-3">
                  Practice exercises targeting the letter{" "}
                  <span className="text-violet-300 font-bold">
                    {ex.targetKey.toUpperCase()}
                  </span>
                  :
                </p>
                <div className="space-y-2">
                  {ex.exercises.map((line, i) => (
                    <div
                      key={i}
                      className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 font-mono text-white/80 text-sm tracking-wider"
                    >
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-center flex-wrap">
          {enemy.world && (
            <Link
              href={`/anime-world/${enemy.world}`}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-black font-black text-sm transition-all shadow-[0_0_20px_rgba(249,115,22,0.4)]"
            >
              <MapPin size={16} />
              {t("battleResult.worldMapBtn").toUpperCase()}
            </Link>
          )}
          <button
            onClick={onRematch}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 font-bold text-sm transition-colors"
          >
            <RotateCcw size={16} />
            {t("battleResult.rematchBtn").toUpperCase()}
          </button>
          {!victory && weakKeys.length > 0 && (
            <Link
              href={`/training?mode=weak-keys&keys=${weakKeys.map((w) => w.key).join(",")}`}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-black text-sm transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)]"
            >
              <Dumbbell size={16} />
              {t("battleResult.trainBtn").toUpperCase()}
            </Link>
          )}
          <Link
            href="/game"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 font-bold text-sm transition-colors"
          >
            {t("battleResult.dashboardBtn").toUpperCase()}
            <ChevronRight size={16} />
          </Link>
        </div>
      </motion.div>

      {/* Rank Up Celebration Modal */}
      {rewardSummary && (
        <RankUpModal
          isOpen={showRankUpModal}
          prevRank={rewardSummary.prevRank}
          newRank={rewardSummary.newRank}
          onClose={() => setShowRankUpModal(false)}
        />
      )}
    </div>
  )
}

function StatBox({
  icon,
  label,
  value,
  color = "white",
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  color?: string
}) {
  return (
    <div className="flex flex-col items-center p-3 rounded-xl bg-white/5 border border-white/10">
      <div className="flex items-center gap-1 text-white/40 mb-1">
        {icon}
        <span className="text-[10px] uppercase tracking-widest">{label}</span>
      </div>
      <span className="text-2xl font-black tabular-nums" style={{ color }}>
        {value}
      </span>
    </div>
  )
}
