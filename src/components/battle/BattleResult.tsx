"use client"

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
} from "lucide-react"
import Link from "next/link"

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
            <h2 className="text-xs font-bold tracking-widest text-red-400 uppercase mb-1">
              Your Biggest Weakness
            </h2>

            {weakKeys.slice(0, 1).map((wk) => (
              <div key={wk.key}>
                <div className="flex items-end gap-3 mt-3 mb-1">
                  <span className="text-6xl font-black text-red-400">
                    {wk.key.toUpperCase()}
                  </span>
                  <div className="pb-2">
                    <p className="text-sm text-white/60">
                      Attempts: {wk.attempts} · Errors: {wk.errors}
                    </p>
                    <p className="text-sm font-bold text-red-400">
                      Accuracy: {Math.round((1 - wk.errorRate) * 100)}%
                    </p>
                  </div>
                </div>
                <p className="text-sm text-white/50 mt-2">
                  {exercises.find((e) => e.targetKey === wk.key)?.description}
                </p>
              </div>
            ))}

            {/* All weak keys */}
            {weakKeys.length > 1 && (
              <div className="mt-4 flex gap-2 flex-wrap">
                <p className="text-xs text-white/30 uppercase tracking-widest w-full mb-1">
                  Also struggling with:
                </p>
                {weakKeys.slice(1).map((wk) => (
                  <span
                    key={wk.key}
                    className="px-3 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-sm"
                  >
                    {wk.key.toUpperCase()}{" "}
                    <span className="text-white/30 font-normal">
                      ({Math.round(wk.errorRate * 100)}% err)
                    </span>
                  </span>
                ))}
              </div>
            )}
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
