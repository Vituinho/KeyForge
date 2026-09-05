"use client"

import { usePlayer } from "@/hooks/usePlayer"
import { useBattleHistory } from "@/hooks/useBattleHistory"
import { RANK_METADATA } from "@/lib/progression/calculateRank"
import { getXpRequiredForLevel } from "@/lib/progression/calculateLevel"
import {
  Swords,
  Trophy,
  Target,
  Zap,
  Flame,
  Clock,
  Dumbbell,
  BookOpen,
  Shield,
  ChevronLeft,
  Award,
  Sparkles,
  Activity,
  History as HistoryIcon,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

function formatDuration(totalSeconds: number): string {
  if (totalSeconds < 60) return `${totalSeconds}s`
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes < 60) return `${minutes}m ${seconds}s`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return `${hours}h ${remainingMinutes}m`
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return "Recent"
  }
}

export default function StatisticsPage() {
  const { player } = usePlayer()
  const { history } = useBattleHistory()

  const rankMeta = RANK_METADATA[player.rank]
  const xpNeeded = getXpRequiredForLevel(player.level)
  const xpProgress = Math.min(100, Math.round((player.xp / xpNeeded) * 100))

  const winRate =
    player.stats.battlesPlayed > 0
      ? Math.round((player.stats.battlesWon / player.stats.battlesPlayed) * 100)
      : 0

  return (
    <div className="min-h-screen bg-black text-white px-4 py-8 max-w-5xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <Link
          href="/game"
          className="inline-flex items-center gap-2 text-xs font-bold text-white/50 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10"
        >
          <ChevronLeft size={16} />
          <span>GAME DASHBOARD</span>
        </Link>

        <div className="flex items-center gap-2 text-xs text-white/40 font-mono">
          <Activity size={14} className="text-orange-400" />
          <span>REAL-TIME PERFORMANCE TELEMETRY</span>
        </div>
      </div>

      {/* Hero Title & Player Overview */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
            <Award className="text-pink-500" size={32} />
            <span>PLAYER STATISTICS</span>
          </h1>
          <p className="text-white/40 text-sm mt-1">
            Lifetime combat records, typing speed metrics, and RPG attributes.
          </p>
        </div>

        {/* Player Profile Card */}
        <div className="p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md relative overflow-hidden">
          <div
            className="absolute top-0 right-0 w-80 h-80 rounded-full blur-[100px] pointer-events-none opacity-20"
            style={{ backgroundColor: rankMeta.color }}
          />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
            {/* User & Level */}
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl border shadow-lg"
                style={{
                  backgroundColor: `${rankMeta.color}22`,
                  borderColor: rankMeta.color,
                  color: rankMeta.color,
                }}
              >
                {player.rank}
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-2xl font-black text-white">{player.username}</h2>
                  <span
                    className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider border"
                    style={{
                      backgroundColor: `${rankMeta.color}15`,
                      borderColor: `${rankMeta.color}40`,
                      color: rankMeta.color,
                    }}
                  >
                    Rank {player.rank} · {rankMeta.label}
                  </span>
                </div>
                <p className="text-xs text-white/40 mt-1 font-mono">
                  Level <strong className="text-white">{player.level}</strong> · Total XP:{" "}
                  <strong className="text-amber-400 font-mono">{player.totalXp.toLocaleString()} XP</strong>
                </p>
              </div>
            </div>

            {/* Quick Overall rating */}
            <div className="text-right sm:border-l sm:border-white/10 sm:pl-6 w-full sm:w-auto">
              <span className="text-[10px] uppercase font-bold tracking-widest text-white/40 block">
                Overall Power Rating
              </span>
              <div className="text-3xl font-black text-amber-400 font-mono">
                {player.attributes.overall}
                <span className="text-sm text-white/30 font-normal"> / 100</span>
              </div>
            </div>
          </div>

          {/* Level XP Bar */}
          <div className="mt-6 pt-5 border-t border-white/10">
            <div className="flex justify-between text-xs text-white/60 mb-2 font-mono">
              <span className="flex items-center gap-1">
                <Sparkles size={12} className="text-amber-400" />
                Level {player.level} Progress
              </span>
              <span>
                {player.xp} / {xpNeeded} XP ({xpProgress}%)
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-white/10 overflow-hidden p-0.5">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-300"
                initial={{ width: 0 }}
                animate={{ width: `${xpProgress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Combat Stats */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold tracking-widest text-white/40 uppercase flex items-center gap-1.5">
          <Swords size={14} className="text-orange-400" />
          Combat Performance
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            label="Total Battles"
            value={player.stats.battlesPlayed}
            icon={<Swords size={14} />}
            color="#f97316"
          />
          <StatCard
            label="Battles Won"
            value={player.stats.battlesWon}
            icon={<Trophy size={14} />}
            color="#22c55e"
          />
          <StatCard
            label="Battles Lost"
            value={player.stats.battlesLost}
            icon={<Shield size={14} />}
            color="#ef4444"
          />
          <StatCard
            label="Win Rate"
            value={`${winRate}%`}
            icon={<Activity size={14} />}
            color={winRate >= 70 ? "#22c55e" : winRate >= 40 ? "#eab308" : "#ef4444"}
          />
        </div>
      </div>

      {/* Grid: Typing Throughput */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold tracking-widest text-white/40 uppercase flex items-center gap-1.5">
          <Zap size={14} className="text-yellow-400" />
          Typing Mastery Metrics
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            label="Average WPM"
            value={player.stats.averageWpm}
            icon={<Zap size={14} />}
            color="#eab308"
          />
          <StatCard
            label="Best Peak WPM"
            value={player.stats.bestWpm}
            icon={<Flame size={14} />}
            color="#f97316"
          />
          <StatCard
            label="Average Accuracy"
            value={`${player.stats.averageAccuracy}%`}
            icon={<Target size={14} />}
            color={
              player.stats.averageAccuracy >= 95
                ? "#22c55e"
                : player.stats.averageAccuracy >= 85
                  ? "#eab308"
                  : "#ef4444"
            }
          />
          <StatCard
            label="Longest Combo"
            value={`×${player.stats.bestCombo}`}
            icon={<Flame size={14} />}
            color="#ec4899"
          />
        </div>
      </div>

      {/* Grid: Training & Volume */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold tracking-widest text-white/40 uppercase flex items-center gap-1.5">
          <Dumbbell size={14} className="text-cyan-400" />
          Training & Lifetime Volume
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            label="Enemies Defeated"
            value={player.stats.enemiesDefeated}
            icon={<Trophy size={14} />}
            color="#10b981"
          />
          <StatCard
            label="Training Drills"
            value={player.stats.trainingSessions}
            icon={<Dumbbell size={14} />}
            color="#06b6d4"
          />
          <StatCard
            label="Academy Lessons"
            value={player.stats.academyLessonsCompleted}
            icon={<BookOpen size={14} />}
            color="#8b5cf6"
          />
          <StatCard
            label="Active Typing Time"
            value={formatDuration(player.stats.totalTypingTime)}
            icon={<Clock size={14} />}
            color="#a855f7"
          />
        </div>
      </div>

      {/* RPG Attributes Radar Breakdown */}
      <div className="p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md space-y-5">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Shield className="text-amber-400" size={20} />
            <span>RPG ATTRIBUTES BREAKDOWN</span>
          </h2>
          <p className="text-xs text-white/40 mt-0.5">
            Dynamic attributes calculated from real typing performance and disciplined training.
          </p>
        </div>

        <div className="space-y-4">
          <AttributeRow
            label="Speed"
            description="Normalized against 110 WPM elite benchmark"
            value={player.attributes.speed}
            color="#f97316"
          />
          <AttributeRow
            label="Accuracy"
            description="Direct error discipline rating (weighted heavily at 35% towards Rank)"
            value={player.attributes.accuracy}
            color="#22c55e"
          />
          <AttributeRow
            label="Technique"
            description="Increases strictly from Academy modules and Weak Key sessions"
            value={player.attributes.technique}
            color="#06b6d4"
          />
          <AttributeRow
            label="Combo"
            description="Sustained streak length and flow consistency"
            value={player.attributes.combo}
            color="#ec4899"
          />
          <AttributeRow
            label="Overall Power"
            description="Composite skill index determining eligibility for higher Ranks"
            value={player.attributes.overall}
            color="#eab308"
          />
        </div>
      </div>

      {/* Battle History Section */}
      <div className="p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <HistoryIcon className="text-cyan-400" size={20} />
              <span>RECENT BATTLES</span>
            </h2>
            <p className="text-xs text-white/40 mt-0.5">
              Persistent history of your last {history.length} matches (capped at 50).
            </p>
          </div>

          <Link
            href="/battle"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-black font-black text-xs transition-colors"
          >
            <Swords size={14} />
            <span>FIGHT AGAIN</span>
          </Link>
        </div>

        {history.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-white/10 bg-black/30 space-y-3">
            <Swords size={36} className="mx-auto text-white/20" />
            <p className="text-sm font-bold text-white/60">No battle records forged yet</p>
            <p className="text-xs text-white/30 max-w-sm mx-auto">
              Challenge anime adversaries to test your typing throughput and begin recording your combat history.
            </p>
            <Link
              href="/battle"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold text-xs transition-colors mt-2"
            >
              <span>ENTER THE ARENA</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {history.slice(0, 10).map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between flex-wrap gap-3 p-3.5 rounded-2xl bg-black/40 border border-white/10 hover:border-white/20 transition-all"
              >
                {/* Result & Enemy */}
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border ${
                      entry.victory
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                        : "bg-red-500/10 border-red-500/30 text-red-400"
                    }`}
                  >
                    {entry.victory ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{entry.enemyName}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-white/50 border border-white/10 font-mono">
                        {entry.enemyAnime}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/40">
                      {formatDate(entry.timestamp)} · Duration: {entry.durationSeconds}s
                    </p>
                  </div>
                </div>

                {/* Metrics */}
                <div className="flex items-center gap-4 text-xs font-mono ml-auto">
                  <div className="text-right">
                    <span className="text-white/40 text-[10px] block">WPM</span>
                    <strong className="text-white">{entry.battleWpm}</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-white/40 text-[10px] block">ACC</span>
                    <strong
                      className={entry.battleAccuracy >= 95 ? "text-emerald-400" : "text-amber-400"}
                    >
                      {entry.battleAccuracy}%
                    </strong>
                  </div>
                  <div className="text-right">
                    <span className="text-white/40 text-[10px] block">COMBO</span>
                    <strong className="text-pink-400">×{entry.bestCombo}</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-white/40 text-[10px] block">XP</span>
                    <strong className="text-amber-400">+{entry.xpEarned}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string
  value: string | number
  icon: React.ReactNode
  color: string
}) {
  return (
    <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col justify-between">
      <div className="flex items-center gap-1.5 text-white/40 mb-2">
        <span style={{ color }}>{icon}</span>
        <span className="text-[10px] uppercase font-bold tracking-wider">{label}</span>
      </div>
      <span className="text-2xl font-black tabular-nums font-mono" style={{ color }}>
        {value}
      </span>
    </div>
  )
}

function AttributeRow({
  label,
  description,
  value,
  color,
}: {
  label: string
  description: string
  value: number
  color: string
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <div>
          <span className="font-bold text-white uppercase tracking-wider">{label}</span>
          <span className="text-white/40 text-[11px] ml-2 hidden sm:inline">
            · {description}
          </span>
        </div>
        <span className="font-mono font-bold" style={{ color }}>
          {value} / 100
        </span>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
    </div>
  )
}
