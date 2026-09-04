"use client"
 
import { useState } from "react"
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
} from "lucide-react"
import Link from "next/link"
import { processBattleRewards, BattleRewardSummary } from "@/lib/progression/processBattleRewards"
import { RankUpModal } from "@/components/progression/RankUpModal"

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
  const { finalStats } = result

  // Process rewards strictly once upon initial mount
  const [rewardSummary] = useState<BattleRewardSummary>(() =>
    processBattleRewards(result, enemy)
  )
  const [showRankUpModal, setShowRankUpModal] = useState(
    () => rewardSummary.didRankUp
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
              <h1 className="text-5xl font-black tracking-wider text-white">VICTORY</h1>
              <p className="text-white/50 mt-2">You defeated {enemy.name}!</p>
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
              <h1 className="text-5xl font-black tracking-wider text-red-400">DEFEAT</h1>
              <p className="text-white/50 mt-2">
                <span style={{ color: enemy.themeColor }}>{enemy.name}</span> defeated you.
              </p>
            </>
          )}
        </div>

        {/* XP Progression Card */}
        {rewardSummary && (
          <motion.div
            className="rounded-2xl border border-amber-500/20 bg-amber-500/5 backdrop-blur-sm p-5 space-y-3"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase text-amber-400 flex items-center gap-1.5">
                  <Sparkles size={14} />
                  Level {rewardSummary.levelResult.newLevel}
                </span>

                {rewardSummary.levelResult.didLevelUp && (
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px] uppercase animate-pulse border border-emerald-500/30 flex items-center gap-1">
                    <ArrowUpCircle size={10} />
                    LEVEL UP! (+{rewardSummary.levelResult.levelsGained})
                  </span>
                )}

                {rewardSummary.didRankUp && (
                  <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 font-bold text-[10px] uppercase border border-orange-500/30">
                    RANK UP: {rewardSummary.prevRank} → {rewardSummary.newRank}
                  </span>
                )}
              </div>

              <span className="text-sm font-black text-amber-400">
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
                <span>XP to next level</span>
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
            Battle Performance (Entire Match)
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatBox
              icon={<Gauge size={14} />}
              label="Battle WPM"
              value={finalStats.battleWpm}
              color={enemy.themeColor}
            />
            <StatBox
              icon={<Zap size={14} />}
              label="Best WPM"
              value={finalStats.bestWpm}
              color="#38bdf8"
            />
            <StatBox
              icon={<Target size={14} />}
              label="Accuracy"
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
              label="Errors"
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
              label="Best Combo"
              value={`×${finalStats.bestCombo}`}
              color="#f59e0b"
            />
            <StatBox
              icon={<Clock size={14} />}
              label="Battle Time"
              value={`${Math.round(result.elapsedTime)}s`}
            />
            <StatBox
              icon={<Swords size={14} />}
              label="Damage Dealt"
              value={result.totalDamageDealt}
              color="#a855f7"
            />
            <StatBox
              icon={<ShieldAlert size={14} />}
              label="Damage Taken"
              value={result.totalDamageTaken}
              color="#f87171"
            />
          </div>
        </div>

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
                YOUR WEAKNESSES
              </h2>
              <span className="text-[10px] text-white/40 uppercase tracking-wider">
                Top {Math.min(3, weakKeys.length)} Key Struggles
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
                      <span>Accuracy:</span>
                      <span className="font-bold text-white">
                        {Math.round((1 - wk.errorRate) * 100)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-white/70">
                      <span>Errors:</span>
                      <span className="font-bold text-red-400">{wk.errors}</span>
                    </div>
                    <div className="flex justify-between text-white/70">
                      <span>Avg response:</span>
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
          <button
            onClick={onRematch}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 font-bold text-sm transition-colors"
          >
            <RotateCcw size={16} />
            REMATCH
          </button>
          {!victory && weakKeys.length > 0 && (
            <Link
              href={`/training?mode=weak-keys&keys=${weakKeys.map((w) => w.key).join(",")}`}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-black font-black text-sm transition-all shadow-[0_0_20px_rgba(249,115,22,0.4)]"
            >
              <Dumbbell size={16} />
              TRAIN MY WEAKNESSES
            </Link>
          )}
          <Link
            href="/"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 font-bold text-sm transition-colors"
          >
            HOME
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
