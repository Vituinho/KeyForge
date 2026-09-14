"use client"

import { useMemo } from "react"
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
  Globe,
  Star,
  Info,
} from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher"
import { getAllWorlds, getWorldProgress } from "@/data/worlds"
import { useI18n } from "@/lib/i18n/i18nContext"
import { computeSkillProfile } from "@/lib/progression/skillProfile"

function formatDuration(totalSeconds: number): string {
  if (totalSeconds < 60) return `${totalSeconds}s`
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes < 60) return `${minutes}m ${seconds}s`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return `${hours}h ${remainingMinutes}m`
}

function formatDate(iso: string, locale: string, fallback = "Recent"): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString(locale === "pt-BR" ? "pt-BR" : "en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return fallback
  }
}

export default function StatisticsPage() {
  const { t, locale } = useI18n()
  const { player } = usePlayer()
  const { history } = useBattleHistory()

  const rankMeta = RANK_METADATA[player.rank]
  const xpNeeded = getXpRequiredForLevel(player.level)
  const xpProgress = Math.min(100, Math.round((player.xp / xpNeeded) * 100))

  const skillProfile = useMemo(() => computeSkillProfile(player, history), [player, history])

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
          <span>{t("statistics.backBtn")}</span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs text-white/40 font-mono">
            <Activity size={14} className="text-orange-400" />
            <span>{t("statistics.realTimeTelemetry")}</span>
          </div>
          <LanguageSwitcher />
        </div>
      </div>

      {/* Hero Title & Player Overview */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
            <Award className="text-pink-500" size={32} />
            <span>{t("statistics.title")}</span>
          </h1>
          <p className="text-white/40 text-sm mt-1">
            {t("statistics.subtitle")}
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
                    {t("profile.rankLabel", { rank: player.rank, label: t(`ranks.${player.rank}`) })}
                  </span>
                </div>
                <p className="text-xs text-white/40 mt-1 font-mono">
                  {t("profile.levelLabel", { level: player.level })} ·{" "}
                  <strong className="text-amber-400 font-mono">
                    {t("statistics.totalXpLabel", {
                      xp: player.totalXp.toLocaleString(locale === "pt-BR" ? "pt-BR" : "en-US"),
                    })}
                  </strong>
                </p>
              </div>
            </div>

            {/* Quick Overall rating */}
            <div className="text-right sm:border-l sm:border-white/10 sm:pl-6 w-full sm:w-auto">
              <span className="text-[10px] uppercase font-bold tracking-widest text-white/40 block">
                {t("statistics.overallPowerRating")}
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
                {t("statistics.levelProgress", { level: player.level })}
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
          {t("statistics.combatPerformance")}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            label={t("statistics.battlesPlayed")}
            value={player.stats.battlesPlayed}
            icon={<Swords size={14} />}
            color="#f97316"
          />
          <StatCard
            label={t("statistics.battlesWon")}
            value={player.stats.battlesWon}
            icon={<Trophy size={14} />}
            color="#22c55e"
          />
          <StatCard
            label={t("statistics.battlesLost")}
            value={player.stats.battlesLost}
            icon={<Shield size={14} />}
            color="#ef4444"
          />
          <StatCard
            label={t("statistics.winRate")}
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
          {t("statistics.typingMasteryMetrics")}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            label={t("statistics.avgWpm")}
            value={player.stats.averageWpm}
            icon={<Zap size={14} />}
            color="#eab308"
          />
          <StatCard
            label={t("statistics.bestWpm")}
            value={player.stats.bestWpm}
            icon={<Flame size={14} />}
            color="#f97316"
          />
          <StatCard
            label={t("statistics.avgAccuracy")}
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
            label={t("statistics.bestCombo")}
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
          {t("statistics.trainingVolume")}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            label={t("statistics.enemiesDefeated")}
            value={player.stats.enemiesDefeated}
            icon={<Trophy size={14} />}
            color="#10b981"
          />
          <StatCard
            label={t("statistics.trainingDrills")}
            value={player.stats.trainingSessions}
            icon={<Dumbbell size={14} />}
            color="#06b6d4"
          />
          <StatCard
            label={t("statistics.academyLessons")}
            value={player.stats.academyLessonsCompleted}
            icon={<BookOpen size={14} />}
            color="#8b5cf6"
          />
          <StatCard
            label={t("statistics.totalTypingTime")}
            value={formatDuration(player.stats.totalTypingTime)}
            icon={<Clock size={14} />}
            color="#a855f7"
          />
        </div>
      </div>

      {/* Anime Worlds Campaign Progression Telemetry */}
      <div className="p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Globe className="text-orange-400" size={20} />
              <span>{t("animeWorld.globalCampaignStats")}</span>
            </h2>
            <p className="text-xs text-white/40 mt-0.5">
              {t("animeWorld.hubDesc")}
            </p>
          </div>

          <Link
            href="/anime-world"
            className="inline-flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 font-bold font-mono"
          >
            <span>{t("animeWorld.hubTitle")}</span>
            <ChevronLeft size={14} className="rotate-180" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            label={t("animeWorld.activeWorld")}
            value={`${player.worldsUnlocked ?? 1} / 7`}
            icon={<Globe size={14} />}
            color="#f97316"
          />
          <StatCard
            label={t("animeWorld.clearedBadge")}
            value={`${player.worldsCompleted ?? 0} / 7`}
            icon={<Trophy size={14} />}
            color="#10b981"
          />
          <StatCard
            label={t("animeWorld.masteredBadge")}
            value={`${player.worldMastery ?? 0} / 7`}
            icon={<Star size={14} />}
            color="#eab308"
          />
          <StatCard
            label={t("animeWorld.stagesCleared")}
            value={`${player.totalStagesCleared ?? 0} / 56`}
            icon={<Swords size={14} />}
            color="#8b5cf6"
          />
        </div>

        <div className="space-y-2.5 pt-2">
          {getAllWorlds().map((world) => {
            const progress = getWorldProgress(world.id, player)
            return (
              <div
                key={world.id}
                className="p-3.5 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between flex-wrap gap-3"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: world.theme.primaryColor }}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{world.series}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-white/50 border border-white/10 font-mono">
                        {world.focus.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/40 font-mono">
                      <span>{progress.stagesClearedCount} / {progress.totalStages} Stages · {progress.masteryStarsCount} Stars</span>
                      {player.worldBaselines?.[world.id] && (
                        <span className="text-emerald-400 font-bold">
                          · Entry: {player.worldBaselines[world.id].entryAvgWpm} WPM
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {progress.bestWpm > 0 && (
                    <span className="text-xs font-mono text-white/70">
                      Best: <strong className="text-amber-400">{progress.bestWpm}</strong> WPM
                    </span>
                  )}
                  {progress.mastered ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 text-[10px] font-black uppercase font-mono">
                      {t("animeWorld.masteredBadge")}
                    </span>
                  ) : progress.completed ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase font-mono">
                      {t("animeWorld.clearedBadge")}
                    </span>
                  ) : progress.unlocked ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-black uppercase font-mono">
                      {progress.progressPercent}%
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-white/5 text-white/40 border border-white/10 text-[10px] font-black uppercase font-mono">
                      {t("animeWorld.lockedWorld")}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* RPG Attributes Radar Breakdown */}
      <div className="p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md space-y-5">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Shield className="text-amber-400" size={20} />
            <span>
              {t("statistics.rpgAttributesTitle")}
            </span>
          </h2>
          <p className="text-xs text-white/40 mt-0.5">
            {t("statistics.rpgAttributesSub")}
          </p>
        </div>

        {skillProfile.confidence === "insufficient_data" && (
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
            <Info size={16} className="shrink-0" />
            <span>{t("progression.skillProfile.insufficientData")}</span>
          </div>
        )}

        <div className="space-y-4">
          <AttributeRow
            label={t("progression.skillProfile.speed")}
            description={skillProfile.speed.explainableReason}
            value={skillProfile.speed.score}
            color="#f97316"
          />
          <AttributeRow
            label={t("progression.skillProfile.accuracy")}
            description={skillProfile.accuracy.explainableReason}
            value={skillProfile.accuracy.score}
            color="#22c55e"
          />
          <AttributeRow
            label={t("progression.skillProfile.consistency")}
            description={skillProfile.consistency.explainableReason}
            value={skillProfile.consistency.score}
            color="#ec4899"
          />
          <AttributeRow
            label={t("progression.skillProfile.technique")}
            description={skillProfile.technique.explainableReason}
            value={skillProfile.technique.score}
            color="#06b6d4"
          />
          <AttributeRow
            label={t("progression.skillProfile.endurance")}
            description={skillProfile.endurance.explainableReason}
            value={skillProfile.endurance.score}
            color="#8b5cf6"
          />
          <AttributeRow
            label={t("statistics.overallPowerRating")}
            description={skillProfile.overall.explainableReason}
            value={skillProfile.overall.score}
            color="#eab308"
          />
        </div>
      </div>

      {/* Multiplayer PvP Telemetry Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-xs font-bold tracking-widest text-white/40 uppercase flex items-center gap-1.5">
              <Zap size={14} className="text-purple-400" />
              <span>{t("statistics.multiplayerTitle")}</span>
            </h2>
            <p className="text-xs text-white/40 mt-0.5">
              {t("statistics.multiplayerSub")}
            </p>
          </div>

          <Link
            href="/multiplayer"
            className="inline-flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 font-bold font-mono"
          >
            <span>{t("profile.goToArenaBtn")}</span>
            <ChevronLeft size={14} className="rotate-180" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            label={t("profile.matchesPlayed")}
            value={player.multiplayerStats?.matchesPlayed ?? 0}
            icon={<Swords size={14} />}
            color="#a855f7"
          />
          <StatCard
            label={t("profile.pvpWinRate")}
            value={`${player.multiplayerStats?.winRate ?? 0}%`}
            icon={<Trophy size={14} />}
            color="#10b981"
          />
          <StatCard
            label={t("profile.pvpBestWpm")}
            value={player.multiplayerStats?.bestWpm ?? 0}
            icon={<Flame size={14} />}
            color="#f97316"
          />
          <StatCard
            label={t("profile.pvpBestCombo")}
            value={`${player.multiplayerStats?.bestCombo ?? 0}x`}
            icon={<Zap size={14} />}
            color="#ec4899"
          />
        </div>
      </div>

      {/* Battle History Section */}
      <div className="p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <HistoryIcon className="text-cyan-400" size={20} />
              <span>{t("statistics.historyTitle")}</span>
            </h2>
            <p className="text-xs text-white/40 mt-0.5">
              {t("statistics.historyCapped", { count: history.length })}
            </p>
          </div>

          <Link
            href="/battle"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-black font-black text-xs transition-colors"
          >
            <Swords size={14} />
            <span>{t("statistics.fightAgain")}</span>
          </Link>
        </div>

        {history.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-white/10 bg-black/30 space-y-3">
            <Swords size={36} className="mx-auto text-white/20" />
            <p className="text-sm font-bold text-white/60">
              {t("statistics.noHistoryTitle")}
            </p>
            <p className="text-xs text-white/30 max-w-sm mx-auto">
              {t("statistics.noHistorySub")}
            </p>
            <Link
              href="/battle"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold text-xs transition-colors mt-2"
            >
              <span>{t("statistics.enterArena")}</span>
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
                      {formatDate(entry.timestamp, locale, t("statistics.recent"))} · {t("statistics.duration")} {entry.durationSeconds}s
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
                    <span className="text-white/40 text-[10px] block">
                      {t("statistics.accShort")}
                    </span>
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
