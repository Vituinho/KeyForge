"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { TypingStats } from "@/types/typing"
import { Dumbbell, RotateCcw, Swords, Home, Target, Zap, Flame, Clock, TrendingUp, Sparkles, ArrowUpCircle } from "lucide-react"
import Link from "next/link"
import { processTrainingRewards, ActivityRewardSummary } from "@/lib/progression/processActivityRewards"
import { RankUpModal } from "@/components/progression/RankUpModal"
import { useI18n } from "@/lib/i18n/i18nContext"

interface TrainingResultProps {
  stats: TypingStats
  targetKeys: string[]
  baselineAccuracies?: Record<string, number> // key -> prior battle accuracy (0-100)
  onRetry: () => void
}

export function TrainingResult({
  stats,
  targetKeys,
  baselineAccuracies = {},
  onRetry,
}: TrainingResultProps) {
  const { t } = useI18n()
  const [rewardSummary] = useState<ActivityRewardSummary>(() =>
    processTrainingRewards(stats, targetKeys)
  )
  const [showRankUpModal, setShowRankUpModal] = useState(
    () => rewardSummary.didRankUp
  )

  return (
    <motion.div
      className="w-full max-w-2xl px-4 py-8 mx-auto space-y-6"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Rank Up Celebration Modal */}
      <RankUpModal
        isOpen={showRankUpModal}
        prevRank={rewardSummary.prevRank}
        newRank={rewardSummary.newRank}
        onClose={() => setShowRankUpModal(false)}
      />

      {/* Header */}
      <div className="text-center">
        <motion.div
          className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-black shadow-[0_0_30px_rgba(249,115,22,0.5)]"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
        >
          <Dumbbell size={32} />
        </motion.div>
        <h1 className="text-4xl font-black tracking-wider text-white">
          {t("training.result.complete")}
        </h1>
        <p className="text-white/40 text-sm mt-1">
          {t("training.result.drillsConcluded")}{" "}
          <span className="text-orange-400 font-bold uppercase">
            {targetKeys.join(", ")}
          </span>
        </p>

        {/* XP & Level Up Badges */}
        <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold font-mono">
            <Sparkles size={14} />
            <span>{t("training.result.xpEarned", { xp: rewardSummary.xpGained })}</span>
          </div>

          {rewardSummary.didLevelUp && (
            <motion.div
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-black"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <ArrowUpCircle size={14} />
              <span>
                {t("training.result.levelUp", {
                  prev: rewardSummary.prevLevel,
                  next: rewardSummary.newLevel,
                })}
              </span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Global Performance Cards */}
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5">
        <h2 className="text-xs font-bold tracking-widest text-white/40 uppercase mb-4">
          {t("training.result.performance")}
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatBox
            icon={<Zap size={14} />}
            label={t("common.wpm")}
            value={stats.battleWpm || stats.currentWpm}
            color="#f97316"
          />
          <StatBox
            icon={<Target size={14} />}
            label={t("common.accuracy")}
            value={`${stats.battleAccuracy}%`}
            color={
              stats.battleAccuracy >= 95
                ? "#22c55e"
                : stats.battleAccuracy >= 85
                  ? "#eab308"
                  : "#ef4444"
            }
          />
          <StatBox
            icon={<Clock size={14} />}
            label={t("common.errors")}
            value={stats.totalErrors}
            color={stats.totalErrors === 0 ? "#22c55e" : "#ef4444"}
          />
          <StatBox
            icon={<Flame size={14} />}
            label={t("common.combo")}
            value={`×${stats.bestCombo}`}
            color="#f59e0b"
          />
        </div>
      </div>

      {/* Per-Key Comparison Card */}
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5">
        <h2 className="text-xs font-bold tracking-widest text-white/40 uppercase mb-4 flex items-center gap-1.5">
          <TrendingUp size={14} />
          {t("training.result.breakdown")}
        </h2>

        <div className="space-y-3">
          {targetKeys.map((key) => {
            const normalized = key.toLowerCase()
            const keyStat = stats.keyStats[normalized]
            const attempts = keyStat?.attempts ?? 0
            const errors = keyStat?.errors ?? 0
            const trainingAcc = attempts > 0 ? Math.round(((attempts - errors) / attempts) * 100) : 100

            const priorAcc = baselineAccuracies[normalized]
            const hasPrior = typeof priorAcc === "number" && Number.isFinite(priorAcc)
            const diff = hasPrior ? trainingAcc - priorAcc : null

            return (
              <div
                key={key}
                className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/10"
              >
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 font-black text-lg flex items-center justify-center uppercase">
                    {key}
                  </span>
                  <div>
                    <p className="text-xs text-white/50">
                      {t("training.result.attemptsErrors", { attempts, errors })}
                    </p>
                    <p className="text-sm font-bold text-white">
                      {t("training.result.trainingLabel")}: <span className="text-green-400">{trainingAcc}%</span>
                    </p>
                  </div>
                </div>

                {/* Comparison display */}
                {hasPrior && diff !== null ? (
                  <div className="text-right">
                    <p className="text-xs text-white/40">
                      {t("training.result.beforeLabel")}: {priorAcc}%
                    </p>
                    <p
                      className={`text-sm font-black ${
                        diff > 0
                          ? "text-emerald-400"
                          : diff < 0
                            ? "text-red-400"
                            : "text-white/60"
                      }`}
                    >
                      {diff > 0
                        ? t("training.result.improvement", { diff })
                        : diff < 0
                          ? `${diff}%`
                          : t("training.result.noChange")}
                    </p>
                  </div>
                ) : (
                  <div className="text-right text-xs text-white/40">
                    <span>
                      {attempts > 0
                        ? t("training.result.practiced")
                        : t("training.result.untyped")}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-black font-black text-sm transition-all shadow-[0_0_20px_rgba(249,115,22,0.4)]"
        >
          <RotateCcw size={16} />
          {t("training.trainAgain").toUpperCase()}
        </button>
        <Link
          href="/battle"
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 font-bold text-sm text-white transition-colors"
        >
          <Swords size={16} />
          {t("training.backToBattle").toUpperCase()}
        </Link>
        <Link
          href="/game"
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 font-bold text-sm text-white/70 transition-colors"
        >
          <Home size={16} />
          {t("training.dashboard").toUpperCase()}
        </Link>
      </div>
    </motion.div>
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
    <div className="flex flex-col items-center p-3 rounded-xl bg-black/40 border border-white/10">
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
